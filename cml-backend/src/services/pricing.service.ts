/**
 * Shipping/tax computation stubs, per EPIC 3 scope ("shipping/tax computation
 * stubs"). Replace with real courier-rate and GST-slab logic when available —
 * call sites (checkout.service, cart totals) don't need to change.
 */
export function computeShipping(subtotal: number): number {
  const FREE_SHIPPING_THRESHOLD = 5000;
  const FLAT_SHIPPING_FEE = 99;
  return subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING_FEE;
}

export function computeTax(subtotal: number): number {
  const GST_RATE = 0.03; // placeholder rate for jewelry (typically 3% GST in India)
  return Math.round(subtotal * GST_RATE * 100) / 100;
}
