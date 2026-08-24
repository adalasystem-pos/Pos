import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Order, OrderStatus } from '../types/order';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/useToast';
import {
  listenActiveOperationalOrders,
  markOrderReady as serviceMarkOrderReady,
  markOrderServed as serviceMarkOrderServed,
  completeOrder as serviceCompleteOrder,
  cancelOrder as serviceCancelOrder,
  claimOrderForPrinting,
  claimOrderForReprint,
  markOrderPrintResult,
} from '../services/orders.service';
import { iminPrinter, PrinterStatus, PrinterEnvironment, PrintResult } from '../services/iminPrinter.service';
import { playOrderNotificationChime } from '../utils/sound';
import { formatIQD } from '../utils/currency';

interface POSRealtimeContextType {
  activeOrders: Order[];
  preparingOrders: Order[];
  readyOrders: Order[];
  servedOrders: Order[];
  preparingCount: number;
  readyCount: number;
  servedCount: number;
  totalActiveCount: number;
  loading: boolean;
  markOrderReady: (orderId: string) => Promise<void>;
  markOrderServed: (orderId: string) => Promise<void>;
  completeOrder: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  reprintOrder: (order: Order) => Promise<PrintResult>;
  printerStatus: PrinterStatus;
  printerEnvironment: PrinterEnvironment;
  refreshPrinterStatus: () => Promise<PrinterStatus>;
}

const POSRealtimeContext = createContext<POSRealtimeContextType | undefined>(undefined);

