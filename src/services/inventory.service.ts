import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  writeBatch,
  increment,
  Transaction,
  DocumentReference,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Ingredient,
  StockMovement,
  StockMovementType,
  CreateIngredientInput,
  UpdateIngredientInput,
  StockInInput,
  StockAdjustmentInput,
} from '../types/inventory';
import { Order } from '../types/order';
import { Product } from '../types/product';
import { PRODUCTS_COLLECTION } from './products.service';

export const INGREDIENTS_COLLECTION = 'ingredients';
export const STOCK_MOVEMENTS_COLLECTION = 'stockMovements';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(error instanceof Error ? error.message : JSON.stringify(errInfo));
}

/**
 * Retrieves all ingredients from Firestore.
 */
export async function getIngredients(): Promise<Ingredient[]> {
  const path = INGREDIENTS_COLLECTION;
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    const list: Ingredient[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Ingredient);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Real-time listener for all ingredients.
 */
export function listenIngredients(
  callback: (ingredients: Ingredient[]) => void,
  onError?: (err: Error) => void
) {
  const path = INGREDIENTS_COLLECTION;
  const colRef = collection(db, path);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Ingredient[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Ingredient);
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Authoritatively creates a new ingredient in Firestore.
 */
export async function createIngredient(
  input: CreateIngredientInput,
  userId: string,
  userName?: string
): Promise<Ingredient> {
  const trimmedName = input.name?.trim();
  const trimmedUnit = input.unit?.trim();

  if (!trimmedName) {
    throw new Error('ناوی پێکهاتە ناتوانێت بەتاڵ بێت');
  }
  if (!trimmedUnit) {
    throw new Error('یەکەی پێوانە (Unit) ناتوانێت بەتاڵ بێت');
  }

  const initialStock = Number(input.initialStock || 0);
  const minStock = Number(input.minimumStock || 0);

  if (isNaN(initialStock) || initialStock < 0) {
    throw new Error('بڕی سەرەتایی ناتوانێت کەمتر لە ٠ بێت');
  }
  if (isNaN(minStock) || minStock < 0) {
    throw new Error('کەمترین بڕی ئاگادارکردنەوە ناتوانێت کەمتر لە ٠ بێت');
  }

  const id = `ing-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const ingDocRef = doc(db, INGREDIENTS_COLLECTION, id);

  const payload: Record<string, any> = {
    id,
    name: trimmedName,
    unit: trimmedUnit,
    currentStock: Math.round(initialStock * 1000) / 1000,
    minimumStock: Math.round(minStock * 1000) / 1000,
    isActive: input.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    updatedBy: userId,
  };

  try {
    await runTransaction(db, async (transaction) => {
      transaction.set(ingDocRef, payload);

      // If initial stock was supplied > 0, record initial stock movement
      if (initialStock > 0) {
        const movementId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const movementDocRef = doc(db, STOCK_MOVEMENTS_COLLECTION, movementId);
        const movementPayload: StockMovement = {
          id: movementId,
          ingredientId: id,
          ingredientName: trimmedName,
          type: 'stock_in',
          quantity: Math.round(initialStock * 1000) / 1000,
          reason: 'کۆگای دەستپێکی نوێ لە کاتی دروستکردن',
          createdBy: userId,
          createdByName: userName || 'بەڕێوەبەر',
          createdAt: serverTimestamp(),
        };
        transaction.set(movementDocRef, movementPayload);
      }
    });

    return {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Ingredient;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${INGREDIENTS_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Updates an ingredient's metadata (name, unit, minimumStock, isActive).
 */
export async function updateIngredient(
  id: string,
  input: UpdateIngredientInput,
  userId: string
): Promise<void> {
  if (!id) throw new Error('ناسنامەی پێکهاتە نادروستە');

  const ingDocRef = doc(db, INGREDIENTS_COLLECTION, id);
  const path = `${INGREDIENTS_COLLECTION}/${id}`;

  try {
    const snap = await getDoc(ingDocRef);
    if (!snap.exists()) {
      throw new Error('پێکهاتەکە لە سیستەم نەدۆزرایەوە');
    }

    const payload: Record<string, any> = {
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (!trimmed) throw new Error('ناوی پێکهاتە ناتوانێت بەتاڵ بێت');
      payload.name = trimmed;
    }
    if (input.unit !== undefined) {
      const trimmed = input.unit.trim();
      if (!trimmed) throw new Error('یەکەی پێوانە ناتوانێت بەتاڵ بێت');
      payload.unit = trimmed;
    }
    if (input.minimumStock !== undefined) {
      const minVal = Number(input.minimumStock);
      if (isNaN(minVal) || minVal < 0) {
        throw new Error('کەمترین بڕی ئاگادارکردنەوە ناتوانێت کەمتر لە ٠ بێت');
      }
      payload.minimumStock = Math.round(minVal * 1000) / 1000;
    }
    if (input.isActive !== undefined) {
      payload.isActive = Boolean(input.isActive);
    }

    await updateDoc(ingDocRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Toggles an ingredient's active status (soft-delete / disable).
 */
export async function toggleIngredientActive(
  id: string,
  currentActive: boolean,
  userId: string
): Promise<void> {
  return updateIngredient(id, { isActive: !currentActive }, userId);
}

/**
 * Adds inventory stock (Stock In) with an atomic movement record.
 */
export async function addStockIn(
  input: StockInInput,
  userId: string,
  userName?: string
): Promise<void> {
  const { ingredientId, quantity, reason } = input;
  if (!ingredientId) throw new Error('تکایە پێکهاتە دیاری بکە');

  const addQty = Number(quantity);
  if (isNaN(addQty) || addQty <= 0) {
    throw new Error('بڕی زیادکراو دەبێت ژمارەیەکی دروست و زیاتر لە ٠ بێت');
  }

  const ingDocRef = doc(db, INGREDIENTS_COLLECTION, ingredientId);

  await runTransaction(db, async (transaction) => {
    const ingSnap = await transaction.get(ingDocRef);
    if (!ingSnap.exists()) {
      throw new Error('پێکهاتەکە لە سیستەم نەدۆزرایەوە');
    }

    const ingData = ingSnap.data() as Ingredient;
    const prevStock = Number(ingData.currentStock || 0);
    const newStock = Math.round((prevStock + addQty) * 1000) / 1000;

    // 1. Update ingredient stock
    transaction.update(ingDocRef, {
      currentStock: newStock,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // 2. Create Stock In movement record
    const movementId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const movementDocRef = doc(db, STOCK_MOVEMENTS_COLLECTION, movementId);
    const movementPayload: StockMovement = {
      id: movementId,
      ingredientId,
      ingredientName: ingData.name,
      type: 'stock_in',
      quantity: Math.round(addQty * 1000) / 1000,
      reason: reason?.trim() || 'زیادکردنی کۆگا (Stock In)',
      createdBy: userId,
      createdByName: userName || 'بەڕێوەبەر',
      createdAt: serverTimestamp(),
    };
    transaction.set(movementDocRef, movementPayload);
  });
}

/**
 * Adjusts inventory stock (Stock Adjustment) with mandatory reason.
 */
export async function adjustStock(
  input: StockAdjustmentInput,
  userId: string,
  userName?: string
): Promise<void> {
  const { ingredientId, newStock, reason } = input;
  if (!ingredientId) throw new Error('تکایە پێکهاتە دیاری بکە');

  const targetStock = Number(newStock);
  if (isNaN(targetStock) || targetStock < 0) {
    throw new Error('بڕی نوێی کۆگا ناتوانێت کەمتر لە ٠ بێت');
  }

  const trimmedReason = reason?.trim();
  if (!trimmedReason) {
    throw new Error('نووسینی هۆکاری دەستکاریکردنی کۆگا (وەک بەفیڕۆچوون یان ژماردن) ئیجبارییە');
  }

  const ingDocRef = doc(db, INGREDIENTS_COLLECTION, ingredientId);

  await runTransaction(db, async (transaction) => {
    const ingSnap = await transaction.get(ingDocRef);
    if (!ingSnap.exists()) {
      throw new Error('پێکهاتەکە لە سیستەم نەدۆزرایەوە');
    }

    const ingData = ingSnap.data() as Ingredient;
    const prevStock = Number(ingData.currentStock || 0);
    const diff = Math.round((targetStock - prevStock) * 1000) / 1000;

    // 1. Update ingredient stock to exact adjusted count
    transaction.update(ingDocRef, {
      currentStock: Math.round(targetStock * 1000) / 1000,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // 2. Create Stock Adjustment movement record
    const movementId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const movementDocRef = doc(db, STOCK_MOVEMENTS_COLLECTION, movementId);
    const movementPayload: StockMovement = {
      id: movementId,
      ingredientId,
      ingredientName: ingData.name,
      type: 'stock_adjustment',
      quantity: diff,
      reason: trimmedReason,
      createdBy: userId,
      createdByName: userName || 'بەڕێوەبەر',
      createdAt: serverTimestamp(),
    };
    transaction.set(movementDocRef, movementPayload);
  });
}

/**
 * Retrieves stock movements list (optionally filtered by ingredientId).
 */
export async function getStockMovements(
  ingredientId?: string,
  limitCount: number = 50
): Promise<StockMovement[]> {
  const path = STOCK_MOVEMENTS_COLLECTION;
  try {
    const colRef = collection(db, path);
    let q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
    if (ingredientId) {
      q = query(colRef, where('ingredientId', '==', ingredientId), orderBy('createdAt', 'desc'), limit(limitCount));
    }
    const snap = await getDocs(q);
    const list: StockMovement[] = [];
    snap.forEach((d) => {
      list.push(d.data() as StockMovement);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Real-time listener for stock movements.
 */
export function listenStockMovements(
  callback: (movements: StockMovement[]) => void,
  ingredientId?: string,
  limitCount: number = 50
) {
  const path = STOCK_MOVEMENTS_COLLECTION;
  const colRef = collection(db, path);
  let q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
  if (ingredientId) {
    q = query(colRef, where('ingredientId', '==', ingredientId), orderBy('createdAt', 'desc'), limit(limitCount));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const list: StockMovement[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as StockMovement);
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Helper to compute portion multiplier
 */
export function getPortionMultiplier(portion?: string): number {
  if (!portion) return 1.0;
  if (portion === 'نیو نەفەر') return 0.5;
  if (portion === 'کیلۆ') return 4.0;
  return 1.0;
}

/**
 * Atomically deducts ingredients required for an order inside an ongoing Firestore transaction.
 * Strictly guarantees duplicate deduction protection via inventoryProcessed flag.
 */
export async function executeOrderInventoryDeduction(
  transaction: Transaction,
  orderDocRef: DocumentReference,
  order: Order,
  userId: string,
  userName?: string
): Promise<void> {
  // 1. Mandatory duplicate deduction protection
  if (order.inventoryProcessed) {
    return;
  }

  if (!order.items || order.items.length === 0) {
    transaction.update(orderDocRef, {
      inventoryProcessed: true,
      inventoryProcessedAt: serverTimestamp(),
    });
    return;
  }

  // 2. Collect all referenced product IDs in this order
  const uniqueProductIds = Array.from(new Set(order.items.map((i) => i.productId)));
  const productSnaps = await Promise.all(
    uniqueProductIds.map((pid) => transaction.get(doc(db, PRODUCTS_COLLECTION, pid)))
  );

  const productMap = new Map<string, Product>();
  productSnaps.forEach((ps) => {
    if (ps.exists()) {
      productMap.set(ps.id, ps.data() as Product);
    }
  });

  // 3. Aggregate ingredient requirements across all ordered cart items
  const aggregatedRequirements = new Map<string, { quantity: number; productName: string }>();

  for (const item of order.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.ingredients || product.ingredients.length === 0) {
      continue;
    }

    const portionFactor = getPortionMultiplier(item.portion);
    const itemQty = Number(item.quantity || 1);

    for (const ingReq of product.ingredients) {
      if (!ingReq.ingredientId || !ingReq.quantity || ingReq.quantity <= 0) {
        continue;
      }
      const neededTotal = ingReq.quantity * portionFactor * itemQty;
      const current = aggregatedRequirements.get(ingReq.ingredientId);
      if (current) {
        current.quantity += neededTotal;
      } else {
        aggregatedRequirements.set(ingReq.ingredientId, {
          quantity: neededTotal,
          productName: item.productName || product.name,
        });
      }
    }
  }

  // 4. If no ingredients are configured for any product in this order
  if (aggregatedRequirements.size === 0) {
    transaction.update(orderDocRef, {
      inventoryProcessed: true,
      inventoryProcessedAt: serverTimestamp(),
    });
    return;
  }

  // 5. Fetch all required ingredient documents inside the transaction
  const ingredientIds = Array.from(aggregatedRequirements.keys());
  const ingredientSnaps = await Promise.all(
    ingredientIds.map((ingId) => transaction.get(doc(db, INGREDIENTS_COLLECTION, ingId)))
  );

  const orderNumStr = order.orderNumber || (order.orderId ? `#${order.orderId.slice(-4).toUpperCase()}` : '#001');

  // 6. Apply stock deduction and generate movement records
  for (let idx = 0; idx < ingredientIds.length; idx++) {
    const ingId = ingredientIds[idx];
    const ingSnap = ingredientSnaps[idx];
    const req = aggregatedRequirements.get(ingId)!;

    if (ingSnap.exists()) {
      const ingData = ingSnap.data() as Ingredient;
      const prevStock = Number(ingData.currentStock || 0);
      const deductedQty = Math.round(req.quantity * 1000) / 1000;
      const newStock = Math.round(Math.max(0, prevStock - deductedQty) * 1000) / 1000;

      // Update ingredient document
      transaction.update(ingSnap.ref, {
        currentStock: newStock,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });

      // Create consumption stock movement
      const movementId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const movementDocRef = doc(db, STOCK_MOVEMENTS_COLLECTION, movementId);
      const movementPayload: StockMovement = {
        id: movementId,
        ingredientId: ingId,
        ingredientName: ingData.name,
        type: 'consumption',
        quantity: -deductedQty,
        orderId: order.orderId,
        reason: `بەکارهاتن لە فرۆشتنی داواکاری ${orderNumStr}`,
        createdBy: userId,
        createdByName: userName || 'سیستەمی POS',
        createdAt: serverTimestamp(),
      };
      transaction.set(movementDocRef, movementPayload);
    }
  }

  // 7. Authoritatively mark order as inventory processed
  transaction.update(orderDocRef, {
    inventoryProcessed: true,
    inventoryProcessedAt: serverTimestamp(),
  });
}
