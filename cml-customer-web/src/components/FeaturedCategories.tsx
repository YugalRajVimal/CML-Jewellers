"use client";

import { apiClient } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Category } from "@/lib/types";

export function FeaturedCategories() {
  const state = useAsync(
    () => apiClient.get<Category[]>("/categories", { auth: false }),
    (categories) => !Array.isArray(categories) || categories.length === 0,
  );

  // Ensure categories is always an array before using .map
  const categories: Category[] = Array.isArray(state.data) ? state.data : [];

  return (
    <section className="border-t border-[var(--color-stone-light)] bg-[var(--color-cream-deep)]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="font-display text-2xl text-[var(--color-ink)]">Shop by category</h2>

        {state.status === "loading" && (
          <div className="mt-8 flex gap-6 overflow-x-hidden" aria-busy="true" aria-label="Loading categories">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 w-28 shrink-0 animate-pulse rounded-full bg-[var(--color-stone-light)]" />
            ))}
          </div>
        )}

        {state.status === "error" && (
          <p className="mt-8 text-sm text-[var(--color-stone)]">
            Categories aren&apos;t loading right now — the backend isn&apos;t connected yet
            <span className="block text-xs text-[var(--color-stone)]/70">({state.message})</span>
          </p>
        )}

        {state.status === "empty" && <p className="mt-8 text-sm text-[var(--color-stone)]">No categories yet.</p>}

        {state.status === "success" && (
          <div className="relative mt-8">
            <div className="flex gap-6 overflow-x-auto pb-1 pr-8">
              {categories.map((category) => (
                <div key={category.id} className="group flex shrink-0 flex-col items-center gap-3">
                  <div className="h-28 w-28 rounded-full bg-[var(--color-stone-light)] transition-transform duration-200 ease-out group-hover:scale-[1.08] group-hover:shadow-lg" />
                  <span className="text-sm">{category.name}</span>
                </div>
              ))}
            </div>
            {/* Fade at the trailing edge signals there's more to scroll to. */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--color-cream-deep)] to-transparent" />
          </div>
        )}
      </div>
    </section>
  );
}
