import React, { useState } from 'react';
import { ProductIngredient } from '../../types/product';
import { useInventory } from '../../hooks/useInventory';
import { Button } from '../ui/Button';
import { Plus, Trash2, Layers, AlertCircle, Info } from 'lucide-react';

interface ProductRecipeEditorProps {
  ingredients: ProductIngredient[];
  onChange: (ingredients: ProductIngredient[]) => void;
  disabled?: boolean;
}

export const ProductRecipeEditor: React.FC<ProductRecipeEditorProps> = ({
  ingredients,
  onChange,
  disabled = false,
}) => {
  const { activeIngredients } = useInventory();
  const [selectedIngId, setSelectedIngId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');

  const handleAddIngredient = () => {
    if (!selectedIngId) return;
    const qty = quantity === '' ? 1 : Number(quantity);
    if (isNaN(qty) || qty <= 0) return;

    // If ingredient already in list, update quantity
    const existingIndex = ingredients.findIndex((i) => i.ingredientId === selectedIngId);
    if (existingIndex >= 0) {
      const updated = [...ingredients];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: Math.round((updated[existingIndex].quantity + qty) * 1000) / 1000,
      };
      onChange(updated);
    } else {
      onChange([
        ...ingredients,
        {
          ingredientId: selectedIngId,
          quantity: Math.round(qty * 1000) / 1000,
        },
      ]);
    }

    setSelectedIngId('');
    setQuantity('');
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleQuantityChange = (index: number, val: number) => {
    if (isNaN(val) || val <= 0) return;
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      quantity: Math.round(val * 1000) / 1000,
    };
    onChange(updated);
  };

  const selectedIngredientObj = activeIngredients.find((i) => i.id === selectedIngId);

  return (
    <div className="p-3.5 bg-orange-50/40 rounded-2xl border border-orange-100 space-y-3 text-right">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-black text-gray-800">
          <Layers className="w-4 h-4 text-orange-500" />
          <span>پێکهاتەکانی ئەم خواردنە (Recipe / پێداویستی کۆگا)</span>
        </div>
        <span className="text-[11px] text-gray-500 font-bold">
          {ingredients.length} پێکهاتە
        </span>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed">
        لەم بەشەدا دیاری بکە بۆ هەر ١ نەفەر لەم خواردنە، چەند لە پێکهاتە و کەرەستەی خاو بەکاردێت.
        لە کاتی تەواوکردنی داواکاری، کۆگا بە شێوەی ئۆتۆماتیکی کەمدەبێتەوە.
      </p>

      {/* Existing Ingredients List */}
      {ingredients.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {ingredients.map((item, idx) => {
            const ingDetail = activeIngredients.find((i) => i.id === item.ingredientId);
            return (
              <div
                key={item.ingredientId || idx}
                className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-orange-200/70 text-xs"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    disabled={disabled}
                    className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    title="سڕینەوەی پێکهاتە لە خواردن"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="font-black text-gray-900">
                    {ingDetail?.name || 'پێکهاتەی دیارینەکراو'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(idx, parseFloat(e.target.value) || 0)
                    }
                    step="any"
                    min="0.001"
                    disabled={disabled}
                    className="w-20 rounded-lg border border-orange-200 bg-white px-2 py-1 text-xs font-mono font-black text-orange-600 text-center"
                  />
                  <span className="text-gray-600 font-bold">
                    {ingDetail?.unit || 'یەکە'} / نەفەر
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Recipe Requirement */}
      {!disabled && (
        <div className="pt-2 border-t border-orange-100">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6">
              <select
                value={selectedIngId}
                onChange={(e) => setSelectedIngId(e.target.value)}
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none min-h-[38px] text-right"
              >
                <option value="">-- پێکهاتە هەڵبژێرە --</option>
                {activeIngredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))
                }
                placeholder={`بڕ ${selectedIngredientObj ? `(${selectedIngredientObj.unit})` : ''}`}
                step="any"
                min="0.001"
                disabled={!selectedIngId}
                className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none min-h-[38px] text-right font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddIngredient}
                disabled={!selectedIngId || quantity === '' || Number(quantity) <= 0}
                className="w-full rounded-xl text-xs font-bold py-2 border-orange-300 text-orange-600 hover:bg-orange-100 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>زیادکردن</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
