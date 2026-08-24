import { useState, useEffect, useCallback } from 'react';
import { AnalyticsRange, AnalyticsSummary } from '../types/analytics';
import { Order } from '../types/order';
import { Expense } from '../types/expense';
import { DailyClosing } from '../types/closing';
import { listenTodayOrders } from '../services/orders.service';
import { listenTodayExpenses } from '../services/expenses.service';
import { listenDailyClosing, closeDailyBusiness } from '../services/closing.service';
import { calculateAnalyticsSummary, fetchAnalyticsRangeData } from '../services/analytics.service';
import { getAnalyticsRangeInfo, getBaghdadDateString } from '../utils/dates';

export function useAnalyticsReport(initialRange: AnalyticsRange = 'daily') {
  const [range, setRange] = useState<AnalyticsRange>(initialRange);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [closing, setClosing] = useState<DailyClosing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const todayStr = getBaghdadDateString();
  const rangeInfo = getAnalyticsRangeInfo(range);

  // Re-fetch or listen based on active range
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    let unsubOrders: (() => void) | undefined;
    let unsubExpenses: (() => void) | undefined;
    let unsubClosing: (() => void) | undefined;

    if (range === 'daily') {
      // Use real-time listener for today
      try {
        unsubOrders = listenTodayOrders(
          (data) => {
            if (!isCancelled) {
              setOrders(data);
              setLoading(false);
            }
          },
          todayStr,
          (err) => {
            console.error('Error fetching today orders:', err);
            if (!isCancelled) {
              setError('هەڵەیەک لە بارکردنی فرۆشەکان ڕوویدا');
              setLoading(false);
            }
          }
        );

        unsubExpenses = listenTodayExpenses(
          (data) => {
            if (!isCancelled) {
              setExpenses(data);
            }
          },
          todayStr,
          (err) => {
            console.error('Error fetching today expenses:', err);
            if (!isCancelled) {
              setError('هەڵەیەک لە بارکردنی خەرجییەکان ڕوویدا');
            }
          }
        );

        unsubClosing = listenDailyClosing(
          (data) => {
            if (!isCancelled) {
              setClosing(data);
            }
          },
          todayStr,
          (err) => {
            console.error('Error listening closing:', err);
          }
        );
      } catch (err) {
        console.error(err);
        if (!isCancelled) {
          setError('هەڵەیەک لە پەیوەندی بە داتابەیسەوە ڕوویدا');
          setLoading(false);
        }
      }
    } else {
      // Historical range query (weekly / monthly)
      fetchAnalyticsRangeData(range)
        .then((result) => {
          if (!isCancelled) {
            setOrders(result.orders);
            setExpenses(result.expenses);
            setClosing(null); // Closing only applies to single daily business date
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(`Error loading analytics for range ${range}:`, err);
          if (!isCancelled) {
            setError('هەڵەیەک لە بارکردنی زانیارییەکان ڕوویدا');
            setLoading(false);
          }
        });
    }

    return () => {
      isCancelled = true;
      if (unsubOrders) unsubOrders();
      if (unsubExpenses) unsubExpenses();
      if (unsubClosing) unsubClosing();
    };
  }, [range, refreshKey, todayStr]);

  const summary: AnalyticsSummary = calculateAnalyticsSummary(
    range,
    orders,
    expenses,
    rangeInfo.startDateStr,
    rangeInfo.endDateStr,
    rangeInfo.label
  );

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const executeClosing = useCallback(
    async (userId: string, userName?: string, notes?: string) => {
      return await closeDailyBusiness(
        {
          businessDate: todayStr,
          totalSales: summary.totalSales,
          totalExpenses: summary.totalExpenses,
          netProfit: summary.netProfit,
          orderCount: summary.orderCount,
          expenseCount: summary.expenseCount,
        },
        userId,
        userName,
        notes
      );
    },
    [summary, todayStr]
  );

  return {
    range,
    setRange,
    rangeInfo,
    summary,
    orders,
    expenses,
    closing,
    isClosed: !!closing,
    loading,
    error,
    refresh,
    executeClosing,
  };
}
