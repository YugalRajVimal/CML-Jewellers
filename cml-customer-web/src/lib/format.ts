/**
 * Formats a rupee amount for display. Prices, totals and taxes are stored and returned by the API in
 * rupees (NOT paise), so this never divides by 100. Rounds to 2 decimals to hide float noise
 * (1234.5600000002 → ₹1,234.56) and drops the decimals for whole amounts (₹18,000).
 */
export function formatINR(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    return `₹${rounded.toLocaleString("en-IN", {
      minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }