"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Cart } from "@/lib/types";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CouponForm } from "@/components/cart/CouponForm";
import { PriceSummary } from "@/components/cart/PriceSummary";

export default function CartPage() {
  const [refetchKey, setRefetchKey] = useState(0);
  const state = useAsync(() => apiClient.get<Cart>("/cart"), (cart) => cart.items.length === 0, [refetchKey]);
  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl text-[var(--color-ink)]">Your Cart</h1>

      {state.status === "loading" && (
        <div className="mt-8 flex flex-col gap-4" aria-busy="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 skeleton" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <p className="mt-8 text-sm text-[var(--color-stone)]">
          {state.message.toLowerCase().includes("unauthor") || state.message.toLowerCase().includes("token") ? (
            <>
              Your session has expired.{" "}
              <Link href="/login?next=/cart" className="text-[var(--color-gold)] underline">
                Log in
              </Link>{" "}
              to see your cart.
            </>
          ) : (
            <>Couldn&apos;t load your cart right now. ({state.message})</>
          )}
        </p>
      )}

      {state.status === "empty" && (
        <div className="mt-16 flex flex-col items-center text-center">
          <ShoppingBag size={40} strokeWidth={1} className="text-[var(--color-stone-light)]" />
          <p className="mt-4 text-[var(--color-stone)]">Your cart is empty.</p>
          <Link href="/shop" className="pill mt-6">
            Continue shopping
          </Link>
        </div>
      )}

      {state.status === "success" && <CartLoaded cart={state.data} onRefetch={refetch} />}
    </div>
  );
}

function CartLoaded({ cart, onRefetch }: { cart: Cart; onRefetch: () => void }) {
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasBlockingIssue = cart.items.some((item) => item.stock <= 0 || item.quantity > item.stock);

  async function handleQuantityChange(itemId: string, quantity: number) {
    setBusyItemId(itemId);
    setError(null);
    try {
      await apiClient.patch(`/cart/items/${itemId}`, { quantity });
      onRefetch();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't update quantity.");
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleRemove(itemId: string) {
    setBusyItemId(itemId);
    setError(null);
    try {
      await apiClient.delete(`/cart/items/${itemId}`);
      onRefetch();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't remove that item.");
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        {error && <p className="mb-4 text-sm text-[var(--color-maroon)]">{error}</p>}
        {cart.items.map((item) => (
          <CartLineItem
            key={item.id}
            item={item}
            busy={busyItemId === item.id}
            onQuantityChange={(q) => handleQuantityChange(item.id, q)}
            onRemove={() => handleRemove(item.id)}
          />
        ))}
        <Link href="/shop" className="mt-6 inline-block text-sm text-[var(--color-stone)] underline">
          Continue shopping
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <CouponForm appliedCode={cart.couponCode} onApplied={onRefetch} onRemoved={onRefetch} />
        <PriceSummary cart={cart} />

        {hasBlockingIssue && (
          <p className="text-xs text-[var(--color-maroon)]">
            Resolve the stock issues above before checking out.
          </p>
        )}

        <Link
          href="/checkout"
          aria-disabled={hasBlockingIssue}
          className={`pill justify-center ${hasBlockingIssue ? "pointer-events-none opacity-50" : ""}`}
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
