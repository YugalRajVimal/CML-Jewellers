"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RevealGroup, revealItemVariants, motion } from "@/components/motion/Reveal";

const TILES = [
  {
    eyebrow: "New in",
    title: "Layered Necklaces",
    dark: true,
    image: "/Images/I0.jpg",
  },
  {
    eyebrow: "Bestsellers",
    title: "Statement Earrings",
    dark: false,
    image: "/Images/I5.jpg",
  },
  {
    eyebrow: "For every day",
    title: "Fine Bangles",
    dark: true,
    image: "/Images/I2.jpg",
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
            className={`flex aspect-[4/5] flex-col justify-end p-8 relative overflow-hidden ${
              tile.dark ? "bg-[var(--color-maroon-deep)]" : "bg-[var(--color-cream-deep)]"
            }`}
          >
            <img
              src={tile.image}
              alt={tile.title}
              className="absolute inset-0 h-full w-full object-cover object-center opacity-40"
              draggable={false}
              aria-hidden="true"
            />
            <div className="relative z-10">
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
            </div>
          </motion.div>
        ))}
      </RevealGroup>
    </section>
  );
}
