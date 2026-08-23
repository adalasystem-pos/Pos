import React from 'react';
import { Expense } from '../../types/expense';
import { formatIQD } from '../../utils/currency';
import { formatBaghdadDateTime } from '../../utils/dates';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Badge } from '../ui/Badge';
import { Receipt, Calendar, User } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  loading?: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, loading }) => {
  if (expenses.length === 0 && !loading) {
    return (
      <EmptyState
        title="هیچ خەرجییەک تۆمار نەکراوە"
        description="هەر خەرجییەک کە ئەمڕۆ تۆمار بکرێت لێرەدا دەردەکەوێت."
        icon={<Receipt className="w-8 h-8" />}
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {expenses.map((exp) => (
        <Card
          key={exp.expenseId}
          id={`expense-row-${exp.expenseId}`}
          className="p-4 bg-white border border-orange-100/90 shadow-sm text-right transition-all rounded-3xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="warning" size="sm">
                  {exp.category}
                </Badge>
                {exp.note && (
                  <span className="text-xs text-gray-700 font-bold">{exp.note}</span>
                )}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span dir="ltr">{formatBaghdadDateTime(exp.createdAt)}</span>
                </span>
                {exp.createdByName && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{exp.createdByName}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-left shrink-0">
              <span className="text-sm sm:text-base font-black text-red-600 block" dir="rtl">
                -{formatIQD(exp.amount)}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
