import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { CartItem } from '../types/order';
import { Product, Portion } from '../types/product';
import { calculateLineTotal, calculateOrderTotal, calculatePortionPrice } from '../utils/calculations';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  totalAmount: number;
  note: string;
  setNote: (note: string) => void;
  tableNumber: string;
  setTableNumber: (tableNumber: string) => void;
  addItem: (product: Product, portion?: Portion, customizations?: string[], quantity?: number) => void;
  increaseQuantity: (index: number) => void;
  decreaseQuantity: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  updateItemPortion: (index: number, newPortion: Portion, basePrice: number, customPortions?: { [key in Portion]?: number }) => void;
  toggleItemCustomization: (index: number, customizationName: string) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [note, setNote] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');

  const addItem = useCallback(
    (product: Product, portion: Portion = 'نەفەر', customizations: string[] = [], quantity: number = 1) => {
      const unitPrice = calculatePortionPrice(product.price, portion, product.customPortions);
      const safeQty = Math.max(1, Math.floor(quantity));

      setItems((prev) => {
        // Check if matching item (same product ID, same portion, same customizations) already exists
        const sortedCustoms = [...customizations].sort();
        const existingIndex = prev.findIndex((item) => {
          if (item.productId !== product.id || item.portion !== portion) return false;
          const itemSortedCustoms = [...item.customizations].sort();
          return (
            itemSortedCustoms.length === sortedCustoms.length &&
            itemSortedCustoms.every((val, idx) => val === sortedCustoms[idx])
          );
        });

        if (existingIndex > -1) {
          const updated = [...prev];
          const currentItem = updated[existingIndex];
          const newQty = currentItem.quantity + safeQty;
          updated[existingIndex] = {
            ...currentItem,
            quantity: newQty,
            lineTotal: calculateLineTotal(currentItem.unitPrice, newQty),
          };
          return updated;
        }

        const newItem: CartItem = {
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity: safeQty,
          portion,
          customizations: [...customizations],
          lineTotal: calculateLineTotal(unitPrice, safeQty),
        };

        return [...prev, newItem];
      });
    },
    []
  );

  const increaseQuantity = useCallback((index: number) => {
    setItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      const item = updated[index];
      const newQty = item.quantity + 1;
      updated[index] = {
        ...item,
        quantity: newQty,
        lineTotal: calculateLineTotal(item.unitPrice, newQty),
      };
      return updated;
    });
  }, []);

  const decreaseQuantity = useCallback((index: number) => {
    setItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const currentItem = prev[index];
      if (currentItem.quantity <= 1) {
        return prev.filter((_, i) => i !== index);
      }
      const updated = [...prev];
      const newQty = currentItem.quantity - 1;
      updated[index] = {
        ...currentItem,
        quantity: newQty,
        lineTotal: calculateLineTotal(currentItem.unitPrice, newQty),
      };
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const safeQty = Math.floor(quantity);
      if (safeQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const updated = [...prev];
      const item = updated[index];
      updated[index] = {
        ...item,
        quantity: safeQty,
        lineTotal: calculateLineTotal(item.unitPrice, safeQty),
      };
      return updated;
    });
  }, []);

  const updateItemPortion = useCallback(
    (index: number, newPortion: Portion, basePrice: number, customPortions?: { [key in Portion]?: number }) => {
      setItems((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const updated = [...prev];
        const item = updated[index];
        const newUnitPrice = calculatePortionPrice(basePrice, newPortion, customPortions);
        updated[index] = {
          ...item,
          portion: newPortion,
          unitPrice: newUnitPrice,
          lineTotal: calculateLineTotal(newUnitPrice, item.quantity),
        };
        return updated;
      });
    },
    []
  );

  const toggleItemCustomization = useCallback((index: number, customizationName: string) => {
    setItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      const item = updated[index];
      const exists = item.customizations.includes(customizationName);
      const newCustomizations = exists
        ? item.customizations.filter((c) => c !== customizationName)
        : [...item.customizations, customizationName];

      updated[index] = {
        ...item,
        customizations: newCustomizations,
      };
      return updated;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setNote('');
    setTableNumber('');
  }, []);

  const { subtotal, totalAmount } = useMemo(() => {
    return calculateOrderTotal(items);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        totalAmount,
        note,
        setNote,
        tableNumber,
        setTableNumber,
        addItem,
        increaseQuantity,
        decreaseQuantity,
        updateQuantity,
        updateItemPortion,
        toggleItemCustomization,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
