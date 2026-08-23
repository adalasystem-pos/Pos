import React from 'react';
import { Portion } from '../../types/product';
import { PORTION_OPTIONS } from '../../data/products';

interface PortionSelectorProps {
  selectedPortion: Portion;
  onSelectPortion: (portion: Portion) => void;
  customPrices?: { [key in Portion]?: number };
  basePrice: number;
}

export const PortionSelector: React.FC<PortionSelectorProps> = ({
  selectedPortion,
  onSelectPortion,
  customPrices,
  basePrice,
}) => {
  return (
    <div className="space-y-1.5 text-right">
      <label className="block text-xs font-semibold text-neutral-700">قەبارە / بەش (Portion):</label>
      <div className="grid grid-cols-3 gap-2">
        {PORTION_OPTIONS.map((opt) => {
          const isSelected = selectedPortion === opt.id;
          const displayPrice =
            customPrices && customPrices[opt.id] !== undefined
              ? customPrices[opt.id]
              : opt.id === 'نیو نەفەر'
              ? Math.round((basePrice * 0.6) / 250) * 250
              : opt.id === 'کیلۆ'
              ? Math.round((basePrice * 2.5) / 500) * 500
              : basePrice;

          return (
            <button
              key={opt.id}
              id={`portion-btn-${opt.id}`}
              type="button"
              onClick={() => onSelectPortion(opt.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer min-h-[56px] ${
                isSelected
                  ? 'bg-orange-500 border-orange-500 text-white font-bold shadow-xs'
                  : 'bg-white border-orange-100 text-gray-700 hover:bg-orange-50/50'
              }`}
            >
              <span className="text-xs">{opt.id}</span>
              <span className={`text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-orange-100' : 'text-gray-500'}`} dir="ltr">
                {new Intl.NumberFormat('en-US').format(displayPrice || 0)} IQD
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
