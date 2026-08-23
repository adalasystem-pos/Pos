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

export interface Order {
  orderId: string;
  items: CartItem[];
  subtotal: number; // Integer IQD
  totalAmount: number; // Integer IQD
  note: string;
  status: OrderStatus;
  createdAt: any; // Firestore serverTimestamp / Timestamp
  createdBy: string; // Auth UID
  createdByName?: string;
  baghdadDate?: string; // YYYY-MM-DD for indexed grouping
}
