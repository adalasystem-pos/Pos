import React from 'react';
import { useInventory } from '../../hooks/useInventory';
import { AlertTriangle, PackageX } from 'lucide-react';

interface LowStockAlertBannerProps {
  onSelectIngredient?: (ingredientId: string) => void;
}

export const LowStockAlertBanner: React.FC<LowStockAlertBannerProps> = ({
  onSelectIngredient,
}) => {
  const { lowStockIngredients, lowStockCount } = useInventory();

  if (lowStockCount === 0) {
    return null;
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-right">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>ئاگاداری کەمبوونی کۆگا ({lowStockCount} پێکهاتە پێویستی بە پڕکردنەوەیە)</span>
        </div>
        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-900 rounded-full text-xs font-black">
          کۆگای کەم
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {lowStockIngredients.map((ing) => (
          <button
            key={ing.id}
            type="button"
            onClick={() => onSelectIngredient && onSelectIngredient(ing.id)}
            className="flex items-center gap-2 bg-white/90 hover:bg-white border border-amber-200/80 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-900 shadow-sm transition-all hover:scale-[1.02]"
          >
            <PackageX className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-black text-amber-950">{ing.name}:</span>
            <span className="font-mono text-red-600 font-black">
              {ing.currentStock} {ing.unit}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">
              (کەمترین: {ing.minimumStock})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
