import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Shift, CashMovement, CashMovementType, ShiftReconciliationData } from '../types/shift';
import { Order } from '../types/order';
import { Expense } from '../types/expense';
import { getBaghdadDateString } from '../utils/dates';

const SHIFTS_COLLECTION = 'shifts';
const CASH_MOVEMENTS_COLLECTION = 'cashMovements';
const ORDERS_COLLECTION = 'orders';
const EXPENSES_COLLECTION = 'expenses';

export interface OpenShiftParams {
  openingCash: number;
  userId: string;
  userName?: string;
}

export interface RecordCashMovementParams {
  type: CashMovementType;
  amount: number;
  reason: string;
  shiftId: string;
  userId: string;
  userName?: string;
}

export interface CloseShiftParams {
  shiftId: string;
  actualCash: number;
  userId: string;
  userName?: string;
  notes?: string;
}

/**
 * Checks for any currently open active shift.
 */
export async function getActiveShift(): Promise<Shift | null> {
  const shiftsRef = collection(db, SHIFTS_COLLECTION);
  const q = query(shiftsRef, where('status', '==', 'open'));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const shiftDoc = snapshot.docs[0];
  return {
    id: shiftDoc.id,
    ...shiftDoc.data(),
  } as Shift;
}

/**
 * Real-time listener for the active operational shift.
 */
