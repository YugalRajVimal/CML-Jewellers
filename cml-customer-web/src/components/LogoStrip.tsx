"use client";

import { Reveal } from "@/components/motion/Reveal";

// Placeholder wordmarks in the reference's serif/sans style — swap for real
// partner logos when available.
const BRANDS = ["Maskan", "Sequencer", "Nomak", "Arcadium", "Modern"];

export function LogoStrip() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-8">
          {BRANDS.map((brand) => (
            <span
              key={brand}
              className="font-display text-xl tracking-wide text-[var(--color-stone)] opacity-70 transition-all duration-200 hover:scale-[1.08] hover:opacity-100"
            >
              {brand}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
