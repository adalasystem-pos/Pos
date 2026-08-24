import { Order } from '../types/order';
import { formatIQD } from '../utils/currency';
import { formatBaghdadTime } from '../utils/dates';
import { APP_CONFIG } from '../config/appConfig';

export type PrinterStatus = 'Ready' | 'Paper Missing' | 'Printer Error' | 'Printer Unavailable';

export interface PrintResult {
  success: boolean;
  error?: string;
  status: PrinterStatus;
}

export interface POSPrinter {
  initialize(): Promise<void>;
  getStatus(): Promise<PrinterStatus>;
  printReceipt(order: Order, isManualReprint?: boolean): Promise<PrintResult>;
}

// Key for session-based print idempotency
const PRINTED_ORDERS_STORAGE_KEY = 'imin_printed_orders_set';

class IminThermalPrinter implements POSPrinter {
  private printedOrderIds: Set<string>;
  private isInitialized = false;

  constructor() {
    this.printedOrderIds = new Set<string>();
    this.loadPrintedOrders();
  }

  private loadPrintedOrders() {
    try {
      const stored = sessionStorage.getItem(PRINTED_ORDERS_STORAGE_KEY);
      if (stored) {
        const ids = JSON.parse(stored);
        if (Array.isArray(ids)) {
          ids.forEach((id) => this.printedOrderIds.add(id));
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  private savePrintedOrders() {
    try {
      const arr = Array.from(this.printedOrderIds);
      sessionStorage.setItem(PRINTED_ORDERS_STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Detects if the iMin Android Hardware JS bridge is present in window
   */
  private getIminBridge(): any {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    return (
      w.IminPrintInstance ||
      w.iminPrint ||
      w.IminPrinter ||
      w.AndroidPrinter ||
      w.js_bridge?.imin ||
      w.imin ||
      null
    );
  }

  /**
   * Initializes the printer hardware if available
   */
  async initialize(): Promise<void> {
    try {
      const bridge = this.getIminBridge();
      if (bridge && typeof bridge.initPrinter === 'function') {
        bridge.initPrinter();
        this.isInitialized = true;
      } else {
        this.isInitialized = true;
      }
    } catch (err) {
      console.warn('iMin Printer initialization notice:', err);
      this.isInitialized = true;
    }
  }

  /**
   * Queries real-time hardware status from iMin Swift 2 Pro
   */
  async getStatus(): Promise<PrinterStatus> {
    const bridge = this.getIminBridge();
    if (!bridge) {
      // In browser environment or standard POS terminal, web thermal print is ready
      return 'Ready';
    }

    try {
      if (typeof bridge.getPrinterStatus === 'function') {
        const rawStatus = bridge.getPrinterStatus();
        // iMin status codes: 0 = Normal/Ready, 1 = Out of paper, -1 = Error/Cover open
        if (rawStatus === 0 || rawStatus === '0' || rawStatus === 'OK') {
          return 'Ready';
        } else if (rawStatus === 1 || rawStatus === '1' || rawStatus === 'PAPER_EMPTY') {
          return 'Paper Missing';
        } else {
          return 'Printer Error';
        }
      }
      return 'Ready';
    } catch (err) {
      console.warn('Error reading iMin printer status:', err);
      return 'Printer Unavailable';
    }
  }

  /**
   * Checks if an order was already printed (idempotency)
   */
  isOrderPrinted(orderId: string): boolean {
    return this.printedOrderIds.has(orderId);
  }

  /**
   * Formats 58mm thermal plain text receipt with Kurdish Sorani RTL content
   */
  format58mmReceiptText(order: Order): string {
    const divider = '----------------------------';
    const orderNum = order.orderNumber || (order.orderId ? `#${order.orderId.slice(-4).toUpperCase()}` : '#001');
    const timeStr = formatBaghdadTime(order.createdAt);
    const lines: string[] = [];

    lines.push(APP_CONFIG.restaurantName);
    lines.push(divider);
    lines.push(`ژمارەی داواکاری: ${orderNum}`);
    if (order.tableNumber) {
      lines.push(`مێز: ${order.tableNumber}`);
    }
    lines.push(`کات: ${timeStr}`);
    lines.push(divider);

    order.items.forEach((item) => {
      let itemName = item.productName;
      if (item.portion) {
        itemName += ` (${item.portion})`;
      }
      lines.push(itemName);
      lines.push(`${item.quantity} × ${formatIQD(item.unitPrice)} = ${formatIQD(item.lineTotal)}`);
      if (item.customizations && item.customizations.length > 0) {
        lines.push(`[${item.customizations.join(', ')}]`);
      }
    });

    if (order.note) {
      lines.push(divider);
      lines.push(`تێبینی: ${order.note}`);
    }

    lines.push(divider);
    lines.push(`کۆی گشتی: ${formatIQD(order.totalAmount)}`);
    lines.push(divider);
    lines.push('حاڵەت: نێردرا بۆ ئامادەکردن');
    lines.push(divider);
    lines.push(APP_CONFIG.providerAttributionKurdish);
    lines.push(APP_CONFIG.providerAttribution);

    return lines.join('\n');
  }

  /**
   * Prints the receipt for an order with duplicate prevention
   */
  async printReceipt(order: Order, isManualReprint: boolean = false): Promise<PrintResult> {
    if (!order || !order.orderId) {
      return { success: false, error: 'داواکاری بەردەست نییە', status: 'Printer Error' };
    }

    // Idempotency: prevent automatic duplicate prints unless user explicitly triggered reprint
    if (!isManualReprint && this.printedOrderIds.has(order.orderId)) {
      return { success: true, status: 'Ready' };
    }

    const currentStatus = await this.getStatus();
    if (currentStatus === 'Paper Missing') {
      return { success: false, error: 'کاغەزی چاپکەر نەماوە (Paper Missing)', status: 'Paper Missing' };
    }

    const bridge = this.getIminBridge();

    // 1. Native iMin Android Hardware JS Bridge Execution
    if (bridge) {
      try {
        if (typeof bridge.initPrinter === 'function') bridge.initPrinter();

        // Center aligned title
        if (typeof bridge.setAlignment === 'function') bridge.setAlignment(1);
        if (typeof bridge.setTextSize === 'function') bridge.setTextSize(26);
        if (typeof bridge.setTextType === 'function') bridge.setTextType(1); // Bold
        if (typeof bridge.printText === 'function') {
          bridge.printText(`${APP_CONFIG.restaurantName}\n`);
          bridge.printText('----------------------------\n');
        }

        // Order details
        if (typeof bridge.setAlignment === 'function') bridge.setAlignment(0); // Right / Natural
        if (typeof bridge.setTextSize === 'function') bridge.setTextSize(22);
        if (typeof bridge.setTextType === 'function') bridge.setTextType(0);

        const textContent = this.format58mmReceiptText(order);
        if (typeof bridge.printText === 'function') {
          bridge.printText(textContent + '\n\n');
        }

        // Feed & Partial Cut
        if (typeof bridge.printAndFeedPaper === 'function') {
          bridge.printAndFeedPaper(30);
        }
        if (typeof bridge.partialCut === 'function') {
          bridge.partialCut();
        }

        // Mark as printed
        this.printedOrderIds.add(order.orderId);
        this.savePrintedOrders();

        return { success: true, status: 'Ready' };
      } catch (hardwareErr: any) {
        console.warn('iMin hardware bridge error:', hardwareErr);
        // Fallback to browser window.print below
      }
    }

    // 2. Standard Web / Thermal Browser Fallback
    try {
      if (typeof window !== 'undefined') {
        // Mark as printed first
        this.printedOrderIds.add(order.orderId);
        this.savePrintedOrders();

        // Trigger thermal print view safely
        setTimeout(() => {
          try {
            window.print();
          } catch (e) {
            console.warn('Browser print exception:', e);
          }
        }, 150);

        return { success: true, status: 'Ready' };
      }
      return { success: false, error: 'ژینگەی چاپکردن بەردەست نییە', status: 'Printer Unavailable' };
    } catch (err: any) {
      console.error('Print failure:', err);
      return {
        success: false,
        error: err.message || 'چاپکردن سەرکەوتوو نەبوو',
        status: 'Printer Error',
      };
    }
  }
}

// Export singleton instance
export const iminPrinter = new IminThermalPrinter();
