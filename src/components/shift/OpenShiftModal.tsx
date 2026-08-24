import React, { useState } from 'react';
import { useShift } from '../../hooks/useShift';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatIQD, parseIntegerIQD } from '../../utils/currency';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LockOpen, Coins, AlertCircle, ArrowRight } from 'lucide-react';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = [0, 25000, 50000, 100000, 250000];

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({ isOpen, onClose }) => {
  const { openShift } = useShift();
  const { role } = useAuth();
  const { error } = useToast();

  const [openingCashStr, setOpeningCashStr] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);

  if (role === 'captain') {
    return null;
  }

  const handleQuickAmount = (val: number) => {
    setOpeningCashStr(val.toString());
    setInputError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const amount = parseIntegerIQD(openingCashStr);
    if (isNaN(amount) || amount < 0) {
      setInputError('تکایە بڕی پارەی سەرەتایی دروست بنووسە (سفر یان زیاتر)');
      return;
    }

    try {
      setIsSubmitting(true);
      await openShift(amount);
      onClose();
    } catch (err: any) {
      console.error('Failed to open shift:', err);
      setInputError(err.message || 'کردنەوەی شێفت سەرکەوتوو نەبوو');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmount = parseIntegerIQD(openingCashStr) || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="کردنەوەی شێفتی نوێ" size="md">
      <form onSubmit={handleSubmit} className="space-y-5 text-right">
        <div className="bg-orange-50/80 border border-orange-200/90 p-4 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-orange-500 text-white rounded-xl shrink-0 mt-0.5">
            <LockOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-800">دەستپێکردنی کارکردنی سندوق</h4>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              تکایە بڕی پارەی کاشی ناو سندوق (پارەی وردە/سەرەتایی) دیاری بکە پێش دەستپێکردنی فرۆشتن.
            </p>
          </div>
        </div>

        {/* Input Field */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-end gap-1.5">
            <span>بڕی پارەی سەرەتایی سندوق (IQD)</span>
            <Coins className="w-3.5 h-3.5 text-orange-500" />
          </label>
          <div className="relative">
            <input
              id="opening-cash-input"
              type="text"
              inputMode="numeric"
              value={openingCashStr}
              onChange={(e) => {
                setOpeningCashStr(e.target.value);
                setInputError(null);
              }}
              placeholder="0"
              className="w-full pl-24 pr-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl text-xl font-black text-gray-900 focus:outline-none transition-all text-right"
              autoFocus
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
              دیناری عێراقی
            </div>
          </div>

          {parsedAmount > 0 && (
            <p className="text-xs font-bold text-orange-600 mt-1.5 text-left" dir="ltr">
              {formatIQD(parsedAmount)}
            </p>
          )}
        </div>

        {/* Quick Amount Chips */}
        <div>
          <span className="block text-xs font-medium text-gray-500 mb-2">بڕی خێرا:</span>
          <div className="grid grid-cols-5 gap-2">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                  parsedAmount === val
                    ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                    : 'bg-gray-50 hover:bg-orange-50 text-gray-700 border-gray-200 hover:border-orange-300'
                }`}
              >
                {val === 0 ? 'سفر' : `${(val / 1000).toLocaleString('en-US')} هەزار`}
              </button>
            ))}
          </div>
        </div>

        {inputError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{inputError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl px-5"
          >
            پەشیمانبوونەوە
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-6 flex items-center gap-2"
          >
            {isSubmitting ? (
              'دەکرێتەوە...'
            ) : (
              <>
                <span>کردنەوەی سندوق</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
