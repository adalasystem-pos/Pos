import React, { useState, useRef, useEffect } from 'react';
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

const SWIPE_THRESHOLD = 75; // Pixels needed to trigger deletion

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  index,
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  const [offsetX, setOffsetX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  // Handle Touch Start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDeleting) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentXRef.current = e.touches[0].clientX;
    isHorizontalSwipeRef.current = null;
    setIsSwiping(true);
  };

  // Handle Touch Move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDeleting) return;
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;
    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (isHorizontalSwipeRef.current) {
      currentXRef.current = clientX;
      // Allow swiping in either direction, with gentle resistance past threshold
      const resistance = Math.abs(deltaX) > SWIPE_THRESHOLD ? 0.7 : 1;
      setOffsetX(deltaX * resistance);
    }
  };

  // Handle Touch End / Cancel
  const handleTouchEnd = () => {
    if (isDeleting) return;
    setIsSwiping(false);

    const absOffset = Math.abs(offsetX);
    if (absOffset >= SWIPE_THRESHOLD) {
      // Trigger full delete slide-out animation
      setIsDeleting(true);
      const exitDirection = offsetX < 0 ? -1 : 1;
      setOffsetX(exitDirection * 400);

      setTimeout(() => {
        onRemove(index);
      }, 220);
    } else {
      // Snap back smoothly
      setOffsetX(0);
    }
    isHorizontalSwipeRef.current = null;
  };

  const isTriggered = Math.abs(offsetX) >= SWIPE_THRESHOLD;
  const swipeProgress = Math.min(1, Math.abs(offsetX) / SWIPE_THRESHOLD);

  return (
    <div
      id={`cart-item-container-${index}`}
      className="relative overflow-hidden rounded-2xl select-none"
    >
      {/* Background Action Revealed on Swipe (Red Delete Banner) */}
      <div
        className={`absolute inset-0 bg-red-500 rounded-2xl flex items-center px-4 transition-colors ${
          offsetX < 0 ? 'justify-end' : 'justify-start'
        } ${isTriggered ? 'bg-red-600' : 'bg-red-500'}`}
        aria-hidden="true"
      >
        <div
          className="flex items-center gap-1.5 text-white font-bold text-xs"
          style={{
            opacity: swipeProgress,
            transform: `scale(${0.7 + swipeProgress * 0.3})`,
            transition: 'transform 0.1s ease',
          }}
        >
          <Trash2 className="w-4 h-4" />
          <span>سڕینەوە</span>
        </div>
      </div>

      {/* Foreground Swipeable Card */}
      <div
        id={`cart-item-${index}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease',
          opacity: isDeleting ? 0 : 1,
        }}
        className="relative z-10 p-3.5 bg-orange-50/90 hover:bg-orange-50 rounded-2xl border border-orange-100 space-y-2 text-right transition-colors shadow-2xs touch-pan-y"
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
    </div>
  );
};
