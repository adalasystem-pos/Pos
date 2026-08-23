import React, { useState, useMemo } from 'react';
import { Product } from '../types/product';
import { DEFAULT_CATEGORIES } from '../data/products';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ProductEditModal } from '../components/products/ProductEditModal';
import { ProductAddModal } from '../components/products/ProductAddModal';
import { formatIQD } from '../utils/currency';
import {
  Plus,
  Search,
  Edit3,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  PackageCheck,
  Layers,
  Power,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { products, loading, toggleAvailability } = useProducts();
  const { role, setRole, isAdminOrManager } = useAuth();
  const { success, error } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCategory =
        selectedCategory === 'all' || item.categoryId === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.price.toString().includes(searchQuery.trim());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = products.length;
    const activeCount = products.filter((p) => p.active !== false).length;
    const inactiveCount = total - activeCount;
    return { total, activeCount, inactiveCount };
  }, [products]);

  const handleToggle = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdminOrManager) {
      error('تەنها بەڕێوەبەر (Admin/Manager) مافی گۆڕینی دۆخی بەردەستبوونی هەیە.');
      return;
    }

    try {
      setTogglingId(product.id);
      const newActive = !product.active;
      await toggleAvailability(product.id, product.active);
      success(
        newActive
          ? `ئایتمی (${product.name}) کرایە بەردەست لە فرۆشتندا`
          : `ئایتمی (${product.name}) ناچالاک کرا لە فرۆشتندا`
      );
    } catch (err: any) {
      console.error('Toggle error:', err);
      error(err.message || 'گۆڕینی دۆخی بەردەستبوون سەرکەوتوو نەبوو');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div id="products-management-page" className="space-y-5 select-none">
      {/* Top Header */}
      <PageHeader
        title="بەڕێوەبردنی ئایتمەکان و مینیو"
        subtitle="دەستکاریکردنی ناو، نرخ، زیادکردنی ئایتمی نوێ، و کۆنتڕۆڵی بەردەستبوون بۆ فرۆشتن"
        action={
          <div className="flex items-center gap-2.5">
            {isAdminOrManager && (
              <Button
                id="open-add-product-modal-btn"
                type="button"
                variant="primary"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2 font-black bg-orange-500 hover:bg-orange-600 text-white rounded-2xl custom-shadow px-4 py-2.5"
              >
                <Plus className="w-4 h-4" />
                <span>زیادکردنی ئایتمی نوێ</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Role Indicator & Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* Active Role Selector Card */}
        <div className="p-4 bg-white rounded-3xl border-2 border-orange-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">ڕۆڵی ئێستای بەکارهێنەر</span>
            {isAdminOrManager ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-orange-500" />
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-black text-gray-900">
              {role === 'admin' ? 'بەڕێوەبەری گشتی (Admin)' : role === 'manager' ? 'بەڕێوەبەر (Manager)' : 'کاشێر (Cashier)'}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`text-[10px] px-2 py-1 rounded-lg font-black transition-colors ${
                  role === 'admin' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-gray-600 hover:bg-orange-100'
                }`}
                title="گۆڕین بۆ ئەدمین"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('cashier')}
                className={`text-[10px] px-2 py-1 rounded-lg font-black transition-colors ${
                  role === 'cashier' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-gray-600 hover:bg-orange-100'
                }`}
                title="گۆڕین بۆ کاشێر"
              >
                Cashier
              </button>
            </div>
          </div>
        </div>

        {/* Total items */}
        <div className="p-4 bg-white rounded-3xl border-2 border-orange-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500">کۆی گشتی ئایتمەکان</p>
            <p className="text-xl font-black text-gray-900 mt-1">{stats.total} خواردن و کاڵا</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Active items */}
        <div className="p-4 bg-white rounded-3xl border-2 border-orange-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500">بەردەست بۆ فرۆشتن (ON)</p>
            <p className="text-xl font-black text-emerald-600 mt-1">{stats.activeCount} ئایتم</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Inactive items */}
        <div className="p-4 bg-white rounded-3xl border-2 border-orange-100 shadow-sm flex items-center justify-between sm:col-span-3 lg:col-span-1">
          <div>
            <p className="text-xs font-bold text-gray-500">ناچالاککراو / بێ بەردەست</p>
            <p className="text-xl font-black text-red-600 mt-1">{stats.inactiveCount} ئایتم</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border-2 border-orange-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-orange-50/70 text-gray-700 hover:bg-orange-100/80 border border-orange-100/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="products-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەپێی ناو یان نرخ..."
            className="w-full pr-10 pl-4 py-2 text-xs bg-white rounded-2xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-right min-h-[40px] font-semibold"
          />
        </div>
      </div>

      {/* Products Table / Grid View */}
      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-gray-400">
          چاوەڕوانبە، ئایتمەکان لە داتابەیس دەهێنرێن...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-12 bg-white rounded-3xl border-2 border-orange-100">
          <EmptyState
            title="هیچ ئایتمێک نەدۆزرایەوە"
            description="دەتوانیت بەدوای ناوێکی تردا بگەڕێیت یان ئایتمی نوێ زیاد بکەیت."
            icon={<Search className="w-8 h-8 text-orange-400" />}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-orange-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-orange-50/80 border-b border-orange-100 text-xs font-black text-gray-700">
                  <th className="py-3.5 px-4">ناوی خواردن / ئایتم</th>
                  <th className="py-3.5 px-4">بەش</th>
                  <th className="py-3.5 px-4">نرخ (IQD)</th>
                  <th className="py-3.5 px-4">دۆخی بەردەستبوون</th>
                  <th className="py-3.5 px-4 text-center">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50 text-xs sm:text-sm font-semibold text-gray-800">
                {filteredProducts.map((prod) => {
                  const categoryName =
                    DEFAULT_CATEGORIES.find((c) => c.id === prod.categoryId)?.name || prod.categoryId;
                  const isAvailable = prod.active !== false;

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-orange-50/40 transition-colors ${
                        !isAvailable ? 'bg-gray-50/80 opacity-75' : ''
                      }`}
                    >
                      {/* Name & Portions indicator */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">
                            {prod.name}
                          </span>
                          {prod.allowPortions && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                              فرە قەبارە
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ID: {prod.id}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block bg-orange-50 border border-orange-100/80 text-orange-800 px-2.5 py-1 rounded-xl text-xs font-bold">
                          {categoryName}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-orange-600 text-sm sm:text-base">
                          {formatIQD(prod.price)}
                        </span>
                      </td>

                      {/* Availability Switch */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            id={`toggle-prod-active-${prod.id}`}
                            type="button"
                            onClick={(e) => handleToggle(prod, e)}
                            disabled={!isAdminOrManager || togglingId === prod.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                              isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            }`}
                            title="گۆڕینی دۆخی بەردەستبوون"
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{isAvailable ? 'بەردەست [ON]' : 'بەردەست نییە [OFF]'}</span>
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            id={`edit-prod-btn-${prod.id}`}
                            type="button"
                            onClick={() => setEditingProduct(prod)}
                            disabled={!isAdminOrManager}
                            className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-xl border border-orange-200/80 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="دەستکاری کردنی نرخ یان ناو"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>دەستکاری</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      <ProductEditModal
        product={editingProduct}
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
      />

      {/* Add Product Modal */}
      <ProductAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
