import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { DailyClosing, DailySummary } from '../types/closing';
import { getTodayOrders } from './orders.service';
import { getTodayExpenses } from './expenses.service';
import { calculateNetProfit } from '../utils/calculations';
import { getBaghdadDateString } from '../utils/dates';

const CLOSINGS_COLLECTION = 'dailyClosings';

/**
 * Computes authoritative daily summary for a given Baghdad business date
 */
export async function getDailySummary(targetDateStr?: string): Promise<DailySummary> {
  const dateStr = targetDateStr || getBaghdadDateString();

  const [orders, expenses] = await Promise.all([
    getTodayOrders(dateStr),
    getTodayExpenses(dateStr),
  ]);

  const totalSales = orders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netProfit = calculateNetProfit(totalSales, totalExpenses);

  return {
    businessDate: dateStr,
    totalSales,
    totalExpenses,
    netProfit,
    orderCount: orders.length,
    expenseCount: expenses.length,
  };
}

/**
 * Checks if the specified business day has already been closed.
 */
export async function getDailyClosing(targetDateStr?: string): Promise<DailyClosing | null> {
  const dateStr = targetDateStr || getBaghdadDateString();
  const closingDocRef = doc(db, CLOSINGS_COLLECTION, dateStr);
  const snapshot = await getDoc(closingDocRef);

  if (snapshot.exists()) {
    return snapshot.data() as DailyClosing;
  }
  return null;
}

/**
 * Subscribes to real-time status of today's daily closing.
 */
export function listenDailyClosing(
  callback: (closing: DailyClosing | null) => void,
  targetDateStr?: string,
  onError?: (err: Error) => void
) {
  const dateStr = targetDateStr || getBaghdadDateString();
  const closingDocRef = doc(db, CLOSINGS_COLLECTION, dateStr);

  return onSnapshot(
    closingDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as DailyClosing);
      } else {
        callback(null);
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Closes the business day and records immutable closing totals.
 * Rejects duplicate closing.
 */
export async function closeDailyBusiness(
  summary: DailySummary,
  userId: string,
  userName: string = 'کاشێر',
  notes?: string
): Promise<DailyClosing> {
  if (!userId) {
    throw new Error('دەبێت بەکارهێنەر چووبێتە ژوورەوە بۆ داخستنی سندوق');
  }

  const dateStr = summary.businessDate || getBaghdadDateString();
  const closingDocRef = doc(db, CLOSINGS_COLLECTION, dateStr);

  // 1. Check if already closed to prevent duplicate overwrite
  const existingDoc = await getDoc(closingDocRef);
  if (existingDoc.exists()) {
    throw new Error(`سندوقی ئەم بەروارە (${dateStr}) پێشتر داخراوە`);
  }

  // 2. Recompute or verify the numbers directly from database for absolute financial integrity
  const verifiedSummary = await getDailySummary(dateStr);

  const closingRecord: DailyClosing = {
    businessDate: dateStr,
    totalSales: verifiedSummary.totalSales,
    totalExpenses: verifiedSummary.totalExpenses,
    netProfit: verifiedSummary.netProfit,
    orderCount: verifiedSummary.orderCount,
    expenseCount: verifiedSummary.expenseCount,
    status: 'closed',
    closedAt: serverTimestamp(),
    closedBy: userId,
    closedByName: userName,
    notes: notes?.trim() || '',
  };

  await setDoc(closingDocRef, closingRecord);

  return closingRecord;
}
