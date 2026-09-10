
// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// import { Eye, Heart, Pin, ShoppingBag, Star } from "lucide-react";
// import { apiClient } from "@/lib/api-client";
// import { useAsync } from "@/lib/use-async";
// import type { Product } from "@/lib/types";
// import { ShopNowButton } from "@/components/Shopnowbutton";

// type Tab = {
//   label: string;
//   category: string;
//   bannerImage: string;
//   discount: string;
//   blurb: string;
// };

// const TABS: Tab[] = [
//   {
//     label: "Traditional Jewels",
//     category: "traditional",
//     bannerImage: "/Images/I5.jpg",
//     discount: "25% Off",
//     blurb:
//       "Justo Ante Convallis Leo Nullam Nunc Justo Amet Laoreet. Nulla Mi Nunc Eget Curabitur Massa Sem Ut. Himenaeos Turpis Luctus Sollicitudin Aliquam Risus Amet Facilisis Ultrices Pulvinar Proin.",
//   },
//   {
//     label: "Bridal Jewels",
//     category: "bridal",
//     bannerImage: "/Images/I2.jpg",
//     discount: "30% Off",
//     blurb:
//       "Nascetur Class Vivamus Ut Eleifend Primis Lobortis Dapibus Ridiculus Congue. Congue Duis Suspendisse Dui Per Faucibus Nascetur Class Vivamus.",
//   },
//   {
//     label: "Antique Jewels",
//     category: "antique",
//     bannerImage: "/Images/I4.jpg",
//     discount: "20% Off",
//     blurb:
//       "Vestibulum Vehicula Nunc Ad Fringilla Pretium Ex Ac Praesent Vitae. Conubia Egestas Porta Per Maximus Sem Congue Vulputate Tristique Interdum.",
//   },
// ];

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

// function RatingStars({ value }: { value: number }) {
//   const rounded = Math.round(value);
//   return (
//     <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
//       {Array.from({ length: 5 }).map((_, i) => (
//         <Star
//           key={i}
//           size={13}
//           strokeWidth={1.5}
//           className={
//             i < rounded
//               ? "fill-[var(--color-gold,#b98a4e)] text-[var(--color-gold,#b98a4e)]"
//               : "text-[var(--color-stone-light,#d8c9ab)]"
//           }
//         />
//       ))}
//     </div>
//   );
// }

// const quickActions = [
//   { Icon: Eye, label: "Quick view" },
//   { Icon: Heart, label: "Add to wishlist" },
//   { Icon: ShoppingBag, label: "Add to cart" },
// ];

// function ProductGridCard({ product, index }: { product: Product; index: number }) {
//   const reduce = useReducedMotion();
//   const id = (product as any)._id ?? (product as any).id;
//   const image = product.images?.[0];
//   const hasDiscount = (product as any).discountPercent > 0;

//   return (
//     <motion.div
//       initial={reduce ? undefined : { opacity: 0, y: 32, scale: 0.98 }}
//       whileInView={{ opacity: 1, y: 0, scale: 1 }}
//       viewport={{ once: true, amount: 0.3 }}
//       transition={{ duration: 0.7, delay: index * 0.05, ease: [0.32, 0.72, 0, 1] }}
//       className="group relative rounded-xl border border-[var(--color-cream-light,#f7ece1)] bg-gradient-to-br from-[#fff8f0] to-[var(--color-cream,#fcf5eb)] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-400"
//       style={{ overflow: "visible" }}
//     >
//       <Link
//         href={`/products/${(product as any).slug ?? id}`}
//         className="block rounded-xl overflow-hidden"
//         style={{ boxShadow: "0 8px 40px 0 rgba(195,168,129,0.12)" }}
//       >
//         <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--color-cream-deep,#f3e7d6)] border border-[var(--color-cream-light,#f7ece1)] transition-all duration-300 group-hover:border-[var(--color-gold,#b98a4e)]">
//           {(product as any).isFeatured && (
//             <span className="absolute left-3 top-3 z-20 flex h-8 w-8 -rotate-12 items-center justify-center rounded-full bg-gradient-to-b from-[var(--color-gold-light,#efd6ae)] to-[var(--color-gold,#b98a4e)] shadow-gold-glow text-white">
//               <Pin size={15} strokeWidth={2} className="rotate-12" />
//             </span>
//           )}

//           {hasDiscount && (
//             <span className="absolute right-3 top-3 z-20 rounded-xl bg-gradient-to-r from-[var(--color-ink,#1c1c1c)] via-[var(--color-gold,#b98a4e)] to-[var(--color-gold-light,#efd6ae)] px-3 py-1 text-xs font-semibold text-white shadow-lg tracking-wide">
//               Sale &nbsp; • &nbsp; {(product as any).discountPercent}% Off
//             </span>
//           )}

