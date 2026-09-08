"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

const FEATURED = [
  { name: "Pearl Bird Necklace", price: "₹1,900 – ₹2,200", tag: "Ear Stud, Nose Stud" },
  { name: "Layered Gold Chain", price: "₹2,400", tag: "Necklace" },
  { name: "Citrine Drop Earrings", price: "₹1,650", tag: "Earrings" },
];

export function SplitPromoBanner() {
  const [index, setIndex] = useState(0);
  const current = FEATURED[index];

  function go(direction: 1 | -1) {
    setIndex((i) => (i + direction + FEATURED.length) % FEATURED.length);
  }

  return (
    <Reveal>
      <section className="grid gap-0 lg:grid-cols-2">
        <div className="aspect-[4/3] w-full bg-[var(--color-cream-deep)] lg:aspect-auto" aria-hidden />

        <div className="flex flex-col justify-center bg-[var(--color-maroon-deep)] px-8 py-16 text-center lg:px-16">
          <p className="eyebrow text-[var(--color-gold-light)]">Jewels as unique as you</p>
          <h2 className="mt-3 font-display text-4xl text-[var(--color-cream)]">Every Gem Tells A Story</h2>

          <div className="relative mx-auto mt-10 w-full max-w-xs">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[var(--color-cream)] p-4"
              >
                <div className="aspect-square w-full bg-[var(--color-cream-deep)]" aria-hidden />
                <p className="mt-4 text-xs text-[var(--color-gold)]">{current.tag}</p>
                <p className="font-display text-lg text-[var(--color-ink)]">{current.name}</p>
                <p className="mt-1 text-sm text-[var(--color-stone)]">{current.price}</p>
              </motion.div>
            </AnimatePresence>

            <button
              onClick={() => go(-1)}
              aria-label="Previous featured product"
              className="absolute left-0 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-[var(--color-ink)] text-[var(--color-cream)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next featured product"
              className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center bg-[var(--color-ink)] text-[var(--color-cream)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]"
            >
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
