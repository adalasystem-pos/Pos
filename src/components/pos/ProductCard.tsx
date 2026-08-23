import React from 'react';
import { Product } from '../../types/product';
import { formatIQD } from '../../utils/currency';
import { Plus, SlidersHorizontal } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

const getProductEmoji = (product: Product): string => {
  if (product.categoryId === 'drinks') {
    if (product.id.includes('water')) return '💧';
    if (product.id.includes('do')) return '🥛';
    return '🥤';
  }
  if (product.categoryId === 'bread') return '🍞';
  if (product.categoryId === 'sides') {
    if (product.id.includes('pickles')) return '🥒';
    if (product.id.includes('jajik')) return '🥣';
    return '🥗';
  }
  if (product.categoryId === 'chicken') {
    if (product.id.includes('wings')) return '🍗';
    return '🍗';
  }
  if (product.categoryId === 'mix') return '🍱';
  if (product.name.includes('تیکە') || product.name.includes('بەرخ')) return '🥩';
  return '🍖';
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const isAvailable = product.active !== false;
  const hasCustomizations = product.allowPortions || (product.availableCustomizations && product.availableCustomizations.length > 0);
  const emoji = getProductEmoji(product);

  return (
    <button
      id={`product-card-${product.id}`}
      type="button"
      onClick={() => isAvailable && onClick(product)}
      disabled={!isAvailable}
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-3xl bg-white border-2 border-transparent shadow-sm transition-all text-right select-none ${
        isAvailable
          ? 'hover:border-orange-400 hover:shadow-md cursor-pointer active:scale-95'
          : 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200'
      }`}
    >
      {/* Visual illustration top box */}
      <div className={`w-full h-24 sm:h-28 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shrink-0 relative overflow-hidden transition-transform ${
        isAvailable ? 'bg-orange-100/90 group-hover:scale-105' : 'bg-gray-100 grayscale'
      }`}>
        <span>{emoji}</span>

        {!isAvailable && (
          <span className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-sm">
              بەردەست نییە
            </span>
          </span>
        )}

        {isAvailable && hasCustomizations && (
          <span
            className="absolute top-2 left-2 p-1.5 rounded-xl bg-white/80 backdrop-blur-xs text-orange-700 shadow-2xs"
            title="خاوەنی قەبارە و هەڵبژاردەیە"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {/* Details & Title */}
      <div className="w-full mt-3 flex-1 flex flex-col justify-between">
        <h3 className={`font-bold text-sm sm:text-base line-clamp-1 leading-snug transition-colors ${
          isAvailable ? 'text-gray-800 group-hover:text-orange-600' : 'text-gray-400'
        }`}>
          {product.name}
        </h3>

        {/* Bottom row: Price and Quick Add */}
        <div className="w-full mt-2 pt-2 border-t border-orange-50 flex items-center justify-between">
          <p className={`font-black text-base sm:text-lg ${isAvailable ? 'text-orange-600' : 'text-gray-400'}`}>
            {formatIQD(product.price)}
          </p>

          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-2xs font-bold ${
            isAvailable
              ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white'
              : 'bg-gray-100 text-gray-400'
          }`}>
            <Plus className="w-4 h-4" />
          </div>
        </div>
      </div>
    </button>
  );
};
