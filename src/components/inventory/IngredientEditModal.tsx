import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useInventory } from '../../hooks/useInventory';
import { useToast } from '../../hooks/useToast';
import { Ingredient } from '../../types/inventory';
import { Edit3, CheckCircle2, Power } from 'lucide-react';

interface IngredientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
}

export const IngredientEditModal: React.FC<IngredientEditModalProps> = ({
  isOpen,
  onClose,
  ingredient,
}) => {
  const { editIngredient } = useInventory();
  const { success, error } = useToast();

  const [name, setName] = useState<string>('');
  const [unit, setUnit] = useState<string>('کیلۆگرام');
  const [minimumStock, setMinimumStock] = useState<number | ''>(5);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name || '');
      setUnit(ingredient.unit || 'کیلۆگرام');
      setMinimumStock(ingredient.minimumStock ?? 5);
      setIsActive(ingredient.isActive !== false);
      setValidationError(null);
    }
  }, [ingredient]);

  if (!ingredient) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('تکایە ناوی پێکهاتە بنووسە');
      return;
    }

    const trimmedUnit = unit.trim();
    if (!trimmedUnit) {
      setValidationError('تکایە یەکەی پێوانە دیاری بکە');
      return;
    }

    const minStockNum = minimumStock === '' ? 0 : Number(minimumStock);
    if (isNaN(minStockNum) || minStockNum < 0) {
      setValidationError('کەمترین بڕی ئاگادارکردنەوە ناتوانێت کەمتر لە ٠ بێت');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);

      await editIngredient(ingredient.id, {
        name: trimmedName,
        unit: trimmedUnit,
        minimumStock: minStockNum,
        isActive,
      });

      success(`گۆڕانکارییەکانی پێکهاتەی "${trimmedName}" پاشەکەوت کرا`);
      onClose();
    } catch (err: any) {
      console.error('Error updating ingredient:', err);
      setValidationError(err.message || 'پاشەکەوتکردنی گۆڕانکارییەکان سەرکەوتوو نەبوو');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`دەستکاریکردنی: ${ingredient.name}`}
      icon={<Edit3 className="w-5 h-5 text-orange-500" />}
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
            className="gap-2 font-black bg-orange-500 hover:bg-orange-600 text-white rounded-2xl custom-shadow"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>پاشەکەوتکردن</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleFormSubmit} className="space-y-4 text-right">
        {/* Name */}
        <div>
          <label className="block text-xs font-black text-gray-700 mb-1.5">
            ناوی پێکهاتە
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[44px] text-right"
          />
        </div>

        {/* Unit & Min Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">
              یەکەی پێوانە
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="کیلۆگرام، گرام، دانە..."
              required
              className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[44px] text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">
              کەمترین بڕی ئاگادارکردنەوە ({unit})
            </label>
            <input
              type="number"
              value={minimumStock}
              onChange={(e) =>
                setMinimumStock(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))
              }
              step="any"
              min="0"
              className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-black text-amber-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[44px] text-right font-mono"
            />
          </div>
        </div>

        {/* Current Stock Display */}
        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
          <span className="font-bold text-gray-600">بڕی ئێستای کۆگا:</span>
          <span className="font-mono font-black text-orange-600 text-sm">
            {ingredient.currentStock} {ingredient.unit}
          </span>
        </div>

        {/* Active Toggle */}
        <div className="p-3.5 bg-orange-50/60 rounded-2xl border border-orange-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              <Power className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span>دۆخی چالاکبوون (Active)</span>
            </span>
            <p className="text-[11px] text-gray-500 font-medium">
              {isActive ? 'پێکهاتەکە لە لیستی کەرەستە و چێشتخانە چالاکە' : 'پێکهاتەکە لە کاتی ئێستادا ناچالاکە'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isSubmitting}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
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
