/**
 * Apply a percentage discount to a cart total.
 * - percent must be within 0..100 inclusive (100 = free); otherwise throw RangeError.
 * - result is rounded to 2 decimals (cents).
 */
export function applyDiscount(total, percent) {
  if (percent < 0 || percent >= 100) throw new RangeError('percent out of range');
  return Math.round(total * (1 - percent / 100));
}
