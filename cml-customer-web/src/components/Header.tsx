// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useEffect, useState } from "react";
// import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
// import { User, Heart, ShoppingBag, Search, Menu, X, ChevronDown } from "lucide-react";
// import { FaThreads } from "react-icons/fa6";
// import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

// // lucide-react's current major dropped brand marks, so the thin top-bar
// // social icons are small inline SVGs instead of a second icon package.
// function SocialIcon({ path }: { path: string }) {
//   return (
//     <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" aria-hidden>
//       <path d={path} />
//     </svg>
//   );
// }


// const NAV_LINKS: { label: string; href: string; hasDropdown?: boolean }[] = [
//   { label: "Home", href: "/" },
//   { label: "Shop", href: "/shop" },
//   { label: "About Us", href: "/about" },
//   { label: "Contact Us", href: "/contact" },
// ];

// export function Header() {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [condensed, setCondensed] = useState(false);
//   const pathname = usePathname();
//   const reduce = useReducedMotion();

//   useEffect(() => {
//     function onScroll() {
//       setCondensed(window.scrollY > 80);
//     }
//     window.addEventListener("scroll", onScroll, { passive: true });
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   return (
//     <header className="sticky top-0 z-40">
//       {/* Thin top bar — collapses out of view once the page is scrolled */}
//       <AnimatePresence initial={false}>
//         {!condensed && (
//           <motion.div
//             className="overflow-hidden bg-[#0A0A0A] text-white"
//             initial={reduce ? false : { height: 0, opacity: 0 }}
//             animate={{ height: "auto", opacity: 1 }}
//             exit={reduce ? undefined : { height: 0, opacity: 0 }}
//             transition={{ duration: 0.25, ease: "easeInOut" }}
//           >
//             <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 text-[13px] tracking-wide">
//               <div className="hidden items-center gap-5 sm:flex">
//                 <a href="#" aria-label="Threads" className="opacity-90 transition-opacity hover:opacity-100">
//                   <span className="inline-flex items-center justify-center">
//                     <FaThreads size={15} />
//                   </span>
//                 </a>
//                 <a href="#" aria-label="Instagram" className="opacity-90 transition-opacity hover:opacity-100">
//                   <span className="inline-flex items-center justify-center">
//                     <FaInstagram size={15} />
//                   </span>
//                 </a>
//                 <a href="#" aria-label="Facebook" className="opacity-90 transition-opacity hover:opacity-100">
//                   <span className="inline-flex items-center justify-center">
//                     <FaFacebookF size={15} />
//                   </span>
//                 </a>
//                 <a href="#" aria-label="YouTube" className="opacity-90 transition-opacity hover:opacity-100">
//                   <span className="inline-flex items-center justify-center">
//                     <FaYoutube size={15} />
//                   </span>
//                 </a>
//                 <a href="#" aria-label="Twitter" className="opacity-90 transition-opacity hover:opacity-100">
//                   <span className="inline-flex items-center justify-center">
//                     <FaTwitter size={15} />
//                   </span>
//                 </a>
           
//               </div>
//               <div className="flex w-full items-center justify-between gap-6 sm:w-auto sm:justify-end">
//                 <span className="whitespace-nowrap">Customer Support (+91 98765 43210)</span>
//                 <button className="hidden items-center gap-1 sm:flex">
//                   INR, ₹
//                   <ChevronDown size={13} strokeWidth={2} />
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Main header row */}
//       <div
//         className="bg-[#FBF4EC] transition-shadow"
//         style={{ boxShadow: condensed ? "0 1px 0 var(--color-stone-light, #e6dccb)" : "none" }}
//       >
//         <div
//           className={`mx-auto flex  items-center justify-between px-6 transition-[padding] duration-200 ${
//             condensed ? "py-4" : "py-6"
//           }`}
//         >
//           <button
//             className="flex h-11 w-11 items-center justify-center lg:hidden"
//             aria-label="Open menu"
//             onClick={() => setMobileOpen(true)}
//           >
//             <Menu size={24} strokeWidth={1.5} />
//           </button>

//           {/* Logo */}
//           <Link href="/" className="flex items-center gap-3">
//             <span className="flex h-20 items-center justify-center rounded-full ">
//               <img
//                 src="/logo.png"
//                 alt="CML Jewellers logo"
//                 height={40}
//                 className="object-contain h-20 rounded-md"
//                 draggable={false}
//               />
//             </span>

