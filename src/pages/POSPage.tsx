import React, { useState, useMemo } from 'react';
import { Product, ProductCategory, Portion } from '../types/product';
import { DEFAULT_CATEGORIES } from '../data/products';
import { useCart } from '../hooks/useCart';
import { useProducts } from '../hooks/useProducts';
import { usePOSRealtime } from '../contexts/POSRealtimeContext';
import { useToast } from '../hooks/useToast';
import { CategoryTabs } from '../components/pos/CategoryTabs';
import { ProductGrid } from '../components/pos/ProductGrid';
import { ProductModal } from '../components/pos/ProductModal';
import { CartPanel } from '../components/cart/CartPanel';
import { OrderPreparationQueue } from '../components/pos/OrderPreparationQueue';
import { ShiftControlBar } from '../components/shift/ShiftControlBar';
import { PageHeader } from '../components/layout/PageHeader';
import { Search, ShoppingBag, UtensilsCrossed, LayoutGrid } from 'lucide-react';

export const POSPage: React.FC = () => {
  const { addItem, itemCount } = useCart();
  const { products } = useProducts();
  const { preparingCount } = usePOSRealtime();
  const { error: toastError } = useToast();
  const [categories] = useState<ProductCategory[]>(DEFAULT_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [activeSubView, setActiveSubView] = useState<'menu' | 'queue'>('menu');

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
    if (product.active === false) {
      toastError(`خواردنی (${product.name}) لە ئێستادا بەردەست نییە`);
      return;
    }

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
    if (product.active === false) {
      toastError(`خواردنی (${product.name}) لە ئێستادا بەردەست نییە`);
      return;
    }
    addItem(product, portion, customizations, quantity);
  };

  return (
    <div id="pos-page" className="space-y-4">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          title="خاڵی فرۆشتن (POS)"
          subtitle="دیاریکردنی خواردن، ناردن بۆ ئامادەکردن و چاپکردنی پسوولە"
        />

        <div className="flex items-center gap-2 flex-wrap">
          {/* SubView Switcher Tabs */}
          <div className="flex items-center p-1 bg-white rounded-2xl border border-orange-200/90 shadow-2xs">
            <button
              id="pos-view-menu-btn"
              type="button"
              onClick={() => setActiveSubView('menu')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubView === 'menu'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>لیستی خواردنەکان</span>
            </button>

            <button
              id="pos-view-queue-btn"
              type="button"
              onClick={() => setActiveSubView('queue')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                activeSubView === 'queue'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>ئامادەکردنی چێشتخانە</span>
              {preparingCount > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    activeSubView === 'queue'
                      ? 'bg-white text-orange-600'
                      : 'bg-orange-500 text-white'
                  }`}
                >
                  {preparingCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar - only shown in menu view */}
          {activeSubView === 'menu' && (
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="product-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="گەڕان بەدوای خواردن..."
                className="w-full pr-10 pl-4 py-2 text-xs bg-white rounded-2xl border border-orange-200/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-400 text-right min-h-[40px] font-semibold"
              />
            </div>
          )}
        </div>
      </div>

      {/* Operational Shift & Cash Control Bar */}
      <ShiftControlBar />

      {activeSubView === 'queue' ? (
        /* Kitchen Preparation Queue View */
        <OrderPreparationQueue />
      ) : (
        /* Main Grid & Cart Layout */
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

          {/* Right: Cart Panel (4 cols on lg, sticky on desktop/iPad landscape) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20">
            <div className="h-[calc(100dvh-120px)] min-h-[520px]">
              <CartPanel />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Cart Action Button */}
      {activeSubView === 'menu' && (
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
      )}

      {/* Mobile & Tablet Cart Drawer Modal */}
      {isMobileCartOpen && activeSubView === 'menu' && (
        <div
          id="mobile-cart-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsMobileCartOpen(false);
            }
          }}
          className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex flex-col justify-end"
        >
          <div
            id="mobile-cart-drawer"
            className="bg-white rounded-t-3xl h-[92dvh] max-h-[92dvh] sm:h-[88dvh] sm:max-h-[88dvh] flex flex-col min-h-0 overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            {/* Drawer Drag handle & Header */}
            <div className="p-3 bg-orange-50 border-b border-orange-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500 text-white rounded-xl font-bold shadow-2xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-sm font-black text-gray-800">سەبەتەی داواکاری</span>
                {itemCount > 0 && (
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                    {itemCount} دانە
                  </span>
                )}
              </div>
              <button
                id="close-mobile-cart-btn"
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="text-xs font-bold text-orange-600 bg-white px-3.5 py-1.5 rounded-xl border border-orange-200 hover:bg-orange-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
              >
                داخستن
              </button>
            </div>

            {/* Direct vertically-constrained CartPanel */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <CartPanel isMobileDrawer={true} onClose={() => setIsMobileCartOpen(false)} />
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
