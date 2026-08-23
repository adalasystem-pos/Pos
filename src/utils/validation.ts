import { CartItem } from '../types/order';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateCartItem(item: CartItem): ValidationResult {
  if (!item) {
    return { valid: false, error: 'بڕگەی داواکاری نادروستە' };
  }
  if (!item.productId || typeof item.productId !== 'string') {
    return { valid: false, error: 'ناسنامەی کاڵا بوونی نییە' };
  }
  if (!item.productName || item.productName.trim() === '') {
    return { valid: false, error: 'ناوی کاڵا پێویستە' };
  }
  if (typeof item.unitPrice !== 'number' || item.unitPrice <= 0 || !Number.isInteger(item.unitPrice)) {
    return { valid: false, error: 'نرخی کاڵا دەبێت ژمارەیەکی دروستی ئەرێنی بێت' };
  }
  if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
    return { valid: false, error: 'ژمارەی داواکاری دەبێت بەلایەنی کەم ١ بێت' };
  }
  if (item.lineTotal !== item.unitPrice * item.quantity) {
    return { valid: false, error: 'کۆی هێڵەکە نادروستە' };
  }
  return { valid: true };
}

export function validateCart(items: CartItem[]): ValidationResult {
  if (!items || items.length === 0) {
    return { valid: false, error: 'سەبەتەی داواکاری بەتاڵە' };
  }
  for (const item of items) {
    const itemValidation = validateCartItem(item);
    if (!itemValidation.valid) {
      return itemValidation;
    }
  }
  return { valid: true };
}

export function validateExpense(amount: number, category: string): ValidationResult {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0 || !Number.isFinite(amount)) {
    return { valid: false, error: 'تکایە بڕی پارەی خەرجی بە دروستی بنووسە (دەبێت لە سفر زیاتر بێت)' };
  }
  if (!category || category.trim() === '') {
    return { valid: false, error: 'تکایە جۆری خەرجی دیاری بکە' };
  }
  return { valid: true };
}
