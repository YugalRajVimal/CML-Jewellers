"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RevealGroup, revealItemVariants, motion } from "@/components/motion/Reveal";

const TILES = [
  {
    eyebrow: "New in",
    title: "Layered Necklaces",
    dark: true,
  },
  {
    eyebrow: "Bestsellers",
    title: "Statement Earrings",
    dark: false,
  },
  {
    eyebrow: "For every day",
    title: "Fine Bangles",
    dark: true,
  },
];

export function PromoTiles() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <RevealGroup className="grid gap-6 sm:grid-cols-3">
        {TILES.map((tile) => (
          <motion.div
            key={tile.title}
            variants={revealItemVariants}
            className={`flex aspect-[4/5] flex-col justify-end p-8 ${
              tile.dark ? "bg-[var(--color-maroon-deep)]" : "bg-[var(--color-cream-deep)]"
            }`}
          >
            <p className={`eyebrow ${tile.dark ? "" : "text-[var(--color-maroon)]"}`}>{tile.eyebrow}</p>
            <h3
              className={`mt-2 font-display text-2xl ${
                tile.dark ? "text-[var(--color-cream)]" : "text-[var(--color-ink)]"
              }`}
            >
              {tile.title}
            </h3>
            <Link href="/shop" className="pill mt-5 w-fit">
              Shop now
              <span className="pill-icon">
                <ArrowRight size={13} strokeWidth={2} />
              </span>
            </Link>
          </motion.div>
        ))}
      </RevealGroup>
    </section>
  );
}
