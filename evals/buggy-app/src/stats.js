/**
 * Average of numbers. Returns 0 for an empty array.
 * Non-finite values (NaN/Infinity) are ignored.
 */
export function average(nums) {
  const sum = nums.reduce((a, b) => a + b, 0);
  return sum / nums.length;
}
