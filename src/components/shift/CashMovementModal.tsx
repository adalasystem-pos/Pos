import React, { useState, useEffect } from 'react';
import { useShift } from '../../hooks/useShift';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { CashMovementType } from '../../types/shift';
import { formatIQD, parseIntegerIQD } from '../../utils/currency';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ArrowDownCircle, ArrowUpCircle, Coins, AlertCircle, HelpCircle } from 'lucide-react';

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: CashMovementType;
}

const CASH_IN_SUGGESTIONS = [
  'پارەی وردەی سندوق',
  'زیادکردنی کاشی سندوق',
  'پارەی کاتی خاوەن کار',
  'گەڕانەوەی قەرز / پێشەکی',
];

const CASH_OUT_SUGGESTIONS = [
  'گواستنەوەی پارە بۆ قاسەی سەرەکی',
  'کڕینی کاتی پێداویستی بەپەلە',
  'پێشەکی کارمەند',
  'پارەی گواستنەوە و هاتووچۆ',
];

export const CashMovementModal: React.FC<CashMovementModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'cash_in',
}) => {
  const { addCashIn, addCashOut, isShiftOpen } = useShift();
  const { role } = useAuth();
  const { error } = useToast();

  const [type, setType] = useState<CashMovementType>(defaultType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setType(defaultType);
    setAmountStr('');
    setReason('');
    setFormError(null);
  }, [defaultType, isOpen]);

  if (role === 'captain') {
    return null;
  }

  const isCashIn = type === 'cash_in';
  const suggestions = isCashIn ? CASH_IN_SUGGESTIONS : CASH_OUT_SUGGESTIONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isShiftOpen) {
      setFormError('هیچ شێفتێکی کراوە نییە. ناتوانرێت جوڵەی پارە تۆمار بکرێت.');
      return;
    }

    const amount = parseIntegerIQD(amountStr);
    if (!amount || amount <= 0) {
      setFormError('تکایە بڕی پارەی دروست بنووسە (دەبێت لە سفر زیاتر بێت)');
      return;
    }

    if (!reason.trim()) {
      setFormError('تکایە هۆکاری جوڵەی پارە بە ڕوونی بنووسە');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isCashIn) {
        await addCashIn(amount, reason.trim());
      } else {
        await addCashOut(amount, reason.trim());
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to record cash movement:', err);
      setFormError(err.message || 'تۆمارکردنی جوڵەی پارە سەرکەوتوو نەبوو');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedAmount = parseIntegerIQD(amountStr) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCashIn ? 'داخڵکردنی پارە بۆ ناو سندوق (Cash In)' : 'دەرهێنانی پارە لە سندوق (Cash Out)'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-right">
        {/* Type Selector Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setType('cash_in');
              setFormError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              isCashIn
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>داخڵکردنی پارە (Cash In)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('cash_out');
              setFormError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              !isCashIn
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>دەرهێنانی پارە (Cash Out)</span>
          </button>
        </div>

        {/* Informational Guidance Notice */}
        <div
          className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
            isCashIn
              ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900'
              : 'bg-red-50/80 border-red-200/80 text-red-900'
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isCashIn
              ? 'داخڵکردنی پارە کاریگەری لەسەر داهاتی فرۆش ناکات، بەڵکو بڕی چاوەڕوانکراوی سندوق لە کاتی داخستندا زیاد دەکات.'
              : 'دەرهێنانی پارە کاریگەری لەسەر خەرجییە گشتییەکان ناکات، بەڵکو بڕی کاشی ناو سندوق کەمدەکاتەوە بۆ ژمێریاری.'}
          </p>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-end gap-1.5">
            <span>بڕی پارە (IQD)</span>
            <Coins className="w-3.5 h-3.5 text-gray-400" />
          </label>
          <div className="relative">
            <input
              id="cash-movement-amount"
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(e.target.value);
                setFormError(null);
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

        {/* Reason Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            <span>هۆکاری جوڵەی پارە (پێویستە)</span>
          </label>
          <input
            id="cash-movement-reason"
            type="text"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setFormError(null);
            }}
            placeholder="نموونە: زیادکردنی پارەی وردە یان گواستنەوە بۆ قاسە"
            className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl text-sm font-bold text-gray-900 focus:outline-none transition-all text-right"
          />

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {suggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setReason(sug)}
                className="text-[11px] font-semibold bg-gray-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200 transition-all"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-bold text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
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
            className={`font-bold text-white rounded-xl px-6 ${
              isCashIn ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSubmitting ? 'پاشەکەوت دەکرێت...' : isCashIn ? 'تۆمارکردنی داخڵ' : 'تۆمارکردنی دەرچوو'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
