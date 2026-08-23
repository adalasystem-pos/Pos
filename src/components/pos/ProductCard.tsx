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
  const hasCustomizations = product.allowPortions || (product.availableCustomizations && product.availableCustomizations.length > 0);
  const emoji = getProductEmoji(product);

  return (
    <button
      id={`product-card-${product.id}`}
      type="button"
      onClick={() => onClick(product)}
      disabled={!product.active}
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-3xl bg-white border-2 border-transparent hover:border-orange-400 shadow-sm hover:shadow-md transition-all text-right cursor-pointer active:scale-95 select-none ${
        !product.active ? 'opacity-50 cursor-not-allowed bg-orange-50/50' : ''
      }`}
    >
      {/* Visual illustration top box */}
      <div className="w-full h-24 sm:h-28 bg-orange-100/90 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-105 transition-transform shrink-0 relative overflow-hidden">
        <span>{emoji}</span>
        {hasCustomizations && (
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
        <h3 className="font-bold text-gray-800 text-sm sm:text-base group-hover:text-orange-600 transition-colors line-clamp-1 leading-snug">
          {product.name}
        </h3>

        {/* Bottom row: Price and Quick Add */}
        <div className="w-full mt-2 pt-2 border-t border-orange-50 flex items-center justify-between">
          <p className="text-orange-600 font-black text-base sm:text-lg">
            {formatIQD(product.price)}
          </p>

          <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs font-bold">
            <Plus className="w-4 h-4" />
          </div>
        </div>
      </div>
    </button>
  );
};
