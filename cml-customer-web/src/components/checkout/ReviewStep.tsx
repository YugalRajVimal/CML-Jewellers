"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Address, Cart } from "@/lib/types";
import { PriceSummary } from "@/components/cart/PriceSummary";
import { SHIPPING_METHODS } from "./ShippingStep";

export function ReviewStep({
  addressId,
  shippingMethodId,
  onBack,
}: {
  addressId: string;
  shippingMethodId: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const cartState = useAsync(() => apiClient.get<Cart>("/cart"), (cart) => cart.items.length === 0);
  const addressState = useAsync(() => apiClient.get<Address[]>("/users/me/addresses"), (a) => a.length === 0);

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingMethod = SHIPPING_METHODS.find((m) => m.id === shippingMethodId)!;

  async function handlePlaceOrder() {
    setError(null);
    setPlacing(true);
    try {
      // Re-validate stock, price and coupon against the backend right before committing.
      await apiClient.post("/checkout/validate", { addressId, shippingMethodId });

      const order = await apiClient.post<{ id: string }>("/orders", { addressId, shippingMethodId });

      router.push(`/checkout/payment?orderId=${order.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 401) {
          router.push("/login?next=/checkout");
          return;
        }
        if (err.code === "OUT_OF_STOCK" || err.code === "INSUFFICIENT_STOCK") {
          setError("One or more items in your cart are no longer available in the quantity you ordered.");
        } else if (err.code === "COUPON_EXPIRED" || err.code === "COUPON_INVALID") {
          setError("Your coupon is no longer valid — remove it from your cart and try again.");
        } else if (err.code === "INVALID_ADDRESS") {
          setError("That delivery address looks invalid — please check it and try again.");
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
  const total = cart.total + shippingMethod.price;

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
                <span>₹{item.currentPrice * item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-between text-sm text-[var(--color-stone)]">
          <span>Shipping ({shippingMethod.label})</span>
          <span>{shippingMethod.price === 0 ? "Free" : `₹${shippingMethod.price}`}</span>
        </div>

        <PriceSummary cart={{ ...cart, total }} />

        {error && <p className="text-sm text-[var(--color-maroon)]">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onBack} className="text-sm text-[var(--color-stone)] underline">
            Back
          </button>
          <button onClick={handlePlaceOrder} disabled={placing} className="pill flex-1 justify-center disabled:opacity-50">
            {placing ? "Placing order…" : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
