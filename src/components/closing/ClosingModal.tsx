import React, { useState } from 'react';
import { DailySummary } from '../../types/closing';
import { formatIQD } from '../../utils/currency';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Lock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
  summary: DailySummary;
}

export const ClosingModal: React.FC<ClosingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  summary,
}) => {
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCloseDay = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onConfirm(notes);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'داخستنی سندوق سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="داخستنی سندوقی ئەمڕۆ"
      maxWidth="md"
      id="daily-closing-modal"
      footer={
        <>
          <Button
            id="cancel-closing-btn"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl font-bold"
          >
            پاشگەزبوونەوە
          </Button>
          <Button
            id="confirm-closing-btn"
            variant="primary"
            onClick={handleCloseDay}
            isLoading={isSubmitting}
            className="gap-2 font-black bg-gray-900 hover:bg-black text-white rounded-2xl"
          >
            <Lock className="w-4 h-4" />
            <span>بەڵێ، سندوق دابخە</span>
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-right">
        {/* Warning banner */}
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-black text-orange-950">
              دڵنیایت دەتەوێت سندوقی ئەمڕۆ دابخەیت؟
            </p>
            <p className="text-xs text-orange-800 leading-relaxed font-medium">
              دوای داخستن، کۆی فرۆش، خەرجی و قازانجی ئەمڕۆ قفڵ دەکرێن و بە فەرمی لە داتابەیس پاشەکەوت دەبن.
            </p>
          </div>
        </div>

        {/* Financial Summary Table */}
        <div className="space-y-2.5 bg-orange-50/60 p-4 rounded-2xl border border-orange-100">
          <h4 className="text-xs font-bold text-gray-700 pb-2 border-b border-orange-200/80 flex items-center justify-between">
            <span>کۆتایی ژمێریاری ئەمڕۆ ({summary.businessDate})</span>
            <ShieldCheck className="w-4 h-4 text-orange-400" />
          </h4>

          <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
            <span>کۆی فرۆش ({summary.orderCount} داواکاری):</span>
            <span className="font-bold text-emerald-600">{formatIQD(summary.totalSales)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
            <span>کۆی خەرجییەکان ({summary.expenseCount} خەرجی):</span>
            <span className="font-bold text-red-600">-{formatIQD(summary.totalExpenses)}</span>
          </div>

          <div className="pt-2 border-t border-orange-200/80 flex items-center justify-between text-sm">
            <span className="font-bold text-gray-900">قازانجی پاکی ئەمڕۆ:</span>
            <span
              className={`font-black ${
                summary.netProfit >= 0 ? 'text-orange-600' : 'text-red-600'
              }`}
            >
              {formatIQD(summary.netProfit)}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            تێبینی داخستن (ئارەزوومەندانە):
          </label>
          <Input
            id="closing-notes-input"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="نموونە: هەموو ژمێریاری کۆتایی ڕۆژ پشکنرا"
          />
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
            {errorMsg}
          </p>
        )}
      </div>
    </Modal>
  );
};