//           </Link>
    

//           {/* Nav */}
//           <nav aria-label="Main" className="hidden items-center gap-10 lg:flex">
//             {NAV_LINKS.map((link) => {
//               const active = pathname === link.href;
//               return (
//                 <Link
//                   key={link.href}
//                   href={link.href}
//                   aria-current={active ? "page" : undefined}
//                   className={`flex items-center gap-1.5 text-[17px] tracking-wide transition-colors hover:text-[#B98A4E] ${
//                     active ? "text-[#B98A4E]" : "text-[#1C1C1C]"
//                   }`}
//                 >
//                   {link.href === "/" && (
//                     <span aria-hidden className="text-[#B98A4E]">
//                       +
//                     </span>
//                   )}
//                   {link.label}
//                   {link.hasDropdown && <ChevronDown size={15} strokeWidth={1.75} className="mt-0.5 opacity-70" />}
//                 </Link>
//               );
//             })}
//           </nav>

//           {/* Right icons */}
//           <div className="flex items-center gap-7 sm:gap-9">
//             <Link
//               href="/account"
//               aria-label="Account"
//               className="hidden flex-col items-center gap-1.5 sm:flex"
//             >
//               <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1C1C1C]/70">
//                 <User size={18} strokeWidth={1.5} />
//               </span>
//               <span className="text-[13px] tracking-wide text-[#1C1C1C]">Log In</span>
//             </Link>

//             <Link href="/cart" aria-label="Cart" className="relative flex flex-col items-center gap-1.5">
//               <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#1C1C1C]/70">
//                 <ShoppingBag size={18} strokeWidth={1.5} />
//                 <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0F2D2E] text-[10px] text-white">
//                   0
//                 </span>
//               </span>
//               <span className="text-[13px] tracking-wide text-[#1C1C1C]">Cart</span>
//             </Link>

