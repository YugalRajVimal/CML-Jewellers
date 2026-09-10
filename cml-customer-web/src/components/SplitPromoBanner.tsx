

// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// import { ArrowLeft, ArrowRight, Eye, Heart, ShoppingBag } from "lucide-react";
// import { apiClient } from "@/lib/api-client";
// import { useAsync } from "@/lib/use-async";
// import type { Product } from "@/lib/types";
// import { Reveal } from "@/components/motion/Reveal";

// function getProductsFromData(data: any): Product[] {
//   if (Array.isArray(data)) return data;
//   if (data && Array.isArray(data.products)) return data.products;
//   return [];
// }

// // Backend stores prices as integer paise/cents — divide by 100 for display.
// function formatPrice(value: number) {
//   return `₹${(value / 100).toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;
// }

// function tagFor(product: any): string {
//   // Fall back through whatever the API actually gives us for a subtitle.
//   if (Array.isArray(product.variantTypes) && product.variantTypes.length > 0) {
//     return product.variantTypes.join(", ");
//   }
//   if (product.subcategory?.name) return product.subcategory.name;
//   if (product.category?.name) return product.category.name;
//   return "";
// }

// const quickActions = [
//   { Icon: Eye, label: "Quick view" },
//   { Icon: Heart, label: "Add to wishlist" },
//   { Icon: ShoppingBag, label: "Add to cart" },
// ];

// export function SplitPromoBanner() {
//   const reduce = useReducedMotion();
//   const [index, setIndex] = useState(0);

//   const state = useAsync(
//     () => apiClient.get<any>("/products?isFeatured=true&limit=6", { auth: false }),
//     (resp) => getProductsFromData(resp).length === 0
//   );

//   const products: Product[] = state.status === "success" ? getProductsFromData(state.data) : [];
//   const current: any = products[index];

//   function go(direction: 1 | -1) {
//     if (products.length === 0) return;
//     setIndex((i) => (i + direction + products.length) % products.length);
//   }

//   const id = current ? current._id ?? current.id : undefined;
//   const foregroundImage = current?.images?.[0];
//   const backgroundImage = current?.images?.[1] ?? foregroundImage;
//   const hasDiscount = current?.discountPercent > 0;
//   const tag = current ? tagFor(current) : "";

//   return (
//     <Reveal>
//       <section className="grid h-[80vh] gap-0 lg:grid-cols-2">
//         {/* Left: background + foreground images, synced to the active product */}
//         <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-cream-deep)] lg:aspect-auto">
//           {state.status === "loading" && (
//             <div className="absolute inset-0 animate-pulse bg-[var(--color-stone-light,#e6d9bf)]" />
//           )}

//           {state.status === "success" && current && (
//             <AnimatePresence mode="wait">
//               <motion.div
//                 key={id ?? index}
//                 className="absolute inset-0"
//                 initial={reduce ? undefined : { opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 transition={{ duration: 0.5 }}
//               >
//                 {/* Blurred, darkened background image */}
//                 {backgroundImage && (
//                   <img
//                     src={backgroundImage}
//                     alt=""
//                     aria-hidden
//                     className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-sm brightness-75"
//                     draggable={false}
//                   />
//                 )}

//                 {/* Foreground framed product photo */}
//                 {foregroundImage && (
//                   <motion.div
//                     initial={reduce ? undefined : { opacity: 0, scale: 0.96 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
//                     className="absolute inset-6 overflow-hidden shadow-2xl sm:inset-10 lg:inset-12"
//                   >
//                     <img
//                       src={foregroundImage}
//                       alt={current.name}
//                       className="h-full w-full object-cover object-center"
//                       draggable={false}
//                     />

//                     {hasDiscount && (
//                       <span className="absolute right-4 top-4 z-10 bg-[var(--color-gold,#b98a4e)] px-3 py-1 text-xs font-semibold tracking-wide text-white">
//                         Sale
//                       </span>
//                     )}
//                   </motion.div>
//                 )}

//                 {/* Overlay caption bottom-left */}
//                 <div className="absolute inset-x-0 bottom-0 px-8 pb-8 text-left text-white sm:px-12">
//                   {tag && <p className="text-xs tracking-wide text-white/80">{tag}</p>}
//                   <p className="font-display mt-1 text-2xl">{current.name}</p>
//                   {typeof current.basePrice === "number" && (
//                     <p className="mt-1 text-sm text-white/90">
//                       {hasDiscount && typeof current.mrp === "number" ? (
//                         <>
//                           <span className="mr-2 line-through opacity-70">{formatPrice(current.mrp)}</span>
//                           {formatPrice(current.basePrice)}
//                         </>
//                       ) : (
//                         formatPrice(current.basePrice)
//                       )}
//                     </p>
//                   )}
//                 </div>
//               </motion.div>
//             </AnimatePresence>
//           )}
//         </div>

