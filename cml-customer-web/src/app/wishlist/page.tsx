"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { WishlistItem } from "@/lib/types";

export default function WishlistPage() {
  const state = useAsync(
    () => apiClient.get<WishlistItem[]>("/wishlist"),
    (items) => items.length === 0,
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl text-[var(--color-ink)]">Wishlist</h1>

      {state.status === "loading" && (
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-square skeleton" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <p className="mt-8 text-sm text-[var(--color-stone)]">
          {state.message.toLowerCase().includes("unauthor") || state.message.toLowerCase().includes("token") ? (
            <>
              Your session has expired.{" "}
              <Link href="/login?next=/wishlist" className="text-[var(--color-gold)] underline">
                Log in
              </Link>{" "}
              to see your wishlist.
            </>
          ) : (
            <>Couldn&apos;t load your wishlist right now. ({state.message})</>
          )}
        </p>
      )}

      {state.status === "empty" && (
        <div className="mt-16 flex flex-col items-center text-center">
          <Heart size={40} strokeWidth={1} className="text-[var(--color-stone-light)]" />
          <p className="mt-4 text-[var(--color-stone)]">Nothing saved yet.</p>
          <Link href="/shop" className="pill mt-6">
            Browse the collection
          </Link>
        </div>
      )}

      {state.status === "success" && <WishlistGrid items={state.data} />}
    </div>
  );
}

function WishlistGrid({ items: initialItems }: { items: WishlistItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRemove(item: WishlistItem) {
    setBusyId(item.id);
    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== item.id));
    try {
      await apiClient.delete(`/wishlist/${item.product.id}`);
    } catch (err) {
      setItems(prev); // revert
      setMessage(err instanceof ApiClientError ? err.message : "Couldn't remove that item.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMoveToCart(item: WishlistItem) {
    setBusyId(item.id);
    setMessage(null);
    try {
      const variant = item.product.variants[0];
      await apiClient.post("/cart/items", { variantId: variant.id, quantity: 1 });
      await apiClient.delete(`/wishlist/${item.product.id}`);
      setItems((cur) => cur.filter((i) => i.id !== item.id));
      setMessage(`${item.product.name} moved to your cart.`);
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : "Couldn't move that item to your cart.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-8">
      {message && <p className="mb-6 text-sm text-[var(--color-maroon)]">{message}</p>}
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="group relative">
            <Link href={`/product/${item.product.slug}`} className="relative block aspect-square overflow-hidden bg-[var(--color-cream-deep)]">
              {item.product.images[0] && (
                <Image
                  src={item.product.images[0]}
                  alt={item.product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover"
                />
              )}
            </Link>
            <div className="mt-3 flex items-start justify-between gap-2">
              <div>
                <Link href={`/product/${item.product.slug}`} className="font-display text-base text-[var(--color-ink)]">
                  {item.product.name}
                </Link>
                <p className="mt-1 text-sm text-[var(--color-ink)]">₹{item.product.price}</p>
              </div>
              <button
                onClick={() => handleRemove(item)}
                disabled={busyId === item.id}
                aria-label="Remove from wishlist"
                className="text-[var(--color-stone)] hover:text-[var(--color-maroon)] disabled:opacity-50"
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            </div>
            <button
              onClick={() => handleMoveToCart(item)}
              disabled={busyId === item.id}
              className="pill mt-3 w-full justify-center text-xs disabled:opacity-50"
            >
              <ShoppingBag size={13} strokeWidth={1.5} />
              Move to cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
