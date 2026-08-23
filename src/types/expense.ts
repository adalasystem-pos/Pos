export type ExpenseCategory =
  | 'گۆشت'
  | 'سەوزە'
  | 'نان'
  | 'کرێ'
  | 'کارمەند'
  | 'گاز'
  | 'کارەبا'
  | 'ئاو'
  | 'گواستنەوە'
  | 'هی تر';

export interface Expense {
  expenseId: string;
  amount: number; // Integer IQD
  category: ExpenseCategory;
  note: string;
  createdAt: any; // Firestore serverTimestamp / Timestamp
  createdBy: string; // Auth UID
  createdByName?: string;
  baghdadDate?: string; // YYYY-MM-DD
}
