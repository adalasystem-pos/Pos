export interface DailySummary {
  businessDate: string; // YYYY-MM-DD
  totalSales: number; // Integer IQD
  totalExpenses: number; // Integer IQD
  netProfit: number; // Integer IQD: totalSales - totalExpenses
  orderCount: number;
  expenseCount: number;
}

export interface DailyClosing {
  businessDate: string; // Document ID: YYYY-MM-DD
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  orderCount: number;
  expenseCount: number;
  status: 'closed';
  closedAt: any; // Firestore Timestamp
  closedBy: string; // Auth UID
  closedByName?: string;
  notes?: string;
}
