import { Order } from '../types/order';
import { formatIQD } from '../utils/currency';
import { formatBaghdadTime } from '../utils/dates';
import { APP_CONFIG } from '../config/appConfig';

export type PrinterEnvironment =
  | 'imin-supported'
  | 'browser-unsupported'
  | 'bridge-unavailable';

export type PrinterStatus =
  | 'ready'
  | 'paper-missing'
  | 'error'
  | 'unavailable'
  | 'unknown';

export interface PrintResult {
  success: boolean;
  error?: string;
  status: PrinterStatus;
}

export interface POSPrinterAdapter {
  isSupported(): boolean;
  getEnvironment(): PrinterEnvironment;
  initialize(): Promise<void>;
  getStatus(): Promise<PrinterStatus>;
  printReceipt(order: Order, isManualReprint?: boolean): Promise<PrintResult>;
  format58mmReceiptText(order: Order): string;
}

/**
 * Standard typed interface for official iMin Web JS Bridge
 * Documented for iMin Swift 2 Pro Android POS
 */
interface IminHardwareBridge {
  initPrinter?: () => void;
  getPrinterStatus?: () => number | string;
  setAlignment?: (align: number) => void;
  setTextSize?: (size: number) => void;
  setTextType?: (type: number) => void;
  printText?: (text: string) => void;
  printAndFeedPaper?: (lines: number) => void;
  partialCut?: () => void;
}

class IminThermalPrinterService implements POSPrinterAdapter {
  private isInitialized = false;

  /**
   * Safely detects the verified official iMin JavaScript bridge
   */
  private getIminBridge(): IminHardwareBridge | null {
    if (typeof window === 'undefined') return null;
    const win = window as unknown as { IminPrintInstance?: IminHardwareBridge; iminPrint?: IminHardwareBridge };
    if (win.IminPrintInstance && typeof win.IminPrintInstance === 'object') {
      return win.IminPrintInstance;
    }
    if (win.iminPrint && typeof win.iminPrint === 'object') {
      return win.iminPrint;
    }
    return null;
  }

  isSupported(): boolean {
    return this.getIminBridge() !== null;
  }

  getEnvironment(): PrinterEnvironment {
    if (typeof window === 'undefined') {
      return 'bridge-unavailable';
    }
    const bridge = this.getIminBridge();
    if (bridge) {
      return 'imin-supported';
    }
    return 'browser-unsupported';
  }

  /**
   * Initializes the verified printer hardware if present
   */
  async initialize(): Promise<void> {
    try {
      const bridge = this.getIminBridge();
      if (bridge && typeof bridge.initPrinter === 'function') {
        bridge.initPrinter();
        this.isInitialized = true;
      } else {
        this.isInitialized = false;
      }
    } catch (err) {
      console.warn('iMin Printer initialization error:', err);
      this.isInitialized = false;
    }
  }

  /**
   * Queries real-time hardware status from iMin Swift 2 Pro thermal printer
   * Returns 'unavailable' when no verified hardware bridge is connected.
   */
  async getStatus(): Promise<PrinterStatus> {
    const bridge = this.getIminBridge();
    if (!bridge) {
      // In standard browser environment without native iMin wrapper, printer is unavailable
      return 'unavailable';
    }

    try {
      if (typeof bridge.getPrinterStatus === 'function') {
        const rawStatus = bridge.getPrinterStatus();
        // Official iMin status mapping:
        // 0 / "0" / "OK" = Normal/Ready
        // 1 / "1" / "PAPER_EMPTY" = Out of paper
        // -1 / other = Hardware Error / Cover open
        if (rawStatus === 0 || rawStatus === '0' || rawStatus === 'OK') {
          return 'ready';
        } else if (rawStatus === 1 || rawStatus === '1' || rawStatus === 'PAPER_EMPTY') {
          return 'paper-missing';
        } else {
          return 'error';
        }
      }
      return 'ready';
    } catch (err) {
      console.warn('Error reading iMin printer status:', err);
      return 'error';
    }
  }

  /**
   * Formats 58mm thermal receipt text with Kurdish Sorani RTL content
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
    if (order.createdByName) {
      lines.push(`تۆمارکار: ${order.createdByName}`);
    }
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
   * Prints the receipt using verified iMin hardware.
   * If hardware is unavailable, returns typed error without crashing or triggering fake prints.
   */
  async printReceipt(order: Order, _isManualReprint: boolean = false): Promise<PrintResult> {
    if (!order || !order.orderId) {
      return { success: false, error: 'داواکاری بەردەست نییە', status: 'error' };
    }

    const bridge = this.getIminBridge();
    if (!bridge) {
      // Production POS policy: No guessed bridge -> report unavailable clearly
      return {
        success: false,
        error: 'چاپکەری iMin لەم ئامێرەدا نەدۆزرایەوە (پێویستی بە ئامێری iMin هەیە)',
        status: 'unavailable',
      };
    }

    const currentStatus = await this.getStatus();
    if (currentStatus === 'paper-missing') {
      return {
        success: false,
        error: 'کاغەزی چاپکەر نەماوە (Paper Missing)',
        status: 'paper-missing',
      };
    }

    if (currentStatus === 'error') {
      return {
        success: false,
        error: 'هەڵەیەک لە چاپکەردا هەیە',
        status: 'error',
      };
    }

    // Native iMin Hardware Output
    try {
      if (typeof bridge.initPrinter === 'function') {
        bridge.initPrinter();
      }

      // Title formatting
      if (typeof bridge.setAlignment === 'function') bridge.setAlignment(1);
      if (typeof bridge.setTextSize === 'function') bridge.setTextSize(26);
      if (typeof bridge.setTextType === 'function') bridge.setTextType(1); // Bold
      if (typeof bridge.printText === 'function') {
        bridge.printText(`${APP_CONFIG.restaurantName}\n`);
        bridge.printText('----------------------------\n');
      }

      // Order content formatting
      if (typeof bridge.setAlignment === 'function') bridge.setAlignment(0);
      if (typeof bridge.setTextSize === 'function') bridge.setTextSize(22);
      if (typeof bridge.setTextType === 'function') bridge.setTextType(0);

      const textContent = this.format58mmReceiptText(order);
      if (typeof bridge.printText === 'function') {
        bridge.printText(textContent + '\n\n');
      }

      // Feed & Cut
      if (typeof bridge.printAndFeedPaper === 'function') {
        bridge.printAndFeedPaper(30);
      }
      if (typeof bridge.partialCut === 'function') {
        bridge.partialCut();
      }

      return { success: true, status: 'ready' };
    } catch (err: any) {
      console.error('iMin thermal print execution error:', err);
      return {
        success: false,
        error: err.message || 'چاپکردن بە سەرکەوتوویی تەواو نەبوو',
        status: 'error',
      };
    }
  }
}

// Export singleton instance
export const iminPrinter = new IminThermalPrinterService();
