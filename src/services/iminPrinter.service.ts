import { Order } from '../types/order';
import { formatIQD } from '../utils/currency';
import { formatBaghdadTime } from '../utils/dates';
import { APP_CONFIG } from '../config/appConfig';
import {
  PrinterCapability,
  PrinterHardwareState,
  PrintStatus,
  PrintResult,
  IminPrinterBridge,
  POSPrinterAdapter,
} from '../types/printer';

// Legacy type aliases for backward compatibility across context consumers
export type PrinterEnvironment = 'imin-supported' | 'browser-unsupported' | 'bridge-unavailable';
export type PrinterStatus = PrinterHardwareState;
export type { PrintResult, PrinterCapability, PrintStatus, PrinterHardwareState, IminPrinterBridge };

class IminThermalPrinterService implements POSPrinterAdapter {
  private isInitialized = false;

  /**
   * Safely detects the verified official iMin JavaScript bridge.
   * Defends against undefined window, non-object wrappers, or missing methods.
   */
  private getIminBridge(): IminPrinterBridge | null {
    if (typeof window === 'undefined') return null;

    try {
      const win = window as unknown as {
        IminPrintInstance?: IminPrinterBridge;
        iminPrint?: IminPrinterBridge;
      };

      if (win.IminPrintInstance && typeof win.IminPrintInstance === 'object') {
        return win.IminPrintInstance;
      }
      if (win.iminPrint && typeof win.iminPrint === 'object') {
        return win.iminPrint;
      }
    } catch (err) {
      console.warn('Safe bridge detection caught error:', err);
    }

    return null;
  }

  /**
   * Evaluates the active hardware environment and bridge capability.
   */
  getCapability(): PrinterCapability {
    if (typeof window === 'undefined') {
      return 'unavailable';
    }

    const bridge = this.getIminBridge();
    if (!bridge) {
      return 'unsupported';
    }

    if (typeof bridge.printText === 'function') {
      return 'verified';
    }

    return 'available';
  }

  /**
   * Returns true if verified iMin hardware printing is supported on the current device.
   */
  isSupported(): boolean {
    const cap = this.getCapability();
    return cap === 'verified' || cap === 'available';
  }

  /**
   * Legacy environment string for backwards compatibility
   */
  getEnvironment(): PrinterEnvironment {
    const cap = this.getCapability();
    if (cap === 'verified' || cap === 'available') {
      return 'imin-supported';
    }
    if (cap === 'unavailable') {
      return 'bridge-unavailable';
    }
    return 'browser-unsupported';
  }

