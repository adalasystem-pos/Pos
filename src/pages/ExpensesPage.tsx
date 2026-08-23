import React from 'react';
import { useDailyReport } from '../hooks/useDailyReport';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingState } from '../components/ui/LoadingState';
import { formatIQD } from '../utils/currency';
import { Receipt, TrendingDown } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { expenses, summary, loading } = useDailyReport();

  return (
    <div id="expenses-page" className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="تۆماری خەرجییەکان"
        subtitle="تۆمارکردن و بەڕێوەبردنی خەرجییەکانی چێشتخانە بە شێوەی ڕاستەوخۆ"
        action={
          <div className="flex items-center gap-2 bg-red-50 border border-red-200/80 px-4 py-2.5 rounded-2xl text-red-900 shadow-2xs">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold">کۆی خەرجی ئەمڕۆ:</span>
            <span className="text-sm font-black text-red-600">{formatIQD(summary.totalExpenses)}</span>
          </div>
        }
      />

      {/* Grid: Form (Left on RTL, 5 cols) and List (Right on RTL, 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form */}
        <div className="lg:col-span-5">
          <ExpenseForm />
        </div>

        {/* List of today's recorded expenses */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-500" />
              <span>خەرجییە تۆمارکراوەکانی ئەمڕۆ ({expenses.length})</span>
            </h3>
          </div>

          {loading ? (
            <LoadingState message="خەرجییەکان باردەکرێن..." />
          ) : (
            <ExpenseList expenses={expenses} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
};
