import type { Cart } from "@/lib/types";

export function PriceSummary({ cart }: { cart: Cart }) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex justify-between text-[var(--color-stone)]">
        <span>Subtotal</span>
        <span>₹{cart.subtotal}</span>
      </div>
      {cart.discount > 0 && (
        <div className="flex justify-between text-[var(--color-maroon)]">
          <span>Discount{cart.couponCode ? ` (${cart.couponCode})` : ""}</span>
          <span>−₹{cart.discount}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-[var(--color-stone-light)] pt-3 font-display text-lg text-[var(--color-ink)]">
        <span>Total</span>
        <span>₹{cart.total}</span>
      </div>
    </div>
  );
}
