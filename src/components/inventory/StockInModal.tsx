import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useInventory } from '../../hooks/useInventory';
import { useToast } from '../../hooks/useToast';
import { Ingredient } from '../../types/inventory';
import { Plus, CheckCircle2, ArrowDownToLine, PackagePlus } from 'lucide-react';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  ingredient,
}) => {
  const { stockIn } = useInventory();
  const { success, error } = useToast();

  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('کڕینی نوێ');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (ingredient) {
      setQuantity('');
      setReason('کڕینی نوێ');
      setValidationError(null);
    }
  }, [ingredient]);

  if (!ingredient) return null;

  const currentStock = Number(ingredient.currentStock || 0);
  const addQty = quantity === '' ? 0 : Number(quantity);
  const projectedStock = Math.round((currentStock + addQty) * 1000) / 1000;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(addQty) || addQty <= 0) {
      setValidationError('تکایە بڕێکی دروست و زیاتر لە ٠ بنووسە');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);

      await stockIn({
        ingredientId: ingredient.id,
        quantity: addQty,
        reason: reason.trim() || 'زیادکردنی کۆگا',
      });

      success(`بڕی ${addQty} ${ingredient.unit} زیادکرا بۆ کۆگای "${ingredient.name}"`);
      onClose();
    } catch (err: any) {
      console.error('Stock In error:', err);
      setValidationError(err.message || 'زیادکردنی کۆگا سەرکەوتوو نەبوو');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`زیادکردنی کۆگا (Stock In): ${ingredient.name}`}
      icon={<PackagePlus className="w-5 h-5 text-emerald-600" />}
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
            className="gap-2 font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl custom-shadow"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>پاشەکەوتکردنی زیادکردن</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleFormSubmit} className="space-y-4 text-right">
        {/* Ingredient Stats Header */}
        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-bold block">پێکهاتە:</span>
            <span className="text-sm font-black text-gray-900">{ingredient.name}</span>
          </div>
          <div className="text-left">
            <span className="text-xs text-gray-500 font-bold block">بڕی بەردەستی ئێستا:</span>
            <span className="text-base font-black font-mono text-emerald-700">
              {ingredient.currentStock} {ingredient.unit}
            </span>
          </div>
        </div>

        {/* Quantity to Add */}
        <div>
          <label className="block text-xs font-black text-gray-700 mb-1.5 flex items-center justify-end gap-1.5">
            <span>بڕی زیادکراو ({ingredient.unit})</span>
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))
            }
            placeholder="نموونە: 10"
            step="any"
            min="0.001"
            required
            autoFocus
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-base font-black text-emerald-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 min-h-[48px] text-right font-mono"
          />
        </div>

        {/* Quick Reasons */}
        <div>
          <label className="block text-xs font-black text-gray-700 mb-1.5">
            هۆکاری زیادکردن / سەرچاوە
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {['کڕینی نوێ لە بازاڕ', 'وەجبەی نوێی گۆشت', 'زیادەی گەڕاوە', 'کڕینی ڕۆژانە'].map(
              (r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    reason === r
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  {r}
                </button>
              )
            )}
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="تێبینی / هۆکاری تایبەت..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 text-right"
          />
        </div>

        {/* Projected Stock Preview */}
        {addQty > 0 && (
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex items-center justify-between text-xs font-bold">
            <span className="text-emerald-950">کۆگای چاوەڕوانکراو دوای زیادکردن:</span>
            <span className="font-mono text-sm font-black text-emerald-800">
              {projectedStock} {ingredient.unit}
            </span>
          </div>
        )}

        {validationError && (
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100 font-bold">
            {validationError}
          </p>
        )}
      </form>
    </Modal>
  );
};
