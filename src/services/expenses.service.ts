import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Expense, ExpenseCategory } from '../types/expense';
import { validateExpense } from '../utils/validation';
import { getBaghdadDateString, getBaghdadDayRange } from '../utils/dates';

const EXPENSES_COLLECTION = 'expenses';

export interface CreateExpenseParams {
  amount: number;
  category: ExpenseCategory;
  note?: string;
  userId: string;
  userName?: string;
}

/**
 * Creates and records a business expense in Cloud Firestore.
 */
export async function createExpense(params: CreateExpenseParams): Promise<Expense> {
  const { amount, category, note = '', userId, userName = 'کاشێر' } = params;

  if (!userId) {
    throw new Error('دەبێت بەکارهێنەر چووبێتە ژوورەوە بۆ تۆمارکردنی خەرجی');
  }

  const validation = validateExpense(amount, category);
  if (!validation.valid) {
    throw new Error(validation.error || 'زانیاری خەرجی نادروستە');
  }

  const integerAmount = Math.max(1, Math.floor(amount));
  const expensesRef = collection(db, EXPENSES_COLLECTION);
  const newExpenseDoc = doc(expensesRef);
  const baghdadDate = getBaghdadDateString();

  const expensePayload = {
    expenseId: newExpenseDoc.id,
    amount: integerAmount,
    category,
    note: note.trim(),
    createdAt: serverTimestamp(),
    createdBy: userId,
    createdByName: userName,
    baghdadDate,
  };

  await setDoc(newExpenseDoc, expensePayload);

  return {
    ...expensePayload,
    createdAt: new Date(),
  };
}

/**
 * Retrieves expenses for a specific Baghdad business day.
 */
export async function getTodayExpenses(targetDateStr?: string): Promise<Expense[]> {
  const dateStr = targetDateStr || getBaghdadDateString();
  const { start, end } = getBaghdadDayRange(dateStr);

  const expensesRef = collection(db, EXPENSES_COLLECTION);

  try {
    const q = query(expensesRef, where('baghdadDate', '==', dateStr));
    const snapshot = await getDocs(q);
    const expenses: Expense[] = [];
    snapshot.forEach((d) => {
      expenses.push(d.data() as Expense);
    });
    return expenses.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });
  } catch (err) {
    const startTs = Timestamp.fromDate(start);
    const endTs = Timestamp.fromDate(end);
    const fallbackQ = query(
      expensesRef,
      where('createdAt', '>=', startTs),
      where('createdAt', '<=', endTs)
    );
    const snapshot = await getDocs(fallbackQ);
    const expenses: Expense[] = [];
    snapshot.forEach((d) => {
      expenses.push(d.data() as Expense);
    });
    return expenses;
  }
}

/**
 * Real-time listener for today's expenses.
 */
export function listenTodayExpenses(
  callback: (expenses: Expense[]) => void,
  targetDateStr?: string,
  onError?: (err: Error) => void
) {
  const dateStr = targetDateStr || getBaghdadDateString();
  const expensesRef = collection(db, EXPENSES_COLLECTION);
  const q = query(expensesRef, where('baghdadDate', '==', dateStr));

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses: Expense[] = [];
      snapshot.forEach((d) => {
        expenses.push(d.data() as Expense);
      });
      expenses.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      callback(expenses);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}
