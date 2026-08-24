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
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Product, ProductIngredient } from '../types/product';
import { DEFAULT_PRODUCTS } from '../data/products';

export const PRODUCTS_COLLECTION = 'products';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
 * Validates product creation & modification payloads.
 */
export function validateProductData(product: Partial<Product>): { valid: boolean; error?: string } {
  if (!product.name || product.name.trim() === '') {
    return { valid: false, error: 'ناوی ئایتم ناتوانێت بەتاڵ بێت' };
  }
  if (product.price === undefined || product.price === null || product.price <= 0 || !Number.isInteger(product.price)) {
    return { valid: false, error: 'نرخ دەبێت ژمارەیەکی تەواو و زیاتر لە ٠ بێت بە دیناری عێراقی' };
  }
  if (!product.categoryId || product.categoryId.trim() === '') {
    return { valid: false, error: 'تکایە بەش یان جۆری ئایتم دیاری بکە' };
  }
  return { valid: true };
}

/**
 * Seeds default products into Firestore if the collection is empty.
 */
export async function seedDefaultProductsIfEmpty(userId: string): Promise<void> {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  try {
    const snap = await getDocs(productsRef);
    if (snap.empty) {
      console.log('Seeding default products into Firestore collection...');
      const batch = writeBatch(db);
      for (const prod of DEFAULT_PRODUCTS) {
        const prodDoc = doc(productsRef, prod.id);
        const payload: Record<string, any> = {
          id: prod.id,
          name: prod.name,
          categoryId: prod.categoryId,
          price: Math.round(prod.price),
          active: prod.active ?? true,
          allowPortions: prod.allowPortions ?? false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId || 'system',
          updatedBy: userId || 'system',
        };
        if (prod.customPortions) {
          payload.customPortions = prod.customPortions;
        }
        if (prod.availableCustomizations) {
          payload.availableCustomizations = prod.availableCustomizations;
        }
        if (prod.imageUrl) {
          payload.imageUrl = prod.imageUrl;
        }
        batch.set(prodDoc, payload);
      }
      await batch.commit();
      console.log('Default products seeded successfully.');
    }
  } catch (error) {
    console.warn('Seed products notice:', error);
  }
}

/**
 * Retrieves all products from Firestore.
 */
export async function getProducts(): Promise<Product[]> {
  const path = PRODUCTS_COLLECTION;
  try {
    const productsRef = collection(db, path);
    const snap = await getDocs(productsRef);
    const list: Product[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Product);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Retrieves only active products from Firestore for POS.
 */
export async function getActiveProducts(): Promise<Product[]> {
  const path = PRODUCTS_COLLECTION;
  try {
    const productsRef = collection(db, path);
    const q = query(productsRef, where('active', '==', true));
    const snap = await getDocs(q);
    const list: Product[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Product);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Real-time listener for all products.
 */
export function listenProducts(
  callback: (products: Product[]) => void,
  onError?: (err: Error) => void
) {
  const path = PRODUCTS_COLLECTION;
  const productsRef = collection(db, path);

  return onSnapshot(
    productsRef,
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Product);
      });
      callback(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export interface CreateProductInput {
  name: string;
  categoryId: string;
  price: number;
  active?: boolean;
  allowPortions?: boolean;
  customPortions?: Record<string, number>;
  availableCustomizations?: string[];
  imageUrl?: string;
  customId?: string;
  ingredients?: ProductIngredient[];
}

/**
 * Authoritatively creates a new product in Firestore.
 */
export async function createProduct(input: CreateProductInput, userId: string): Promise<Product> {
  const validation = validateProductData(input);
  if (!validation.valid) {
    throw new Error(validation.error || 'زانیارییەکان تەواو نین');
  }

  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const id = input.customId?.trim() || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const prodDocRef = doc(productsRef, id);

  // Check if duplicate ID exists
  const existingSnap = await getDoc(prodDocRef);
  if (existingSnap.exists()) {
    throw new Error('ئەم ناسنامەی ئایتمە (ID) پێشتر بەکارهاتووە');
  }

  const payload: Record<string, any> = {
    id,
    name: input.name.trim(),
    categoryId: input.categoryId.trim(),
    price: Math.round(input.price),
    active: input.active !== undefined ? input.active : true,
    allowPortions: input.allowPortions ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    updatedBy: userId,
  };

  if (input.customPortions && Object.keys(input.customPortions).length > 0) {
    payload.customPortions = input.customPortions;
  }
  if (input.availableCustomizations && input.availableCustomizations.length > 0) {
    payload.availableCustomizations = input.availableCustomizations;
  }
  if (input.imageUrl) {
    payload.imageUrl = input.imageUrl;
  }
  if (input.ingredients && Array.isArray(input.ingredients)) {
    payload.ingredients = input.ingredients.filter((i) => i.ingredientId && i.quantity > 0);
  }

  try {
    await setDoc(prodDocRef, payload);
    return {
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Product;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PRODUCTS_COLLECTION}/${id}`);
    throw error;
  }
}

export interface UpdateProductInput {
  name: string;
  categoryId: string;
  price: number;
  active: boolean;
  allowPortions?: boolean;
  customPortions?: Record<string, number>;
  availableCustomizations?: string[];
  imageUrl?: string;
  ingredients?: ProductIngredient[];
}

/**
 * Updates an existing product while preserving product ID and setting audit trail.
 */
export async function updateProduct(
  productId: string,
  input: Partial<UpdateProductInput>,
  userId: string
): Promise<void> {
  if (!productId) {
    throw new Error('ناسنامەی ئایتم دیاری نەکراوە');
  }

  if (input.name !== undefined && (!input.name || input.name.trim() === '')) {
    throw new Error('ناوی ئایتم ناتوانێت بەتاڵ بێت');
  }
  if (input.price !== undefined && (input.price <= 0 || !Number.isInteger(input.price))) {
    throw new Error('نرخ دەبێت ژمارەیەکی تەواو و زیاتر لە ٠ بێت بە دیناری عێراقی');
  }

  const prodDocRef = doc(db, PRODUCTS_COLLECTION, productId);
  const path = `${PRODUCTS_COLLECTION}/${productId}`;

  try {
    const snap = await getDoc(prodDocRef);
    if (!snap.exists()) {
      // Find fallback default product definition
      const defaultProd = DEFAULT_PRODUCTS.find((p) => p.id === productId);
      const initialName = input.name?.trim() || defaultProd?.name || 'خواردن';
      const initialPrice = input.price !== undefined ? Math.round(input.price) : (defaultProd?.price || 1000);
      const initialCat = input.categoryId?.trim() || defaultProd?.categoryId || 'kebab';
      const initialActive = input.active !== undefined ? Boolean(input.active) : (defaultProd?.active ?? true);
      const initialAllowPortions = input.allowPortions !== undefined ? Boolean(input.allowPortions) : (defaultProd?.allowPortions ?? false);

      const initialPayload: Record<string, any> = {
        id: productId,
        name: initialName,
        categoryId: initialCat,
        price: initialPrice,
        active: initialActive,
        allowPortions: initialAllowPortions,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId,
      };

      if (input.customPortions || defaultProd?.customPortions) {
        initialPayload.customPortions = input.customPortions || defaultProd?.customPortions;
      }
      if (input.availableCustomizations || defaultProd?.availableCustomizations) {
        initialPayload.availableCustomizations = input.availableCustomizations || defaultProd?.availableCustomizations;
      }
      if (input.imageUrl || defaultProd?.imageUrl) {
        initialPayload.imageUrl = input.imageUrl || defaultProd?.imageUrl;
      }
      if (input.ingredients) {
        initialPayload.ingredients = input.ingredients.filter((i) => i.ingredientId && i.quantity > 0);
      }

      await setDoc(prodDocRef, initialPayload);
      return;
    }

    const payload: Record<string, any> = {
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.categoryId !== undefined) payload.categoryId = input.categoryId.trim();
    if (input.price !== undefined) payload.price = Math.round(input.price);
    if (input.active !== undefined) payload.active = Boolean(input.active);
    if (input.allowPortions !== undefined) payload.allowPortions = Boolean(input.allowPortions);
    if (input.customPortions !== undefined) payload.customPortions = input.customPortions;
    if (input.availableCustomizations !== undefined) payload.availableCustomizations = input.availableCustomizations;
    if (input.imageUrl !== undefined) payload.imageUrl = input.imageUrl;
    if (input.ingredients !== undefined) {
      payload.ingredients = input.ingredients.filter((i) => i.ingredientId && i.quantity > 0);
    }

    await setDoc(prodDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Quick toggle for product availability state.
 */
export async function setProductAvailability(
  productId: string,
  active: boolean,
  userId: string
): Promise<void> {
  if (!productId) {
    throw new Error('ناسنامەی ئایتم دیاری نەکراوە');
  }

  const prodDocRef = doc(db, PRODUCTS_COLLECTION, productId);
  const path = `${PRODUCTS_COLLECTION}/${productId}`;

  try {
    const snap = await getDoc(prodDocRef);
    if (!snap.exists()) {
      const defaultProd = DEFAULT_PRODUCTS.find((p) => p.id === productId);
      const initialPayload: Record<string, any> = {
        id: productId,
        name: defaultProd?.name || 'خواردن',
        categoryId: defaultProd?.categoryId || 'kebab',
        price: defaultProd?.price || 1000,
        active: Boolean(active),
        allowPortions: defaultProd?.allowPortions ?? false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId,
      };
      if (defaultProd?.customPortions) {
        initialPayload.customPortions = defaultProd.customPortions;
      }
      if (defaultProd?.availableCustomizations) {
        initialPayload.availableCustomizations = defaultProd.availableCustomizations;
      }
      if (defaultProd?.imageUrl) {
        initialPayload.imageUrl = defaultProd.imageUrl;
      }
      await setDoc(prodDocRef, initialPayload);
      return;
    }

    await setDoc(
      prodDocRef,
      {
        active: Boolean(active),
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}
