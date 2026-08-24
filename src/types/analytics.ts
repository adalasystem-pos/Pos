import { ExpenseCategory } from './expense';

export type AnalyticsRange = 'daily' | 'weekly' | 'monthly';

export interface ProductSalesSummary {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number; // Integer IQD
  orderCount: number;
}

export interface ExpenseCategorySummary {
  category: ExpenseCategory | string;
  totalAmount: number; // Integer IQD
  count: number;
  percentage: number; // 0 to 100
}

export interface AnalyticsSummary {
  range: AnalyticsRange;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dateLabel: string;
  totalSales: number; // Integer IQD
  orderCount: number;
  totalExpenses: number; // Integer IQD
  expenseCount: number;
  netProfit: number; // Integer IQD: totalSales - totalExpenses
  topProducts: ProductSalesSummary[];
  expenseCategories: ExpenseCategorySummary[];
}
