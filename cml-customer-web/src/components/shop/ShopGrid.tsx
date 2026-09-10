// "use client";

// import { useCallback, useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { apiClient, ApiClientError } from "@/lib/api-client";
// import { toQueryString } from "@/lib/query";
// import type { Product, SortOption } from "@/lib/types";
// import { ProductCard } from "@/components/ProductCard";
// import { SearchBox } from "./SearchBox";
// import { SortSelect } from "./SortSelect";
// import { FilterPanel, type FilterValues } from "./FilterPanel";
// import { MobileFilterDrawer } from "./MobileFilterDrawer";
// import { Pagination } from "./Pagination";

// const PAGE_SIZE = 12;

// // Helper to extract raw product array, even if {products: [...]} shape
// function getProductsFromApiData(data: any): Product[] {
//   if (Array.isArray(data)) return data;
//   if (data && Array.isArray(data.products)) return data.products;
//   return [];
// }

// type GridState =
//   | { status: "loading" }
//   | { status: "error"; message: string }
//   | { status: "empty" }
//   | { status: "success"; products: Product[]; total: number };

// export function ShopGrid({ category, title }: { category?: string; title: string }) {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const page = Number(searchParams.get("page") ?? "1");
//   const sort = (searchParams.get("sort") as SortOption) ?? "recommended";
//   const q = searchParams.get("q") ?? "";
//   const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
//   const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
//   const metal = searchParams.get("metal") ?? undefined;

//   const [state, setState] = useState<GridState>({ status: "loading" });

//   const queryKey = JSON.stringify({ page, sort, q, minPrice, maxPrice, metal, category });
//   const [prevQueryKey, setPrevQueryKey] = useState(queryKey);
//   if (prevQueryKey !== queryKey) {
//     setPrevQueryKey(queryKey);
//     if (state.status !== "loading") setState({ status: "loading" });
//   }

//   const updateParams = useCallback(
//     (updates: Record<string, string | number | undefined>) => {
//       const params = new URLSearchParams(searchParams.toString());
//       Object.entries(updates).forEach(([key, value]) => {
//         if (value === undefined || value === "") {
//           params.delete(key);
//         } else {
//           params.set(key, String(value));
//         }
//       });
//       // any change other than page resets pagination
//       if (!("page" in updates)) params.delete("page");
//       router.push(`?${params.toString()}`, { scroll: false });
//     },
//     [router, searchParams],
//   );

//   useEffect(() => {
//     let cancelled = false;

//     const qs = toQueryString({ page, limit: PAGE_SIZE, sort, q: q || undefined, minPrice, maxPrice, metal, category });

//     console.log("[ShopGrid] Fetching products with params:", { page, sort, q, minPrice, maxPrice, metal, category, qs });

//     apiClient
//       .getWithMeta<any>(`/products${qs}`, { auth: false })
//       .then(({ data, meta }) => {
//         if (cancelled) return;

//         // data might be {products: Product[]} or Product[], handle both
//         const products: Product[] = getProductsFromApiData(data);

//         console.log("[ShopGrid] Products loaded:", products, "Meta:", meta);

//         if (!Array.isArray(products) || products.length === 0) {
//           setState({ status: "empty" });
//         } else {
//           setState({ status: "success", products, total: meta?.total ?? products.length });
//         }
//       })
//       .catch((err: unknown) => {
//         if (cancelled) return;
//         const message = err instanceof ApiClientError ? err.message : "Couldn't load products.";
//         console.error("[ShopGrid] Error loading products:", err);
//         setState({ status: "error", message });
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [page, sort, q, minPrice, maxPrice, metal, category]);

//   const filterValues: FilterValues = { minPrice, maxPrice, metal };
//   const handleFilterChange = (values: FilterValues) => updateParams(values as Record<string, string | number | undefined>);

//   return (
//     <div className="mx-auto max-w-7xl px-6 py-12">
//       <div className="flex flex-wrap items-center justify-between gap-4">
//         <h1 className="font-display text-3xl text-[var(--color-ink)]">{title}</h1>
//         <MobileFilterDrawer values={filterValues} onChange={handleFilterChange} />
//       </div>

//       <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
//         <SearchBox value={q} onChange={(value) => updateParams({ q: value })} />
//         <SortSelect value={sort} onChange={(value) => updateParams({ sort: value })} />
//       </div>

//       <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
//         <aside className="hidden lg:block">
//           <FilterPanel values={filterValues} onChange={handleFilterChange} />
//         </aside>

//         <div>
//           {state.status === "loading" && (
//             <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-4" aria-busy="true">
//               {Array.from({ length: 8 }).map((_, i) => (
//                 <div key={i} className="aspect-square skeleton" />
//               ))}
//             </div>
//           )}

//           {state.status === "error" && (
//             <p className="text-sm text-[var(--color-stone)]">
//               Products aren&apos;t loading right now — the backend isn&apos;t connected yet
//               <span className="block text-xs text-[var(--color-stone)]/70">({state.message})</span>
//             </p>
//           )}

//           {state.status === "empty" && (
//             <p className="text-sm text-[var(--color-stone)]">
//               No products match those filters. Try widening your price range or clearing the metal filter.
//             </p>
//           )}

