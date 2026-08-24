import React, { useState, useEffect } from 'react';
import { useShift } from '../../hooks/useShift';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Shift, ShiftReconciliationData } from '../../types/shift';
import { formatIQD, parseIntegerIQD } from '../../utils/currency';
import { formatBaghdadTime } from '../../utils/dates';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LoadingState } from '../ui/LoadingState';
import {
  Lock,
  Calculator,
  Coins,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Receipt,
} from 'lucide-react';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftClosed?: (shift: Shift) => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  onShiftClosed,
}) => {
  const { activeShift, closeShift, getReconciliation } = useShift();
  const { role } = useAuth();
  const { error } = useToast();

  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [reconData, setReconData] = useState<ShiftReconciliationData | null>(null);
  const [actualCashStr, setActualCashStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeShift) {
      setLoadingData(true);
      setActualCashStr('');
      setNotes('');
      setFormError(null);

      getReconciliation()
        .then((data) => {
          setReconData(data);
          // Pre-fill with expected cash as a convenience guide
          setActualCashStr(data.expectedCash.toString());
          setLoadingData(false);
        })
        .catch((err) => {
          console.error('Error fetching reconciliation data:', err);
          setFormError('هەڵەیەک لە بارکردنی ژمێریاری سندوق ڕوویدا');
          setLoadingData(false);
        });
    }
  }, [isOpen, activeShift, getReconciliation]);

  if (role === 'captain') {
    return null;
  }

  const parsedActualCash = parseIntegerIQD(actualCashStr) ?? 0;
  const expectedCash = reconData?.expectedCash ?? (activeShift?.openingCash || 0);
  const variance = parsedActualCash - expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeShift) {
      setFormError('هیچ شێفتێکی کراوە نییە بۆ داخستن');
      return;
    }

    const actual = parseIntegerIQD(actualCashStr);
    if (isNaN(actual) || actual < 0) {
      setFormError('تکایە بڕی پارەی ژمێردراوی سندوق بە دروستی بنووسە');
      return;
    }

    try {
      setIsSubmitting(true);
      const closed = await closeShift(actual, notes.trim());
      onClose();
      if (onShiftClosed) {
        onShiftClosed(closed);
      }
    } catch (err: any) {
      console.error('Failed to close shift:', err);
      setFormError(err.message || 'داخستنی شێفت سەرکەوتوو نەبوو');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="داخستن و تەواوکردنی شێفت" size="lg">
      {loadingData ? (
        <div className="py-8">
          <LoadingState message="ژمێریاری سندوق و فرۆش هەژمار دەکرێت..." />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-right">
          {/* Shift Time Info Header */}
          <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-gray-700">دەستپێکردنی شێفت:</span>
              <span className="text-gray-900 font-semibold" dir="ltr">
                {activeShift?.openedAt ? formatBaghdadTime(activeShift.openedAt) : '--:--'}
              </span>
            </div>
            <div className="text-gray-500">
              <span>کاشێر: </span>
              <span className="font-bold text-gray-800">{activeShift?.openedByName || 'کاشێر'}</span>
            </div>
          </div>

          {/* Mathematical Reconciliation Grid */}
          <div className="bg-amber-50/60 border-2 border-amber-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-200/70 text-amber-900 font-black text-xs">
              <Calculator className="w-4 h-4 text-amber-600" />
              <span>هەژمارکردنی پارەی چاوەڕوانکراوی سندوق (Expected Cash)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {/* Opening Cash */}
              <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                <span className="block text-[11px] text-gray-500 font-medium">پارەی سەرەتایی</span>
                <span className="block text-sm font-black text-gray-800 mt-0.5" dir="ltr">
                  {formatIQD(reconData?.openingCash || 0)}
                </span>
              </div>

              {/* Cash Sales */}
              <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  <span>فرۆشی کاش ({reconData?.orderCount || 0})</span>
                </div>
                <span className="block text-sm font-black text-emerald-700 mt-0.5" dir="ltr">
                  +{formatIQD(reconData?.totalCashSales || 0)}
                </span>
              </div>

              {/* Cash In */}
              <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[11px] text-blue-600 font-medium">
                  <ArrowDownCircle className="w-3 h-3" />
                  <span>داخڵکراو (Cash In)</span>
                </div>
                <span className="block text-sm font-black text-blue-700 mt-0.5" dir="ltr">
                  +{formatIQD(reconData?.totalCashIn || 0)}
                </span>
              </div>

              {/* Cash Out */}
              <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[11px] text-red-600 font-medium">
                  <ArrowUpCircle className="w-3 h-3" />
                  <span>دەرچوو (Cash Out)</span>
                </div>
                <span className="block text-sm font-black text-red-700 mt-0.5" dir="ltr">
                  -{formatIQD(reconData?.totalCashOut || 0)}
                </span>
              </div>
            </div>

            {/* Expected Cash Total Banner */}
            <div className="bg-amber-100/90 border border-amber-300/80 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs font-black text-amber-950">کۆی چاوەڕوانکراوی سندوق (Expected):</span>
              <span className="text-base font-black text-amber-950" dir="ltr">
                {formatIQD(expectedCash)}
              </span>
            </div>
          </div>

          {/* Actual Cash Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-end gap-1.5">
              <span>پارەی ژمێردراوی دەستی ناو سندوق (Actual Cash)</span>
              <Coins className="w-3.5 h-3.5 text-orange-500" />
            </label>
            <div className="relative">
              <input
                id="actual-cash-input"
                type="text"
                inputMode="numeric"
                value={actualCashStr}
                onChange={(e) => {
                  setActualCashStr(e.target.value);
                  setFormError(null);
                }}
                placeholder="0"
                className="w-full pl-24 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl text-2xl font-black text-gray-900 focus:outline-none transition-all text-right"
                autoFocus
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                دیناری عێراقی
              </div>
            </div>
          </div>

          {/* Dynamic Real-Time Variance Calculation Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
              variance === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : variance > 0
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {variance === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : variance > 0 ? (
                <Scale className="w-5 h-5 text-blue-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-xs font-bold">
                {variance === 0
                  ? 'سندوق تەواوە و هیچ جیاوازییەک نییە (یەکسانە)'
                  : variance > 0
                  ? 'پارەی زیادە لە سندوق (Surplus):'
                  : 'کەمی لە سندوق (Shortage):'}
              </span>
            </div>
            <div className="text-sm font-black" dir="ltr">
              {variance === 0 ? (
                <span className="text-emerald-700">0 IQD</span>
              ) : variance > 0 ? (
                <span className="text-blue-700">+{formatIQD(variance)}</span>
              ) : (
                <span className="text-red-700">-{formatIQD(Math.abs(variance))}</span>
              )}
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              <span>تێبینی داخستنی شێفت (ئارەزوومەندانە)</span>
            </label>
            <textarea
              id="close-shift-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ئەگەر جیاوازی هەبوو یان تێبینییەک هەیە لێرە بنووسە..."
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 focus:border-orange-500 focus:bg-white rounded-2xl text-xs font-medium text-gray-900 focus:outline-none transition-all text-right resize-none"
            />
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
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-6 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'دادەخرێت...' : 'داخستنی یەکجاری شێفت'}</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
