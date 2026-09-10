"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const FEATURES = [
  "Brilliant Cut Quality",
  "Natural Color Grade",
  "High Clarity Rating",
  "Precise Carat Weight",
  "Elegant Setting Style",
  "Durable Metal Choice",
];

function StarBullet() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden className="text-[var(--color-gold,#b98a4e)]">
      <path d="M12 0c.6 4.8 2.2 8 4 9.8 1.8 1.8 5 3.4 8 4-3 .6-6.2 2.2-8 4-1.8 1.8-3.4 5-4 8-.6-3-2.2-6.2-4-8-1.8-1.8-5-3.4-8-4 3-.6 6.2-2.2 8-4 1.8-1.8 3.4-5 4-9.8Z" />
    </svg>
  );
}

export function QualitySection() {
  const reduce = useReducedMotion();

  return (
    <section className="font-marcellus relative mx-auto max-w-7xl overflow-hidden px-6 py-16 lg:py-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        {/* Left: copy + feature grid */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-xs tracking-[0.35em] text-[var(--color-gold,#b98a4e)]">
            JEWELS AS UNIQUE AS YOU
          </p>

          <h2 className="mt-4 text-4xl leading-[1.15] text-[var(--color-ink,#1c1c1c)] lg:text-[42px]">
            Commitment, Forever, In Every Sparkling Jewel
          </h2>

          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--color-stone,#6b6154)]">
            Vestibulum Augue Nibh, Elementum Eget Ante Nec, Consectetur Viverra Leo. Curabitur
            Sit Amet Dignissim Erat. Aenean Fringilla Pretium Elit, Et Eleifend Orci Cursus A.
            Aenean Bibendum Faucibus Semper. Vestibulum Pretium Dictum Lacus Eget Sodales.
            Aliquam Fermentum.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature}
                className="flex items-center gap-3"
                initial={reduce ? undefined : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <StarBullet />
                <span className="text-[15px] text-[var(--color-ink,#1c1c1c)]">{feature}</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            type="button"
            className="mt-10 inline-flex items-center gap-5 bg-[var(--color-ink,#0a0a0a)] py-3.5 pl-7 pr-2.5 text-[15px] text-white"
            initial={reduce ? undefined : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Know More
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--color-ink,#0a0a0a)]">
              <ArrowRight size={15} strokeWidth={2} />
            </span>
          </motion.button>
        </motion.div>

        {/* Right: arch image with gold outline + floating detail shot */}
        <motion.div
          className="relative"
          initial={reduce ? undefined : { opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="relative mx-auto max-w-md">
            {/* Gold arch outline, offset behind the image */}
            <div className="absolute -inset-3 rounded-t-full border border-[var(--color-gold,#b98a4e)]" />

            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-full bg-[var(--color-cream-deep,#f2e4cc)]">
              <img
                src="/Images/I4.jpg"
                alt="Model wearing statement jewellery"
                className="h-full w-full object-cover object-top"
                draggable={false}
              />
            </div>

            {/* Floating circular detail shot */}
            <motion.div
              className="absolute -bottom-10 -left-10 h-40 w-40 overflow-hidden rounded-full border-4 border-[var(--color-cream,#fdf3ea)] shadow-xl sm:h-48 sm:w-48"
              initial={reduce ? undefined : { opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <img
                src="/Images/I6.jpg"
                alt="Earring detail close up"
                className="h-full w-full object-cover"
                draggable={false}
              />
            </motion.div>

            {/* Decorative sparkle, bottom-right of the whole block */}
            <motion.span
              className="absolute -bottom-6 -right-2 text-[var(--color-ink,#1c1c1c)]"
              animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], rotate: [-12, 12, -12] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width={26} height={26} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 0c.6 4.8 2.2 8 4 9.8 1.8 1.8 5 3.4 8 4-3 .6-6.2 2.2-8 4-1.8 1.8-3.4 5-4 8-.6-3-2.2-6.2-4-8-1.8-1.8-5-3.4-8-4 3-.6 6.2-2.2 8-4 1.8-1.8 3.4-5 4-9.8Z" />
              </svg>
            </motion.span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}