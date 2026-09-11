// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { useState } from "react";
// import { Heart, Repeat, Eye, Star } from "lucide-react";
// import { apiClient } from "@/lib/api-client";
// import type { Product } from "@/lib/types";

// export function ProductCard({ product }: { product: Product }) {
//   const [wishlisted, setWishlisted] = useState(false);
//   const [addState, setAddState] = useState<"idle" | "adding" | "added" | "error">("idle");
//   const onSale = product.mrp !== undefined && product.mrp > product.price;
//   const discountPct = onSale ? Math.round((1 - product.price / product.mrp!) * 100) : 0;

//   async function handleAddToCart(e: React.MouseEvent) {
//     e.preventDefault();
//     const defaultVariant = product.variants[0];
//     if (!defaultVariant) return;
//     setAddState("adding");
//     try {
//       await apiClient.post("/cart/items", { variantId: defaultVariant.id, quantity: 1 });
//       setAddState("added");
//       setTimeout(() => setAddState("idle"), 1500);
//     } catch {
//       setAddState("error");
//       setTimeout(() => setAddState("idle"), 1500);
//     }
//   }

//   return (
//     <div className="group relative">
//       <div className="relative aspect-square overflow-hidden bg-[var(--color-cream-deep)]">
//         <Link href={`/product/${product.slug}`} className="block h-full w-full" aria-label={product.name}>
//           {product.images[0] ? (
//             <Image
//               src={product.images[0]}
//               alt={product.name}
//               fill
//               sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
//               className="object-cover transition-transform duration-300 lg:group-hover:scale-105"
//             />
//           ) : (
//             <div className="h-full w-full bg-[var(--color-stone-light)]" />
//           )}
//         </Link>

//         {onSale && (
//           <span className="absolute left-3 top-3 rounded-sm bg-[var(--color-maroon)] px-2 py-1 text-xs text-[var(--color-cream)]">
//             {discountPct}% Off
//           </span>
//         )}

//         {/* Action icons: always visible on touch devices, hover-reveal on desktop where
//             the pointer can discover them without extra taps. */}
//         <div className="absolute right-2 top-2 flex flex-col gap-2 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100">
//           <button
//             aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
//             aria-pressed={wishlisted}
//             onClick={(e) => {
//               e.preventDefault();
//               setWishlisted((w) => !w);
//             }}
//             className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-cream)]"
//           >
//             <Heart size={16} fill={wishlisted ? "currentColor" : "none"} strokeWidth={1.5} />
//           </button>
//           <Link
//             href={`/product/${product.slug}?compare=1`}
//             aria-label="Compare"
//             className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-cream)]"
//           >
//             <Repeat size={16} strokeWidth={1.5} />
//           </Link>
//           <Link
//             href={`/product/${product.slug}`}
//             aria-label="Quick view"
//             className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-cream)]"
//           >
//             <Eye size={16} strokeWidth={1.5} />
//           </Link>
//         </div>

//         <button
//           onClick={handleAddToCart}
//           disabled={addState === "adding"}
//           className="absolute inset-x-0 bottom-0 bg-[var(--color-ink)] py-3 text-sm text-[var(--color-cream)] transition-transform duration-200 disabled:opacity-70 lg:translate-y-full lg:group-hover:translate-y-0"
//         >
//           {addState === "adding" ? "Adding…" : addState === "added" ? "Added ✓" : addState === "error" ? "Couldn't add" : "Add To Cart"}
//         </button>
//       </div>

//       <div className="mt-3">
//         <Link href={`/product/${product.slug}`} className="font-display text-base text-[var(--color-ink)]">
//           {product.name}
//         </Link>
//         {product.rating !== undefined && (
//           <div className="mt-1 flex items-center gap-0.5">
//             {Array.from({ length: 5 }).map((_, i) => (
//               <Star
//                 key={i}
//                 size={12}
//                 fill={i < Math.round(product.rating!) ? "var(--color-gold)" : "none"}
//                 stroke="var(--color-gold)"
//                 strokeWidth={1.5}
//               />
//             ))}
//           </div>
//         )}
//         <div className="mt-1 flex items-center gap-2 text-sm">
//           {onSale && <span className="text-[var(--color-stone)] line-through">₹{product.mrp}</span>}
//           <span className="text-[var(--color-ink)]">₹{product.price}</span>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, Heart, Pin, ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useCommerce } from "@/lib/commerce-context";

