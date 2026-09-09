"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import { Sparkle } from "@/components/motion/Sparkle";

const TESTIMONIALS = [
  {
    quote:
      "The necklace arrived exactly as pictured, and the box alone felt like part of the gift. My mother hasn't taken it off since.",
    name: "Ananya R.",
    location: "Mumbai",
  },
  {
    quote:
      "I asked for a custom ring size and had it in ten days. The finish is better than pieces I've bought abroad.",
    name: "Devika S.",
    location: "Bengaluru",
  },
  {
    quote:
      "Ordered earrings for a wedding and the customer support team helped me pick the right metal tone over chat.",
    name: "Priya K.",
    location: "Delhi",
  },
];

const AUTO_ADVANCE_MS = 6000;

export function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const current = TESTIMONIALS[active];

  useEffect(() => {
    if (paused || reduce) return;
    const timer = setTimeout(() => {
      setActive((i) => (i + 1) % TESTIMONIALS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [active, paused, reduce]);

  return (
    <Reveal>
      <section
        className="mx-auto max-w-7xl px-6 py-16"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Customer voices</p>
            <h2 className="mt-3 font-display text-4xl text-[var(--color-ink)]">Our customers speak for us</h2>

            <div className="relative mt-6 min-h-[120px]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={active}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-lg text-lg leading-relaxed text-[var(--color-stone)]"
                >
                  &ldquo;{current.quote}&rdquo;
                </motion.p>
              </AnimatePresence>
            </div>

            <p className="mt-6 font-display text-lg text-[var(--color-ink)]">
              — {current.name}, <span className="text-[var(--color-stone)]">{current.location}</span>
            </p>

            <div className="mt-8 flex items-center gap-3">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Show testimonial ${i + 1}`}
                  onClick={() => setActive(i)}
                  className="relative h-px w-10 overflow-hidden bg-[var(--color-stone-light)]"
                >
                  {i === active && !reduce && (
                    <motion.span
                      key={active}
                      className="absolute inset-y-0 left-0 bg-[var(--color-gold)]"
                      initial={{ width: "0%" }}
                      animate={{ width: paused ? undefined : "100%" }}
                      transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: "linear" }}
                    />
                  )}
                  {i === active && reduce && <span className="absolute inset-0 bg-[var(--color-gold)]" />}
                  {i < active && <span className="absolute inset-0 bg-[var(--color-gold)]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className="h-full w-full  rounded-t-[70%] bg-[var(--color-cream-deep)] overflow-hidden" aria-hidden>
              <img
                src="/Images/I6.jpg"
                alt="Customer testimonial collage"
                className="h-full w-full object-cover object-center"
                draggable={false}
              />
            </div>
            <Sparkle className="absolute -right-2 -top-2" size={36} />
          </div>
        </div>
      </section>
    </Reveal>
  );
}
