import {
  collection,
  doc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  CartItem,
  Order,
  OrderStatus,
  OrderSource,
  KitchenPrintStatus,
  OrderStatusHistoryItem,
} from '../types/order';
import { calculateLineTotal, calculateOrderTotal } from '../utils/calculations';
import { validateCart } from '../utils/validation';
import { getBaghdadDateString, getBaghdadDayRange } from '../utils/dates';
import { executeOrderInventoryDeduction } from './inventory.service';

const ORDERS_COLLECTION = 'orders';
const COUNTERS_COLLECTION = 'counters';

export interface CreateOrderParams {
  items: CartItem[];
  note?: string;
  tableNumber?: string;
  source?: OrderSource;
  shiftId?: string;
  userId: string;
  userName?: string;
}

export interface TransitionUser {
  uid: string;
  name?: string;
  role?: string;
}

/**
 * Authoritatively creates and saves a new order in Cloud Firestore.
 * Uses a Firestore atomic transaction to allocate the sequential order number (#001, #002)
 * without race conditions across multiple POS/Captain devices.
 */
export async function createOrder(params: CreateOrderParams): Promise<Order> {
  const {
    items,
    note = '',
    tableNumber = '',
    source = 'pos',
    shiftId,
    userId,
    userName = 'کاشێر',
  } = params;

  if (!userId) {
    throw new Error('دەبێت بەکارهێنەر چووبێتە ژوورەوە بۆ تەواوکردنی داواکاری');
  }

  // 1. Validate items
  const validation = validateCart(items);
  if (!validation.valid) {
    throw new Error(validation.error || 'سەبەتەی داواکاری نادروستە');
  }

  // 2. Authoritatively recalculate each item line total & order totals
  const verifiedItems: CartItem[] = items.map((item) => {
    const verifiedLineTotal = calculateLineTotal(item.unitPrice, item.quantity);
    return {
      productId: item.productId,
      productName: item.productName,
      unitPrice: Math.round(item.unitPrice),
      quantity: Math.floor(item.quantity),
      portion: item.portion,
      customizations: Array.isArray(item.customizations) ? [...item.customizations] : [],
      lineTotal: verifiedLineTotal,
    };
  });

  const { subtotal, totalAmount } = calculateOrderTotal(verifiedItems);

  if (totalAmount <= 0) {
    throw new Error('کۆی گشتی داواکاری ناتوانێت سفر بێت');
  }

  const baghdadDate = getBaghdadDateString();
  const counterDocRef = doc(db, COUNTERS_COLLECTION, `orders-${baghdadDate}`);
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const newOrderDoc = doc(ordersRef);

  try {
    const createdOrder = await runTransaction(db, async (transaction) => {
      // 3. Atomically read and increment sequence counter for today
      const counterSnap = await transaction.get(counterDocRef);
      let sequence = 1;

      if (counterSnap.exists()) {
        const counterData = counterSnap.data();
        sequence = (counterData.sequence || 0) + 1;
      }

      transaction.set(
        counterDocRef,
        {
          sequence,
          date: baghdadDate,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const orderNumber = `#${sequence.toString().padStart(3, '0')}`;

      const initialHistoryItem: OrderStatusHistoryItem = {
        status: 'preparing',
        changedAt: new Date().toISOString(),
        changedBy: userId,
        changedByName: userName,
        note: 'دروستکردنی داواکاری لە سیستەم',
      };

      // 4. Construct authoritative Order payload
      const orderPayload = {
        orderId: newOrderDoc.id,
        orderNumber,
        source,
        tableNumber: tableNumber.trim(),
        items: verifiedItems,
        subtotal,
        totalAmount,
        note: note.trim(),
        status: 'preparing' as const,
        kitchenPrintStatus: 'pending' as KitchenPrintStatus,
        kitchenPrintAttempts: 0,
        statusHistory: [initialHistoryItem],
        preparingAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: userId,
        createdByName: userName,
        ...(shiftId ? { shiftId } : {}),
        baghdadDate,
        updatedAt: serverTimestamp(),
      };

      transaction.set(newOrderDoc, orderPayload);

      return {
        ...orderPayload,
        createdAt: new Date(),
        preparingAt: new Date(),
      };
    });

    return createdOrder as Order;
  } catch (error) {
    console.error('Error creating order in transaction:', error);
    throw error;
  }
}

/**
 * Validates if a status transition is permitted by restaurant operations rules.
 */
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): boolean {
  if (currentStatus === targetStatus) return false;

  switch (currentStatus) {
    case 'preparing':
      return targetStatus === 'ready' || targetStatus === 'cancelled';
    case 'ready':
      return targetStatus === 'served' || targetStatus === 'cancelled';
    case 'served':
      return targetStatus === 'completed';
    case 'completed':
    case 'cancelled':
    default:
      // Terminal states cannot be changed arbitrarily
      return false;
  }
}

/**
 * Authoritatively executes an atomic status transition on an order with status history.
 */
export async function transitionOrderStatus(
  orderId: string,
  targetStatus: OrderStatus,
  user: TransitionUser,
  cancelReason?: string
): Promise<void> {
  if (!orderId) throw new Error('ناسنامەی داواکاری نادروستە');
  if (!user || !user.uid) throw new Error('دەبێت بەکارهێنەر دیاری بکرێت');

  if (targetStatus === 'cancelled' && (!cancelReason || !cancelReason.trim())) {
    throw new Error('دەبێت هۆکاری هەڵوەشاندنەوە بنووسرێت');
  }

  const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderDocRef);
    if (!snap.exists()) {
      throw new Error('داواکارییەکە لە سیستەم نەدۆزرایەوە');
    }

    const orderData = snap.data() as Order;
    const currentStatus = orderData.status || 'preparing';

    if (!isValidStatusTransition(currentStatus, targetStatus)) {
      throw new Error(
        `گۆڕینی دۆخی داواکاری لە (${currentStatus}) بۆ (${targetStatus}) ڕێگەپێدراو نییە`
      );
    }

    const existingHistory = Array.isArray(orderData.statusHistory)
      ? [...orderData.statusHistory]
      : [];

    const newHistoryItem: OrderStatusHistoryItem = {
      status: targetStatus,
      changedAt: new Date().toISOString(),
      changedBy: user.uid,
      changedByName: user.name || 'کارمەند',
      note: cancelReason ? cancelReason.trim() : undefined,
    };

    const updatePayload: Record<string, any> = {
      status: targetStatus,
      statusHistory: [...existingHistory, newHistoryItem],
      updatedAt: serverTimestamp(),
    };

    if (targetStatus === 'ready') {
      updatePayload.readyAt = serverTimestamp();
    } else if (targetStatus === 'served') {
      updatePayload.servedAt = serverTimestamp();
    } else if (targetStatus === 'completed') {
      updatePayload.completedAt = serverTimestamp();
      // Atomic inventory deduction with duplicate deduction protection
      await executeOrderInventoryDeduction(transaction, orderDocRef, orderData, user.uid, user.name);
    } else if (targetStatus === 'cancelled') {
      updatePayload.cancelledAt = serverTimestamp();
      updatePayload.cancelledBy = user.uid;
      updatePayload.cancelledByName = user.name || 'کارمەند';
      updatePayload.cancelReason = cancelReason?.trim() || '';
    }

    transaction.update(orderDocRef, updatePayload);
  });
}