//           {image ? (
//             <img
//               src={image}
//               alt={product.name}
//               className="h-full w-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-500 will-change-transform rounded-xl"
//               draggable={false}
//             />
//           ) : (
//             <div className="absolute inset-0 flex items-center justify-center text-stone-400 rounded-xl">
//               <span className="text-2xl">No Image</span>
//             </div>
//           )}

//           {/* Quick-actions: Show more visually elegant, with glassmorphism, and premium icons */}
//           <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-3 pb-5 opacity-0 transition-all duration-500 ease-out group-hover:pointer-events-auto group-hover:opacity-100 translate-y-3 group-hover:translate-y-0">
//             {quickActions.map(({ Icon, label }, i) => (
//               <button
//                 key={label}
//                 type="button"
//                 aria-label={label}
//                 onClick={e => e.preventDefault()}
//                 style={{ transitionDelay: `${i * 70}ms` }}
//                 className="flex h-10 w-10 items-center justify-center rounded-full shadow-xl backdrop-blur-lg bg-white/70 border border-[var(--color-gold-light,#efd6ae)] ring-1 ring-[var(--color-gold-light,#efd6ae)] text-[var(--color-gold,#b98a4e)] hover:bg-[var(--color-gold,#b98a4e)] hover:text-white hover:scale-110 transition-all duration-300"
//               >
//                 <Icon size={17} strokeWidth={1.5} />
//               </button>
//             ))}
//           </div>

//           {/* Add a subtle floating gold sparkle on hover for lux touch */}
//           <div className="pointer-events-none absolute right-6 bottom-7 z-30 hidden group-hover:block animate-fade-in">
//             <svg width="36" height="36" fill="none" viewBox="0 0 64 64">
//               <circle cx="32" cy="32" r="12" fill="url(#gold-glow)" fillOpacity="0.12"/>
//               <circle cx="32" cy="32" r="4" fill="url(#gold-med)"/>
//               <defs>
//                 <radialGradient id="gold-glow" cx="0" cy="0" r="1" gradientTransform="rotate(45) scale(20)">
//                   <stop stopColor="#efd6ae" />
//                   <stop offset="1" stopColor="#b98a4e" stopOpacity="0" />
//                 </radialGradient>
//                 <radialGradient id="gold-med" cx="0" cy="0" r="1" gradientTransform="rotate(0) scale(8)">
//                   <stop stopColor="#b98a4e" />
//                   <stop offset="1" stopColor="#efd6ae" stopOpacity="0" />
//                 </radialGradient>
//               </defs>
//             </svg>
//           </div>
//         </div>
//         {/* Added extra padding for the text part */}
//         <div className="pt-5 px-6 pb-4">
//           <div className="flex items-start justify-between gap-3">
//             <p className="font-marcellus text-xl font-semibold text-[var(--color-ink,#22160f)] truncate tracking-wide" title={product.name}>
//               {product.name}
//             </p>
//             <div className="mt-0.5">
//               <RatingStars value={(product as any).ratingAvg ?? 0} />
//             </div>
//           </div>
//           <div className="mt-2 flex items-end gap-2">
//             {hasDiscount && (
//               <span className="text-base text-[var(--color-stone,#ac9777)] line-through decoration-wavy decoration-[var(--color-gold,#d3b779)]">
//                 {formatPrice((product as any).mrp)}
//               </span>
//             )}
//             <span className="text-lg font-bold text-[var(--color-gold,#b98a4e)] drop-shadow-gold">
//               {formatPrice((product as any).basePrice)}
//             </span>
//           </div>
//         </div>
//       </Link>
//       {/* Premium border highlight */}
//       <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[var(--color-gold,#b98a4e)] group-hover:shadow-gold-glow transition-all duration-300 z-10" />
//     </motion.div>
//   );
// }

// export function JewelCollectionsSection() {
//   const [active, setActive] = useState(0);
//   const reduce = useReducedMotion();
//   const tab = TABS[active];

//   const state = useAsync(
//     () => apiClient.get<any>(`/products?category=${tab.category}&limit=6`, { auth: false }),
//     (resp) => getProductsFromData(resp).length === 0,
//     [active]
//   );

//   const products: Product[] = state.status === "success" ? getProductsFromData(state.data) : [];

//   return (
//     <section className="font-marcellus bg-[var(--color-cream,#fdf3ea)] py-16">
//       <div className="mx-auto max-w-7xl px-6">
//         {/* Heading + tabs */}
//         <div className="text-center">
//           <p className="text-xs tracking-[0.35em] text-[var(--color-gold,#b98a4e)]">
//             UNVEIL YOUR PERFECT GEM
//           </p>
//           <h2 className="mt-3 text-4xl text-[var(--color-ink,#1c1c1c)]">Choose Your Ideal Jewel</h2>
//         </div>

