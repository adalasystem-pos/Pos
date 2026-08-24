export type ShiftStatus = 'open' | 'closed';

export interface Shift {
  id: string;
  status: ShiftStatus;

  openedBy: string; // Auth UID
  openedByName?: string;
  openedAt: any; // Firestore serverTimestamp / Timestamp

  openingCash: number; // Integer IQD (بڕی پارەی سەرەتایی سندوق)

  closedBy?: string; // Auth UID
  closedByName?: string;
  closedAt?: any; // Firestore serverTimestamp / Timestamp

  expectedCash?: number; // Integer IQD
  actualCash?: number;   // Integer IQD
  variance?: number;     // Integer IQD: actualCash - expectedCash

  totalCashSales?: number; // Integer IQD
  totalCashIn?: number;    // Integer IQD
  totalCashOut?: number;   // Integer IQD
  totalExpenses?: number;  // Integer IQD (if any linked)
  orderCount?: number;
  baghdadDate?: string;    // YYYY-MM-DD
  notes?: string;
}

export type CashMovementType = 'cash_in' | 'cash_out';

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number; // Integer IQD
  reason: string; // Mandatory explanation
  shiftId: string;
  createdBy: string; // Auth UID
  createdByName?: string;
  createdAt: any; // Firestore serverTimestamp / Timestamp
  baghdadDate?: string; // YYYY-MM-DD
}

export interface ShiftReconciliationData {
  openingCash: number;
  totalCashSales: number;
  totalCashIn: number;
  totalCashOut: number;
  totalExpenses: number;
  expectedCash: number;
  orderCount: number;
  movementCount: number;
}