//         {/* Right: heading + product card carousel */}
//         <div className="flex flex-col justify-center bg-[var(--color-maroon-deep)] px-8 py-16 text-center lg:px-16">
//           <p className="eyebrow text-[var(--color-gold-light)]">Jewels as unique as you</p>
//           <h2 className="mt-3 font-display text-4xl text-[var(--color-cream)]">Every Gem Tells A Story</h2>

//           <div className="relative mx-auto mt-10 w-full max-w-xs">
//             {state.status === "loading" && (
//               <div className="bg-[var(--color-cream)] p-4">
//                 <div className="aspect-square w-full animate-pulse bg-[var(--color-stone-light,#e6d9bf)]" />
//                 <div className="mx-auto mt-4 h-3 w-1/2 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)]" />
//                 <div className="mx-auto mt-3 h-4 w-2/3 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)]" />
//                 <div className="mx-auto mt-2 h-4 w-1/3 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)]" />
//               </div>
//             )}

//             {state.status === "error" && (
//               <p className="text-sm text-[var(--color-cream)]/80">
//                 Couldn&apos;t load featured products right now.
//               </p>
//             )}

//             {(state.status === "empty" || (state.status === "success" && products.length === 0)) && (
//               <p className="text-sm text-[var(--color-cream)]/80">No featured products yet.</p>
//             )}

//             {state.status === "success" && current && (
//               <>
//                 <AnimatePresence mode="wait">
//                   <motion.div
//                     key={id ?? index}
//                     initial={reduce ? undefined : { opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     exit={{ opacity: 0 }}
//                     transition={{ duration: 0.3 }}
//                     className="group relative bg-[var(--color-cream)] p-4 transition-shadow duration-300 hover:shadow-2xl"
//                   >
//                     <Link href={`/products/${current.slug ?? id}`} className="block">
//                       <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-cream-deep)]">
//                         {hasDiscount && (
//                           <span className="absolute right-3 top-3 z-10 bg-[var(--color-gold,#b98a4e)] px-2.5 py-1 text-xs font-semibold text-white">
//                             Sale
//                           </span>
//                         )}

//                         {foregroundImage ? (
//                           <img
//                             src={foregroundImage}
//                             alt={current.name}
//                             className="h-full w-full scale-100 object-cover object-center transition-transform duration-500 group-hover:scale-110"
//                             draggable={false}
//                           />
//                         ) : (
//                           <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-stone)]">
//                             No image
//                           </div>
//                         )}

//                         {/* Hover quick-actions */}
//                         <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-3 pb-4 opacity-0 transition-all duration-300 ease-out translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto">
//                           {quickActions.map(({ Icon, label }, i) => (
//                             <button
//                               key={label}
//                               type="button"
//                               aria-label={label}
//                               onClick={(e) => e.preventDefault()}
//                               style={{ transitionDelay: `${i * 60}ms` }}
//                               className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-cream)] shadow-lg transition-colors duration-300 hover:bg-[var(--color-gold,#b98a4e)]"
//                             >
//                               <Icon size={15} strokeWidth={1.5} />
//                             </button>
//                           ))}
//                         </div>
//                       </div>

//                       {tag && <p className="mt-4 text-xs text-[var(--color-gold)]">{tag}</p>}
//                       <p className="font-display text-lg text-[var(--color-ink)]">{current.name}</p>
//                       {typeof current.basePrice === "number" && (
//                         <p className="mt-1 text-sm text-[var(--color-stone)]">
//                           {hasDiscount && typeof current.mrp === "number" ? (
//                             <>
//                               <span className="mr-2 line-through">{formatPrice(current.mrp)}</span>
//                               {formatPrice(current.basePrice)}
//                             </>
//                           ) : (
//                             formatPrice(current.basePrice)
//                           )}
//                         </p>
//                       )}
//                     </Link>
//                   </motion.div>
//                 </AnimatePresence>

