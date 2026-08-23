import React from 'react';
import { Product } from '../../types/product';
import { ProductCard } from './ProductCard';
import { EmptyState } from '../ui/EmptyState';
import { Search } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  searchQuery?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onSelectProduct,
  searchQuery,
}) => {
  if (products.length === 0) {
    return (
      <EmptyState
        title="هیچ خواردن یان کاڵایەک نەدۆزرایەوە"
        description={
          searchQuery
            ? `هیچ ئەنجامێک بۆ "${searchQuery}" نەدۆزرایەوە.`
            : 'هیچ کاڵایەک لەم بەشەدا بەردەست نییە.'
        }
        icon={<Search className="w-8 h-8" />}
      />
    );
  }

  return (
    <div
      id="pos-product-grid"
      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pr-1"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={onSelectProduct}
        />
      ))}
    </div>
  );
};
