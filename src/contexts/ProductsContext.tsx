import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../types/product';
import {
  listenProducts,
  createProduct,
  updateProduct,
  setProductAvailability,
  seedDefaultProductsIfEmpty,
  CreateProductInput,
  UpdateProductInput,
} from '../services/products.service';
import { useAuth } from '../hooks/useAuth';
import { DEFAULT_PRODUCTS } from '../data/products';

interface ProductsContextType {
  products: Product[];
  activeProducts: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (input: CreateProductInput) => Promise<Product>;
  editProduct: (id: string, updates: Partial<UpdateProductInput>) => Promise<void>;
  toggleAvailability: (id: string, currentActive: boolean) => Promise<void>;
  isProductActive: (productId: string) => boolean;
  getProductById: (productId: string) => Product | undefined;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and listen to products from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Seed default products if collection is empty
    seedDefaultProductsIfEmpty(user.uid).catch((err) => {
      console.warn('Initial product seed check:', err);
    });

    const unsubscribe = listenProducts(
      (loadedProducts) => {
        if (loadedProducts.length > 0) {
          setProducts(loadedProducts);
        } else {
          // If Firestore is empty, use defaults until seeded
          setProducts(DEFAULT_PRODUCTS);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Products listener error:', err);
        setError('هەڵەیەک لە هێنانی لیستی ئایتمەکان ڕوویدا');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const activeProducts = useMemo(() => {
    return products.filter((p) => p.active !== false);
  }, [products]);

  const addProduct = useCallback(
    async (input: CreateProductInput): Promise<Product> => {
      if (!user) {
        throw new Error('پێویستە چووبیتە ژوورەوە بۆ زیادکردنی ئایتم');
      }
      const newProduct = await createProduct(input, user.uid);
      return newProduct;
    },
    [user]
  );

  const editProduct = useCallback(
    async (id: string, updates: Partial<UpdateProductInput>): Promise<void> => {
      if (!user) {
        throw new Error('پێویستە چووبیتە ژوورەوە بۆ دەستکاری کردنی ئایتم');
      }
      await updateProduct(id, updates, user.uid);
    },
    [user]
  );

  const toggleAvailability = useCallback(
    async (id: string, currentActive: boolean): Promise<void> => {
      if (!user) {
        throw new Error('پێویستە چووبیتە ژوورەوە بۆ گۆڕینی دۆخی بەردەستبوون');
      }
      await setProductAvailability(id, !currentActive, user.uid);
    },
    [user]
  );

  const isProductActive = useCallback(
    (productId: string): boolean => {
      const prod = products.find((p) => p.id === productId);
      return prod ? prod.active !== false : false;
    },
    [products]
  );

  const getProductById = useCallback(
    (productId: string): Product | undefined => {
      return products.find((p) => p.id === productId);
    },
    [products]
  );

  return (
    <ProductsContext.Provider
      value={{
        products,
        activeProducts,
        loading,
        error,
        addProduct,
        editProduct,
        toggleAvailability,
        isProductActive,
        getProductById,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export function useProducts(): ProductsContextType {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