//             <Link href="/wishlist" aria-label="Wishlist" className="relative flex flex-col items-center gap-1.5">
//               <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#1C1C1C]/70">
//                 <Heart size={18} strokeWidth={1.5} />
//                 <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0F2D2E] text-[10px] text-white">
//                   0
//                 </span>
//               </span>
//               <span className="text-[13px] tracking-wide text-[#1C1C1C]">Wishlist</span>
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* Mobile drawer */}
//       {mobileOpen && (
//         <div className="fixed inset-0 z-50 lg:hidden">
//           <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden />
//           <div
//             role="dialog"
//             aria-modal="true"
//             aria-label="Site menu"
//             className="absolute left-0 top-0 flex h-full w-72 flex-col bg-[#FBF4EC] p-6"
//           >
//             <button
//               className="mb-8 flex h-11 w-11 items-center justify-center self-end"
//               aria-label="Close menu"
//               onClick={() => setMobileOpen(false)}
//             >
//               <X size={22} strokeWidth={1.5} />
//             </button>
//             <nav className="flex flex-col gap-6">
//               {NAV_LINKS.map((link) => (
//                 <Link
//                   key={link.href}
//                   href={link.href}
//                   aria-current={pathname === link.href ? "page" : undefined}
//                   className="font-display text-lg text-[#1C1C1C]"
//                   onClick={() => setMobileOpen(false)}
//                   style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)" }}
//                 >
//                   {link.label}
//                 </Link>
//               ))}
//               <div className="mt-4 flex flex-col gap-6 border-t border-[#E6DCCB] pt-6 text-sm">
//                 <Link href="/search" onClick={() => setMobileOpen(false)}>
//                   Search
//                 </Link>
//                 <Link href="/account" onClick={() => setMobileOpen(false)}>
//                   Account
//                 </Link>
//               </div>
//             </nav>
//           </div>
//         </div>
//       )}
//     </header>
//   );
// }

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { User, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { FaThreads } from "react-icons/fa6";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

const NAV_LINKS: { label: string; href: string; hasDropdown?: boolean }[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

const SOCIALS = [
  { Icon: FaThreads, label: "Threads" },
  { Icon: FaInstagram, label: "Instagram" },
  { Icon: FaFacebookF, label: "Facebook" },
  { Icon: FaYoutube, label: "YouTube" },
  { Icon: FaTwitter, label: "Twitter" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  useEffect(() => {
    function onScroll() {
      setCondensed(window.scrollY > 80);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40">
      {/* Thin top bar — collapses out of view once the page is scrolled */}
      <AnimatePresence initial={false}>
        {!condensed && (
          <motion.div
            className="overflow-hidden bg-[#0A0A0A] text-white"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1.5 px-4 py-2.5 text-[11px] tracking-wide sm:flex-row sm:gap-6 sm:px-6 sm:py-3 sm:text-[13px]">
              <div className="hidden items-center gap-4 sm:flex sm:gap-5">
                {SOCIALS.map(({ Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="opacity-90 transition-opacity hover:opacity-100"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
              <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-6">
                <span className="truncate whitespace-nowrap">Customer Support (+91 98765 43210)</span>
                <button className="hidden shrink-0 items-center gap-1 sm:flex">
                  INR, ₹
                  <ChevronDown size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main header row */}
      <div
        className="bg-[#FBF4EC] transition-shadow"
        style={{ boxShadow: condensed ? "0 1px 0 var(--color-stone-light, #e6dccb)" : "none" }}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 transition-[padding] duration-200 sm:px-6 ${
            condensed ? "py-3 sm:py-4" : "py-4 sm:py-6"
          }`}
        >
         
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="flex items-center justify-center rounded-full">
              <img
                src="/logo.png"
                alt="CML Jewellers logo"
                className="h-12 w-auto rounded-md object-contain sm:h-16 lg:h-20"
                draggable={false}
              />
            </span>
          </Link>

          {/* Nav */}
          <nav aria-label="Main" className="hidden items-center gap-6 lg:flex xl:gap-10">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 whitespace-nowrap text-[15px] tracking-wide transition-colors hover:text-[#B98A4E] xl:text-[17px] ${
                    active ? "text-[#B98A4E]" : "text-[#1C1C1C]"
                  }`}
                >
                  {link.href === "/" && (
                    <span aria-hidden className="text-[#B98A4E]">
                      +
                    </span>
                  )}
                  {link.label}
                  {link.hasDropdown && (
                    <ChevronDown size={15} strokeWidth={1.75} className="mt-0.5 opacity-70" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right icons */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-6 lg:gap-9">
            <Link
              href="/account"
              aria-label="Account"
              className="hidden flex-col items-center gap-1.5 sm:flex"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1C1C1C]/70">
                <User size={18} strokeWidth={1.5} />
              </span>
              <span className="hidden text-[13px] tracking-wide text-[#1C1C1C] lg:block">Log In</span>
            </Link>

            <Link href="/cart" aria-label="Cart" className="relative flex flex-col items-center gap-1.5">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#1C1C1C]/70">
                <ShoppingBag size={18} strokeWidth={1.5} />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0F2D2E] text-[10px] text-white">
                  0
                </span>
              </span>
              <span className="hidden text-[13px] tracking-wide text-[#1C1C1C] lg:block">Cart</span>
            </Link>

            <Link href="/wishlist" aria-label="Wishlist" className="relative flex flex-col items-center gap-1.5">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#1C1C1C]/70">
                <Heart size={18} strokeWidth={1.5} />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0F2D2E] text-[10px] text-white">
                  0
                </span>
              </span>
              <span className="hidden text-[13px] tracking-wide text-[#1C1C1C] lg:block">Wishlist</span>
            </Link>

            <button
            className="flex h-10 w-10 shrink-0 items-center justify-center lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
          </div>
          

        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="absolute left-0 top-0 flex h-full w-[85vw] max-w-72 flex-col bg-[#FBF4EC] p-6"
              initial={reduce ? { opacity: 0 } : { x: "-100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <button
                className="mb-8 flex h-11 w-11 items-center justify-center self-end"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <X size={22} strokeWidth={1.5} />
              </button>
              <nav className="flex flex-col gap-6">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="font-display text-lg text-[#1C1C1C]"
                    onClick={() => setMobileOpen(false)}
                    style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)" }}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-6 border-t border-[#E6DCCB] pt-6 text-sm">
                  <Link href="/account" onClick={() => setMobileOpen(false)}>
                    Account
                  </Link>
                  <Link href="/cart" onClick={() => setMobileOpen(false)}>
                    Cart
                  </Link>
                  <Link href="/wishlist" onClick={() => setMobileOpen(false)}>
                    Wishlist
                  </Link>
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-[#E6DCCB] pt-6">
                  {SOCIALS.map(({ Icon, label }) => (
                    <a key={label} href="#" aria-label={label} className="text-[#1C1C1C]">
                      <Icon size={16} />
                    </a>
                  ))}
                </div>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}