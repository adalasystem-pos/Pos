import React, { useState } from 'react';
import { ExpenseCategory } from '../../types/expense';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { createExpense } from '../../services/expenses.service';
import { parseIntegerIQD } from '../../utils/currency';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { PlusCircle, DollarSign, Tag, FileText } from 'lucide-react';

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'گۆشت', label: 'گۆشت (Meat)' },
  { value: 'سەوزە', label: 'سەوزە و میوە (Vegetables)' },
  { value: 'نان', label: 'نان و هەویر (Bread & Flour)' },
  { value: 'کرێ', label: 'کرێی شوێن (Rent)' },
  { value: 'کارمەند', label: 'مووچەی کارمەندان (Staff Wages)' },
  { value: 'گاز', label: 'گاز و سووتەمەنی (Gas / Fuel)' },
  { value: 'کارەبا', label: 'کارەبا و مۆلیدە (Electricity)' },
  { value: 'ئاو', label: 'ئاو و پاککەرەوە (Water & Cleaning)' },
  { value: 'گواستنەوە', label: 'گواستنەوە و هاتووچۆ (Transport)' },
  { value: 'هی تر', label: 'خەرجی تر (Other / Misc)' },
];

export const ExpenseForm: React.FC<{ onExpenseAdded?: () => void }> = ({ onExpenseAdded }) => {
  const { user, displayName } = useAuth();
  const { success, error } = useToast();
  const { isOnline } = useNetworkStatus();

  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('گۆشت');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      error('تکایە سەرەتا بچۆ ژوورەوە بۆ تۆمارکردنی خەرجی');
      return;
    }

    const amount = parseIntegerIQD(amountStr);
    if (!amount || amount <= 0) {
      setFormError('تکایە بڕی پارەی خەرجی بە دروستی بنووسە (دەبێت لە سفر زیاتر بێت)');
      return;
    }

    if (!category) {
      setFormError('تکایە جۆری خەرجی دیاری بکە');
      return;
    }

    if (!isOnline) {
      error('پەیوەندی ئینتەرنێت پچڕاوە. ناتوانرێت خەرجی پاشەکەوت بکرێت.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createExpense({
        amount,
        category,
        note,
        userId: user.uid,
        userName: displayName,
      });

      // Clear form ONLY on successful save
      setAmountStr('');
      setCategory('گۆشت');
      setNote('');
      success('خەرجی بە سەرکەوتوویی تۆمارکرا');
      if (onExpenseAdded) onExpenseAdded();
    } catch (err: any) {
      console.error('Expense error:', err);
      const errMsg = err.message || 'تۆمارکردنی خەرجی سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە.';
      setFormError(errMsg);
      error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-white border-2 border-orange-100 shadow-sm rounded-3xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-orange-100">
        <div className="p-2.5 bg-red-100 text-red-600 rounded-2xl">
          <PlusCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-base text-gray-800">تۆمارکردنی خەرجی نوێ</h3>
          <p className="text-xs text-gray-400 font-medium">خەرجییەکانی ئەمڕۆ تۆمار بکە بۆ هەژمارکردنی قازانجی پاک</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-right">
        {/* Amount input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5 justify-end">
            <span>بڕی پارە (بە دیناری عێراقی)</span>
            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
          </label>
          <div className="relative">
            <input
              id="expense-amount-input"
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="نموونە: 25000"
              className="w-full rounded-2xl border border-orange-200 px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none min-h-[46px] text-right"
            />
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-black text-orange-600 pointer-events-none">
              د.ع
            </span>
          </div>
        </div>

        {/* Category Select */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5 justify-end">
            <span>جۆری خەرجی</span>
            <Tag className="w-3.5 h-3.5 text-gray-400" />
          </label>
          <Select
            id="expense-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            options={CATEGORY_OPTIONS}
          />
        </div>

        {/* Note input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5 justify-end">
            <span>تێبینی (ئارەزوومەندانە)</span>
            <FileText className="w-3.5 h-3.5 text-gray-400" />
          </label>
          <Input
            id="expense-note-input"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ڕوونکردنەوە لەسەر خەرجییەکە..."
          />
        </div>

        {formError && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
            {formError}
          </p>
        )}

        <Button
          id="submit-expense-btn"
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={!isOnline}
          className="gap-2 font-black mt-3 custom-shadow py-3.5 rounded-2xl"
        >
          <PlusCircle className="w-5 h-5" />
          <span>تۆمارکردنی خەرجی</span>
        </Button>
      </form>
    </Card>
  );
};
