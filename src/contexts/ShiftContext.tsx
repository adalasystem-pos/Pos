import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Shift, CashMovement, ShiftReconciliationData } from '../types/shift';
import { Order } from '../types/order';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/useToast';
import {
  listenActiveShift,
  listenShiftCashMovements,
  openShift as serviceOpenShift,
  recordCashMovement as serviceRecordCashMovement,
  calculateShiftReconciliation,
  closeShift as serviceCloseShift,
} from '../services/shift.service';

interface ShiftContextType {
  activeShift: Shift | null;
  movements: CashMovement[];
  loading: boolean;
  isShiftOpen: boolean;
  openShift: (openingCash: number) => Promise<Shift>;
  addCashIn: (amount: number, reason: string) => Promise<CashMovement>;
  addCashOut: (amount: number, reason: string) => Promise<CashMovement>;
  closeShift: (actualCash: number, notes?: string) => Promise<Shift>;
  getReconciliation: () => Promise<ShiftReconciliationData & { orders: Order[]; cashMovements: CashMovement[] }>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, displayName } = useAuth();
  const { success, error: toastError, warning } = useToast();

  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Realtime subscription to active open shift
  useEffect(() => {
    if (!user) {
      setActiveShift(null);
      setMovements([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribeShift = listenActiveShift(
      (shift) => {
        setActiveShift(shift);
        setLoading(false);
      },
      (err) => {
        console.error('Error in active shift listener:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeShift();
    };
  }, [user]);

  // Realtime subscription to cash movements for the active shift
  useEffect(() => {
    if (!activeShift?.id) {
      setMovements([]);
      return;
    }

    const unsubscribeMovements = listenShiftCashMovements(
      activeShift.id,
      (movs) => {
        setMovements(movs);
      },
      (err) => {
        console.error('Error in cash movements listener:', err);
      }
    );

    return () => {
      unsubscribeMovements();
    };
  }, [activeShift?.id]);

  const isShiftOpen = !!activeShift && activeShift.status === 'open';

  const checkAuthorization = useCallback(() => {
    if (!user) {
      throw new Error('دەبێت بەکارهێنەر چووبێتە ژوورەوە');
    }
    if (role === 'captain') {
      throw new Error('کاپتن دەسەڵاتی بەڕێوەبردنی سندوق و شێفتی نییە');
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('پەیوەندی ئینتەرنێت بەردەست نییە. ناتوانرێت کرداری سندوق ئەنجام بدرێت.');
    }
  }, [user, role]);

  const openShift = useCallback(
    async (openingCash: number): Promise<Shift> => {
      checkAuthorization();
      try {
        const newShift = await serviceOpenShift({
          openingCash,
          userId: user!.uid,
          userName: displayName,
        });
        success('شێفتی نوێ بە سەرکەوتوویی کرایەوە');
        return newShift;
      } catch (err: any) {
        console.error('Error opening shift:', err);
        toastError(err.message || 'هەڵەیەک لە کردنەوەی شێفت ڕوویدا');
        throw err;
      }
    },
    [user, displayName, checkAuthorization, success, toastError]
  );

  const addCashIn = useCallback(
    async (amount: number, reason: string): Promise<CashMovement> => {
      checkAuthorization();
      if (!activeShift?.id) {
        throw new Error('هیچ شێفتێکی کراوە بەردەست نییە بۆ داخڵکردنی پارە');
      }

      try {
        const movement = await serviceRecordCashMovement({
          type: 'cash_in',
          amount,
          reason,
          shiftId: activeShift.id,
          userId: user!.uid,
          userName: displayName,
        });
        success('پارەی داخڵکراو بە سەرکەوتوویی تۆمارکرا');
        return movement;
      } catch (err: any) {
        console.error('Error recording cash in:', err);
        toastError(err.message || 'هەڵەیەک لە تۆمارکردنی پارەی داخڵ ڕوویدا');
        throw err;
      }
    },
    [user, displayName, activeShift?.id, checkAuthorization, success, toastError]
  );

  const addCashOut = useCallback(
    async (amount: number, reason: string): Promise<CashMovement> => {
      checkAuthorization();
      if (!activeShift?.id) {
        throw new Error('هیچ شێفتێکی کراوە بەردەست نییە بۆ دەرهێنانی پارە');
      }

      try {
        const movement = await serviceRecordCashMovement({
          type: 'cash_out',
          amount,
          reason,
          shiftId: activeShift.id,
          userId: user!.uid,
          userName: displayName,
        });
        success('پارەی دەرچوو بە سەرکەوتوویی تۆمارکرا');
        return movement;
      } catch (err: any) {
        console.error('Error recording cash out:', err);
        toastError(err.message || 'هەڵەیەک لە تۆمارکردنی پارەی دەرچوو ڕوویدا');
        throw err;
      }
    },
    [user, displayName, activeShift?.id, checkAuthorization, success, toastError]
  );

  const closeShift = useCallback(
    async (actualCash: number, notes?: string): Promise<Shift> => {
      checkAuthorization();
      if (!activeShift?.id) {
        throw new Error('هیچ شێفتێکی کراوە بەردەست نییە بۆ داخستن');
      }

      try {
        const closed = await serviceCloseShift({
          shiftId: activeShift.id,
          actualCash,
          userId: user!.uid,
          userName: displayName,
          notes,
        });
        success('شێفت بە سەرکەوتوویی داخرا و ژمێریاری سندوق پاشەکەوت کرا');
        return closed;
      } catch (err: any) {
        console.error('Error closing shift:', err);
        toastError(err.message || 'هەڵەیەک لە داخستنی شێفت ڕوویدا');
        throw err;
      }
    },
    [user, displayName, activeShift?.id, checkAuthorization, success, toastError]
  );

  const getReconciliation = useCallback(async () => {
    if (!activeShift?.id) {
      return {
        openingCash: 0,
        totalCashSales: 0,
        totalCashIn: 0,
        totalCashOut: 0,
        totalExpenses: 0,
        expectedCash: 0,
        orderCount: 0,
        movementCount: 0,
        orders: [],
        cashMovements: [],
      };
    }
    return calculateShiftReconciliation(activeShift.id, activeShift.openingCash || 0);
  }, [activeShift?.id, activeShift?.openingCash]);

  const value: ShiftContextType = {
    activeShift,
    movements,
    loading,
    isShiftOpen,
    openShift,
    addCashIn,
    addCashOut,
    closeShift,
    getReconciliation,
  };

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
};

export const useShift = (): ShiftContextType => {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
};
