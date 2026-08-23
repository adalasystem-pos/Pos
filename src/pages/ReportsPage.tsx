import React, { useState } from 'react';
import { useDailyReport } from '../hooks/useDailyReport';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { SummaryCard } from '../components/reports/SummaryCard';
import { DailyOrdersList } from '../components/reports/DailyOrdersList';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { DailyClosingCard } from '../components/closing/DailyClosingCard';
import { ClosingModal } from '../components/closing/ClosingModal';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingState } from '../components/ui/LoadingState';
import { formatIQD } from '../utils/currency';
import {
  TrendingUp,
  TrendingDown,
  Coins,
  ShoppingBag,
  Receipt,
  Calendar,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { summary, orders, expenses, closing, isClosed, loading, executeClosing } = useDailyReport();
  const { user, displayName } = useAuth();
  const { success, error } = useToast();
  const { isOnline } = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<'orders' | 'expenses'>('orders');
  const [isClosingModalOpen, setIsClosingModalOpen] = useState<boolean>(false);

  const handleConfirmClosing = async (notes?: string) => {
    if (!user) {
      error('تکایە سەرەتا بچۆ ژوورەوە بۆ ئەنجامدانی داخستنی سندوق');
      return;
    }
    if (!isOnline) {
      error('پەیوەندی ئینتەرنێت پچڕاوە. ناتوانرێت سندوق دابخرێت.');
      return;
    }

    try {
      await executeClosing(user.uid, displayName, notes);
      success('سندوقی ئەمڕۆ بە سەرکەوتوویی داخرا و پاشەکەوت کرا');
    } catch (err: any) {
      console.error('Closing error:', err);
      throw err;
    }
  };

  return (
    <div id="reports-page" className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="ڕاپۆرتی دارایی و سندوق"
        subtitle={`ژمێریاری ڕۆژانەی چێشتخانە بۆ بەرواری (${summary.businessDate}) بە کاتی بەغدا`}
        action={
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-orange-200 px-3.5 py-2 rounded-2xl shadow-2xs">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>ڕۆژی کارکردن:</span>
            <span className="font-bold text-gray-800" dir="ltr">
              {summary.businessDate}
            </span>
          </div>
        }
      />

      {/* Main Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Sales */}
        <SummaryCard
          id="kpi-total-sales"
          title="کۆی فرۆش (داواکارییەکان)"
          amount={formatIQD(summary.totalSales)}
          subtitle={`${summary.orderCount} داواکاری تەواوکراو`}
          icon={<TrendingUp className="w-6 h-6" />}
          variant="sales"
        />

        {/* Total Expenses */}
        <SummaryCard
          id="kpi-total-expenses"
          title="کۆی خەرجییەکان"
          amount={formatIQD(summary.totalExpenses)}
          subtitle={`${summary.expenseCount} تۆماری خەرجی`}
          icon={<TrendingDown className="w-6 h-6" />}
          variant="expenses"
        />

        {/* Net Profit */}
        <SummaryCard
          id="kpi-net-profit"
          title="قازانجی پاک (Net Profit)"
          amount={formatIQD(summary.netProfit)}
          subtitle="کۆی فرۆش - کۆی خەرجییەکان"
          icon={<Coins className="w-6 h-6" />}
          variant="profit"
        />
      </div>

      {/* End-of-Day Closing Section */}
      <DailyClosingCard
        closing={closing}
        summary={summary}
        onOpenClosingModal={() => setIsClosingModalOpen(true)}
        isOnline={isOnline}
      />

      {/* Breakdown Lists */}
      <div className="space-y-4 pt-2">
        {/* Tab switch between orders & expenses */}
        <div className="flex items-center justify-between border-b border-orange-100 pb-3">
          <div className="flex gap-2.5">
            <button
              id="tab-view-orders"
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-orange-500 text-white custom-shadow'
                  : 'bg-white text-gray-600 hover:bg-orange-50/60 border border-orange-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>لیستی فرۆشەکان ({orders.length})</span>
            </button>

            <button
              id="tab-view-expenses"
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-orange-500 text-white custom-shadow'
                  : 'bg-white text-gray-600 hover:bg-orange-50/60 border border-orange-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>لیستی خەرجییەکان ({expenses.length})</span>
            </button>
          </div>
        </div>

        {/* Selected List */}
        {loading ? (
          <LoadingState message="زانیارییەکان باردەکرێن..." />
        ) : activeTab === 'orders' ? (
          <DailyOrdersList orders={orders} loading={loading} />
        ) : (
          <ExpenseList expenses={expenses} loading={loading} />
        )}
      </div>

      {/* Daily Closing Dialog */}
      <ClosingModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        onConfirm={handleConfirmClosing}
        summary={summary}
      />
    </div>
  );
};
