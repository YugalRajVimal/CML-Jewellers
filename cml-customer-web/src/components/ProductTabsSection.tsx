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

export function ProductTabsSection() {
  const [active, setActive] = useState(0);
  const state = useAsync(
    () => apiClient.get<Product[]>(`/products?category=${TABS[active].category}&limit=4`, { auth: false }),
    (products) => !Array.isArray(products) || products.length === 0,
    [active],
  );

  // Ensure products is always an array before using .map
  const products: Product[] = Array.isArray(state.data) ? state.data : [];

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
          <p className="text-center text-sm text-[var(--color-stone)]">Nothing in this collection yet.</p>
        )}

        {state.status === "success" && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
