"use client";

import { useEffect, useState } from "react";
import { Heart, Minus, Plus, Star } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { Gallery } from "./Gallery";
import { VariantSelector } from "./VariantSelector";
import { ProductCard } from "@/components/ProductCard";
import { useRouter } from "next/navigation";
import { useCommerce } from "@/lib/commerce-context";
import { useAuth } from "@/lib/auth-context";
import { useRequireLogin } from "@/lib/require-login";
import { formatINR } from "@/lib/format";
import Link from "next/link";

// const TABS = ["Description", "Specifications", "Shipping & Returns"] as const;
const TABS = ["Description", "Specifications", "Shipping & Returns", "Reviews"] as const;

type ProductAttributes = Record<string, string>;

type ApiProduct = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  mrp?: number;
  sku: string;
  images: string[];
  attributes: ProductAttributes;
  categoryId?: { _id: string; name: string; slug: string };
  subcategoryId?: { _id: string; name: string; slug: string } | null;
  collectionId?: { _id: string; name: string; slug: string } | null;
  ratingAvg?: number;
  ratingCount?: number;
  isFeatured?: boolean;
  isWishlisted?: boolean; // Add this property so TS doesn't complain
};

type ApiVariant = {
  _id: string;
  productId: string;
  sku: string;
  price: number;
  mrp?: number;
  images: string[];
  isActive: boolean;
  available: number;
  attributes?: ProductAttributes;
};

type ProductDetailResponse = {
  product: ApiProduct;
  variants: ApiVariant[];
  relatedProducts: ApiProduct[];
};

