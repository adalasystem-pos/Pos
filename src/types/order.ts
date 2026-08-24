import { Portion } from './product';

export interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number; // Integer IQD
  quantity: number;
  portion: Portion;
  customizations: string[];
  lineTotal: number; // Integer IQD: unitPrice * quantity
}

export type OrderStatus = 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
export type OrderSource = 'captain' | 'pos';
export type KitchenPrintStatus = 'pending' | 'printing' | 'printed' | 'failed';

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  changedAt: any; // Firestore Timestamp
  changedBy: string;
  changedByName?: string;
  note?: string;
}

export interface Order {
  orderId: string;
  orderNumber?: string; // Human-readable order number (e.g. #001)
  source?: OrderSource; // 'captain' | 'pos'
  status: OrderStatus;
  tableNumber?: string; // Optional table number (e.g. "12")
  items: CartItem[];
  subtotal: number; // Integer IQD
  totalAmount: number; // Integer IQD
  note: string;
  kitchenPrintStatus?: KitchenPrintStatus;
  kitchenPrintedAt?: any; // Firestore Timestamp
  kitchenPrintAttempts?: number;
  statusHistory?: OrderStatusHistoryItem[];
  preparingAt?: any;
  readyAt?: any;
  servedAt?: any;
  completedAt?: any;
  cancelledAt?: any;
  cancelledBy?: string;
  cancelledByName?: string;
  cancelReason?: string;
  createdAt: any; // Firestore serverTimestamp / Timestamp
  createdBy: string; // Auth UID
  createdByName?: string;
  shiftId?: string; // Optional reference to active operational shift
  baghdadDate?: string; // YYYY-MM-DD for indexed grouping
  inventoryProcessed?: boolean; // Duplicate deduction protection
  inventoryProcessedAt?: any; // Firestore Timestamp
  updatedAt?: any;
}
