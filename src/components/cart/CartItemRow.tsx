import React from 'react';
import { CartItem } from '../../types/order';
import { formatIQD } from '../../utils/currency';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface CartItemRowProps {
  item: CartItem;
  index: number;
  onIncrease: (index: number) => void;
  onDecrease: (index: number) => void;
  onRemove: (index: number) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  index,
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  return (
    <div
      id={`cart-item-${index}`}
      className="p-3.5 bg-orange-50/60 rounded-2xl border border-orange-100 space-y-2 text-right transition-all"
    >
      {/* Top line: Name, Portion, and Remove Button */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
              {item.productName}
            </h4>
            {item.portion && (
              <span className="text-[10px] font-bold bg-white text-orange-700 px-2 py-0.5 rounded-lg border border-orange-200 shadow-2xs">
                {item.portion}
              </span>
            )}
          </div>

          {/* Customization tags */}
          {item.customizations && item.customizations.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.customizations.map((c, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-orange-100 text-orange-900 border border-orange-200 px-1.5 py-0.2 rounded-md font-semibold"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          title="سڕینەوەی ئەم بڕگەیە"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom line: Quantity controls and Line Total */}
      <div className="flex items-center justify-between pt-2 border-t border-orange-100/80">
        {/* Quantity buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-orange-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => onDecrease(index)}
            className="w-7 h-7 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center hover:bg-orange-100 active:scale-95 transition-all cursor-pointer font-bold"
            aria-label="کەمکردنەوە"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs font-black text-gray-900 w-6 text-center select-none" dir="ltr">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => onIncrease(index)}
            className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 active:scale-95 transition-all cursor-pointer font-bold shadow-2xs"
            aria-label="زیادکردن"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Price & Line total */}
        <div className="text-left">
          <span className="text-xs sm:text-sm font-black text-orange-600 block" dir="rtl">
            {formatIQD(item.lineTotal)}
          </span>
          <span className="text-[10px] text-gray-400 font-medium block">
            {formatIQD(item.unitPrice)} × {item.quantity}
          </span>
        </div>
      </div>
    </div>
  );
};
