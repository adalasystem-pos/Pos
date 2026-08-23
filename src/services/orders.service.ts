import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { CartItem, Order } from '../types/order';
import { calculateLineTotal, calculateOrderTotal } from '../utils/calculations';
import { validateCart } from '../utils/validation';
import { getBaghdadDateString, getBaghdadDayRange } from '../utils/dates';

const ORDERS_COLLECTION = 'orders';

export interface CreateOrderParams {
  items: CartItem[];
  note?: string;
  userId: string;
  userName?: string;
}

/**
 * Authoritatively creates and saves a new order to Cloud Firestore.
 * Recalculates all line totals and order totals to prevent tampering.
 */
export async function createOrder(params: CreateOrderParams): Promise<Order> {
  const { items, note = '', userId, userName = 'کاشێر' } = params;

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

  // 3. Generate unique order ID and record
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const newOrderDoc = doc(ordersRef);
    const baghdadDate = getBaghdadDateString();

    const orderPayload = {
      orderId: newOrderDoc.id,
      items: verifiedItems,
      subtotal,
      totalAmount,
      note: note.trim(),
      status: 'preparing' as const,
      createdAt: serverTimestamp(),
      createdBy: userId,
      createdByName: userName,
      baghdadDate,
    };

    // 4. Save to Firestore
    await setDoc(newOrderDoc, orderPayload);

    // Return the created order model
    return {
      ...orderPayload,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Retrieves orders for a specific Baghdad business day.
 * Includes all active orders (preparing, completed, and legacy orders).
 */
export async function getTodayOrders(targetDateStr?: string): Promise<Order[]> {
  const dateStr = targetDateStr || getBaghdadDateString();
  const { start, end } = getBaghdadDayRange(dateStr);

  const ordersRef = collection(db, ORDERS_COLLECTION);
  
  // Try querying by baghdadDate first, or by timestamp range fallback
  try {
    const q = query(
      ordersRef,
      where('baghdadDate', '==', dateStr)
    );
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach((d) => {
      const ord = d.data() as Order;
      if (ord.status !== 'cancelled') {
        orders.push(ord);
      }
    });
    // Sort descending by creation
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
 * Real-time listener for today's active orders (preparing, completed, and legacy).
 */
export function listenTodayOrders(
  callback: (orders: Order[]) => void,
  targetDateStr?: string,
  onError?: (err: Error) => void
) {
  const dateStr = targetDateStr || getBaghdadDateString();
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(
    ordersRef,
    where('baghdadDate', '==', dateStr)
  );

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
