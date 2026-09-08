"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import type { CartItem } from "@/lib/types";

export function CartLineItem({
  item,
  onQuantityChange,
  onRemove,
  busy,
}: {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const outOfStock = item.stock <= 0;
  const insufficientStock = !outOfStock && item.quantity > item.stock;
  const priceChanged = item.currentPrice !== item.price;

  return (
    <div className="flex gap-4 border-b border-[var(--color-stone-light)] py-6">
      <Link
        href={`/product/${item.productSlug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden bg-[var(--color-cream-deep)]"
      >
        {item.image && <Image src={item.image} alt={item.productName} fill sizes="96px" className="object-cover" />}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/product/${item.productSlug}`} className="font-display text-base text-[var(--color-ink)]">
              {item.productName}
            </Link>
            <p className="mt-1 text-xs text-[var(--color-stone)]">
              {Object.entries(item.variantAttributes)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </p>
          </div>
          <button
            onClick={onRemove}
            disabled={busy}
            aria-label="Remove item"
            className="text-[var(--color-stone)] hover:text-[var(--color-maroon)] disabled:opacity-50"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {outOfStock && (
          <p className="mt-1 text-xs text-[var(--color-maroon)]">
            This item just went out of stock — remove it to continue checkout.
          </p>
        )}
        {insufficientStock && (
          <p className="mt-1 text-xs text-[var(--color-maroon)]">
            Only {item.stock} left — lower the quantity to continue checkout.
          </p>
        )}
        {priceChanged && (
          <p className="mt-1 text-xs text-[var(--color-maroon)]">
            Price updated to ₹{item.currentPrice} since you added this (was ₹{item.price}).
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center border border-[var(--color-stone-light)]">
            <button
              onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
              disabled={busy || outOfStock}
              className="px-2 py-1 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={12} strokeWidth={1.5} />
            </button>
            <span className="w-7 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => onQuantityChange(item.quantity + 1)}
              disabled={busy || outOfStock || item.quantity >= item.stock}
              className="px-2 py-1 disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={12} strokeWidth={1.5} />
            </button>
          </div>
          <span className="text-sm text-[var(--color-ink)]">₹{item.currentPrice * item.quantity}</span>
        </div>
      </div>
    </div>
  );
}
