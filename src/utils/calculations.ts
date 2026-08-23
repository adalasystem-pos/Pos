import { Portion } from '../types/product';
import { CartItem } from '../types/order';

/**
 * Calculate price based on portion
 * Portion rules:
 * - 'نەفەر': 100% of base price
 * - 'نیو نەفەر': ~60% or custom portion override (rounded to integer IQD e.g. nearest 250 IQD)
 * - 'کیلۆ': typically 2.5x base price or explicit customPortions definition
 */
export function calculatePortionPrice(
  basePrice: number,
  portion: Portion,
  customPortions?: { [key in Portion]?: number }
): number {
  if (customPortions && customPortions[portion] !== undefined) {
    return Math.round(customPortions[portion]!);
  }

  switch (portion) {
    case 'نیو نەفەر':
      // 60% of full portion, rounded to nearest 250 IQD
      return Math.max(500, Math.round((basePrice * 0.6) / 250) * 250);
    case 'کیلۆ':
      // 2.5x full portion, rounded to nearest 500 IQD
      return Math.max(basePrice, Math.round((basePrice * 2.5) / 500) * 500);
    case 'نەفەر':
    default:
      return Math.round(basePrice);
  }
}

/**
 * Authoritative line total calculation
 * lineTotal = unitPrice * quantity
 */
export function calculateLineTotal(unitPrice: number, quantity: number): number {
  const safePrice = Math.max(0, Math.round(unitPrice));
  const safeQty = Math.max(1, Math.floor(quantity));
  return safePrice * safeQty;
}

/**
 * Authoritative order total calculation
 * orderTotal = sum(lineTotal)
 */
export function calculateOrderTotal(items: CartItem[]): { subtotal: number; totalAmount: number } {
  if (!items || items.length === 0) {
    return { subtotal: 0, totalAmount: 0 };
  }

  const subtotal = items.reduce((sum, item) => {
    const itemLineTotal = calculateLineTotal(item.unitPrice, item.quantity);
    return sum + itemLineTotal;
  }, 0);

  return {
    subtotal,
    totalAmount: subtotal,
  };
}

/**
 * Authoritative net profit calculation
 * netProfit = totalSales - totalExpenses
 */
export function calculateNetProfit(sales: number, expenses: number): number {
  const safeSales = Math.max(0, Math.round(sales));
  const safeExpenses = Math.max(0, Math.round(expenses));
  return safeSales - safeExpenses;
}
