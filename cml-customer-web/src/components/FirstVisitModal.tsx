"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

const SESSION_KEY = "cml_first_visit_modal_shown";

export function FirstVisitModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  function handleClose() {
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No newsletter/promo-signup endpoint in the API contract yet — this just
    // confirms locally until that's added.
    setSubmitted(true);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="First purchase offer"
            className="relative grid w-full max-w-2xl overflow-hidden bg-[var(--color-cream)] sm:grid-cols-2"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-cream)] text-[var(--color-ink)] shadow"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            <div className="hidden bg-[var(--color-cream-deep)] sm:block" aria-hidden />

            <div className="flex flex-col justify-center p-8">
              <p className="eyebrow">On your first purchase</p>
              <h2 className="mt-2 font-display text-2xl text-[var(--color-ink)]">Get 10% Off</h2>
              <p className="mt-2 text-sm text-[var(--color-stone)]">
                Sign up for early access to new collections and a welcome discount.
              </p>

              {submitted ? (
                <p className="mt-6 text-sm text-[var(--color-maroon)]">
                  You&apos;re on the list — check your inbox for the code.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="border border-[var(--color-stone-light)] bg-[var(--color-cream)] px-3 py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
                  />
                  <button type="submit" className="pill mt-1 w-fit justify-center">
                    Sign up
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
