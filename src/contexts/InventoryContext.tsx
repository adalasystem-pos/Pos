import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Ingredient,
  StockMovement,
  CreateIngredientInput,
  UpdateIngredientInput,
  StockInInput,
  StockAdjustmentInput,
} from '../types/inventory';
import {
  listenIngredients,
  createIngredient,
  updateIngredient,
  toggleIngredientActive,
  addStockIn,
  adjustStock as serviceAdjustStock,
} from '../services/inventory.service';
import { useAuth } from '../hooks/useAuth';

interface InventoryContextType {
  ingredients: Ingredient[];
  activeIngredients: Ingredient[];
  lowStockIngredients: Ingredient[];
  lowStockCount: number;
  loading: boolean;
  error: string | null;
  addIngredient: (input: CreateIngredientInput) => Promise<Ingredient>;
  editIngredient: (id: string, updates: UpdateIngredientInput) => Promise<void>;
  toggleActive: (id: string, currentActive: boolean) => Promise<void>;
  stockIn: (input: StockInInput) => Promise<void>;
  adjustStock: (input: StockAdjustmentInput) => Promise<void>;
  getIngredientById: (id: string) => Ingredient | undefined;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIngredients([]);
      setLoading(false);
      return;
    }

    const unsubscribe = listenIngredients(
      (loaded) => {
        setIngredients(loaded);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Inventory listener error:', err);
        setError('هەڵەیەک لە بارکردنی پێکهاتەکان ڕوویدا');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const activeIngredients = useMemo(() => {
    return ingredients.filter((item) => item.isActive !== false);
  }, [ingredients]);

  const lowStockIngredients = useMemo(() => {
    return ingredients.filter(
      (item) => item.isActive !== false && item.currentStock <= item.minimumStock
    );
  }, [ingredients]);

  const lowStockCount = useMemo(() => {
    return lowStockIngredients.length;
  }, [lowStockIngredients]);

  const addIngredient = useCallback(
    async (input: CreateIngredientInput): Promise<Ingredient> => {
      if (!user) {
        throw new Error('پێویستە چووبیتە ژوورەوە بۆ زیادکردنی پێکهاتە');
      }
      return createIngredient(input, user.uid, user.email || 'بەڕێوەبەر');
    },
    [user]
  );

  const editIngredient = useCallback(
    async (id: string, updates: UpdateIngredientInput): Promise<void> => {
      if (!user) {
        throw new Error('پێویستە چووبیتە ژوورەوە بۆ دەستکاریکردنی پێکهاتە');
      }
      return updateIngredient(id, updates, user.uid);
    },
    [user]
  );

  const toggleActive = useCallback(
    async (id: string, currentActive: boolean): Promise<void> => {
      if (!user) {
        throw new Error('پێویستە چووبیتە ژوورەوە بۆ گۆڕینی دۆخ');
      }
      return toggleIngredientActive(id, currentActive, user.uid);
    },
    [user]
  );

  const stockIn = useCallback(
    async (input: StockInInput): Promise<void> => {
      if (!user) {
        throw new Error('پێویستە چووبیتە ژوورەوە بۆ زیادکردنی کۆگا');
      }
      return addStockIn(input, user.uid, user.email || 'بەڕێوەبەر');
    },
    [user]
  );

  const adjustStock = useCallback(
    async (input: StockAdjustmentInput): Promise<void> => {
      if (!user) {
        throw new Error('پێویستە چووبیتە ژوورەوە بۆ دەستکاریکردنی کۆگا');
      }
      return serviceAdjustStock(input, user.uid, user.email || 'بەڕێوەبەر');
    },
    [user]
  );

  const getIngredientById = useCallback(
    (id: string): Ingredient | undefined => {
      return ingredients.find((i) => i.id === id);
    },
    [ingredients]
  );

  const value = {
    ingredients,
    activeIngredients,
    lowStockIngredients,
    lowStockCount,
    loading,
    error,
    addIngredient,
    editIngredient,
    toggleActive,
    stockIn,
    adjustStock,
    getIngredientById,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
