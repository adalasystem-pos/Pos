import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useInventory } from '../../hooks/useInventory';
import { useToast } from '../../hooks/useToast';
import { PlusCircle, PackagePlus, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface IngredientAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_UNITS = [
  { label: 'کیلۆگرام (kg)', value: 'کیلۆگرام' },
  { label: 'گرام (g)', value: 'گرام' },
  { label: 'دانە (piece)', value: 'دانە' },
  { label: 'لیتر (L)', value: 'لیتر' },
  { label: 'دەستە (bundle)', value: 'دەستە' },
  { label: 'قوتوو (can/box)', value: 'قوتوو' },
];

export const IngredientAddModal: React.FC<IngredientAddModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addIngredient } = useInventory();
  const { success, error } = useToast();

  const [name, setName] = useState<string>('');
  const [unit, setUnit] = useState<string>('کیلۆگرام');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [initialStock, setInitialStock] = useState<number | ''>(0);
  const [minimumStock, setMinimumStock] = useState<number | ''>(5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setUnit('کیلۆگرام');
    setCustomUnit('');
    setInitialStock(0);
    setMinimumStock(5);
    setValidationError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('تکایە ناوی پێکهاتە بنووسە');
      return;
    }

    const selectedUnit = unit === 'custom' ? customUnit.trim() : unit.trim();
    if (!selectedUnit) {
      setValidationError('تکایە یەکەی پێوانە دیاری بکە یان بنووسە');
      return;
    }

    const initStockNum = initialStock === '' ? 0 : Number(initialStock);
    const minStockNum = minimumStock === '' ? 0 : Number(minimumStock);

    if (isNaN(initStockNum) || initStockNum < 0) {
      setValidationError('بڕی سەرەتایی کۆگا ناتوانێت کەمتر لە ٠ بێت');
      return;
    }

    if (isNaN(minStockNum) || minStockNum < 0) {
      setValidationError('کەمترین بڕی ئاگادارکردنەوە ناتوانێت کەمتر لە ٠ بێت');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);

      await addIngredient({
        name: trimmedName,
        unit: selectedUnit,
        initialStock: initStockNum,
        minimumStock: minStockNum,
        isActive: true,
      });

      success(`پێکهاتەی "${trimmedName}" بە سەرکەوتوویی زیادکرا`);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Error adding ingredient:', err);
      setValidationError(err.message || 'زیادکردنی پێکهاتە سەرکەوتوو نەبوو');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="زیادکردنی پێکهاتەی نوێ بۆ کۆگا"
      icon={<PackagePlus className="w-5 h-5 text-orange-500" />}
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
            <span>پاشەکەوتکردنی پێکهاتە</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleFormSubmit} className="space-y-4 text-right">
        {/* Ingredient Name */}
        <div>
          <label className="block text-xs font-black text-gray-700 mb-1.5">
            ناوی پێکهاتە
          </label>
          <input
            id="add-ingredient-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نموونە: گۆشتی بەرخ، سینگی مریشک، پیاز، ڕۆن"
            required
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[44px] text-right"
          />
        </div>

        {/* Unit Selector */}
        <div>
          <label className="block text-xs font-black text-gray-700 mb-1.5">
            یەکەی پێوانە
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {COMMON_UNITS.map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => setUnit(u.value)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                  unit === u.value
                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>

          {unit === 'custom' && (
            <input
              type="text"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="یەکەی دیاری نەکراو بنووسە..."
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 text-right mt-1.5"
            />
          )}
        </div>

        {/* Initial Stock & Min Stock Threshold */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">
              بڕی سەرەتایی کۆگا ({unit === 'custom' ? customUnit || 'یەکە' : unit})
            </label>
            <input
              id="add-ingredient-stock-input"
              type="number"
              value={initialStock}
              onChange={(e) =>
                setInitialStock(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))
              }
              placeholder="0"
              step="any"
              min="0"
              className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-black text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[44px] text-right font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              ئەم بڕە ڕاستەوخۆ دەچێتە ناو کۆگای بەردەست
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">
              کەمترین بڕی ئاگادارکردنەوە ({unit === 'custom' ? customUnit || 'یەکە' : unit})
            </label>
            <input
              id="add-ingredient-min-stock-input"
              type="number"
              value={minimumStock}
              onChange={(e) =>
                setMinimumStock(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))
              }
              placeholder="5"
              step="any"
              min="0"
              className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-black text-amber-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[44px] text-right font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              ئەگەر کۆگا لەم بڕە کەمتر بێت، ئاگاداری دەدرێت
            </p>
          </div>
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
