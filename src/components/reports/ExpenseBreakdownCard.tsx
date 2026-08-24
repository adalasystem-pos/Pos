import React from 'react';
import { ExpenseCategorySummary } from '../../types/analytics';
import { formatIQD } from '../../utils/currency';
import { Card } from '../ui/Card';
import { PieChart, Receipt, Layers } from 'lucide-react';

interface ExpenseBreakdownCardProps {
  categories: ExpenseCategorySummary[];
  totalExpenses: number;
  loading?: boolean;
}

export const ExpenseBreakdownCard: React.FC<ExpenseBreakdownCardProps> = ({
  categories,
  totalExpenses,
  loading,
}) => {
  return (
    <Card
      id="expense-breakdown-card"
      className="p-5 bg-white border border-red-100 shadow-sm rounded-3xl space-y-4 text-right"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-red-50 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-100 text-red-600">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">شیکاری خەرجییەکان (Expense Breakdown)</h3>
            <p className="text-[11px] text-gray-500 font-medium">
              دابەشبوونی خەرجییەکان بەپێی بەشەکان
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-xl border border-red-200">
          {categories.length} بەش
        </span>
      </div>

      {/* Content */}
      {categories.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-red-50 text-red-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-500">هیچ خەرجییەک لەم ماوەیەدا تۆمار نەکراوە</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {categories.map((item, index) => (
            <div
              key={item.category || index}
              className="p-2.5 rounded-2xl bg-red-50/30 hover:bg-red-50/60 border border-red-100/50 transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span className="font-black text-gray-900">{item.category}</span>
                  <span className="text-[10px] text-gray-400 font-bold">
                    ({item.count} تۆمار)
                  </span>
                </div>

                <div className="flex items-center gap-2.5 font-mono" dir="ltr">
                  <span className="text-[11px] font-black text-red-600 bg-white px-2 py-0.5 rounded-lg border border-red-200 shadow-2xs">
                    {item.percentage}%
                  </span>
                  <span className="font-bold text-gray-800">
                    {formatIQD(item.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-red-100">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, item.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
