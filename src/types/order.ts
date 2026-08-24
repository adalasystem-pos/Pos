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

export type OrderStatus = 'preparing' | 'completed' | 'cancelled';
export type OrderSource = 'captain' | 'pos';

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
  createdAt: any; // Firestore serverTimestamp / Timestamp
  createdBy: string; // Auth UID
  createdByName?: string;
  baghdadDate?: string; // YYYY-MM-DD for indexed grouping
  updatedAt?: any;
}