export function listenActiveShift(
  callback: (shift: Shift | null) => void,
  onError?: (err: Error) => void
) {
  const shiftsRef = collection(db, SHIFTS_COLLECTION);
  const q = query(shiftsRef, where('status', '==', 'open'));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        const shiftDoc = snapshot.docs[0];
        callback({
          id: shiftDoc.id,
          ...shiftDoc.data(),
        } as Shift);
      }
    },
    (err) => {
      console.error('Error listening to active shift:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Opens a new operational shift.
 * Ensures only one active shift exists at any given time.
 */
export async function openShift(params: OpenShiftParams): Promise<Shift> {
  const { openingCash, userId, userName = 'کاشێر' } = params;

  if (!userId) {
    throw new Error('دەبێت بەکارهێنەر چووبێتە ژوورەوە بۆ کردنەوەی شێفت');
  }

  const cleanOpeningCash = Math.max(0, Math.floor(openingCash || 0));

  // Check if an active shift is already open
  const existingActive = await getActiveShift();
  if (existingActive) {
    throw new Error('شێفتێکی تر لە ئێستادا کراوەیە. ناتوانرێت شێفتی نوێ بکرێتەوە تاوەکو شێفتی پێشوو دانەخرێت.');
  }

  const shiftsRef = collection(db, SHIFTS_COLLECTION);
  const newShiftDoc = doc(shiftsRef);
  const baghdadDate = getBaghdadDateString();

  const shiftPayload = {
    id: newShiftDoc.id,
    status: 'open' as const,
    openedBy: userId,
    openedByName: userName,
    openedAt: serverTimestamp(),
    openingCash: cleanOpeningCash,
    baghdadDate,
    totalCashSales: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    totalExpenses: 0,
    orderCount: 0,
    notes: '',
  };

  await setDoc(newShiftDoc, shiftPayload);

  return {
    ...shiftPayload,
    openedAt: new Date(),
  };
}

/**
 * Records a controlled Cash In or Cash Out movement associated with the active shift.
 */
export async function recordCashMovement(params: RecordCashMovementParams): Promise<CashMovement> {
  const { type, amount, reason, shiftId, userId, userName = 'کاشێر' } = params;

  if (!userId) {
    throw new Error('دەبێت بەکارهێنەر چووبێتە ژوورەوە');
  }

  if (!shiftId) {
    throw new Error('دەبێت شێفتی چالاک دیاری کرابێت');
  }

  const cleanAmount = Math.floor(amount);
  if (cleanAmount <= 0) {
    throw new Error('بڕی پارە دەبێت زیاتر بێت لە ٠ دینار');
  }

  if (!reason || !reason.trim()) {
    throw new Error('دەبێت هۆکاری جوڵەی پارە بنووسرێت');
  }

  // Verify that the shift exists and is currently open
  const shiftDocRef = doc(db, SHIFTS_COLLECTION, shiftId);
  const shiftSnap = await getDoc(shiftDocRef);
  if (!shiftSnap.exists()) {
    throw new Error('شێفتی داواکراو نەدۆزرایەوە');
  }

  const shiftData = shiftSnap.data();
  if (shiftData.status !== 'open') {
    throw new Error('ئەم شێفتە داخراوە و ناتوانرێت پارەی تێدا جوڵە پێبکرێت');
  }

  const movementsRef = collection(db, CASH_MOVEMENTS_COLLECTION);
  const newMovementDoc = doc(movementsRef);
  const baghdadDate = getBaghdadDateString();

  const movementPayload = {
    id: newMovementDoc.id,
    type,
    amount: cleanAmount,
    reason: reason.trim(),
    shiftId,
    createdBy: userId,
    createdByName: userName,
    createdAt: serverTimestamp(),
    baghdadDate,
  };

  await setDoc(newMovementDoc, movementPayload);

  return {
    ...movementPayload,
    createdAt: new Date(),
  };
}

/**
 * Subscribes to real-time cash movements for a given shift.
 */
export function listenShiftCashMovements(
  shiftId: string,
  callback: (movements: CashMovement[]) => void,
  onError?: (err: Error) => void
) {
  if (!shiftId) {
    callback([]);
    return () => {};
  }

  const movementsRef = collection(db, CASH_MOVEMENTS_COLLECTION);
  const q = query(movementsRef, where('shiftId', '==', shiftId));

  return onSnapshot(
    q,
    (snapshot) => {
      const movements: CashMovement[] = [];
      snapshot.forEach((d) => {
        movements.push({ id: d.id, ...d.data() } as CashMovement);
      });

      // Sort descending by createdAt
      movements.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });

      callback(movements);
    },
    (err) => {
      console.error('Error listening to shift cash movements:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Authoritatively calculates shift reconciliation totals:
 * Expected Cash = Opening Cash + Cash Sales + Cash In - Cash Out - Expenses (if linked)
 */
export async function calculateShiftReconciliation(
  shiftId: string,
  openingCash: number
): Promise<ShiftReconciliationData & { orders: Order[]; cashMovements: CashMovement[] }> {
  const cleanOpeningCash = Math.max(0, Math.floor(openingCash || 0));

  // 1. Fetch orders associated with this shift
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const ordersQuery = query(ordersRef, where('shiftId', '==', shiftId));
  const ordersSnap = await getDocs(ordersQuery);

  const orders: Order[] = [];
  ordersSnap.forEach((d) => {
    const ord = d.data() as Order;
    // Exclude cancelled orders from shift revenue calculation
    if (ord.status !== 'cancelled') {
      orders.push(ord);
    }
  });

  const totalCashSales = orders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

  // 2. Fetch cash movements for this shift
  const movementsRef = collection(db, CASH_MOVEMENTS_COLLECTION);
  const movementsQuery = query(movementsRef, where('shiftId', '==', shiftId));
  const movementsSnap = await getDocs(movementsQuery);

  const cashMovements: CashMovement[] = [];
  let totalCashIn = 0;
  let totalCashOut = 0;

  movementsSnap.forEach((d) => {
    const mov = { id: d.id, ...d.data() } as CashMovement;
    cashMovements.push(mov);
    if (mov.type === 'cash_in') {
      totalCashIn += mov.amount || 0;
    } else if (mov.type === 'cash_out') {
      totalCashOut += mov.amount || 0;
    }
  });

  // 3. Fetch any expenses linked to this shift
  const expensesRef = collection(db, EXPENSES_COLLECTION);
  const expensesQuery = query(expensesRef, where('shiftId', '==', shiftId));
  const expensesSnap = await getDocs(expensesQuery);

  let totalExpenses = 0;
  expensesSnap.forEach((d) => {
    const exp = d.data() as Expense;
    totalExpenses += exp.amount || 0;
  });

  // 4. Formula: Opening Cash + Cash Sales + Cash In - Cash Out - Shift Expenses
  const expectedCash = cleanOpeningCash + totalCashSales + totalCashIn - totalCashOut - totalExpenses;

  return {
    openingCash: cleanOpeningCash,
    totalCashSales,
    totalCashIn,
    totalCashOut,
    totalExpenses,
    expectedCash,
    orderCount: orders.length,
    movementCount: cashMovements.length,
    orders,
    cashMovements,
  };
}

/**
 * Closes an open shift with atomic financial reconciliation.
 * Prevents closing the same shift twice.
 */
export async function closeShift(params: CloseShiftParams): Promise<Shift> {
  const { shiftId, actualCash, userId, userName = 'کاشێر', notes = '' } = params;

  if (!userId) {
    throw new Error('دەبێت بەکارهێنەر چووبێتە ژوورەوە بۆ داخستنی شێفت');
  }

  if (!shiftId) {
    throw new Error('دەبێت ناسنامەی شێفت دیاری کرابێت');
  }

  const cleanActualCash = Math.max(0, Math.floor(actualCash || 0));
  const shiftDocRef = doc(db, SHIFTS_COLLECTION, shiftId);

  // 1. First fetch shift document to verify status and retrieve opening cash
  const initialSnap = await getDoc(shiftDocRef);
  if (!initialSnap.exists()) {
    throw new Error('شێفت نەدۆزرایەوە');
  }

  const initialData = initialSnap.data() as Shift;
  if (initialData.status === 'closed') {
    throw new Error('ئەم شێفتە پێشتر داخراوە و ناتوانرێت دووبارە دابخرێتەوە');
  }

  // 2. Authoritatively calculate expected totals from Firestore records
  const reconciliation = await calculateShiftReconciliation(shiftId, initialData.openingCash || 0);

  const variance = cleanActualCash - reconciliation.expectedCash;

  // 3. Atomically finalize shift closure in Firestore transaction
  const updatedShift = await runTransaction(db, async (transaction) => {
    const shiftSnap = await transaction.get(shiftDocRef);
    if (!shiftSnap.exists()) {
      throw new Error('شێفت نەدۆزرایەوە');
    }

    const currentData = shiftSnap.data() as Shift;
    if (currentData.status === 'closed') {
      throw new Error('ئەم شێفتە پێشتر داخراوە');
    }

    const closingPayload = {
      status: 'closed' as const,
      closedBy: userId,
      closedByName: userName,
      closedAt: serverTimestamp(),
      expectedCash: reconciliation.expectedCash,
      actualCash: cleanActualCash,
      variance,
      totalCashSales: reconciliation.totalCashSales,
      totalCashIn: reconciliation.totalCashIn,
      totalCashOut: reconciliation.totalCashOut,
      totalExpenses: reconciliation.totalExpenses,
      orderCount: reconciliation.orderCount,
      notes: notes.trim(),
      updatedAt: serverTimestamp(),
    };

    transaction.update(shiftDocRef, closingPayload);

    return {
      ...currentData,
      ...closingPayload,
      closedAt: new Date(),
    };
  });

  return updatedShift as Shift;
}
