import type { Cart } from "@/lib/types";
import { formatINR } from "@/lib/format";

// Always renders the server-computed totals (subtotal, discount, shipping, GST, total) as returned by
// the API — nothing is added or overridden on the client, so what is shown is what is charged.
export function PriceSummary({ cart }: { cart: Cart }) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex justify-between text-[var(--color-stone)]">
        <span>Subtotal</span>
        <span>{formatINR(cart.subtotal)}</span>
      </div>
      {cart.discount > 0 && (
        <div className="flex justify-between text-[var(--color-maroon)]">
          <span>Discount{cart.couponCode ? ` (${cart.couponCode})` : ""}</span>
          <span>−{formatINR(cart.discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-[var(--color-stone)]">
        <span>Shipping</span>
        <span>{cart.shipping === 0 ? "Free" : formatINR(cart.shipping)}</span>
      </div>
      <div className="flex justify-between text-[var(--color-stone)]">
        <span>Tax (GST)</span>
        <span>{formatINR(cart.tax)}</span>
      </div>
      <div className="flex justify-between border-t border-[var(--color-stone-light)] pt-3 font-display text-lg text-[var(--color-ink)]">
        <span>Total</span>
        <span>{formatINR(cart.total)}</span>
      </div>
    </div>
  );
}