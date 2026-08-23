import { useState, useEffect, useCallback } from 'react';
import { DailySummary, DailyClosing } from '../types/closing';
import { Order } from '../types/order';
import { Expense } from '../types/expense';
import { listenTodayOrders } from '../services/orders.service';
import { listenTodayExpenses } from '../services/expenses.service';
import { listenDailyClosing, closeDailyBusiness } from '../services/closing.service';
import { calculateNetProfit } from '../utils/calculations';
import { getBaghdadDateString } from '../utils/dates';

export function useDailyReport(dateString?: string) {
  const targetDate = dateString || getBaghdadDateString();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [closing, setClosing] = useState<DailyClosing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    let unsubOrders: (() => void) | undefined;
    let unsubExpenses: (() => void) | undefined;
    let unsubClosing: (() => void) | undefined;

    try {
      unsubOrders = listenTodayOrders(
        (data) => {
          setOrders(data);
          setLoading(false);
        },
        targetDate,
        (err) => {
          console.error('Error fetching orders:', err);
          setError('هەڵەیەک لە بارکردنی فرۆشەکان ڕوویدا');
          setLoading(false);
        }
      );

      unsubExpenses = listenTodayExpenses(
        (data) => {
          setExpenses(data);
        },
        targetDate,
        (err) => {
          console.error('Error fetching expenses:', err);
          setError('هەڵەیەک لە بارکردنی خەرجییەکان ڕوویدا');
        }
      );

      unsubClosing = listenDailyClosing(
        (data) => {
          setClosing(data);
        },
        targetDate,
        (err) => {
          console.error('Error listening closing:', err);
        }
      );
    } catch (err: any) {
      console.error(err);
      setError('هەڵەیەک لە پەیوەندی بە داتابەیسەوە ڕوویدا');
      setLoading(false);
    }

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubExpenses) unsubExpenses();
      if (unsubClosing) unsubClosing();
    };
  }, [targetDate]);

  const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = calculateNetProfit(totalSales, totalExpenses);

  const summary: DailySummary = {
    businessDate: targetDate,
    totalSales,
    totalExpenses,
    netProfit,
    orderCount: orders.length,
    expenseCount: expenses.length,
  };

  const executeClosing = useCallback(
    async (userId: string, userName?: string, notes?: string) => {
      return await closeDailyBusiness(summary, userId, userName, notes);
    },
    [summary]
  );

  return {
    date: targetDate,
    summary,
    orders,
    expenses,
    closing,
    isClosed: !!closing,
    loading,
    error,
    executeClosing,
  };
}