export const POSRealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, displayName } = useAuth();
  const { showToast, warning, success, error: toastError } = useToast();

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>('unavailable');
  const [printerEnvironment, setPrinterEnvironment] = useState<PrinterEnvironment>('browser-unsupported');

  const isFirstLoadRef = useRef<boolean>(true);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const knownStatusMapRef = useRef<Map<string, OrderStatus>>(new Map());

  // Check and update printer environment & status
  const refreshPrinterStatus = useCallback(async (): Promise<PrinterStatus> => {
    const env = iminPrinter.getEnvironment();
    setPrinterEnvironment(env);
    const status = await iminPrinter.getStatus();
    setPrinterStatus(status);
    return status;
  }, []);

  useEffect(() => {
    refreshPrinterStatus();
    iminPrinter.initialize();
  }, [refreshPrinterStatus]);

  // Centralized Realtime Listener for active operational orders
  useEffect(() => {
    if (!user) {
      setActiveOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = listenActiveOperationalOrders(
      async (orders) => {
        setActiveOrders(orders);
        setLoading(false);

        // 1. Initial Snapshot Protection:
        // Populate known IDs and statuses without triggering notifications on first page load
        if (isFirstLoadRef.current) {
          orders.forEach((ord) => {
            knownOrderIdsRef.current.add(ord.orderId);
            knownStatusMapRef.current.set(ord.orderId, ord.status);
          });
          isFirstLoadRef.current = false;
          return;
        }

        // 2. Process order updates and transitions
        for (const ord of orders) {
          const prevStatus = knownStatusMapRef.current.get(ord.orderId);
          const isNewlyArrived = !knownOrderIdsRef.current.has(ord.orderId);

          const orderNum =
            ord.orderNumber ||
            (ord.orderId ? `#${ord.orderId.slice(-4).toUpperCase()}` : '#001');
          const tableMsg = ord.tableNumber ? ` • مێز: ${ord.tableNumber}` : '';

          if (isNewlyArrived) {
            knownOrderIdsRef.current.add(ord.orderId);
            knownStatusMapRef.current.set(ord.orderId, ord.status);

            // Audio alert & Auto-Print strictly for POS/Cashier on brand new order creation
            if (role !== 'captain') {
              playOrderNotificationChime();
              const sourceMsg = ord.source === 'captain' ? ' (لە کاپتنەوە)' : '';

              showToast(
                `ژمارەی داواکاری: ${orderNum}${tableMsg}${sourceMsg} • کۆ: ${formatIQD(ord.totalAmount)}`,
                'info',
                'داواکارییەکی نوێ هات!',
                6000
              );

              // POS Atomic Print Claim & Execution (Only on initial creation)
              try {
                const claimed = await claimOrderForPrinting(ord.orderId);
                if (claimed) {
                  const printRes = await iminPrinter.printReceipt(ord, false);
                  await markOrderPrintResult(ord.orderId, printRes.success);
                  if (!printRes.success && printRes.status !== 'ready') {
                    if (printRes.status === 'paper-missing') {
                      warning('کاغەزی چاپکەر نەماوە (Paper Missing)');
                    }
                  }
                }
              } catch (printErr) {
                console.error('POS automatic print error:', printErr);
                await markOrderPrintResult(ord.orderId, false);
              }
            }
          } else if (prevStatus && prevStatus !== ord.status) {
            // Status Transition Notifications (NO automatic reprint triggered!)
            knownStatusMapRef.current.set(ord.orderId, ord.status);

            if (ord.status === 'ready') {
              // Notify when order is ready from kitchen
              showToast(
                `داواکاری ${orderNum}${tableMsg} ئامادەیە بۆ پێشکەشکردن`,
                'success',
                'داواکاری ئامادەیە!',
                5000
              );
            } else if (ord.status === 'served') {
              // Notify when order is served to the table
              showToast(
                `داواکاری ${orderNum}${tableMsg} گەیەنرا بە کڕیار`,
                'info',
                'داواکاری گەیەنرا',
                4000
              );
            }
          }
        }
      },
      undefined,
      (err) => {
        console.error('POS realtime listener error:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, role, showToast, warning]);

  // Derived filtered order lists
  const preparingOrders = useMemo(
    () => activeOrders.filter((o) => o.status === 'preparing'),
    [activeOrders]
  );

  const readyOrders = useMemo(
    () => activeOrders.filter((o) => o.status === 'ready'),
    [activeOrders]
  );

  const servedOrders = useMemo(
    () => activeOrders.filter((o) => o.status === 'served'),
    [activeOrders]
  );

  const markOrderReady = useCallback(
    async (orderId: string) => {
      if (!user) throw new Error('دەبێت بەکارهێنەر چووبێتە ژوورەوە');
      await serviceMarkOrderReady(orderId, {
        uid: user.uid,
        name: displayName,
        role,
      });
    },
    [user, displayName, role]
  );

  const markOrderServed = useCallback(
    async (orderId: string) => {
      if (!user) throw new Error('دەبێت بەکارهێنەر چووبێتە ژوورەوە');
      await serviceMarkOrderServed(orderId, {
        uid: user.uid,
        name: displayName,
        role,
      });
    },
    [user, displayName, role]
  );

  const completeOrder = useCallback(
    async (orderId: string) => {
      if (!user) throw new Error('دەبێت بەکارهێنەر چووبێتە ژوورەوە');
      await serviceCompleteOrder(orderId, {
        uid: user.uid,
        name: displayName,
        role,
      });
    },
    [user, displayName, role]
  );

  const cancelOrder = useCallback(
    async (orderId: string, reason: string) => {
      if (!user) throw new Error('دەبێت بەکارهێنەر چووبێتە ژوورەوە');
      if (!reason || !reason.trim()) {
        throw new Error('دەبێت هۆکاری هەڵوەشاندنەوە بنووسرێت');
      }
      await serviceCancelOrder(orderId, reason, {
        uid: user.uid,
        name: displayName,
        role,
      });
    },
    [user, displayName, role]
  );

  const reprintOrder = useCallback(async (order: Order): Promise<PrintResult> => {
    if (!order || !order.orderId) {
      return { success: false, error: 'داواکاری بەردەست نییە', status: 'error' };
    }

    try {
      await claimOrderForReprint(order.orderId);
      const printRes = await iminPrinter.printReceipt(order, true);
      await markOrderPrintResult(order.orderId, printRes.success);
      return printRes;
    } catch (err: any) {
      console.error('Reprint error:', err);
      await markOrderPrintResult(order.orderId, false);
      return { success: false, error: err.message || 'چاپکردن سەرکەوتوو نەبوو', status: 'error' };
    }
  }, []);

  const value = {
    activeOrders,
    preparingOrders,
    readyOrders,
    servedOrders,
    preparingCount: preparingOrders.length,
    readyCount: readyOrders.length,
    servedCount: servedOrders.length,
    totalActiveCount: activeOrders.length,
    loading,
    markOrderReady,
    markOrderServed,
    completeOrder,
    cancelOrder,
    reprintOrder,
    printerStatus,
    printerEnvironment,
    refreshPrinterStatus,
  };

  return <POSRealtimeContext.Provider value={value}>{children}</POSRealtimeContext.Provider>;
};

export const usePOSRealtime = (): POSRealtimeContextType => {
  const context = useContext(POSRealtimeContext);
  if (!context) {
    throw new Error('usePOSRealtime must be used within a POSRealtimeProvider');
  }
  return context;
};