/**
 * Convenient wrappers for operational lifecycle transitions
 */
export async function markOrderReady(orderId: string, user: TransitionUser): Promise<void> {
  return transitionOrderStatus(orderId, 'ready', user);
}

export async function markOrderServed(orderId: string, user: TransitionUser): Promise<void> {
  return transitionOrderStatus(orderId, 'served', user);
}

export async function completeOrder(orderId: string, user: TransitionUser): Promise<void> {
  return transitionOrderStatus(orderId, 'completed', user);
}

export async function cancelOrder(
  orderId: string,
  reason: string,
  user: TransitionUser
): Promise<void> {
  return transitionOrderStatus(orderId, 'cancelled', user, reason);
}

/**
 * Backward compatible updateOrderStatus wrapper
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  user?: TransitionUser,
  cancelReason?: string
): Promise<void> {
  if (user) {
    return transitionOrderStatus(orderId, status, user, cancelReason);
  }
  if (!orderId) throw new Error('Invalid order ID');
  const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderDocRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Atomically claims an order for printing so that only ONE POS instance
 * prints the receipt. Prevents duplicate prints.
 */
export async function claimOrderForPrinting(orderId: string): Promise<boolean> {
  if (!orderId) return false;
  const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);

  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(orderDocRef);
      if (!snap.exists()) return false;

      const data = snap.data() as Order;

      // Only claim if print status is pending or failed
      const currentPrintStatus = data.kitchenPrintStatus || 'pending';
      if (currentPrintStatus === 'printing' || currentPrintStatus === 'printed') {
        return false;
      }

      transaction.update(orderDocRef, {
        kitchenPrintStatus: 'printing',
        kitchenPrintAttempts: (data.kitchenPrintAttempts || 0) + 1,
        updatedAt: serverTimestamp(),
      });

      return true;
    });
  } catch (err) {
    console.error('Error claiming order for printing:', err);
    return false;
  }
}

/**
 * Atomically claims an order for a manual reprint request.
 */
export async function claimOrderForReprint(orderId: string): Promise<boolean> {
  if (!orderId) return false;
  const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);

  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(orderDocRef);
      if (!snap.exists()) return false;

      const data = snap.data() as Order;

      transaction.update(orderDocRef, {
        kitchenPrintStatus: 'printing',
        kitchenPrintAttempts: (data.kitchenPrintAttempts || 0) + 1,
        updatedAt: serverTimestamp(),
      });

      return true;
    });
  } catch (err) {
    console.error('Error claiming order for reprint:', err);
    return false;
  }
}

