"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, Heart, Pin, ShoppingBag, Star } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Product } from "@/lib/types";
import { ShopNowButton } from "@/components/Shopnowbutton";
import { useCommerce } from "@/lib/commerce-context";
import { useRequireLogin } from "@/lib/require-login";
import { formatINR } from "@/lib/format";

type Tab = {
  label: string;
  category: string;
  bannerImage: string;
  discount: string;
  blurb: string;
};

const TABS: Tab[] = [
  {
    label: "Traditional Jewels",
    category: "traditional",
    bannerImage: "/Images/I5.jpg",
    discount: "25% Off",
    blurb:
      "Justo Ante Convallis Leo Nullam Nunc Justo Amet Laoreet. Nulla Mi Nunc Eget Curabitur Massa Sem Ut. Himenaeos Turpis Luctus Sollicitudin Aliquam Risus Amet Facilisis Ultrices Pulvinar Proin.",
  },
  {
    label: "Bridal Jewels",
    category: "bridal",
    bannerImage: "/Images/I2.jpg",
    discount: "30% Off",
    blurb:
      "Nascetur Class Vivamus Ut Eleifend Primis Lobortis Dapibus Ridiculus Congue. Congue Duis Suspendisse Dui Per Faucibus Nascetur Class Vivamus.",
  },
  {
    label: "Antique Jewels",
    category: "antique",
    bannerImage: "/Images/I4.jpg",
    discount: "20% Off",
    blurb:
      "Vestibulum Vehicula Nunc Ad Fringilla Pretium Ex Ac Praesent Vitae. Conubia Egestas Porta Per Maximus Sem Congue Vulputate Tristique Interdum.",
  },
];

function getProductsFromData(data: any): Product[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.products)) return data.products;
  return [];
}

function RatingStars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          strokeWidth={1.5}
          className={
            i < rounded
              ? "fill-[var(--color-gold,#b98a4e)] text-[var(--color-gold,#b98a4e)]"
              : "text-[var(--color-stone-light,#d8c9ab)]"
          }
        />
      ))}
    </div>
  );
}

const quickActions = [
  { Icon: Eye, label: "Quick view" },
  { Icon: Heart, label: "Add to wishlist" },
  { Icon: ShoppingBag, label: "Add to cart" },
];

function ProductGridCard({ product, index }: { product: Product; index: number }) {
  const reduce = useReducedMotion();
  const p = product as any;
  const id = p._id ?? p.id;
  const image = product.images?.[0];
  const hasDiscount = p.discountPercent > 0;
  const inStock = p.inStock !== false;

  // Initialize wishlisted state from product.isWishlisted
  const [wishlisted, setWishlisted] = useState(!!p.isWishlisted);
  const [cartState, setCartState] = useState<"idle" | "adding" | "added" | "error">("idle");
  const { refresh } = useCommerce();
  const ensureLoggedIn = useRequireLogin();

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!(await ensureLoggedIn())) return; // guests are sent to /login?next=…
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
    const defaultVariantId = p.defaultVariantId;
    if (!defaultVariantId) return; // no variant known → let the click fall through to the product link
    e.preventDefault();
    if (!(await ensureLoggedIn())) return; // guests are sent to /login?next=…
    setCartState("adding");
    try {
      await apiClient.post("/cart/items", { variantId: defaultVariantId, quantity: 1 });
      setCartState("added");
      refresh();
    } catch {
      setCartState("error");
    } finally {
      setTimeout(() => setCartState("idle"), 1500);
    }
  }

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 32, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: [0.32, 0.72, 0, 1] }}
      className="group relative rounded-xl border border-[var(--color-cream-light,#f7ece1)] bg-gradient-to-br from-[#fff8f0] to-[var(--color-cream,#fcf5eb)] shadow-lg transition-all duration-400 hover:-translate-y-1 hover:shadow-xl"
      style={{ overflow: "visible" }}
    >
      <Link
        href={`/product/${(product as any).slug ?? id}`}
        className="block overflow-hidden rounded-xl"
        style={{ boxShadow: "0 8px 40px 0 rgba(195,168,129,0.12)" }}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl border border-[var(--color-cream-light,#f7ece1)] bg-[var(--color-cream-deep,#f3e7d6)] transition-all duration-300 group-hover:border-[var(--color-gold,#b98a4e)]">
          {(product as any).isFeatured && (
            <span className="absolute left-2 top-2 z-20 flex h-6 w-6 -rotate-12 items-center justify-center rounded-full bg-gradient-to-b from-[var(--color-gold-light,#efd6ae)] to-[var(--color-gold,#b98a4e)] text-white shadow sm:left-3 sm:top-3 sm:h-8 sm:w-8">
              <Pin size={12} strokeWidth={2} className="rotate-12 sm:hidden" />
              <Pin size={15} strokeWidth={2} className="hidden rotate-12 sm:block" />
            </span>
          )}

          {hasDiscount && (
            <span className="absolute right-2 top-2 z-20 rounded-lg bg-gradient-to-r from-[var(--color-ink,#1c1c1c)] via-[var(--color-gold,#b98a4e)] to-[var(--color-gold-light,#efd6ae)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow sm:right-3 sm:top-3 sm:rounded-xl sm:px-3 sm:py-1 sm:text-xs">
              Sale &nbsp;•&nbsp; {(product as any).discountPercent}% Off
            </span>
          )}

          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full scale-105 rounded-xl object-cover object-center transition-transform duration-500 will-change-transform group-hover:scale-110"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl text-stone-400">
              <span className="text-lg sm:text-2xl">No Image</span>
            </div>
          )}

          {/* Quick-actions */}
        {/* Quick-actions: Show more visually elegant, with glassmorphism, and premium icons */}
