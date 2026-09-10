

"use client";

import { apiClient } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Category } from "@/lib/types";

/**
 * Returns an array of categories from the backend response,
 * handling both array and `{ categories: Category[] }` shapes.
 */
function getCategoriesFromData(data: any): Category[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.categories)) {
    return data.categories;
  }
  return [];
}

// Placeholder imagery until each category carries its own photo from the
// API — cycled through by index so the strip never repeats the same shot
// back-to-back.
const PLACEHOLDER_IMAGES = [
  "/Category/1.jpg",
  "/Category/2.jpg",
  "/Category/3.jpg",
  "/Category/4.jpg",
];

function getPlaceholderImage(index: number) {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
}

function CategoryItem({ category, image }: { category: Category; image: string }) {
  return (
    <div className="flex shrink-0 items-center gap-5 px-8 md:mx-16">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full sm:h-24 sm:w-24">
        <img
          src={image}
          alt={category.name}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>
      <span className="font-marcellus whitespace-nowrap text-3xl text-[var(--color-ink,#1c1c1c)] sm:text-4xl">
        {category.name}
      </span>
    </div>
  );
}

export function FeaturedCategories() {
  // Adapts to backend returning { categories: [...] } or just [...]
  const state = useAsync(
    () => apiClient.get<any>("/categories", { auth: false }),
    (categoriesResponse) => {
      const cats = getCategoriesFromData(categoriesResponse);
      const isEmpty = cats.length === 0;
      console.log(
        "[FeaturedCategories] useAsync resolved categories:",
        categoriesResponse,
        "extracted:",
        cats,
        "empty:",
        isEmpty
      );
      return isEmpty;
    }
  );

  const categories: Category[] =
    state.status === "success" ? getCategoriesFromData(state.data) : [];

  return (
    <section className="font-marcellus overflow-hidden bg-[var(--color-cream-deep,#f2e4cc)] py-10">
      {state.status === "loading" && (
        <div className="flex gap-8 px-8" aria-busy="true" aria-label="Loading categories">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-5">
              <div className="h-20 w-20 animate-pulse rounded-full bg-[var(--color-stone-light,#e6d9bf)] sm:h-24 sm:w-24" />
              <div className="h-6 w-40 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)]" />
            </div>
          ))}
        </div>
      )}

      {state.status === "error" && (
        <p className="px-8 text-sm text-[var(--color-stone,#5c5347)]">
          Categories aren&apos;t loading right now — the backend isn&apos;t connected yet
          <span className="block text-xs text-[var(--color-stone,#5c5347)]/70">({state.message})</span>
        </p>
      )}

      {state.status === "empty" && (
        <p className="px-8 text-sm text-[var(--color-stone,#5c5347)]">No categories yet.</p>
      )}

      {state.status === "success" && (
        <div className="group relative flex w-max">
          {/* Track is duplicated so the marquee can loop seamlessly at -50%. */}
          <div className="flex w-max animate-[marquee_28s_linear_infinite] items-center group-hover:[animation-play-state:paused]">
            {categories.map((category, i) => (
              <CategoryItem key={category.id} category={category} image={getPlaceholderImage(i)} />
            ))}
          </div>
          <div
            className="flex w-max animate-[marquee_28s_linear_infinite] items-center group-hover:[animation-play-state:paused]"
            aria-hidden="true"
          >
            {categories.map((category, i) => (
              <CategoryItem key={`dup-${category.id}`} category={category} image={getPlaceholderImage(i)} />
            ))}
          </div>

          <style jsx>{`
            @keyframes marquee {
              from {
                transform: translateX(0);
              }
              to {
                transform: translateX(-100%);
              }
            }
          `}</style>
        </div>
      )}
    </section>
  );
}