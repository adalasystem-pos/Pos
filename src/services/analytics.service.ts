import { Order } from '../types/order';
import { Expense, ExpenseCategory } from '../types/expense';
import {
  AnalyticsRange,
  AnalyticsSummary,
  ProductSalesSummary,
  ExpenseCategorySummary,
} from '../types/analytics';
import { calculateNetProfit } from '../utils/calculations';
import { getAnalyticsRangeInfo } from '../utils/dates';
import { getOrdersByDateRange } from './orders.service';
import { getExpensesByDateRange } from './expenses.service';

/**
 * Pure calculation function to authoritatively compute management intelligence
 * from existing orders and expenses datasets without duplicate data mutation.
 */
export function calculateAnalyticsSummary(
  range: AnalyticsRange,
  orders: Order[],
  expenses: Expense[],
  startDate: string,
  endDate: string,
  dateLabel: string
): AnalyticsSummary {
  // 1. Filter out cancelled orders to protect valid sales totals
  const validOrders = orders.filter((o) => o.status !== 'cancelled');

  // 2. Financial totals
  const totalSales = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = calculateNetProfit(totalSales, totalExpenses);

  // 3. Best-Selling Products aggregation
  const productMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      totalQuantity: number;
      totalRevenue: number;
      orderCount: number;
      seenOrderIds: Set<string>;
    }
  >();

  for (const order of validOrders) {
    if (!Array.isArray(order.items)) continue;

    for (const item of order.items) {
      const key = item.productId || item.productName || 'unknown-product';
      const existing = productMap.get(key);

      const itemQty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
      const itemRev =
        typeof item.lineTotal === 'number' && item.lineTotal > 0
          ? item.lineTotal
          : itemQty * (item.unitPrice || 0);

      if (existing) {
        existing.totalQuantity += itemQty;
        existing.totalRevenue += itemRev;
        if (order.orderId && !existing.seenOrderIds.has(order.orderId)) {
          existing.seenOrderIds.add(order.orderId);
          existing.orderCount += 1;
        }
      } else {
        const seenOrderIds = new Set<string>();
        if (order.orderId) seenOrderIds.add(order.orderId);

        productMap.set(key, {
          productId: item.productId || key,
          productName: item.productName || 'ئایتمی بێناو',
          totalQuantity: itemQty,
          totalRevenue: itemRev,
          orderCount: 1,
          seenOrderIds,
        });
      }
    }
  }

  const topProducts: ProductSalesSummary[] = Array.from(productMap.values())
    .map(({ seenOrderIds, ...prod }) => prod)
    .sort((a, b) => {
      // Primary sort by quantity sold descending; secondary by total revenue descending
      if (b.totalQuantity !== a.totalQuantity) {
        return b.totalQuantity - a.totalQuantity;
      }
      return b.totalRevenue - a.totalRevenue;
    });

  // 4. Expense Analysis Breakdown by category
  const expenseMap = new Map<
    string,
    {
      category: ExpenseCategory | string;
      totalAmount: number;
      count: number;
    }
  >();

  for (const expense of expenses) {
    const cat = expense.category || 'هی تر';
    const amount = typeof expense.amount === 'number' && expense.amount > 0 ? expense.amount : 0;
    const existing = expenseMap.get(cat);

    if (existing) {
      existing.totalAmount += amount;
      existing.count += 1;
    } else {
      expenseMap.set(cat, {
        category: cat,
        totalAmount: amount,
        count: 1,
      });
    }
  }

  const expenseCategories: ExpenseCategorySummary[] = Array.from(expenseMap.values())
    .map((item) => ({
      category: item.category,
      totalAmount: item.totalAmount,
      count: item.count,
      percentage: totalExpenses > 0 ? Math.round((item.totalAmount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    range,
    startDate,
    endDate,
    dateLabel,
    totalSales,
    orderCount: validOrders.length,
    totalExpenses,
    expenseCount: expenses.length,
    netProfit,
    topProducts,
    expenseCategories,
  };
}

/**
 * Authoritatively fetches data and computes management intelligence for a given range.
 */
export async function fetchAnalyticsRangeData(range: AnalyticsRange): Promise<{
  summary: AnalyticsSummary;
  orders: Order[];
  expenses: Expense[];
}> {
  const { startDateStr, endDateStr, label } = getAnalyticsRangeInfo(range);

  const [orders, expenses] = await Promise.all([
    getOrdersByDateRange(startDateStr, endDateStr),
    getExpensesByDateRange(startDateStr, endDateStr),
  ]);

  const summary = calculateAnalyticsSummary(
    range,
    orders,
    expenses,
    startDateStr,
    endDateStr,
    label
  );

  return {
    summary,
    orders,
    expenses,
  };
}
