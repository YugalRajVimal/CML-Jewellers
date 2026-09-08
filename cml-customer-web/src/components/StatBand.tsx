"use client";

import { RevealGroup, revealItemVariants, motion } from "@/components/motion/Reveal";

const STATS = [
  { value: "12", label: "Retail Partners" },
  { value: "180+", label: "Product Designs" },
  { value: "3.2K", label: "Verified Reviews" },
  { value: "22K", label: "Happy Customers" },
];

export function StatBand() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((stat) => (
          <motion.div
            key={stat.label}
            variants={revealItemVariants}
            className="bg-[var(--color-cream-deep)] px-6 py-8 text-center"
          >
            <p className="font-display text-4xl text-[var(--color-ink)]">{stat.value}</p>
            <p className="mt-2 text-sm text-[var(--color-stone)]">{stat.label}</p>
          </motion.div>
        ))}
      </RevealGroup>
    </section>
  );
}
