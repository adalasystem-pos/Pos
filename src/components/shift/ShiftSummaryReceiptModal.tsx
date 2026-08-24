import React from 'react';
import { Shift } from '../../types/shift';
import { formatIQD } from '../../utils/currency';
import { formatBaghdadTime } from '../../utils/dates';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  CheckCircle2,
  Printer,
  Calendar,
  Lock,
  Coins,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  X,
} from 'lucide-react';

interface ShiftSummaryReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
}

export const ShiftSummaryReceiptModal: React.FC<ShiftSummaryReceiptModalProps> = ({
  isOpen,
  onClose,
  shift,
}) => {
  if (!shift) return null;

  const variance = shift.variance ?? 0;

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="پسوولەی ژمێریاری و داخستنی شێفت" size="md">
      <div className="space-y-4 text-right">
        {/* Success Header */}
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-emerald-950">شێفت بە سەرکەوتوویی داخرا</h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              ژمێریاری سندوق و وردەکارییە داراییەکان لە سیستەم بە تەواوی پاشەکەوت کران.
            </p>
          </div>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-2xs space-y-3 font-mono text-xs text-gray-800">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-gray-300 space-y-1">
            <h3 className="font-black text-base text-gray-900 font-sans">برژاوی عەدالە</h3>
            <p className="text-[11px] text-gray-500 font-sans">پسوولەی داخستنی شێفتی سندوق</p>
            <div className="flex items-center justify-center gap-3 text-[10px] text-gray-500 pt-1" dir="ltr">
              <span>{shift.baghdadDate || '---'}</span>
              <span>•</span>
              <span>کاشێر: {shift.closedByName || shift.openedByName || 'کاشێر'}</span>
            </div>
          </div>

          {/* Time logs */}
          <div className="space-y-1 py-1 text-[11px] text-gray-600 border-b border-dashed border-gray-300">
            <div className="flex justify-between">
              <span>کاتی دەستپێکردن:</span>
              <span dir="ltr">{shift.openedAt ? formatBaghdadTime(shift.openedAt) : '--:--'}</span>
            </div>
            <div className="flex justify-between">
              <span>کاتی داخستن:</span>
              <span dir="ltr">{shift.closedAt ? formatBaghdadTime(shift.closedAt) : '--:--'}</span>
            </div>
          </div>

          {/* Reconciliation numbers */}
          <div className="space-y-2 py-2 border-b border-dashed border-gray-300">
            <div className="flex justify-between font-sans">
              <span className="text-gray-600">پارەی سەرەتایی:</span>
              <span className="font-bold text-gray-900" dir="ltr">
                {formatIQD(shift.openingCash || 0)}
              </span>
            </div>
            <div className="flex justify-between font-sans">
              <span className="text-gray-600">فرۆشی کاش ({shift.orderCount || 0} داواکاری):</span>
              <span className="font-bold text-emerald-700" dir="ltr">
                +{formatIQD(shift.totalCashSales || 0)}
              </span>
            </div>
            <div className="flex justify-between font-sans">
              <span className="text-gray-600">داخڵکراو (Cash In):</span>
              <span className="font-bold text-blue-700" dir="ltr">
                +{formatIQD(shift.totalCashIn || 0)}
              </span>
            </div>
            <div className="flex justify-between font-sans">
              <span className="text-gray-600">دەرچوو (Cash Out):</span>
              <span className="font-bold text-red-700" dir="ltr">
                -{formatIQD(shift.totalCashOut || 0)}
              </span>
            </div>
          </div>

          {/* Expected vs Actual */}
          <div className="space-y-2 py-2 border-b border-dashed border-gray-300 font-sans">
            <div className="flex justify-between font-bold">
              <span>پارەی چاوەڕوانکراو (Expected):</span>
              <span dir="ltr">{formatIQD(shift.expectedCash || 0)}</span>
            </div>
            <div className="flex justify-between font-black text-sm">
              <span>پارەی ژمێردراوی دەستی (Actual):</span>
              <span dir="ltr">{formatIQD(shift.actualCash || 0)}</span>
            </div>
          </div>

          {/* Variance */}
          <div
            className={`p-2.5 rounded-xl flex items-center justify-between font-sans font-bold text-xs ${
              variance === 0
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : variance > 0
                ? 'bg-blue-50 text-blue-900 border border-blue-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            <span>جیاوازی سندوق (Variance):</span>
            <span dir="ltr">
              {variance === 0
                ? '0 IQD (تەواوە)'
                : variance > 0
                ? `+${formatIQD(variance)} (زیادە)`
                : `-${formatIQD(Math.abs(variance))} (کەمی)`}
            </span>
          </div>

          {shift.notes && (
            <div className="pt-2 text-[11px] font-sans text-gray-500">
              <span className="font-bold">تێبینی: </span>
              <span>{shift.notes}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-5 flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>داخستنی پەنجەرە</span>
          </Button>
          <Button
            type="button"
            onClick={handlePrintReceipt}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-6 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>چاپکردنی پسوولە</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
