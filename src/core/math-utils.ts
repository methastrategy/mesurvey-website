/**
 * IEEE 754 Floating-Point & Geodetic Precision Utilities
 * Prevents precision loss and binary floating-point artifacts (e.g. 0.1 + 0.2 = 0.30000000000000004)
 */

/**
 * Safely rounds a number to a fixed number of decimal places without floating drift.
 */
export function roundTo(value: number, decimals: number = 4): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Safely sums an array of numbers using Kahan summation or scaled integer arithmetic
 * to eliminate cumulative floating point round-off error in traverse and leveling loops.
 */
export function safeSum(values: number[], decimals: number = 4): number {
  let sum = 0;
  let compensation = 0;
  for (const val of values) {
    if (isNaN(val) || !isFinite(val)) continue;
    const y = val - compensation;
    const t = sum + y;
    compensation = (t - sum) - y;
    sum = t;
  }
  return roundTo(sum, decimals);
}

/**
 * Formats a coordinate number to guaranteed decimal places with comma separation.
 */
export function formatFixed(value: number | null | undefined, decimals: number = 3): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