//           {state.status === "success" && (
//             <>
//               <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
//                 {state.products.map((product) => (
//                   // Support product.id or product._id as key (backend might use either shape)
//                   <ProductCard key={product.id ?? product.id} product={product} />
//                 ))}
//               </div>
//               <Pagination
//                 page={page}
//                 totalPages={Math.max(1, Math.ceil(state.total / PAGE_SIZE))}
//                 onChange={(nextPage) => updateParams({ page: nextPage })}
//               />
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { toQueryString } from "@/lib/query";
import type { Product, SortOption } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { SearchBox } from "./SearchBox";
import { SortSelect } from "./SortSelect";
import { FilterPanel, type FilterValues } from "./FilterPanel";
import { MobileFilterDrawer } from "./MobileFilterDrawer";
import { Pagination } from "./Pagination";

const PAGE_SIZE = 12;

// Helper to extract raw product array, even if {products: [...]} shape
function getProductsFromApiData(data: any): Product[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.products)) return data.products;
  return [];
}

type GridState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; products: Product[]; total: number };

export function ShopGrid({ category, title }: { category?: string; title: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const sort = (searchParams.get("sort") as SortOption) ?? "recommended";
  const q = searchParams.get("q") ?? "";
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const metal = searchParams.get("metal") ?? undefined;

  const [state, setState] = useState<GridState>({ status: "loading" });

  const queryKey = JSON.stringify({ page, sort, q, minPrice, maxPrice, metal, category });
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey);
  if (prevQueryKey !== queryKey) {
    setPrevQueryKey(queryKey);
    if (state.status !== "loading") setState({ status: "loading" });
  }

  const updateParams = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      // any change other than page resets pagination
      if (!("page" in updates)) params.delete("page");
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    let cancelled = false;

    const qs = toQueryString({ page, limit: PAGE_SIZE, sort, q: q || undefined, minPrice, maxPrice, metal, category });

    apiClient
      .getWithMeta<any>(`/products${qs}`)
      .then(({ data, meta }) => {
        if (cancelled) return;

        // data might be {products: Product[]} or Product[], handle both.
        // Backend items use _id (not id) — normalize so downstream code
        // (keys, links, cards) never has to guess which one is present.
        console.log(data);
        const rawProducts = getProductsFromApiData(data);
        const products: Product[] = rawProducts.map((p: any) => ({
          ...p,
          id: p.id ?? p._id,
        }));

        if (!Array.isArray(products) || products.length === 0) {
          setState({ status: "empty" });
        } else {
          setState({ status: "success", products, total: meta?.total ?? products.length });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof ApiClientError ? err.message : "Couldn't load products.";
        setState({ status: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, [page, sort, q, minPrice, maxPrice, metal, category]);

  const filterValues: FilterValues = { minPrice, maxPrice, metal };
  const handleFilterChange = (values: FilterValues) => updateParams(values as Record<string, string | number | undefined>);

  return (
    <div className="bg-[var(--color-cream,#fdf3ea)]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="text-center">
          <p className="eyebrow text-[var(--color-gold,#b98a4e)]">
            {category ? "Curated for you" : "The full collection"}
          </p>
          <h1 className="font-display mt-3 text-4xl text-[var(--color-ink)] sm:text-5xl">{title}</h1>
        </div>

        {/* Toolbar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-cream-light,#f0e2cd)] pb-6">
          <div className="flex flex-1 flex-wrap items-center gap-3 sm:flex-nowrap">
            <SearchBox value={q} onChange={(value) => updateParams({ q: value })} />
            <SortSelect value={sort} onChange={(value) => updateParams({ sort: value })} />
          </div>
          <MobileFilterDrawer values={filterValues} onChange={handleFilterChange} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 border border-[var(--color-cream-light,#f0e2cd)] bg-white/60 p-6">
              <p className="font-display mb-4 text-lg text-[var(--color-ink)]">Refine</p>
              <FilterPanel values={filterValues} onChange={handleFilterChange} />
            </div>
          </aside>

          <div>
            {state.status === "loading" && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 xl:grid-cols-4" aria-busy="true">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>
                    <div className="aspect-square animate-pulse rounded-xl bg-[var(--color-stone-light,#e6d9bf)]" />
                    <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)]" />
                    <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)]" />
                  </div>
                ))}
              </div>
            )}

            {state.status === "error" && (
              <div className="border border-[var(--color-cream-light,#f0e2cd)] bg-white/60 px-6 py-10 text-center">
                <p className="text-sm text-[var(--color-stone)]">
                  Products aren&apos;t loading right now.
                  <span className="mt-1 block text-xs text-[var(--color-stone)]/70">({state.message})</span>
                </p>
              </div>
            )}

            {state.status === "empty" && (
              <div className="border border-[var(--color-cream-light,#f0e2cd)] bg-white/60 px-6 py-10 text-center">
                <p className="text-sm text-[var(--color-stone)]">
                  No products match those filters. Try widening your price range or clearing the metal filter.
                </p>
              </div>
            )}

            {state.status === "success" && (
              <>
                <p className="mb-6 text-sm text-[var(--color-stone)]">
                  Showing {state.products.length} of {state.total} {state.total === 1 ? "piece" : "pieces"}
                </p>

                <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:gap-y-14 sm:grid-cols-3 xl:grid-cols-3">
                  {state.products.map((product, i) => (
                    <ProductCard key={(product as any)._id ?? product.id} product={product} />
                  ))}
                </div>

                <div className="mt-14">
                  <Pagination
                    page={page}
                    totalPages={Math.max(1, Math.ceil(state.total / PAGE_SIZE))}
                    onChange={(nextPage) => updateParams({ page: nextPage })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}