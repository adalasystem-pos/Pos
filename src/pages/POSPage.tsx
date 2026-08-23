import React, { useState, useMemo } from 'react';
import { Product, ProductCategory, Portion } from '../types/product';
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } from '../data/products';
import { useCart } from '../hooks/useCart';
import { CategoryTabs } from '../components/pos/CategoryTabs';
import { ProductGrid } from '../components/pos/ProductGrid';
import { ProductModal } from '../components/pos/ProductModal';
import { CartPanel } from '../components/cart/CartPanel';
import { PageHeader } from '../components/layout/PageHeader';
import { Search, ShoppingBag } from 'lucide-react';

export const POSPage: React.FC = () => {
  const { addItem, itemCount } = useCart();
  const [categories] = useState<ProductCategory[]>(DEFAULT_CATEGORIES);
  const [products] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  const handleProductClick = (product: Product) => {
    // If product has portions or customizable options, open modal
    if (
      product.allowPortions ||
      (product.availableCustomizations && product.availableCustomizations.length > 0)
    ) {
      setSelectedProduct(product);
      setIsModalOpen(true);
    } else {
      // Direct quick add for simple products (e.g. water, cold drinks)
      addItem(product, 'نەفەر', [], 1);
    }
  };

  const handleAddToCartFromModal = (
    product: Product,
    portion: Portion,
    customizations: string[],
    quantity: number
  ) => {
    addItem(product, portion, customizations, quantity);
  };

  return (
    <div id="pos-page" className="space-y-4">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          title="خاڵی فرۆشتن (POS)"
          subtitle="دیاریکردنی خواردن و بەڕێوەبردنی داواکارییەکانی چێشتخانە"
        />

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="product-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەدوای خواردن یان بەرهەم..."
            className="w-full pr-10 pl-4 py-2.5 text-xs sm:text-sm bg-white rounded-2xl border border-orange-200/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-400 text-right min-h-[44px] font-semibold"
          />
        </div>
      </div>

      {/* Main Grid & Cart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Center: Categories & Products (8 cols on lg) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Categories Selector */}
          <CategoryTabs
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />

          {/* Products Grid */}
          <ProductGrid
            products={filteredProducts}
            onSelectProduct={handleProductClick}
            searchQuery={searchQuery}
          />
        </div>

        {/* Right: Cart Panel (4 cols on lg, sticky on desktop) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20">
          <div className="h-[calc(100vh-120px)]">
            <CartPanel />
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Action Button */}
      <div className="lg:hidden fixed bottom-20 left-4 z-40">
        <button
          id="mobile-open-cart-btn"
          type="button"
          onClick={() => setIsMobileCartOpen(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3.5 rounded-full custom-shadow border-2 border-white cursor-pointer active:scale-95 transition-all font-black text-sm"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>سەبەتە</span>
          {itemCount > 0 && (
            <span className="bg-white text-orange-600 text-xs px-2 py-0.5 rounded-full font-black">
              {itemCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Cart Drawer Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="p-3.5 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">سەبەتەی داواکاری</span>
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="text-xs font-bold text-orange-600 bg-white px-3 py-1 rounded-xl border border-orange-200 cursor-pointer"
              >
                داخستن
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CartPanel />
            </div>
          </div>
        </div>
      )}

      {/* Product Customization & Portion Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCartFromModal}
      />
    </div>
  );
};