<div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-3 justify-center gap-2 pb-3 opacity-0 transition-all duration-500 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 sm:gap-3 sm:pb-5">
  <button
    type="button"
    aria-label="Quick view"
    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-gold-light,#efd6ae)] bg-white/70 text-[var(--color-gold,#b98a4e)] shadow-xl ring-1 ring-[var(--color-gold-light,#efd6ae)] backdrop-blur-lg transition-all duration-300 hover:scale-110 hover:bg-[var(--color-gold,#b98a4e)] hover:text-white sm:h-10 sm:w-10"
  >
    <Eye size={14} strokeWidth={1.5} className="sm:hidden" />
    <Eye size={17} strokeWidth={1.5} className="hidden sm:block" />
  </button>

  <button
    type="button"
    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    aria-pressed={wishlisted}
    onClick={handleWishlist}
    className={`flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-gold-light,#efd6ae)] shadow-xl ring-1 ring-[var(--color-gold-light,#efd6ae)] backdrop-blur-lg transition-all duration-300 hover:scale-110 sm:h-10 sm:w-10 ${
      wishlisted
        ? "bg-[var(--color-gold,#b98a4e)] text-white"
        : "bg-white/70 text-[var(--color-gold,#b98a4e)] hover:bg-[var(--color-gold,#b98a4e)] hover:text-white"
    }`}
  >
    <Heart size={14} strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} className="sm:hidden" />
    <Heart size={17} strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} className="hidden sm:block" />
  </button>

  <button
    type="button"
    aria-label={cartState === "added" ? "Added to cart" : cartState === "error" ? "Couldn't add to cart" : "Add to cart"}
    title={cartState === "error" ? "Couldn't add to cart — please try again" : undefined}
    onClick={handleAddToCart}
    disabled={!inStock || cartState === "adding"}
    className={`flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-gold-light,#efd6ae)] shadow-xl ring-1 ring-[var(--color-gold-light,#efd6ae)] backdrop-blur-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 sm:h-10 sm:w-10 ${
      cartState === "added"
        ? "bg-[var(--color-gold,#b98a4e)] text-white"
        : "bg-white/70 text-[var(--color-gold,#b98a4e)] hover:bg-[var(--color-gold,#b98a4e)] hover:text-white"
    }`}
  >
    <ShoppingBag size={14} strokeWidth={1.5} className="sm:hidden" />
    <ShoppingBag size={17} strokeWidth={1.5} className="hidden sm:block" />
  </button>
