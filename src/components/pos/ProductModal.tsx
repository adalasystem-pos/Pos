import React, { useState, useMemo } from 'react';
import { Product, Portion } from '../../types/product';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PortionSelector } from './PortionSelector';
import { CustomizationSelector } from './CustomizationSelector';
import { calculatePortionPrice, calculateLineTotal } from '../../utils/calculations';
import { formatIQD } from '../../utils/currency';
import { Plus, Minus } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, portion: Portion, customizations: string[], quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [portion, setPortion] = useState<Portion>('نەفەر');
  const [customizations, setCustomizations] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  // Reset state when opening a new product
  React.useEffect(() => {
    if (isOpen) {
      setPortion('نەفەر');
      setCustomizations([]);
      setQuantity(1);
    }
  }, [isOpen, product]);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    return calculatePortionPrice(product.price, portion, product.customPortions);
  }, [product, portion]);

  const lineTotal = useMemo(() => {
    return calculateLineTotal(unitPrice, quantity);
  }, [unitPrice, quantity]);

  if (!product) return null;

  const handleToggleCustom = (customName: string) => {
    setCustomizations((prev) =>
      prev.includes(customName) ? prev.filter((c) => c !== customName) : [...prev, customName]
    );
  };

  const handleAdd = () => {
    onAddToCart(product, portion, customizations, quantity);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      maxWidth="md"
      id="product-customization-modal"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="text-right">
            <span className="text-xs text-gray-500 block">کۆی ئەم بڕە:</span>
            <span className="text-lg font-black text-orange-600">{formatIQD(lineTotal)}</span>
          </div>
          <Button
            id="add-to-cart-confirm-btn"
            variant="primary"
            size="lg"
            onClick={handleAdd}
            className="flex-1 max-w-xs custom-shadow font-bold"
          >
            زیادکردن بۆ سەبەتە
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Base price info */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50 border border-orange-100">
          <span className="text-xs font-semibold text-orange-950">نرخی بنەڕەتی (نەفەر):</span>
          <span className="text-sm font-black text-orange-600">{formatIQD(product.price)}</span>
        </div>

        {/* Portion Selector if product allows portions */}
        {product.allowPortions && (
          <PortionSelector
            selectedPortion={portion}
            onSelectPortion={setPortion}
            basePrice={product.price}
            customPrices={product.customPortions}
          />
        )}

        {/* Customization Options */}
        {product.availableCustomizations && product.availableCustomizations.length > 0 && (
          <CustomizationSelector
            availableCustomizations={product.availableCustomizations}
            selectedCustomizations={customizations}
            onToggleCustomization={handleToggleCustom}
          />
        )}

        {/* Quantity Controls */}
        <div className="space-y-1.5 text-right pt-1">
          <label className="block text-xs font-semibold text-gray-700">ژمارەی داواکاری:</label>
          <div className="flex items-center justify-center gap-4 bg-orange-50/60 p-3 rounded-2xl border border-orange-100">
            <button
              id="decrease-qty-modal-btn"
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-gray-700 hover:bg-orange-50 disabled:opacity-40 cursor-pointer shadow-2xs font-bold"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="text-xl font-black text-gray-900 w-12 text-center select-none" dir="ltr">
              {quantity}
            </span>

            <button
              id="increase-qty-modal-btn"
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-gray-700 hover:bg-orange-50 cursor-pointer shadow-2xs font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