export function ProductDetail({ slug }: { slug: string }) {
  
  const state = useAsync(
    () => apiClient.get<ProductDetailResponse>(`/products/${slug}`),
    (data) => !data?.product,
    // Re-fetch when the slug changes (e.g. clicking a "You may also like" card keeps
    // this component mounted and only swaps the slug).
    [slug],
  );


  if (state.status === "loading") {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2" aria-busy="true">
        <div className="aspect-square skeleton" />
        <div className="flex flex-col gap-4">
          <div className="h-8 w-2/3 skeleton" />
          <div className="h-4 w-1/3 skeleton" />
          <div className="h-24 w-full skeleton" />
        </div>
      </div>
    );
  }

  if (state.status === "error" || state.status === "empty") {
    // A 404 (or an empty payload) means the product doesn't exist or isn't live —
    // that is not a connectivity problem, so say so.
    const httpStatus = state.status === "error" ? state.httpStatus : undefined;
    const notFound = state.status === "empty" || httpStatus === 404;
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 text-sm text-[var(--color-stone)]">
        {notFound ? (
          <>
            <h1 className="font-display text-2xl text-[var(--color-ink)]">Product not found</h1>
            <p className="mt-2">This piece may have been removed or is not available right now.</p>
            <Link href="/" className="mt-4 inline-block underline">
              Continue shopping
            </Link>
          </>
        ) : (
          <>
            <p>We couldn&apos;t load this product. Please try again in a moment.</p>
            {state.status === "error" && (
              <span className="block text-xs text-[var(--color-stone)]/70">({state.message})</span>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <ProductDetailLoaded
      // Remount per product so variant / quantity / tab state never leaks between products.
      key={state.data.product._id}
      product={state.data.product}
      variants={state.data.variants}
      relatedProducts={state.data.relatedProducts}
    />
  );
}

function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post("/reviews", { productId, rating, title, comment });
      setDone(true);
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <p className="text-sm text-[var(--color-stone)]">Thanks! Your review is pending moderation.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-3 border-b border-[var(--color-stone-light)] pb-8">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button type="button" key={i} onClick={() => setRating(i + 1)}>
            <Star
              size={20}
              strokeWidth={1.5}
              className={i < rating ? "fill-[var(--color-gold)] text-[var(--color-gold)]" : "text-[var(--color-stone-light)]"}
            />
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="border border-[var(--color-stone-light)] px-3 py-2 text-sm"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts on this piece…"
        rows={3}
        className="border border-[var(--color-stone-light)] px-3 py-2 text-sm"
        required
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={submitting} className="pill w-fit disabled:opacity-60">
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}

function ProductDetailLoaded({
  product,
  variants,
  relatedProducts,
}: {
  product: ApiProduct;
  variants: ApiVariant[];
  relatedProducts: ApiProduct[];
}) {
  // Start on the first in-stock variant (so an out-of-stock first variant doesn't hide a purchasable one);
  // if none is in stock, fall back to the first. Guards against an empty/undefined variants array.
  const [variant, setVariant] = useState<ApiVariant | undefined>(
    variants?.find((v) => v.available > 0) ?? variants?.[0],
  );
  const [quantity, setQuantity] = useState(1);
  // Use isWishlisted flag on the main product
  const [wishlisted, setWishlisted] = useState(!!product.isWishlisted);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Description");
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { refresh } = useCommerce();
  const { isLoggedIn } = useAuth();
  const ensureLoggedIn = useRequireLogin();

  async function handleBuyNow() {
    setCartMessage(null);
    if (!(await ensureLoggedIn())) return; // guests are sent to /login?next=…
    setBusy(true);
    try {
      if (!variant) throw new Error("Variant not found.");
      await apiClient.post("/cart/items", { variantId: variant._id, quantity });
      router.push("/checkout");
    } catch (err) {
      setCartMessage(err instanceof ApiClientError ? err.message : "Couldn't start checkout.");
    } finally {
      setBusy(false);
    }
  }

  // Guard against variant being undefined
  const onSale =
    !!variant &&
    typeof variant.mrp === "number" &&
    typeof variant.price === "number" &&
    variant.mrp > variant.price;

  const outOfStock = !variant || variant.available <= 0;

  // Product attributes (metal, purity, stone…) describe the piece; a variant's own
  // attributes (size, colour…) refine them. Variant `attributes` is `{}` by default,
  // so merge instead of preferring one — and drop blank values.
  const specs: ProductAttributes = Object.fromEntries(
    Object.entries({ ...(product.attributes ?? {}), ...(variant?.attributes ?? {}) }).filter(
      ([, value]) => typeof value === "string" && value.trim() !== "",
    ),
  );
  const collectionName = product.collectionId?.name;

  const galleryImages = variant && variant.images && variant.images.length > 0 ? variant.images : product.images;

  async function handleAddToCart() {
    setCartMessage(null);
    if (!(await ensureLoggedIn())) return; // guests are sent to /login?next=…
    setBusy(true);
    try {
      if (!variant) throw new Error("Variant not found.");
      await apiClient.post("/cart/items", { variantId: variant._id, quantity });
      setCartMessage("Added to cart.");
      refresh();
    } catch (err) {
      setCartMessage(err instanceof ApiClientError ? err.message : "Couldn't add to cart.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleWishlist() {
    if (!(await ensureLoggedIn())) return; // guests are sent to /login?next=…
    const next = !wishlisted;
    setWishlisted(next);
    try {
      if (next) {
        await apiClient.post("/wishlist", { productId: product._id });
      } else {
        await apiClient.delete(`/wishlist/${product._id}`);
      }
      refresh();
    } catch {
      setWishlisted(!next); // revert on failure
    }
  }

  type Review = {
    _id: string;
    rating: number;
    title?: string;
    comment?: string;
    createdAt: string;
    userId?: { name?: string };
  };

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  async function loadReviews() {
    setReviewsLoading(true);
    try {
      const resp = await apiClient.get<{ reviews: Review[] }>(`/reviews/product/${product._id}`);
      setReviews(resp.reviews ?? []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "Reviews") loadReviews();
  }, [activeTab, product._id]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <Gallery images={galleryImages} alt={product.name} />

        <div>
          {product.categoryId?.name && (
            <p className="text-xs tracking-[0.2em] text-[var(--color-gold)]">
              {product.categoryId.name.toUpperCase()}
              {product.subcategoryId?.name && ` › ${product.subcategoryId.name.toUpperCase()}`}
            </p>
          )}
          <h1 className="font-display mt-1 text-3xl text-[var(--color-ink)]">{product.name}</h1>
          <p className="mt-1 text-xs text-[var(--color-stone)]">
            SKU: {variant?.sku ?? "N/A"}
          </p>

          <div className="mt-4 flex items-center gap-3">
            {onSale && (
              <span className="text-[var(--color-stone)] line-through">
                {/* Safely show MRP */}
                {variant && typeof variant.mrp === "number" ? formatINR(variant.mrp) : ""}
              </span>
            )}
            <span className="font-display text-2xl text-[var(--color-ink)]">
              {variant && typeof variant.price === "number" ? formatINR(variant.price) : "N/A"}
            </span>
            {outOfStock && <span className="text-sm text-[var(--color-maroon)]">Out of stock</span>}
          </div>

          {variants.length > 1 && (
            <div className="mt-8">
              {variant && (
                <VariantSelector
                  variants={variants}
                  selected={variant}
                  onSelect={(selected) => {
                    // Match the selected variant using a common identifier, e.g. _id or sku
                    const found = variants.find(
                      (v) => v._id === selected._id || v.sku === selected.sku,
                    );
                    if (found) {
                      setVariant(found);
                      // Keep the chosen quantity within the new variant's stock.
                      setQuantity((q) => Math.max(1, Math.min(q, found.available > 0 ? found.available : 1)));
                    }
                  }}
                />
              )}
     
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-[var(--color-stone-light)]">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2"
                aria-label="Decrease quantity"
                disabled={outOfStock}
              >
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <span className="w-8 text-center text-sm">{quantity}</span>
              <button
                onClick={() =>
                  setQuantity((q) =>
                    variant
                      ? Math.min(variant.available, q + 1)
                      : q + 1
                  )
                }
                className="px-3 py-2"
                aria-label="Increase quantity"
                disabled={outOfStock}
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>

            <button
              onClick={handleToggleWishlist}
              aria-label="Toggle wishlist"
              className="flex h-10 w-10 items-center justify-center border border-[var(--color-stone-light)]"
            >
              <Heart size={16} fill={wishlisted ? "currentColor" : "none"} strokeWidth={1.5} />
            </button>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock || busy}
              className="pill justify-center disabled:opacity-50"
            >
              {busy ? "Adding…" : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={outOfStock || busy}
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-maroon)] px-6 py-3 text-sm tracking-[0.02em] text-[var(--color-maroon)] transition-colors hover:bg-[var(--color-maroon)] hover:text-[var(--color-cream)] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--color-maroon)]"
            >
              {busy ? "Please wait…" : "Buy Now"}
            </button>
          </div>

          {cartMessage && <p className="mt-3 text-sm text-[var(--color-stone)]">{cartMessage}</p>}

          <div className="mt-10 border-t border-[var(--color-stone-light)] pt-6">
            <div className="flex gap-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm ${
                    activeTab === tab
                      ? "border-b-2 border-[var(--color-gold)] text-[var(--color-ink)]"
                      : "text-[var(--color-stone)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="mt-4 text-sm leading-relaxed text-[var(--color-stone)]">
              {activeTab === "Description" &&
                (product.description?.trim() ? (
                  <p className="whitespace-pre-line">{product.description}</p>
                ) : (
                  <p>No description available.</p>
                ))}
              {activeTab === "Specifications" && (
                <ul className="space-y-1">
                  {Object.entries(specs).length === 0 && !collectionName && <li>No specifications listed.</li>}
                  {Object.entries(specs).map(([key, value]) => (
                    <li key={key}>
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>: {value}
                    </li>
                  ))}
                  {collectionName && <li>Collection: {collectionName}</li>}
                </ul>
              )}
              {activeTab === "Shipping & Returns" && (
                <p>
                  Free shipping on prepaid orders. 7-day returns on unworn, tagged pieces.
                </p>
              )}
              {activeTab === "Reviews" && (
                <div>
                  {isLoggedIn ? (
                    <ReviewForm productId={product._id} onSubmitted={loadReviews} />
                  ) : (
                    <p className="mb-6 text-sm">
                      <Link href="/login" className="underline">Log in</Link> to write a review.
                    </p>
                  )}
                  {reviewsLoading && <p>Loading reviews…</p>}
                  {!reviewsLoading && reviews.length === 0 && <p>No reviews yet — be the first.</p>}
                  {reviews.map((r) => (
                    <div key={r._id} className="mb-5 border-b border-[var(--color-stone-light)] pb-5">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={13} className={i < r.rating ? "fill-[var(--color-gold)] text-[var(--color-gold)]" : "text-[var(--color-stone-light)]"} />
                          ))}
                        </div>
                        <span className="text-xs text-[var(--color-stone)]">{r.userId?.name ?? "Verified Customer"}</span>
                      </div>
                      {r.title && <p className="mt-1 font-medium text-[var(--color-ink)]">{r.title}</p>}
                      {r.comment && <p className="mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t border-[var(--color-stone-light)] pt-12">
          <h2 className="font-display text-2xl text-[var(--color-ink)]">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard
                key={related._id}
                product={related as any}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}