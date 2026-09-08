"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { User, Heart, ShoppingBag, Search, Menu, X } from "lucide-react";

// lucide-react's current major dropped brand marks, so the thin top-bar
// social icons are small inline SVGs instead of a second icon package.
function SocialIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden>
      <path d={path} />
    </svg>
  );
}

const SOCIAL_PATHS = {
  facebook:
    "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z",
  instagram:
    "M12 2c2.7 0 3.1 0 4.1.1 1.1 0 1.8.2 2.5.4a5 5 0 0 1 2.9 2.9c.2.7.4 1.4.4 2.5.1 1 .1 1.4.1 4.1s0 3.1-.1 4.1c0 1.1-.2 1.8-.4 2.5a5 5 0 0 1-2.9 2.9c-.7.2-1.4.4-2.5.4-1 .1-1.4.1-4.1.1s-3.1 0-4.1-.1c-1.1 0-1.8-.2-2.5-.4a5 5 0 0 1-2.9-2.9c-.2-.7-.4-1.4-.4-2.5C2 15.1 2 14.7 2 12s0-3.1.1-4.1c0-1.1.2-1.8.4-2.5a5 5 0 0 1 2.9-2.9c.7-.2 1.4-.4 2.5-.4C8.9 2 9.3 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.4 6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z",
  youtube:
    "M23 12s0-3.4-.4-5a3 3 0 0 0-2.1-2.1C18.9 4.5 12 4.5 12 4.5s-6.9 0-8.5.4A3 3 0 0 0 1.4 7C1 8.6 1 12 1 12s0 3.4.4 5a3 3 0 0 0 2.1 2.1c1.6.4 8.5.4 8.5.4s6.9 0 8.5-.4A3 3 0 0 0 22.6 17c.4-1.6.4-5 .4-5ZM9.8 15.5v-7l6 3.5-6 3.5Z",
  twitter:
    "M22 5.9c-.7.3-1.5.6-2.3.7a4 4 0 0 0 1.8-2.2 8 8 0 0 1-2.5 1 4 4 0 0 0-6.9 3.6A11.3 11.3 0 0 1 3.9 4.9a4 4 0 0 0 1.2 5.3c-.6 0-1.2-.2-1.7-.5v.1a4 4 0 0 0 3.2 3.9 4 4 0 0 1-1.8.1 4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.6a11.3 11.3 0 0 0 6.1 1.8c7.3 0 11.3-6 11.3-11.3v-.5A8 8 0 0 0 22 5.9Z",
};

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
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

  return (
    <header className="sticky top-0 z-40">
      {/* Thin top bar — collapses out of view once the page is scrolled */}
      <AnimatePresence initial={false}>
        {!condensed && (
          <motion.div
            className="overflow-hidden bg-[var(--color-ink)] text-[var(--color-stone-light)]"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs">
              <div className="hidden items-center gap-4 sm:flex">
                <a href="#" aria-label="Facebook" className="hover:text-[var(--color-gold-light)]">
                  <SocialIcon path={SOCIAL_PATHS.facebook} />
                </a>
                <a href="#" aria-label="Instagram" className="hover:text-[var(--color-gold-light)]">
                  <SocialIcon path={SOCIAL_PATHS.instagram} />
                </a>
                <a href="#" aria-label="Twitter" className="hover:text-[var(--color-gold-light)]">
                  <SocialIcon path={SOCIAL_PATHS.twitter} />
                </a>
                <a href="#" aria-label="YouTube" className="hover:text-[var(--color-gold-light)]">
                  <SocialIcon path={SOCIAL_PATHS.youtube} />
                </a>
              </div>
              <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                <span>Customer Support (+91 98765 43210)</span>
                <span className="hidden sm:inline">INR, ₹</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main header row */}
      <div className="bg-[var(--color-cream)] transition-shadow" style={{ boxShadow: condensed ? "0 1px 0 var(--color-stone-light)" : "none" }}>
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-[padding] duration-200 ${
            condensed ? "py-3" : "py-5"
          }`}
        >
          <button
            className="flex h-11 w-11 items-center justify-center lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>

          <Link href="/" className="font-display text-2xl tracking-wide text-[var(--color-maroon)]">
            CML <span className="text-[var(--color-gold)]">Jewellers</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 text-sm tracking-wide transition-colors hover:text-[var(--color-gold)] ${
                    active ? "text-[var(--color-gold)]" : "text-[var(--color-ink)]"
                  }`}
                >
                  {link.href === "/" && <span aria-hidden className="text-[var(--color-gold)]">+</span>}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-5">
            <Link href="/search" aria-label="Search" className="hidden sm:flex h-11 w-11 items-center justify-center">
              <Search size={20} strokeWidth={1.5} />
            </Link>
            <Link
              href="/account"
              aria-label="Account"
              className="hidden h-11 w-11 items-center justify-center sm:flex"
            >
              <User size={20} strokeWidth={1.5} />
            </Link>
            <Link href="/wishlist" aria-label="Wishlist" className="relative flex h-11 w-11 items-center justify-center">
              <Heart size={20} strokeWidth={1.5} />
            </Link>
            <Link href="/cart" aria-label="Cart" className="relative flex h-11 w-11 items-center justify-center">
              <ShoppingBag size={20} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="absolute left-0 top-0 flex h-full w-72 flex-col bg-[var(--color-cream)] p-6"
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
                  className="font-display text-lg text-[var(--color-ink)]"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-6 border-t border-[var(--color-stone-light)] pt-6 text-sm">
                <Link href="/search" onClick={() => setMobileOpen(false)}>
                  Search
                </Link>
                <Link href="/account" onClick={() => setMobileOpen(false)}>
                  Account
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