// Backend stores prices as integer paise/cents — divide by 100 for display.
function formatPrice(value: number) {
  return `₹${(value / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Builds "Yellow Gold • 18K • Pearl" from the real attributes object,
// skipping anything the product doesn't have (e.g. stone: "None").
function attributeLine(attributes: Record<string, string> | undefined): string {
  if (!attributes) return "";
  const parts = [attributes.metal, attributes.purity, attributes.stone].filter(
    (v) => v && v.toLowerCase() !== "none"
  );
  return parts.join(" • ");
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const reduce = useReducedMotion();
  const p = product as any;
  const id = p._id ?? p.id;
  const image = product.images?.[0];
  const hasDiscount = p.discountPercent > 0;
  const inStock = p.inStock !== false;
  const lowStock = inStock && typeof p.totalAvailable === "number" && p.totalAvailable > 0 && p.totalAvailable <= 5;
  const details = attributeLine(p.attributes);

  // Initialize wishlisted state based on p.isWishlisted for each product
  const [wishlisted, setWishlisted] = useState(!!p.isWishlisted);

  const [cartState, setCartState] = useState<"idle"|"adding"|"added"|"error">("idle");
  const {refresh} = useCommerce();

  // Sync wishlisted state when product changes (e.g. new product card, or wishlist status updated upstream)
  useEffect(() => {
    setWishlisted(!!p.isWishlisted);
  }, [p.isWishlisted, p._id, p.id]); // p._id or p.id change = possibly a new product

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    const next = !wishlisted;
    setWishlisted(next);
    try {
      if (next) await apiClient.post("/wishlist", { productId: id });
      else await apiClient.delete(`/wishlist/${id}`);
      refresh();
    } catch {
      setWishlisted(!next);
    }
  }

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    const defaultVariantId = p.defaultVariantId;
    if (!defaultVariantId) return;
    setCartState("adding");
    try {
      await apiClient.post("/cart/items", { variantId: defaultVariantId, quantity: 1 });
      setCartState("added");
      refresh(); // ← moved here, only on success
    } catch {
      setCartState("error");
    } finally {
      setTimeout(() => setCartState("idle"), 1500);
    }
  }

  // Log the product prop whenever it changes
  useEffect(() => {
    console.log("Product prop:", product);
  }, [product]);

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 32, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: [0.32, 0.72, 0, 1] }}
      className="group relative rounded-xl border border-[var(--color-cream-light,#f7ece1)] bg-gradient-to-br from-[#fff8f0] to-[var(--color-cream,#fcf5eb)] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-400"
      style={{ overflow: "visible" }}
    >
      <Link
        href={`/product/${p.slug ?? id}`}
        className="block rounded-xl overflow-hidden"
        style={{ boxShadow: "0 8px 40px 0 rgba(195,168,129,0.12)" }}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--color-cream-deep,#f3e7d6)] border border-[var(--color-cream-light,#f7ece1)] transition-all duration-300 group-hover:border-[var(--color-gold,#b98a4e)]">
          {p.isFeatured && (
            <span className="absolute left-3 top-3 z-20 flex h-8 w-8 -rotate-12 items-center justify-center rounded-full bg-gradient-to-b from-[var(--color-gold-light,#efd6ae)] to-[var(--color-gold,#b98a4e)] shadow-gold-glow text-white">
              <Pin size={15} strokeWidth={2} className="rotate-12" />
            </span>
          )}

          {!p.isFeatured && p.isNewArrival && (
            <span className="absolute left-3 top-3 z-20 rounded-full bg-[var(--color-ink,#1c1c1c)] px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
              New
            </span>
          )}

          {hasDiscount && (
            <span className="absolute right-3 top-3 z-20 rounded-xl bg-gradient-to-r from-[var(--color-ink,#1c1c1c)] via-[var(--color-gold,#b98a4e)] to-[var(--color-gold-light,#efd6ae)] px-3 py-1 text-xs font-semibold text-white shadow-lg tracking-wide">
              Sale &nbsp; • &nbsp; {p.discountPercent}% Off
            </span>
          )}

          {!inStock && (
            <span className="absolute inset-x-0 bottom-0 z-20 bg-[var(--color-ink,#1c1c1c)]/85 py-1.5 text-center text-xs tracking-wide text-white">
              Out of stock
            </span>
          )}

          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-500 will-change-transform rounded-xl"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-stone-400 rounded-xl">
              <span className="text-2xl">No Image</span>
            </div>
          )}

          {/* Quick-actions */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-3 pb-5 opacity-0 transition-all duration-500 ease-out group-hover:pointer-events-auto group-hover:opacity-100 translate-y-3 group-hover:translate-y-0">
            <button
              type="button"
              aria-label="Quick view"
              style={{ transitionDelay: "0ms" }}
              className="flex h-10 w-10 items-center justify-center rounded-full shadow-xl backdrop-blur-lg bg-white/70 border border-[var(--color-gold-light,#efd6ae)] ring-1 ring-[var(--color-gold-light,#efd6ae)] text-[var(--color-gold,#b98a4e)] hover:bg-[var(--color-gold,#b98a4e)] hover:text-white hover:scale-110 transition-all duration-300"
              // no preventDefault — clicking bubbles to the parent <Link>, which is the correct "quick view" behavior
            >
              <Eye size={17} strokeWidth={1.5} />
            </button>

            <button
              type="button"
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wishlisted}
              onClick={handleWishlist}
              style={{ transitionDelay: "70ms" }}
              className={`flex h-10 w-10 items-center justify-center rounded-full shadow-xl backdrop-blur-lg border border-[var(--color-gold-light,#efd6ae)] ring-1 ring-[var(--color-gold-light,#efd6ae)] hover:scale-110 transition-all duration-300 ${
                wishlisted
                  ? "bg-[var(--color-gold,#b98a4e)] text-white"
                  : "bg-white/70 text-[var(--color-gold,#b98a4e)] hover:bg-[var(--color-gold,#b98a4e)] hover:text-white"
              }`}
            >
              <Heart size={17} strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} />
            </button>

            <button
              type="button"
              aria-label={cartState === "added" ? "Added to cart" : "Add to cart"}
              onClick={handleAddToCart}
              disabled={!inStock || cartState === "adding"}
              style={{ transitionDelay: "140ms" }}
              className={`flex h-10 w-10 items-center justify-center rounded-full shadow-xl backdrop-blur-lg border border-[var(--color-gold-light,#efd6ae)] ring-1 ring-[var(--color-gold-light,#efd6ae)] hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 ${
                cartState === "added"
                  ? "bg-[var(--color-gold,#b98a4e)] text-white"
                  : "bg-white/70 text-[var(--color-gold,#b98a4e)] hover:bg-[var(--color-gold,#b98a4e)] hover:text-white"
              }`}
            >
              <ShoppingBag size={17} strokeWidth={1.5} />
            </button>
          </div>

          {/* Floating gold sparkle on hover */}
          <div className="pointer-events-none absolute right-6 bottom-7 z-30 hidden group-hover:block animate-fade-in">
            <svg width="36" height="36" fill="none" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="12" fill="url(#gold-glow)" fillOpacity="0.12" />
              <circle cx="32" cy="32" r="4" fill="url(#gold-med)" />
              <defs>
                <radialGradient id="gold-glow" cx="0" cy="0" r="1" gradientTransform="rotate(45) scale(20)">
                  <stop stopColor="#efd6ae" />
                  <stop offset="1" stopColor="#b98a4e" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="gold-med" cx="0" cy="0" r="1" gradientTransform="rotate(0) scale(8)">
                  <stop stopColor="#b98a4e" />
                  <stop offset="1" stopColor="#efd6ae" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="pt-5 px-6 pb-4">
          {details && (
            <p className="mb-1 text-xs uppercase tracking-wide text-[var(--color-stone,#9a8f7c)]">{details}</p>
          )}

          <div className="flex items-start justify-between gap-3">
            <p
              className="font-marcellus text-xl font-semibold text-[var(--color-ink,#22160f)] truncate tracking-wide"
              title={product.name}
            >
              {product.name}
            </p>
            {typeof product.ratingCount === "number" && product.ratingCount > 0 && (
              <div className="mt-1 flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      strokeWidth={1.5}
                      className={
                        i < Math.round(product.ratingAvg ?? 0)
                          ? "fill-[var(--color-gold)] text-[var(--color-gold)]"
                          : "text-[var(--color-stone-light)]"
                      }
                    />
                  ))}
                </div>
                <span className="text-xs text-[var(--color-stone)]">
                  {product.ratingAvg?.toFixed(1)} ({product.ratingCount} review{product.ratingCount === 1 ? "" : "s"})
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 flex items-end justify-between gap-2">
            <div className="flex items-end gap-2">
              {hasDiscount && (
                <span className="text-base text-[var(--color-stone,#ac9777)] line-through decoration-wavy decoration-[var(--color-gold,#d3b779)]">
                  {formatPrice(p.mrp)}
                </span>
              )}
              <span className="text-lg font-bold text-[var(--color-gold,#b98a4e)] drop-shadow-gold">
                {formatPrice(p.basePrice)}
              </span>
            </div>

            {lowStock && (
              <span className="text-[11px] font-medium text-[var(--color-maroon,#8a2e1f)]">
                Only {p.totalAvailable} left
              </span>
            )}
          </div>

          {p.variantCount > 1 && (
            <p className="mt-1 text-[11px] text-[var(--color-stone,#9a8f7c)]">
              {p.variantCount} variants available
            </p>
          )}
        </div>
      </Link>
      {/* Premium border highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[var(--color-gold,#b98a4e)] group-hover:shadow-gold-glow transition-all duration-300 z-10" />
    </motion.div>
  );
}