</div>

          {/* Floating gold sparkle on hover */}
          <div className="pointer-events-none absolute bottom-5 right-4 z-30 hidden group-hover:block sm:bottom-7 sm:right-6">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none" className="sm:h-9 sm:w-9">
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

        <div className="px-3 pb-3 pt-3 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <p
              className="font-marcellus truncate text-sm font-semibold tracking-wide text-[var(--color-ink,#22160f)] sm:text-xl"
              title={product.name}
            >
              {product.name}
            </p>
            <div className="mt-0.5 shrink-0">
              <RatingStars value={(product as any).ratingAvg ?? 0} />
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-end gap-1.5 sm:mt-2 sm:gap-2">
            {hasDiscount && (
              <span className="text-xs text-[var(--color-stone,#ac9777)] line-through decoration-wavy decoration-[var(--color-gold,#d3b779)] sm:text-base">
                {formatINR((product as any).mrp)}
              </span>
            )}
            <span className="text-sm font-bold text-[var(--color-gold,#b98a4e)] sm:text-lg">
              {formatINR((product as any).basePrice)}
            </span>
          </div>
        </div>
      </Link>

      <div className="pointer-events-none absolute inset-0 z-10 rounded-xl border-2 border-transparent transition-all duration-300 group-hover:border-[var(--color-gold,#b98a4e)]" />
    </motion.div>
  );
}

export function JewelCollectionsSection() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const tab = TABS[active];

  const state = useAsync(
    () => apiClient.get<any>(`/products?category=${tab.category}&limit=6`),
    (resp) => getProductsFromData(resp).length === 0,
    [active]
  );

  const products: Product[] = state.status === "success" ? getProductsFromData(state.data) : [];

  return (
    <section className="font-marcellus bg-[var(--color-cream,#fdf3ea)] py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Heading + tabs */}
        <div className="text-center">
          <p className="text-[10px] tracking-[0.3em] text-[var(--color-gold,#b98a4e)] sm:text-xs sm:tracking-[0.35em]">
            UNVEIL YOUR PERFECT GEM
          </p>
          <h2 className="mt-2 text-2xl text-[var(--color-ink,#1c1c1c)] sm:mt-3 sm:text-4xl">
            Choose Your Ideal Jewel
          </h2>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2 sm:mt-8 sm:gap-3">
          {TABS.map((t, i) => (
            <button
              key={t.category}
              onClick={() => setActive(i)}
              className={`border px-4 py-2 text-xs transition-colors duration-300 sm:px-7 sm:py-3 sm:text-sm ${
                active === i
                  ? "border-[var(--color-ink,#2e1a0f)] bg-[var(--color-ink,#2e1a0f)] text-white"
                  : "border-[var(--color-stone-light,#d8c9ab)] text-[var(--color-ink,#1c1c1c)] hover:border-[var(--color-ink,#2e1a0f)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Banner + grid, both keyed to the active tab so they switch together */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_2fr]">
          <div className="relative min-h-[280px] overflow-hidden sm:min-h-[420px] lg:min-h-[760px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.category}
                className="absolute inset-0"
                initial={reduce ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <img
                  src={tab.bannerImage}
                  alt={tab.label}
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-5 pb-6 text-center text-white sm:gap-4 sm:px-8 sm:pb-10">
                  <p className="text-3xl sm:text-5xl lg:text-6xl">{tab.discount}</p>
                  <p className="max-w-[260px] text-xs leading-relaxed text-white/90 sm:max-w-xs sm:text-[15px]">
                    {tab.blurb}
                  </p>
                  <ShopNowButton />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div>
            {state.status === "loading" && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <div className="aspect-square animate-pulse rounded-xl bg-[var(--color-stone-light,#e6d9bf)]" />
                    <div className="mt-3 h-3.5 w-2/3 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)] sm:mt-4 sm:h-4" />
                    <div className="mt-2 h-3.5 w-1/3 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)] sm:h-4" />
                  </div>
                ))}
              </div>
            )}

            {state.status === "error" && (
              <p className="text-sm text-[var(--color-stone,#6b6154)]">
                Couldn&apos;t load products right now.{" "}
                <span className="block text-xs opacity-70">({state.message})</span>
              </p>
            )}

            {(state.status === "empty" || (state.status === "success" && products.length === 0)) && (
              <p className="text-sm text-[var(--color-stone,#6b6154)]">No products in this collection yet.</p>
            )}

            {state.status === "success" && products.length > 0 && (
              <div
                className={
                  products.length <= 4
                    ? "grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-10"
                    : "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10"
                }
              >
                {products.slice(0, 6).map((product, i) => (
                  <ProductGridCard
                    key={(product as any)._id ?? (product as any).id}
                    product={product}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}