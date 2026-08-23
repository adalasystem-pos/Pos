import React from 'react';
import { ProductCategory } from '../../types/product';
import { Flame, Drumstick, Layers, Wheat, CupSoda, Salad, UtensilsCrossed } from 'lucide-react';

interface CategoryTabsProps {
  categories: ProductCategory[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-4 h-4" />;
      case 'Drumstick':
        return <Drumstick className="w-4 h-4" />;
      case 'Layers':
        return <Layers className="w-4 h-4" />;
      case 'Wheat':
        return <Wheat className="w-4 h-4" />;
      case 'CupSoda':
        return <CupSoda className="w-4 h-4" />;
      case 'Salad':
        return <Salad className="w-4 h-4" />;
      default:
        return <UtensilsCrossed className="w-4 h-4" />;
    }
  };

  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1 flex gap-3 no-scrollbar shrink-0">
      {categories.map((category) => {
        const isSelected = selectedCategoryId === category.id;

        return (
          <button
            key={category.id}
            id={`category-tab-${category.id}`}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={`flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer select-none min-h-[46px] shadow-xs active:scale-95 ${
              isSelected
                ? 'bg-orange-500 text-white shadow-sm border border-orange-500'
                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-orange-50/50 border border-orange-100'
            }`}
          >
            {category.id !== 'all' && (
              <span className={isSelected ? 'text-orange-100' : 'text-orange-500/80'}>
                {getIcon(category.iconName)}
              </span>
            )}
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
};