//         <div className="mt-8 flex flex-wrap justify-center gap-3">
//           {TABS.map((t, i) => (
//             <button
//               key={t.category}
//               onClick={() => setActive(i)}
//               className={`border px-7 py-3 text-sm transition-colors duration-300 ${
//                 active === i
//                   ? "border-[var(--color-ink,#2e1a0f)] bg-[var(--color-ink,#2e1a0f)] text-white"
//                   : "border-[var(--color-stone-light,#d8c9ab)] text-[var(--color-ink,#1c1c1c)] hover:border-[var(--color-ink,#2e1a0f)]"
//               }`}
//             >
//               {t.label}
//             </button>
//           ))}
//         </div>

//         {/* Banner + grid, both keyed to the active tab so they switch together */}
//         <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_2fr]">
//           <div className="relative min-h-[420px] overflow-hidden lg:min-h-[760px]">
//             <AnimatePresence mode="wait">
//               <motion.div
//                 key={tab.category}
//                 className="absolute inset-0"
//                 initial={reduce ? undefined : { opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 transition={{ duration: 0.4 }}
//               >
//                 <img
//                   src={tab.bannerImage}
//                   alt={tab.label}
//                   className="absolute inset-0 h-full w-full object-cover"
//                   draggable={false}
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

//                 <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-8 pb-10 text-center text-white">
//                   <p className="text-6xl">{tab.discount}</p>
//                   <p className="max-w-xs text-[15px] leading-relaxed text-white/90">{tab.blurb}</p>
//                   <ShopNowButton />
//                 </div>
//               </motion.div>
//             </AnimatePresence>
//           </div>

//           <div>
//             {state.status === "loading" && (
//               <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3" aria-busy="true">
//                 {Array.from({ length: 6 }).map((_, i) => (
//                   <div key={i}>
//                     <div className="aspect-square animate-pulse bg-[var(--color-stone-light,#e6d9bf)]" />
//                     <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)]" />
//                     <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-[var(--color-stone-light,#e6d9bf)]" />
//                   </div>
//                 ))}
//               </div>
//             )}

//             {state.status === "error" && (
//               <p className="text-sm text-[var(--color-stone,#6b6154)]">
//                 Couldn&apos;t load products right now.{" "}
//                 <span className="block text-xs opacity-70">({state.message})</span>
//               </p>
//             )}

//             {(state.status === "empty" || (state.status === "success" && products.length === 0)) && (
//               <p className="text-sm text-[var(--color-stone,#6b6154)]">No products in this collection yet.</p>
//             )}

//             {state.status === "success" && products.length > 0 && (
//               <div
//                 className={
//                   products.length <= 4
//                     ? "grid grid-cols-2 gap-x-6 gap-y-10"
//                     : "grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3"
//                 }
//               >
//                 {products.slice(0, 6).map((product, i) => (
//                   <ProductGridCard
//                     key={(product as any)._id ?? (product as any).id}
//                     product={product}
//                     index={i}
//                   />
//                 ))}
//               </div>
        
//             )}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, Heart, Pin, ShoppingBag, Star } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Product } from "@/lib/types";
import { ShopNowButton } from "@/components/Shopnowbutton";

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

// Backend stores prices as integer paise/cents — divide by 100 for display.
function formatPrice(value: number) {
  return `₹${(value / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
  const id = (product as any)._id ?? (product as any).id;
  const image = product.images?.[0];
  const hasDiscount = (product as any).discountPercent > 0;

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
        href={`/products/${(product as any).slug ?? id}`}
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
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-3 justify-center gap-2 pb-3 opacity-0 transition-all duration-500 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 sm:gap-3 sm:pb-5">
            {quickActions.map(({ Icon, label }, i) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={(e) => e.preventDefault()}
                style={{ transitionDelay: `${i * 70}ms` }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-gold-light,#efd6ae)] bg-white/70 text-[var(--color-gold,#b98a4e)] shadow-xl ring-1 ring-[var(--color-gold-light,#efd6ae)] backdrop-blur-lg transition-all duration-300 hover:scale-110 hover:bg-[var(--color-gold,#b98a4e)] hover:text-white sm:h-10 sm:w-10"
              >
                <Icon size={14} strokeWidth={1.5} className="sm:hidden" />
                <Icon size={17} strokeWidth={1.5} className="hidden sm:block" />
              </button>
            ))}
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
                {formatPrice((product as any).mrp)}
              </span>
            )}
            <span className="text-sm font-bold text-[var(--color-gold,#b98a4e)] sm:text-lg">
              {formatPrice((product as any).basePrice)}
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
    () => apiClient.get<any>(`/products?category=${tab.category}&limit=6`, { auth: false }),
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