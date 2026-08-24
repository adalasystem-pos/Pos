import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Order } from '../types/order';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/useToast';
import {
  listenActivePreparingOrders,
  updateOrderStatus,
  claimOrderForPrinting,
  claimOrderForReprint,
  markOrderPrintResult,
} from '../services/orders.service';
import { iminPrinter, PrinterStatus, PrinterEnvironment, PrintResult } from '../services/iminPrinter.service';
import { playOrderNotificationChime } from '../utils/sound';
import { formatIQD } from '../utils/currency';

interface POSRealtimeContextType {
  preparingOrders: Order[];
  preparingCount: number;
  loading: boolean;
  completeOrder: (orderId: string) => Promise<void>;
  reprintOrder: (order: Order) => Promise<PrintResult>;
  printerStatus: PrinterStatus;
  printerEnvironment: PrinterEnvironment;
  refreshPrinterStatus: () => Promise<PrinterStatus>;
}

const POSRealtimeContext = createContext<POSRealtimeContextType | undefined>(undefined);

export const POSRealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();
  const { showToast, warning } = useToast();

  const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>('unavailable');
  const [printerEnvironment, setPrinterEnvironment] = useState<PrinterEnvironment>('browser-unsupported');

  const isFirstLoadRef = useRef<boolean>(true);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());

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

  // Centralized Realtime Listener for active preparing orders
  useEffect(() => {
    if (!user) {
      setPreparingOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = listenActivePreparingOrders(
      async (activeOrders) => {
        setPreparingOrders(activeOrders);
        setLoading(false);

        // 1. Initial Snapshot Protection:
        // Do NOT auto-notify or auto-print existing historical orders on initial application load.
        if (isFirstLoadRef.current) {
          activeOrders.forEach((ord) => knownOrderIdsRef.current.add(ord.orderId));
          isFirstLoadRef.current = false;
          return;
        }

        // 2. Captain Role Isolation:
        // Captain devices must never play kitchen chime or attempt automatic POS printing.
        if (role === 'captain') {
          activeOrders.forEach((ord) => knownOrderIdsRef.current.add(ord.orderId));
          return;
        }

        // 3. Detect newly arrived orders for POS operator
        const newlyArrivedOrders = activeOrders.filter(
          (ord) => !knownOrderIdsRef.current.has(ord.orderId)
        );

        for (const newOrd of newlyArrivedOrders) {
          knownOrderIdsRef.current.add(newOrd.orderId);

          // Audio alert
          playOrderNotificationChime();

          const orderNum =
            newOrd.orderNumber ||
            (newOrd.orderId ? `#${newOrd.orderId.slice(-4).toUpperCase()}` : '#001');
          const tableMsg = newOrd.tableNumber ? ` • مێز: ${newOrd.tableNumber}` : '';
          const sourceMsg = newOrd.source === 'captain' ? ' (لە کاپتنەوە)' : '';

          // POS Notification Banner
          showToast(
            `ژمارەی داواکاری: ${orderNum}${tableMsg}${sourceMsg} • کۆ: ${formatIQD(newOrd.totalAmount)}`,
            'info',
            'داواکارییەکی نوێ هات!',
            6000
          );

          // 4. POS Atomic Print Claim & Execution
          // Only the POS attempts atomic print claim
          try {
            const claimed = await claimOrderForPrinting(newOrd.orderId);
            if (claimed) {
              const printRes = await iminPrinter.printReceipt(newOrd, false);
              await markOrderPrintResult(newOrd.orderId, printRes.success);
              if (!printRes.success && printRes.status !== 'ready') {
                if (printRes.status === 'paper-missing') {
                  warning('کاغەزی چاپکەر نەماوە (Paper Missing)');
                }
              }
            }
          } catch (printErr) {
            console.error('POS automatic print error:', printErr);
            await markOrderPrintResult(newOrd.orderId, false);
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

  const completeOrder = useCallback(async (orderId: string) => {
    if (!orderId) return;
    await updateOrderStatus(orderId, 'completed');
  }, []);

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
    preparingOrders,
    preparingCount: preparingOrders.length,
    loading,
    completeOrder,
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
