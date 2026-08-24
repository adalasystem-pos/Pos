import React, { useState, useEffect } from 'react';
import { Product, Portion, ProductIngredient } from '../../types/product';
import { DEFAULT_CATEGORIES } from '../../data/products';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ProductRecipeEditor } from '../inventory/ProductRecipeEditor';
import { formatIQD } from '../../utils/currency';
import { useToast } from '../../hooks/useToast';
import { useProducts } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';
import { Edit3, CheckCircle2, ShieldAlert, DollarSign, Tag, Power } from 'lucide-react';

interface ProductEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { editProduct } = useProducts();
  const { isAdminOrManager } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>('kebab');
  const [active, setActive] = useState<boolean>(true);
  const [allowPortions, setAllowPortions] = useState<boolean>(false);
  const [halfPortionPrice, setHalfPortionPrice] = useState<number>(0);
  const [kiloPrice, setKiloPrice] = useState<number>(0);
  const [ingredients, setIngredients] = useState<ProductIngredient[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setPrice(product.price || 0);
      setCategoryId(product.categoryId || 'kebab');
      setActive(product.active !== false);
      setAllowPortions(Boolean(product.allowPortions));
      setHalfPortionPrice(product.customPortions?.['نیو نەفەر'] || Math.round((product.price || 0) * 0.6));
      setKiloPrice(product.customPortions?.['کیلۆ'] || Math.round((product.price || 0) * 4));
      setIngredients(Array.isArray(product.ingredients) ? [...product.ingredients] : []);
      setValidationError(null);
    }
  }, [product, isOpen]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdminOrManager) {
      error('تەنها بەڕێوەبەر (Admin/Manager) دەتوانێت نرخی ئایتم یان زانیارییەکان دەستکاری بکات.');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('تکایە ناوی ئایتم بنووسە');
      return;
    }

    const integerPrice = Math.round(Number(price));
    if (isNaN(integerPrice) || integerPrice <= 0) {
      setValidationError('نرخ دەبێت ژمارەیەکی تەواو و گەورەتر لە ٠ بێت بە دینار');
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);

      const customPortions: Record<Portion, number> = {
        'نەفەر': integerPrice,
        'نیو نەفەر': halfPortionPrice > 0 ? Math.round(halfPortionPrice) : Math.round(integerPrice * 0.6),
        'کیلۆ': kiloPrice > 0 ? Math.round(kiloPrice) : Math.round(integerPrice * 4),
      };

      await editProduct(product.id, {
        name: trimmedName,
        price: integerPrice,
        categoryId,
        active,
        allowPortions,
        customPortions: allowPortions ? customPortions : undefined,
        ingredients,
      });

      success(`ئایتمی (${trimmedName}) بە سەرکەوتوویی نوێکرایەوە`);
      onClose();
    } catch (err: any) {
      console.error('Error updating product:', err);
      setValidationError(err.message || 'نوێکردنەوەی ئایتم سەرکەوتوو نەبوو');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectableCategories = DEFAULT_CATEGORIES.filter((c) => c.id !== 'all');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="دەستکاریکردنی ئایتم"
      icon={<Edit3 className="w-5 h-5 text-orange-500" />}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-2xl font-bold"
          >
            هەڵوەشاندنەوە
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!isAdminOrManager}
            className="gap-2 font-black bg-orange-500 hover:bg-orange-600 text-white rounded-2xl custom-shadow"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>پاشەکەوتکردن</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-right">
        {!isAdminOrManager && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-800 font-bold">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>تەنها بەڕێوەبەر مافی دەستکاریکردنی نرخ و ناوی هەیە.</span>
          </div>
        )}

        {/* Product ID (Immutable) */}
        <div className="p-2.5 bg-orange-50/70 rounded-xl border border-orange-100 flex items-center justify-between text-xs text-gray-500 font-mono">
          <span className="font-sans text-gray-600 font-bold">ناسنامەی ئایتم (نەگۆڕ):</span>
          <span>{product.id}</span>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-xs font-black text-gray-700 mb-1.5 flex items-center gap-1.5 justify-end">
            <span>ناوی ئایتم</span>
            <Tag className="w-3.5 h-3.5 text-orange-500" />
          </label>
          <input
            id="edit-product-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نموونە: کەبابی گۆشتی تایبەت"
            required
            disabled={!isAdminOrManager || isSubmitting}
            className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[44px] text-right"
          />
        </div>

        {/* Category & Base Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Category */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">
              بەش / جۆر
            </label>
            <select
              id="edit-product-category-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!isAdminOrManager || isSubmitting}
              className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[44px] text-right"
            >
              {selectableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5 flex items-center gap-1.5 justify-end">
              <span>نرخ بە دیناری عێراقی (IQD)</span>
              <DollarSign className="w-3.5 h-3.5 text-orange-500" />
            </label>
            <input
              id="edit-product-price-input"
              type="number"
              value={price || ''}
              onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="4000"
              step="250"
              min="250"
              required
              disabled={!isAdminOrManager || isSubmitting}
              className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-black text-orange-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 min-h-[44px] text-right font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              نیشاندان: {formatIQD(price || 0)}
            </p>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="p-3.5 bg-orange-50/60 rounded-2xl border border-orange-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              <Power className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span>بەردەست بۆ فرۆشتن لە POS</span>
            </span>
            <p className="text-[11px] text-gray-500 font-medium">
              {active ? 'ئەم خواردنە لە بەشی فرۆشتندا چالاکە' : 'ئەم خواردنە ناچالاکە و ناتوانرێت بفرۆشرێت'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              id="edit-product-active-toggle"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={!isAdminOrManager || isSubmitting}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Portions toggle & prices */}
        <div className="p-3.5 bg-orange-50/40 rounded-2xl border border-orange-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">هەڵبژاردەی قەبارە (نەفەر / نیو / کیلۆ)</span>
            <input
              type="checkbox"
              checked={allowPortions}
              onChange={(e) => setAllowPortions(e.target.checked)}
              disabled={!isAdminOrManager || isSubmitting}
              className="w-4 h-4 text-orange-500 rounded-lg focus:ring-orange-400 cursor-pointer"
            />
          </div>

          {allowPortions && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-100">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  نرخی نیو نەفەر (IQD)
                </label>
                <input
                  type="number"
                  value={halfPortionPrice || ''}
                  onChange={(e) => setHalfPortionPrice(parseInt(e.target.value) || 0)}
                  placeholder="2500"
                  step="250"
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 text-right"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  نرخی ١ کیلۆ (IQD)
                </label>
                <input
                  type="number"
                  value={kiloPrice || ''}
                  onChange={(e) => setKiloPrice(parseInt(e.target.value) || 0)}
                  placeholder="16000"
                  step="500"
                  className="w-full rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 text-right"
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Recipe & Ingredients Configuration */}
        <ProductRecipeEditor
          ingredients={ingredients}
          onChange={setIngredients}
          disabled={!isAdminOrManager || isSubmitting}
        />

        {validationError && (
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100 font-bold">
            {validationError}
          </p>
        )}
      </form>
    </Modal>
  );
};
