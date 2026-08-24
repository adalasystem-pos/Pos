export interface Ingredient {
  id: string;
  name: string;
  unit: string; // e.g. 'کیلۆگرام' (kg), 'گرام' (g), 'دانە' (piece), 'لیتر' (L), 'دەستە' (bundle), etc.
  currentStock: number;
  minimumStock: number;
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  createdBy?: string;
  updatedBy?: string;
}

export type StockMovementType =
  | 'stock_in'
  | 'stock_adjustment'
  | 'consumption';

export interface StockMovement {
  id?: string;
  ingredientId: string;
  ingredientName?: string;
  type: StockMovementType;
  quantity: number; // positive for addition, negative for deduction
  reason?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: any; // Firestore Timestamp
  orderId?: string;
}

export interface CreateIngredientInput {
  name: string;
  unit: string;
  initialStock?: number;
  minimumStock: number;
  isActive?: boolean;
}

export interface UpdateIngredientInput {
  name?: string;
  unit?: string;
  minimumStock?: number;
  isActive?: boolean;
}

export interface StockInInput {
  ingredientId: string;
  quantity: number;
  reason?: string;
}

export interface StockAdjustmentInput {
  ingredientId: string;
  newStock: number;
  reason: string;
}
