"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/motion/Reveal";

const TABS = [
  { label: "Traditional Jewels", category: "traditional" },
  { label: "Bridal Jewels", category: "bridal" },
  { label: "Antique Jewels", category: "antique" },
];

/**
 * Extracts an array of products from backend response.
 * Handles both array and object-wrapped formats (i.e. {products: [...]})
 */
function getProductsFromData(data: any): Product[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.products)) return data.products;
  return [];
}

export function ProductTabsSection() {
  const [active, setActive] = useState(0);

  const state = useAsync(
    () => {
      console.log("[ProductTabsSection] Fetching products for tab:", TABS[active].category);
      // Don't assume backend always returns a raw array
      return apiClient.get<any>(`/products?category=${TABS[active].category}&limit=4`, { auth: false });
    },
    (resp) => {
      const arr = getProductsFromData(resp);
      const invalid = !Array.isArray(arr) || arr.length === 0;
      if (invalid) {
        console.log("[ProductTabsSection] No products found for tab:", TABS[active].category, resp);
      }
      return invalid;
    },
    [active],
  );

  // Always extract products properly regardless of backend response format
  const products: Product[] = state.status === "success" ? getProductsFromData(state.data) : [];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <Reveal className="text-center">
        <p className="eyebrow">Unveil your perfect gem</p>
        <h2 className="mt-3 font-display text-4xl text-[var(--color-ink)]">Choose Your Ideal Jewel</h2>
      </Reveal>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {TABS.map((tab, i) => (
          <button
            key={tab.category}
            onClick={() => setActive(i)}
            className={`border px-6 py-3 text-sm transition-colors ${
              active === i
                ? "border-[var(--color-maroon)] bg-[var(--color-maroon)] text-[var(--color-cream)]"
                : "border-[var(--color-stone-light)] text-[var(--color-ink)] hover:border-[var(--color-maroon)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {state.status === "loading" && (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square skeleton" />
            ))}
          </div>
        )}

        {state.status === "error" && (
          <p className="text-center text-sm text-[var(--color-stone)]">
            Couldn&apos;t load this collection right now. ({state.message})
          </p>
        )}

        {state.status === "empty" && (
          <p className="text-center text-sm text-[var(--color-stone)]">
            Nothing in this collection yet.
          </p>
        )}

        {state.status === "success" && products.length > 0 && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}

        {/* Guard: If somehow success but empty, show nothing-in-collection */}
        {state.status === "success" && products.length === 0 && (
          <p className="text-center text-sm text-[var(--color-stone)]">
            Nothing in this collection yet.
          </p>
        )}
      </div>
    </section>
  );
}
