import React, { useState } from 'react';
import { useAnalyticsReport } from '../hooks/useAnalyticsReport';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { SummaryCard } from '../components/reports/SummaryCard';
import { DailyOrdersList } from '../components/reports/DailyOrdersList';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { DailyClosingCard } from '../components/closing/DailyClosingCard';
import { ClosingModal } from '../components/closing/ClosingModal';
import { AnalyticsRangeSelector } from '../components/reports/AnalyticsRangeSelector';
import { TopSellingProductsCard } from '../components/reports/TopSellingProductsCard';
import { ExpenseBreakdownCard } from '../components/reports/ExpenseBreakdownCard';
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
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { DailySummary } from '../types/closing';

export const ReportsPage: React.FC = () => {
  const {
    range,
    setRange,
    rangeInfo,
    summary,
    orders,
    expenses,
    closing,
    loading,
    error: loadError,
    refresh,
    executeClosing,
  } = useAnalyticsReport();

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
    } catch (err: unknown) {
      console.error('Closing error:', err);
      throw err;
    }
  };

  // Convert AnalyticsSummary to DailySummary shape for DailyClosingCard & Modal
  const dailyClosingSummary: DailySummary = {
    businessDate: rangeInfo.startDateStr,
    totalSales: summary.totalSales,
    totalExpenses: summary.totalExpenses,
    netProfit: summary.netProfit,
    orderCount: summary.orderCount,
    expenseCount: summary.expenseCount,
  };

  const getRangeSubtitle = () => {
    switch (range) {
      case 'weekly':
        return `شیکاری و ژمێریاری ئەم هەفتەیە (${summary.startDate} تا ${summary.endDate})`;
      case 'monthly':
        return `شیکاری و ژمێریاری ئەم مانگە (${summary.startDate} تا ${summary.endDate})`;
      case 'daily':
      default:
        return `ژمێریاری ڕۆژانەی چێشتخانە بۆ بەرواری (${summary.startDate}) بە کاتی بەغدا`;
    }
  };

  return (
    <div id="reports-page" className="space-y-6 select-none">
      {/* Page Header */}
      <PageHeader
        title="ڕاپۆرت و زیرەکی بەڕێوەبردن"
        subtitle={getRangeSubtitle()}
        action={
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-700 bg-white hover:bg-orange-50/70 border border-orange-200 px-3.5 py-2 rounded-2xl shadow-2xs font-bold transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 text-orange-500 ${loading ? 'animate-spin' : ''}`} />
            <span>نوێکردنەوە</span>
          </button>
        }
      />

      {/* Analytics Time Range Selector (ئەمڕۆ، ئەم هەفتەیە، ئەم مانگە) */}
      <AnalyticsRangeSelector
        selectedRange={range}
        onSelectRange={setRange}
        dateLabel={summary.dateLabel}
        loading={loading}
      />

      {/* Error state if any */}
      {loadError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Main Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Sales */}
        <SummaryCard
          id="kpi-total-sales"
          title={`کۆی فرۆش (${range === 'daily' ? 'ئەمڕۆ' : range === 'weekly' ? 'ئەم هەفتەیە' : 'ئەم مانگە'})`}
          amount={formatIQD(summary.totalSales)}
          subtitle={`${summary.orderCount} داواکاری دروستکراو`}
          icon={<TrendingUp className="w-6 h-6" />}
          variant="sales"
        />

        {/* Total Expenses */}
        <SummaryCard
          id="kpi-total-expenses"
          title={`کۆی خەرجییەکان (${range === 'daily' ? 'ئەمڕۆ' : range === 'weekly' ? 'ئەم هەفتەیە' : 'ئەم مانگە'})`}
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

      {/* End-of-Day Closing Section (Visible on Daily mode) */}
      {range === 'daily' && (
        <DailyClosingCard
          closing={closing}
          summary={dailyClosingSummary}
          onOpenClosingModal={() => setIsClosingModalOpen(true)}
          isOnline={isOnline}
        />
      )}

      {/* Management Intelligence Grid: Best Sellers & Expense Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Best Selling Products */}
        <TopSellingProductsCard products={summary.topProducts} loading={loading} />

        {/* Expense Category Breakdown */}
        <ExpenseBreakdownCard
          categories={summary.expenseCategories}
          totalExpenses={summary.totalExpenses}
          loading={loading}
        />
      </div>

      {/* Detailed Breakdown Lists */}
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

        {/* Selected List Content */}
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
        summary={dailyClosingSummary}
      />
    </div>
  );
};
