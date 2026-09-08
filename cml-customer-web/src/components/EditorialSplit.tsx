"use client";

import Link from "next/link";
import { ArrowRight, Gem, Gift, HeartHandshake } from "lucide-react";
import { Reveal, RevealGroup, revealItemVariants, motion } from "@/components/motion/Reveal";

const FEATURES = [
  {
    icon: Gift,
    title: "Gift Collection",
    copy: "Pieces sized and boxed for giving, with a note card included.",
  },
  {
    icon: Gem,
    title: "Diamond Jewellery",
    copy: "Certified stones set by hand in our Jaipur workshop.",
  },
  {
    icon: HeartHandshake,
    title: "Wedding Rings",
    copy: "Custom fittings and engraving, ready in two weeks.",
  },
];

export function EditorialSplit() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <Reveal className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="aspect-[4/3] w-full bg-[var(--color-cream-deep)]" aria-hidden />
        <div>
          <p className="eyebrow">Made to last</p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-[var(--color-ink)]">
            Every piece is finished by the same hands that started it
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--color-stone)]">
            No two workshops finish gold the same way. Ours has been doing it for three
            generations — polishing, setting, and inspecting every piece before it leaves.
          </p>
          <Link href="/shop" className="pill mt-6">
            Shop now
            <span className="pill-icon">
              <ArrowRight size={13} strokeWidth={2} />
            </span>
          </Link>
        </div>
      </Reveal>

      <RevealGroup className="mt-16 grid divide-y divide-[var(--color-stone-light)] border-t border-[var(--color-stone-light)] pt-12 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {FEATURES.map((feature) => (
          <motion.div
            key={feature.title}
            variants={revealItemVariants}
            className="flex flex-col items-center px-6 pb-8 pt-8 text-center first:pt-0 sm:py-0 sm:first:pt-0"
          >
            <feature.icon size={28} strokeWidth={1.2} className="text-[var(--color-maroon)]" />
            <p className="mt-4 font-display text-xl text-[var(--color-ink)]">{feature.title}</p>
            <p className="mt-2 text-sm text-[var(--color-stone)]">{feature.copy}</p>
          </motion.div>
        ))}
      </RevealGroup>
    </section>
  );
}