//                 <button
//                   onClick={() => go(-1)}
//                   aria-label="Previous featured product"
//                   className="absolute left-0 md:-left-20 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-white text-[var(--color-ink)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-gold,#b98a4e)]"
//                 >
//                   <ArrowLeft size={16} strokeWidth={1.5} color="black" />
//                 </button>
//                 <button
//                   onClick={() => go(1)}
//                   aria-label="Next featured product"
//                   className="absolute right-0 md:-right-20 top-1/2 flex h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center bg-white text-[var(--color-ink)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-gold,#b98a4e)]"
//                 >
//                   <ArrowRight size={16} strokeWidth={1.5} color="black" />
//                 </button>
           
//               </>
//             )}
//           </div>
//         </div>
//       </section>
//     </Reveal>
//   );
// }

"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, Heart, ShoppingBag } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Product } from "@/lib/types";
import { Reveal } from "@/components/motion/Reveal";

function getProductsFromData(data: any): Product[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.products)) return data.products;
  return [];
}

// Backend stores prices as integer paise/cents — divide by 100 for display.
function formatPrice(value: number) {
  return `₹${(value / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function tagFor(product: any): string {
  // Fall back through whatever the API actually gives us for a subtitle.
  if (Array.isArray(product.variantTypes) && product.variantTypes.length > 0) {
    return product.variantTypes.join(", ");
  }
  if (product.subcategory?.name) return product.subcategory.name;
  if (product.category?.name) return product.category.name;
  return "";
}

const quickActions = [
  { Icon: Eye, label: "Quick view" },
  { Icon: Heart, label: "Add to wishlist" },
  { Icon: ShoppingBag, label: "Add to cart" },
];

export function SplitPromoBanner() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  const state = useAsync(
    () => apiClient.get<any>("/products?isFeatured=true&limit=6", { auth: false }),
    (resp) => getProductsFromData(resp).length === 0
  );

  const products: Product[] = state.status === "success" ? getProductsFromData(state.data) : [];
  const current: any = products[index];

  function go(direction: 1 | -1) {
    if (products.length === 0) return;
    setIndex((i) => (i + direction + products.length) % products.length);
  }

  const id = current ? current._id ?? current.id : undefined;
  const foregroundImage = current?.images?.[0];
  const backgroundImage = current?.images?.[1] ?? foregroundImage;
  const hasDiscount = current?.discountPercent > 0;
  const tag = current ? tagFor(current) : "";

  return (
    <Reveal>
      <section className="grid grid-cols-1 gap-0 lg:h-[80vh] lg:grid-cols-2">
        {/* Left: background + foreground images, synced to the active product */}
        <div className="relative h-[380px] w-full overflow-hidden bg-[var(--color-cream-deep)] sm:h-[460px] lg:h-full">
          {state.status === "loading" && (
            <div className="absolute inset-0 animate-pulse bg-[var(--color-stone-light,#e6d9bf)]" />
          )}

          {state.status === "success" && current && (
            <AnimatePresence mode="wait">
              <motion.div
                key={id ?? index}
                className="absolute inset-0"
                initial={reduce ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Blurred, darkened background image */}
                {backgroundImage && (
                  <img
                    src={backgroundImage}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-sm brightness-75"
                    draggable={false}
                  />
                )}

                {/* Foreground framed product photo */}
                {foregroundImage && (
                  <motion.div
                    initial={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-4 overflow-hidden shadow-2xl sm:inset-8 lg:inset-12"
                  >
                    <img
                      src={foregroundImage}
                      alt={current.name}
                      className="h-full w-full object-cover object-center"
                      draggable={false}
                    />

                    {hasDiscount && (
                      <span className="absolute right-3 top-3 z-10 bg-[var(--color-gold,#b98a4e)] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white sm:right-4 sm:top-4 sm:px-3 sm:text-xs">
                        Sale
                      </span>
                    )}
                  </motion.div>
                )}

                {/* Overlay caption bottom-left */}
                <div className="absolute inset-x-0 bottom-0 px-5 pb-5 text-left text-white sm:px-8 sm:pb-8 lg:px-12">
                  {tag && <p className="text-[11px] tracking-wide text-white/80 sm:text-xs">{tag}</p>}
                  <p className="font-display mt-1 text-xl sm:text-2xl">{current.name}</p>
                  {typeof current.basePrice === "number" && (
                    <p className="mt-1 text-sm text-white/90">
                      {hasDiscount && typeof current.mrp === "number" ? (
                        <>
                          <span className="mr-2 line-through opacity-70">{formatPrice(current.mrp)}</span>
                          {formatPrice(current.basePrice)}
                        </>
                      ) : (
                        formatPrice(current.basePrice)
                      )}
                    </p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Right: heading + product card carousel */}
        <div className="flex flex-col justify-center bg-[var(--color-maroon-deep)] px-6 py-12 text-center sm:px-8 sm:py-16 lg:px-16">
          <p className="eyebrow text-[var(--color-gold-light)]">Jewels as unique as you</p>
          <h2 className="font-display mt-3 text-3xl text-[var(--color-cream)] sm:text-4xl">
            Every Gem Tells A Story
          </h2>

          <div className="relative mx-auto mt-8 w-full max-w-[240px] sm:mt-10 sm:max-w-xs">
            {state.status === "loading" && (
              <div className="bg-[var(--color-cream)] p-4">
                <div className="aspect-square w-full animate-pulse bg-[var(--color-stone-light,#e6d9bf)]" />
                <div className="mx-auto mt-4 h-3 w-1/2 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)]" />
                <div className="mx-auto mt-3 h-4 w-2/3 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)]" />
                <div className="mx-auto mt-2 h-4 w-1/3 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)]" />
              </div>
            )}

            {state.status === "error" && (
              <p className="text-sm text-[var(--color-cream)]/80">
                Couldn&apos;t load featured products right now.
              </p>
            )}

            {(state.status === "empty" || (state.status === "success" && products.length === 0)) && (
              <p className="text-sm text-[var(--color-cream)]/80">No featured products yet.</p>
            )}

            {state.status === "success" && current && (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={id ?? index}
                    initial={reduce ? undefined : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group relative bg-[var(--color-cream)] p-3 transition-shadow duration-300 hover:shadow-2xl sm:p-4"
                  >
                    <Link href={`/products/${current.slug ?? id}`} className="block">
                      <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-cream-deep)]">
                        {hasDiscount && (
                          <span className="absolute right-2 top-2 z-10 bg-[var(--color-gold,#b98a4e)] px-2 py-0.5 text-[10px] font-semibold text-white sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
                            Sale
                          </span>
                        )}

                        {foregroundImage ? (
                          <img
                            src={foregroundImage}
                            alt={current.name}
                            className="h-full w-full scale-100 object-cover object-center transition-transform duration-500 group-hover:scale-110"
                            draggable={false}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-stone)]">
                            No image
                          </div>
                        )}

                        {/* Hover quick-actions */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 justify-center gap-2 pb-3 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto sm:gap-3 sm:pb-4">
                          {quickActions.map(({ Icon, label }, i) => (
                            <button
                              key={label}
                              type="button"
                              aria-label={label}
                              onClick={(e) => e.preventDefault()}
                              style={{ transitionDelay: `${i * 60}ms` }}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-cream)] shadow-lg transition-colors duration-300 hover:bg-[var(--color-gold,#b98a4e)] sm:h-9 sm:w-9"
                            >
                              <Icon size={14} strokeWidth={1.5} className="sm:hidden" />
                              <Icon size={15} strokeWidth={1.5} className="hidden sm:block" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {tag && <p className="mt-3 text-xs text-[var(--color-gold)] sm:mt-4">{tag}</p>}
                      <p className="font-display text-base text-[var(--color-ink)] sm:text-lg">{current.name}</p>
                      {typeof current.basePrice === "number" && (
                        <p className="mt-1 text-sm text-[var(--color-stone)]">
                          {hasDiscount && typeof current.mrp === "number" ? (
                            <>
                              <span className="mr-2 line-through">{formatPrice(current.mrp)}</span>
                              {formatPrice(current.basePrice)}
                            </>
                          ) : (
                            formatPrice(current.basePrice)
                          )}
                        </p>
                      )}
                    </Link>
                  </motion.div>
                </AnimatePresence>

                <button
                  onClick={() => go(-1)}
                  aria-label="Previous featured product"
                  className="absolute left-0 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-white text-[var(--color-ink)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-gold,#b98a4e)] sm:h-10 sm:w-10 lg:-left-14 xl:-left-20"
                >
                  <ArrowLeft size={15} strokeWidth={1.5} color="black" className="sm:hidden" />
                  <ArrowLeft size={16} strokeWidth={1.5} color="black" className="hidden sm:block" />
                </button>
                <button
                  onClick={() => go(1)}
                  aria-label="Next featured product"
                  className="absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center bg-white text-[var(--color-ink)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-gold,#b98a4e)] sm:h-10 sm:w-10 lg:-right-14 xl:-right-20"
                >
                  <ArrowRight size={15} strokeWidth={1.5} color="black" className="sm:hidden" />
                  <ArrowRight size={16} strokeWidth={1.5} color="black" className="hidden sm:block" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </Reveal>
  );
}