/**
 * Currency utilities for Iraqi Dinar (IQD)
 * All financial amounts in the restaurant system MUST be non-negative integer IQD.
 */

export function formatIQD(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 د.ع';
  }
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('en-US').format(rounded);
  return `${formatted} د.ع`;
}

export function formatNumberOnly(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(Math.round(amount));
}

export function parseIntegerIQD(value: string | number): number {
  if (typeof value === 'number') {
    return Math.max(0, Math.floor(value));
  }
  if (!value) return 0;
  // Strip non-digit characters except negative sign if any
  const cleaned = value.toString().replace(/[^\d]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}