  /**
   * Initializes the verified printer hardware if present.
   */
  async initialize(): Promise<boolean> {
    try {
      const bridge = this.getIminBridge();
      if (bridge && typeof bridge.initPrinter === 'function') {
        bridge.initPrinter();
        this.isInitialized = true;
        return true;
      }
      this.isInitialized = false;
      return false;
    } catch (err) {
      console.warn('iMin Printer initialization error:', err);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Queries real-time hardware status from iMin Swift 2 Pro thermal printer.
   * Returns 'unavailable' when running in standard browser without hardware bridge.
   */
  async getHardwareState(): Promise<PrinterHardwareState> {
    const bridge = this.getIminBridge();
    if (!bridge) {
      return 'unavailable';
    }

    try {
      if (typeof bridge.getPrinterStatus === 'function') {
        const rawStatus = bridge.getPrinterStatus();
        // Official iMin status code mapping:
        // 0 / "0" / "OK" = Normal / Ready to print
        // 1 / "1" / "PAPER_EMPTY" = Out of 58mm thermal paper
        // -1 / other = Hardware Error / Cover open / Overheated
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
   * Alias for backward compatibility
   */
  async getStatus(): Promise<PrinterStatus> {
    return this.getHardwareState();
  }

  /**
   * Formats 58mm thermal receipt text with Kurdish Sorani RTL content.
   * Preserves exact items, quantities, customizations, notes, totals, and branding.
   */
  format58mmReceiptText(order: Order): string {
    const divider = '----------------------------';
    const orderNum =
      order.orderNumber || (order.orderId ? `#${order.orderId.slice(-4).toUpperCase()}` : '#001');
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
   * Formats 58mm thermal receipt text for Daily Summary & Financial Reports.
   */
  format58mmDailyReportText(
    summary: {
      businessDate: string;
      totalSales: number;
      totalExpenses: number;
      netProfit: number;
      orderCount: number;
      expenseCount: number;
    },
    options?: {
      closedByName?: string;
      closedAt?: any;
      topProducts?: Array<{ productName: string; totalQuantity?: number; quantity?: number; totalRevenue: number }>;
      expenseCategories?: Array<{ category: string | any; totalAmount: number }>;
    }
  ): string {
    const divider = '----------------------------';
    const lines: string[] = [];

    lines.push(APP_CONFIG.restaurantName);
    lines.push('ڕاپۆرتی دارایی و حسابی ڕۆژانە');
    lines.push(divider);
    lines.push(`بەروار: ${summary.businessDate}`);
    lines.push(`کاتی چاپ: ${formatBaghdadTime(new Date())}`);
    if (options?.closedByName) {
      lines.push(`داخراوە لەلایەن: ${options.closedByName}`);
    }
    lines.push(divider);

    lines.push(`کۆی گشتی فرۆش: ${formatIQD(summary.totalSales)}`);
    lines.push(`ژمارەی داواکارییەکان: ${summary.orderCount}`);
    lines.push(divider);

    lines.push(`کۆی گشتی خەرجییەکان: ${formatIQD(summary.totalExpenses)}`);
    lines.push(`ژمارەی خەرجییەکان: ${summary.expenseCount}`);
    lines.push(divider);

    lines.push(`قازانجی پاک (Net Profit):`);
    lines.push(`${formatIQD(summary.netProfit)}`);
    lines.push(divider);

    if (options?.topProducts && options.topProducts.length > 0) {
      lines.push('پڕفرۆشترین خواردنەکان:');
      options.topProducts.slice(0, 5).forEach((p, idx) => {
        const qty = p.totalQuantity !== undefined ? p.totalQuantity : p.quantity || 0;
        lines.push(`${idx + 1}. ${p.productName} (${qty} دانە) - ${formatIQD(p.totalRevenue)}`);
      });
      lines.push(divider);
    }

    if (options?.expenseCategories && options.expenseCategories.length > 0) {
      lines.push('پوختەی خەرجییەکان بەپێی بەش:');
      options.expenseCategories.forEach((cat) => {
        lines.push(`• ${cat.category}: ${formatIQD(cat.totalAmount)}`);
      });
      lines.push(divider);
    }

    lines.push(APP_CONFIG.providerAttributionKurdish);
    lines.push(APP_CONFIG.providerAttribution);

    return lines.join('\n');
  }

  /**
   * Prints the Daily Summary / Financial Report using verified iMin hardware.
   */
  async printDailySummaryReport(
    summary: {
      businessDate: string;
      totalSales: number;
      totalExpenses: number;
      netProfit: number;
      orderCount: number;
      expenseCount: number;
    },
    options?: {
      closedByName?: string;
      closedAt?: any;
      topProducts?: Array<{ productName: string; totalQuantity?: number; quantity?: number; totalRevenue: number }>;
      expenseCategories?: Array<{ category: string | any; totalAmount: number }>;
    }
  ): Promise<PrintResult> {
    const now = new Date().toISOString();
    const capability = this.getCapability();

    const bridge = this.getIminBridge();
    if (!bridge || capability === 'unsupported' || capability === 'unavailable') {
      return {
        success: false,
        status: 'unavailable',
        capability,
        hardwareState: 'unavailable',
        error: 'چاپکەری iMin لەم ئامێرەدا نەدۆزرایەوە (پێویستی بە ئامێری iMin هەیە)',
        timestamp: now,
      };
    }

    const hardwareState = await this.getHardwareState();
    if (hardwareState === 'paper-missing') {
      return {
        success: false,
        status: 'failed',
        capability,
        hardwareState: 'paper-missing',
        error: 'کاغەزی چاپکەر نەماوە (Paper Missing)',
        timestamp: now,
      };
    }

    if (hardwareState === 'error') {
      return {
        success: false,
        status: 'failed',
        capability,
        hardwareState: 'error',
        error: 'هەڵەیەک لە چاپکەردا هەیە (Hardware Error)',
        timestamp: now,
      };
    }

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
        bridge.printText('ڕاپۆرتی ژمێریاری ڕۆژانە\n');
        bridge.printText('----------------------------\n');
      }

      // Content formatting
      if (typeof bridge.setAlignment === 'function') bridge.setAlignment(0);
      if (typeof bridge.setTextSize === 'function') bridge.setTextSize(22);
      if (typeof bridge.setTextType === 'function') bridge.setTextType(0);

      const textContent = this.format58mmDailyReportText(summary, options);
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

      return {
        success: true,
        status: 'success',
        capability: 'verified',
        hardwareState: 'ready',
        timestamp: now,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'چاپکردن بە سەرکەوتوویی تەواو نەبوو';
      console.error('iMin thermal report print error:', err);
      return {
        success: false,
        status: 'failed',
        capability: 'verified',
        hardwareState: 'error',
        error: errorMsg,
        timestamp: now,
      };
    }
  }

  /**
   * Prints the receipt using verified iMin hardware.
   *
   * Flow:
   * 1. Validate order
   * 2. Capability check
   * 3. Hardware state check
   * 4. Bridge execution
   * 5. Deterministic PrintResult return
   */
  async printReceipt(order: Order, _isManualReprint: boolean = false): Promise<PrintResult> {
    const now = new Date().toISOString();
    const capability = this.getCapability();

    if (!order || !order.orderId) {
      return {
        success: false,
        status: 'failed',
        capability,
        hardwareState: 'error',
        error: 'داواکاری بەردەست نییە',
        timestamp: now,
      };
    }

    const bridge = this.getIminBridge();
    if (!bridge || capability === 'unsupported' || capability === 'unavailable') {
      // Safe fallback: report unavailable clearly without throwing or faking success
      return {
        success: false,
        status: 'unavailable',
        capability,
        hardwareState: 'unavailable',
        error: 'چاپکەری iMin لەم ئامێرەدا نەدۆزرایەوە (پێویستی بە ئامێری iMin هەیە)',
        timestamp: now,
      };
    }

    const hardwareState = await this.getHardwareState();
    if (hardwareState === 'paper-missing') {
      return {
        success: false,
        status: 'failed',
        capability,
        hardwareState: 'paper-missing',
        error: 'کاغەزی چاپکەر نەماوە (Paper Missing)',
        timestamp: now,
      };
    }

    if (hardwareState === 'error') {
      return {
        success: false,
        status: 'failed',
        capability,
        hardwareState: 'error',
        error: 'هەڵەیەک لە چاپکەردا هەیە (Hardware Error)',
        timestamp: now,
      };
    }

    // Native iMin Hardware Execution
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

      return {
        success: true,
        status: 'success',
        capability: 'verified',
        hardwareState: 'ready',
        timestamp: now,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'چاپکردن بە سەرکەوتوویی تەواو نەبوو';
      console.error('iMin thermal print execution error:', err);
      return {
        success: false,
        status: 'failed',
        capability: 'verified',
        hardwareState: 'error',
        error: errorMsg,
        timestamp: now,
      };
    }
  }
}

// Export singleton instance
export const iminPrinter = new IminThermalPrinterService();
