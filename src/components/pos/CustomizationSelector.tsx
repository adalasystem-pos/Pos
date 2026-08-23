import React from 'react';
import { CUSTOMIZATION_OPTIONS } from '../../data/products';
import { Check } from 'lucide-react';

interface CustomizationSelectorProps {
  availableCustomizations?: string[];
  selectedCustomizations: string[];
  onToggleCustomization: (customization: string) => void;
}

export const CustomizationSelector: React.FC<CustomizationSelectorProps> = ({
  availableCustomizations,
  selectedCustomizations,
  onToggleCustomization,
}) => {
  const options = availableCustomizations && availableCustomizations.length > 0
    ? CUSTOMIZATION_OPTIONS.filter((opt) => availableCustomizations.includes(opt.id))
    : CUSTOMIZATION_OPTIONS;

  if (options.length === 0) return null;

  return (
    <div className="space-y-2 text-right">
      <label className="block text-xs font-semibold text-neutral-700">تایبەتمەندی و ئارەزووەکان:</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((opt) => {
          const isSelected = selectedCustomizations.includes(opt.id);

          return (
            <button
              key={opt.id}
              id={`custom-opt-${opt.id}`}
              type="button"
              onClick={() => onToggleCustomization(opt.id)}
              className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs font-medium transition-all cursor-pointer min-h-[44px] ${
                isSelected
                  ? 'bg-orange-500 text-white border-orange-500 shadow-xs font-bold'
                  : 'bg-white border-orange-100 text-gray-700 hover:bg-orange-50/50'
              }`}
            >
              <span>{opt.name}</span>
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                  isSelected ? 'border-white bg-orange-600' : 'border-gray-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
