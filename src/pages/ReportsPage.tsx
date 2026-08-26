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
import { DailyReportThermalReceipt } from '../components/reports/DailyReportThermalReceipt';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingState } from '../components/ui/LoadingState';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { formatIQD } from '../utils/currency';
import { iminPrinter } from '../services/iminPrinter.service';
import {
  TrendingUp,
  TrendingDown,
  Coins,
  ShoppingBag,
  Receipt,
  Calendar,
  AlertCircle,
  RotateCw,
  Printer,
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
  const { success, error, warning, info } = useToast();
  const { isOnline } = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<'orders' | 'expenses'>('orders');
  const [isClosingModalOpen, setIsClosingModalOpen] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [showThermalPreviewModal, setShowThermalPreviewModal] = useState<boolean>(false);

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

  const handlePrintDailyReport = async () => {
    setIsPrinting(true);
    try {
      if (iminPrinter.isSupported()) {
        const res = await iminPrinter.printDailySummaryReport(dailyClosingSummary, {
          closedByName: closing?.closedByName || displayName,
          topProducts: summary.topProducts,
          expenseCategories: summary.expenseCategories,
        });

        if (res.status === 'success') {
          success('ڕاپۆرتی ڕۆژانە بە سەرکەوتوویی لە چاپکەری iMin چاپکرا');
          return;
        } else if (res.status === 'unavailable' || res.status === 'unsupported') {
          // Open preview modal for browser printing
          setShowThermalPreviewModal(true);
        } else {
          warning(res.error || 'چاپکردن لە ئامێری iMin سەرکەوتوو نەبوو، پەنجەرەی چاپکردن کرایەوە');
          setShowThermalPreviewModal(true);
        }
      } else {
        setShowThermalPreviewModal(true);
      }
    } catch (err) {
      console.error('Print report error:', err);
      setShowThermalPreviewModal(true);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
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
          <div className="flex items-center gap-2">
            <button
              id="print-thermal-report-header-btn"
              type="button"
              onClick={handlePrintDailyReport}
              disabled={loading || isPrinting}
              className="flex items-center gap-1.5 text-xs text-orange-950 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3.5 py-2 rounded-2xl shadow-2xs font-bold transition-colors cursor-pointer"
              title="چاپکردنی پسوولەی ڕاپۆرتی ڕۆژانە بۆ چاپکەری پەڕاو (58mm Thermal Receipt)"
            >
              <Printer className="w-3.5 h-3.5 text-orange-600" />
              <span>چاپکردنی پسوولەی حسابی ئەمڕۆ</span>
            </button>

            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-gray-700 bg-white hover:bg-orange-50/70 border border-orange-200 px-3.5 py-2 rounded-2xl shadow-2xs font-bold transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-orange-500 ${loading ? 'animate-spin' : ''}`} />
              <span>نوێکردنەوە</span>
            </button>
          </div>
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
          onPrintDailyReport={handlePrintDailyReport}
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

      {/* Thermal Receipt Print Preview Modal for Desktop / Browser Fallback */}
      {showThermalPreviewModal && (
        <Modal
          isOpen={showThermalPreviewModal}
          onClose={() => setShowThermalPreviewModal(false)}
          title="پسوولەی حیساباتی ڕۆژانە (Thermal Receipt Layout)"
          icon={<Printer className="w-6 h-6 text-orange-500" />}
          size="sm"
          footer={
            <div className="flex items-center justify-between gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowThermalPreviewModal(false)}
                className="rounded-2xl text-xs font-bold cursor-pointer"
              >
                داخستن
              </Button>
              <Button
                id="execute-browser-print-btn"
                type="button"
                onClick={handleBrowserPrint}
                className="bg-orange-500 hover:bg-orange-600 text-white font-black px-5 py-2.5 rounded-2xl shadow-xs text-xs sm:text-sm cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>چاپکردنی پسوولە</span>
              </Button>
            </div>
          }
        >
          <div className="bg-gray-100 p-4 rounded-2xl max-h-[70vh] overflow-y-auto">
            <div className="bg-white shadow-md rounded-xl p-3 border border-gray-200 mx-auto max-w-[280px]">
              <DailyReportThermalReceipt
                summary={dailyClosingSummary}
                topProducts={summary.topProducts}
                expenseCategories={summary.expenseCategories}
                closedByName={closing?.closedByName || displayName}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Hidden container for print stylesheet */}
      <DailyReportThermalReceipt
        summary={dailyClosingSummary}
        topProducts={summary.topProducts}
        expenseCategories={summary.expenseCategories}
        closedByName={closing?.closedByName || displayName}
        isPrintOnly={true}
      />
    </div>
  );
};
