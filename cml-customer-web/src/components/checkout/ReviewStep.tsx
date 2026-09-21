"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Address, Cart } from "@/lib/types";
import { PriceSummary } from "@/components/cart/PriceSummary";
import { formatINR } from "@/lib/format";

export function ReviewStep({ addressId, onBack }: { addressId: string; onBack: () => void }) {
  const router = useRouter();
  const cartState = useAsync(() => apiClient.get<Cart>("/cart"), (cart) => cart.items.length === 0);
  const addressState = useAsync(() => apiClient.get<Address[]>("/users/me/addresses"), (a) => a.length === 0);

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codEnabled, setCodEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Prepaid" | "COD">("Prepaid");

  const validateState = useAsync(
    () => apiClient.post<{ codEnabled?: boolean }>("/checkout/validate", { addressId }),
    () => false
  );

  useEffect(() => {
    if (validateState.status === "success") {
      setCodEnabled(Boolean(validateState.data.codEnabled));
    }
  }, [validateState]);

  async function handlePlaceOrder() {
    setError(null);
    setPlacing(true);
    try {
      // Re-validate stock, price and coupon against the backend right before committing.
      // Also tells us whether Cash on Delivery is currently offered, since that
      // can change at any time via the admin toggle.
      const validation = await apiClient.post<{ codEnabled?: boolean }>("/checkout/validate", {
        addressId,
      });
      setCodEnabled(Boolean(validation.codEnabled));
      const effectiveMethod = validation.codEnabled ? paymentMethod : "Prepaid";

      const order = await apiClient.post<{ id: string; paymentMethod: "Prepaid" | "COD" }>("/orders", {
        addressId,
        paymentMethod: effectiveMethod,
      });

      if (order.paymentMethod === "COD") {
        // COD orders are confirmed immediately server-side — there's no
        // payment gateway step to go through.
        router.push(`/orders/${order.id}`);
      } else {
        router.push(`/checkout/payment?orderId=${order.id}`);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          router.push("/login?next=/checkout");
          return;
        }
        if (err.code === "CART_HAS_BLOCKING_ISSUES") {
          setError("Some items in your cart are out of stock or no longer available. Please review your cart.");
        } else if (err.code === "OUT_OF_STOCK" || err.code === "INSUFFICIENT_STOCK") {
          setError("One or more items in your cart are no longer available in the quantity you ordered.");
        } else if (err.code === "COUPON_EXPIRED" || err.code === "COUPON_INVALID") {
          setError("Your coupon is no longer valid — remove it from your cart and try again.");
        } else if (err.code === "INVALID_ADDRESS") {
          setError("That delivery address looks invalid — please check it and try again.");
        } else if (err.code === "COD_NOT_ENABLED") {
          setCodEnabled(false);
          setPaymentMethod("Prepaid");
          setError("Cash on Delivery just became unavailable — please pay now to continue.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong placing your order. Please try again.");
      }
    } finally {
      setPlacing(false);
    }
  }

  if (cartState.status === "loading" || addressState.status === "loading") {
    return <div className="h-40 skeleton" aria-busy="true" />;
  }

  if (cartState.status !== "success" || addressState.status !== "success") {
    return <p className="text-sm text-[var(--color-stone)]">Couldn&apos;t load your order details. Please go back and try again.</p>;
  }

  const cart = cartState.data;
  const address = addressState.data.find((a) => a.id === addressId);
  // Same rule as the cart page: an out-of-stock / over-quantity line blocks checkout.
  const hasBlockingIssue = cart.items.some((item) => item.stock <= 0 || item.quantity > item.stock);

  return (
    <div>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-[var(--color-stone)]">Delivering to</p>
          {address && (
            <p className="mt-1 text-sm text-[var(--color-ink)]">
              {address.line1}, {address.city}, {address.state} {address.postalCode}
            </p>
          )}
        </div>

        <div>
          <p className="text-sm text-[var(--color-stone)]">Items ({cart.items.length})</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-[var(--color-ink)]">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>{formatINR(item.currentPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Server-computed totals only (subtotal, discount, shipping, GST, total) — exactly what is charged. */}
        <PriceSummary cart={cart} />

        {codEnabled && (
          <div>
            <p className="text-sm text-[var(--color-stone)]">Payment method</p>
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "Prepaid"}
                  onChange={() => setPaymentMethod("Prepaid")}
                />
                Pay now (Card / UPI / Netbanking)
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                Cash on Delivery
              </label>
            </div>
          </div>
        )}

        {hasBlockingIssue && (
          <p className="text-sm text-[var(--color-maroon)]">
            Some items in your cart are out of stock or over the available quantity.{" "}
            <Link href="/cart" className="underline">
              Review your cart
            </Link>{" "}
            to continue.
          </p>
        )}

        {error && <p className="text-sm text-[var(--color-maroon)]">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onBack} className="text-sm text-[var(--color-stone)] underline">
            Back
          </button>
          <button onClick={handlePlaceOrder} disabled={placing || hasBlockingIssue} className="pill flex-1 justify-center disabled:opacity-50">
            {placing ? (paymentMethod === "COD" ? "Placing order…" : "Placing order…") : paymentMethod === "COD" ? "Place Order (COD)" : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}