/**
 * Updates the durable print status of an order after a print attempt.
 */
export async function markOrderPrintResult(orderId: string, success: boolean): Promise<void> {
  if (!orderId) return;
  const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);

  try {
    if (success) {
      await updateDoc(orderDocRef, {
        kitchenPrintStatus: 'printed',
        kitchenPrintedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(orderDocRef, {
        kitchenPrintStatus: 'failed',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error('Error updating order print result:', err);
  }
}

/**
 * Retrieves orders for a specific Baghdad business day.
 * Excludes cancelled orders from financial calculations by default.
 */
export async function getTodayOrders(targetDateStr?: string): Promise<Order[]> {
  const dateStr = targetDateStr || getBaghdadDateString();
  const { start, end } = getBaghdadDayRange(dateStr);

  const ordersRef = collection(db, ORDERS_COLLECTION);

  try {
    const q = query(ordersRef, where('baghdadDate', '==', dateStr));
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach((d) => {
      const ord = d.data() as Order;
      // Exclude cancelled orders from financial totals
      if (ord.status !== 'cancelled') {
        orders.push(ord);
      }
    });
    return orders.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });
  } catch (err) {
    // Range query fallback
    const startTs = Timestamp.fromDate(start);
    const endTs = Timestamp.fromDate(end);
    const fallbackQ = query(
      ordersRef,
      where('createdAt', '>=', startTs),
      where('createdAt', '<=', endTs)
    );
    const snapshot = await getDocs(fallbackQ);
    const orders: Order[] = [];
    snapshot.forEach((d) => {
      const ord = d.data() as Order;
      if (ord.status !== 'cancelled') {
        orders.push(ord);
      }
    });
    return orders;
  }
}

/**
 * Retrieves valid orders across a date range (inclusive YYYY-MM-DD strings).
 * Excludes cancelled orders from valid sales & management analytics.
 */
export async function getOrdersByDateRange(
  startDateStr: string,
  endDateStr: string
): Promise<Order[]> {
  const ordersRef = collection(db, ORDERS_COLLECTION);

  try {
    let q;
    if (startDateStr === endDateStr) {
      q = query(ordersRef, where('baghdadDate', '==', startDateStr));
    } else {
      q = query(
        ordersRef,
        where('baghdadDate', '>=', startDateStr),
        where('baghdadDate', '<=', endDateStr)
      );
    }
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach((d) => {
      const ord = d.data() as Order;
      if (ord.status !== 'cancelled') {
        orders.push(ord);
      }
    });
    return orders.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });
  } catch (err) {
    console.error('Range query by baghdadDate failed, falling back to Timestamp range:', err);
    const { start } = getBaghdadDayRange(startDateStr);
    const { end } = getBaghdadDayRange(endDateStr);
    const startTs = Timestamp.fromDate(start);
    const endTs = Timestamp.fromDate(end);
    const fallbackQ = query(
      ordersRef,
      where('createdAt', '>=', startTs),
      where('createdAt', '<=', endTs)
    );
    const snapshot = await getDocs(fallbackQ);
    const orders: Order[] = [];
    snapshot.forEach((d) => {
      const ord = d.data() as Order;
      if (ord.status !== 'cancelled') {
        orders.push(ord);
      }
    });
    return orders.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });
  }
}


/**
 * Real-time listener for today's active orders (preparing, ready, served, completed).
 * Excludes cancelled orders from standard sales lists.
 */
export function listenTodayOrders(
  callback: (orders: Order[]) => void,
  targetDateStr?: string,
  onError?: (err: Error) => void
) {
  const dateStr = targetDateStr || getBaghdadDateString();
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(ordersRef, where('baghdadDate', '==', dateStr));

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((d) => {
        const ord = d.data() as Order;
        if (ord.status !== 'cancelled') {
          orders.push(ord);
        }
      });
      orders.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      callback(orders);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time listener for all active operational orders (status in ['preparing', 'ready', 'served'])
 */
export function listenActiveOperationalOrders(
  callback: (orders: Order[]) => void,
  targetDateStr?: string,
  onError?: (err: Error) => void
) {
  const dateStr = targetDateStr || getBaghdadDateString();
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(ordersRef, where('baghdadDate', '==', dateStr));

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((d) => {
        const ord = d.data() as Order;
        // Include only active workflow states
        if (
          ord.status === 'preparing' ||
          ord.status === 'ready' ||
          ord.status === 'served'
        ) {
          orders.push(ord);
        }
      });
      orders.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeA - timeB; // Oldest active order first for operational queue
      });
      callback(orders);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}
