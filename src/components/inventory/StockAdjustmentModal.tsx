import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useInventory } from '../../hooks/useInventory';
import { useToast } from '../../hooks/useToast';
import { Ingredient } from '../../types/inventory';
import { Sliders, CheckCircle2, AlertCircle } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
}

const COMMON_REASONS = [
  'بەفیڕۆچوون لە کاتی برژاندن / ئامادەکردن',
  'سووتاوی / لەکارکەوتن',
  'کەمبوونی تۆمارکراو لە ژماردنی کۆتایی ڕۆژ',
  'هەڵەی پێوانی پێشوو',
  'تێکچوون / بەسەرچوون',
  'کێشی خاوێنکردنەوە و چەوری',
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  ingredient,
}) => {
  const { adjustStock } = useInventory();
  const { success, error } = useToast();

  const [newStock, setNewStock] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (ingredient) {
      setNewStock(ingredient.currentStock ?? 0);
      setReason('');
      setValidationError(null);
    }
  }, [ingredient]);

  if (!ingredient) return null;

  const currentStock = Number(ingredient.currentStock || 0);
  const targetStockNum = newStock === '' ? 0 : Number(newStock);
  const delta = Math.round((targetStockNum - currentStock) * 1000) / 1000;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newStock === '' || isNaN(targetStockNum) || targetStockNum < 0) {
      setValidationError('تکایە ژمارەیەکی دروست و یەکسان یان گەورەتر لە ٠ بنووسە');
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setValidationError('تکایە هۆکاری دەستکاریکردنی کۆگا (وەک بەفیڕۆچوون یان ژماردن) دیاری بکە یان بنووسە');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);

      await adjustStock({
        ingredientId: ingredient.id,
        newStock: targetStockNum,
        reason: trimmedReason,
      });

      success(
        `کۆگای "${ingredient.name}" ڕێکخرایەوە بۆ ${targetStockNum} ${ingredient.unit}`
      );
      onClose();
    } catch (err: any) {
      console.error('Stock Adjustment error:', err);
      setValidationError(err.message || 'دەستکاریکردنی کۆگا سەرکەوتوو نەبوو');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`ڕێکخستن و چاککردنی کۆگا: ${ingredient.name}`}
      icon={<Sliders className="w-5 h-5 text-indigo-600" />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl font-bold"
          >
            هەڵوەشاندنەوە
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleFormSubmit}
            isLoading={isSubmitting}
            className="gap-2 font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl custom-shadow"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>پاشەکەوتکردنی ڕێکخستن</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleFormSubmit} className="space-y-4 text-right">
        {/* Ingredient Current Stats */}
        <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-bold block">پێکهاتە:</span>
            <span className="text-sm font-black text-gray-900">{ingredient.name}</span>
          </div>
          <div className="text-left">
            <span className="text-xs text-gray-500 font-bold block">کۆگای تۆمارکراوی ئێستا:</span>
            <span className="text-base font-black font-mono text-indigo-700">
              {ingredient.currentStock} {ingredient.unit}
            </span>
          </div>
        </div>

        {/* New Exact Stock Count */}
        <div>
          <label className="block text-xs font-black text-gray-700 mb-1.5">
            بڕی نوێی دروستکراو دوای ژماردن یان بەفیڕۆچوون ({ingredient.unit})
          </label>
          <input
            type="number"
            value={newStock}
            onChange={(e) =>
              setNewStock(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))
            }
            placeholder="0"
            step="any"
            min="0"
            required
            autoFocus
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-indigo-200 bg-white px-4 py-2.5 text-base font-black text-indigo-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 min-h-[48px] text-right font-mono"
          />
        </div>

        {/* Difference Indicator */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            delta < 0
              ? 'bg-red-50 border-red-200 text-red-800'
              : delta > 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}
        >
          <span>جیاوازی ژماردن لەگەڵ سیستەم:</span>
          <span className="font-mono text-sm font-black">
            {delta > 0 ? `+${delta}` : delta} {ingredient.unit}
          </span>
        </div>

        {/* Mandatory Reason */}
        <div>
          <label className="block text-xs font-black text-gray-700 mb-1.5 flex items-center justify-end gap-1">
            <span>هۆکاری دەستکاریکردن (ئیجباری)</span>
            <span className="text-red-500 font-black">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {COMMON_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                  reason === r
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="هۆکاری دەستکاریکردن بنووسە..."
            required
            className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 text-right"
          />
        </div>

        {validationError && (
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100 font-bold">
            {validationError}
          </p>
        )}
      </form>
    </Modal>
  );
};
