"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Heart, Repeat, Eye, Star } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [addState, setAddState] = useState<"idle" | "adding" | "added" | "error">("idle");
  const onSale = product.mrp !== undefined && product.mrp > product.price;
  const discountPct = onSale ? Math.round((1 - product.price / product.mrp!) * 100) : 0;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    const defaultVariant = product.variants[0];
    if (!defaultVariant) return;
    setAddState("adding");
    try {
      await apiClient.post("/cart/items", { variantId: defaultVariant.id, quantity: 1 });
      setAddState("added");
      setTimeout(() => setAddState("idle"), 1500);
    } catch {
      setAddState("error");
      setTimeout(() => setAddState("idle"), 1500);
    }
  }

  return (
    <div className="group relative">
      <div className="relative aspect-square overflow-hidden bg-[var(--color-cream-deep)]">
        <Link href={`/product/${product.slug}`} className="block h-full w-full" aria-label={product.name}>
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 lg:group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-[var(--color-stone-light)]" />
          )}
        </Link>

        {onSale && (
          <span className="absolute left-3 top-3 rounded-sm bg-[var(--color-maroon)] px-2 py-1 text-xs text-[var(--color-cream)]">
            {discountPct}% Off
          </span>
        )}

        {/* Action icons: always visible on touch devices, hover-reveal on desktop where
            the pointer can discover them without extra taps. */}
        <div className="absolute right-2 top-2 flex flex-col gap-2 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
          <button
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            onClick={(e) => {
              e.preventDefault();
              setWishlisted((w) => !w);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-cream)]"
          >
            <Heart size={16} fill={wishlisted ? "currentColor" : "none"} strokeWidth={1.5} />
          </button>
          <Link
            href={`/product/${product.slug}?compare=1`}
            aria-label="Compare"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-cream)]"
          >
            <Repeat size={16} strokeWidth={1.5} />
          </Link>
          <Link
            href={`/product/${product.slug}`}
            aria-label="Quick view"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-cream)]"
          >
            <Eye size={16} strokeWidth={1.5} />
          </Link>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={addState === "adding"}
          className="absolute inset-x-0 bottom-0 bg-[var(--color-ink)] py-3 text-sm text-[var(--color-cream)] transition-transform duration-200 disabled:opacity-70 lg:translate-y-full lg:group-hover:translate-y-0"
        >
          {addState === "adding" ? "Adding…" : addState === "added" ? "Added ✓" : addState === "error" ? "Couldn't add" : "Add To Cart"}
        </button>
      </div>

      <div className="mt-3">
        <Link href={`/product/${product.slug}`} className="font-display text-base text-[var(--color-ink)]">
          {product.name}
        </Link>
        {product.rating !== undefined && (
          <div className="mt-1 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                fill={i < Math.round(product.rating!) ? "var(--color-gold)" : "none"}
                stroke="var(--color-gold)"
                strokeWidth={1.5}
              />
            ))}
          </div>
        )}
        <div className="mt-1 flex items-center gap-2 text-sm">
          {onSale && <span className="text-[var(--color-stone)] line-through">₹{product.mrp}</span>}
          <span className="text-[var(--color-ink)]">₹{product.price}</span>
        </div>
      </div>
    </div>
  );
}
