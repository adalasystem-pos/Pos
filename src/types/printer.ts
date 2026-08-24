import { Order } from './order';

/**
 * iMin POS Hardware Capability States
 */
export type PrinterCapability =
  | 'verified'      // Verified iMin bridge and API methods present and responsive
  | 'available'     // Bridge detected, basic API available
  | 'unsupported'   // Standard browser or environment without hardware printer support
  | 'unavailable';  // Hardware bridge unreachable or missing

/**
 * Real-time Hardware Device State
 */
export type PrinterHardwareState =
  | 'ready'          // Normal operation, paper loaded, ready to print
  | 'paper-missing'  // Out of 58mm thermal paper roll
  | 'error'          // Hardware cover open, overheating, or communication error
  | 'unavailable'    // Bridge not connected
  | 'unknown';       // Unchecked

/**
 * Deterministic Print Execution Status
 */
export type PrintStatus =
  | 'success'        // Hardware confirmed receipt printed
  | 'failed'         // Hardware execution failed or paper missing
  | 'unsupported'    // Environment lacks hardware printing capability
  | 'unavailable';   // Printer device disconnected or bridge absent

/**
 * Structured Print Execution Result
 */
export interface PrintResult {
  success: boolean;
  status: PrintStatus;
  capability: PrinterCapability;
  hardwareState: PrinterHardwareState;
  error?: string;
  timestamp: string;
}

/**
 * Strongly typed interface for official iMin JavaScript Web Bridge
 * Documented for iMin Swift 2 Pro & related Android POS devices.
 */
export interface IminPrinterBridge {
  initPrinter?: () => void;
  getPrinterStatus?: () => number | string;
  setAlignment?: (align: number) => void;
  setTextSize?: (size: number) => void;
  setTextType?: (type: number) => void;
  printText?: (text: string) => void;
  printAndFeedPaper?: (lines: number) => void;
  partialCut?: () => void;
}

/**
 * Contract for POS Hardware Printer Adapter
 */
export interface POSPrinterAdapter {
  isSupported(): boolean;
  getCapability(): PrinterCapability;
  getHardwareState(): Promise<PrinterHardwareState>;
  initialize(): Promise<boolean>;
  printReceipt(order: Order, isManualReprint?: boolean): Promise<PrintResult>;
  format58mmReceiptText(order: Order): string;
}
