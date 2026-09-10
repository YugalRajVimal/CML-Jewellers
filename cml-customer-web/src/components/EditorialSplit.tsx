


"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { CurvedText } from "@/components/Curvedtext";
import { ShopNowButton } from "@/components/Shopnowbutton";

const STATS = [
  { value: "100", label: "Worldwide Branch" },
  { value: "250+", label: "Product Designs" },
  { value: "2K", label: "Products Reviews" },
  { value: "100K", label: "Happy Customers" },
];

// How far (in px) the floating corner image is allowed to drift as the
// mouse moves across the section — kept small so it reads as a subtle
// parallax wobble, not a drag.
const FLOAT_RANGE = 10;

export function AboutStatsSection() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 120, damping: 14, mass: 0.3 });
  const y = useSpring(rawY, { stiffness: 120, damping: 14, mass: 0.3 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduce || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(relX * FLOAT_RANGE * 2);
    rawY.set(relY * FLOAT_RANGE * 2);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="font-marcellus relative mx-auto   overflow-hidden px-6 py-16 lg:py-24"
    >
      <div className="grid gap-12 lg:grid-cols-2  lg:items-center lg:gap-16">
        {/* Left: arch image with curved headline + floating "Know More" badge */}
        <motion.div
          className="relative"
          initial={reduce ? undefined : { opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="relative mx-auto  w-2/3 max-h-[600px] overflow-hidden rounded-t-full bg-[var(--color-cream-deep,#f2e4cc)]">
            <img
              src="/Images/I2.jpg"
              alt="Model wearing gemstone jewellery"
              className="object-contain h-full  object-top"
              draggable={false}
            />

            {/* Curved headline following the dome of the image */}
            <CurvedText
              text="Embrace Your Birthstone's Power And Beauty"
              viewBoxSize={520}
              radius={170}
              startAngle={195}
              endAngle={-15}
              className="pointer-events-none absolute left-1/2 -top-15 w-[130%] -translate-x-1/2"
            />


          </div>

          {/* Floating "Know More" badge */}
          {/* <motion.button
            type="button"
            className="font-marcellus absolute bottom-10 left-1/2 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full bg-white/90 text-center text-sm leading-tight text-[var(--color-ink,#1c1c1c)] shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
            initial={reduce ? undefined : { opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Know
            <br />
            More
          </motion.button> */}
        </motion.div>

        {/* Right: copy, stats, quote, CTA */}
        <div className="relative">
          {/* Floating corner thumbnail — nudges with the mouse within a small range */}
          <motion.div
            className="absolute -top-6 right-0 z-10 hidden h-40 w-40 overflow-hidden rounded-full shadow-xl sm:block lg:h-48 lg:w-48"
            style={{ x, y }}
          >
            <img
              src="/Images/I4.jpg"
              alt="Layered necklace detail"
              className="h-full w-full object-cover"
              draggable={false}
            />
          </motion.div>

          <motion.p
            className="text-xs tracking-[0.35em] text-[var(--color-ink,#1c1c1c)]"
            initial={reduce ? undefined : { opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            BORN TO SHINE, CRAFTED TO LAST
          </motion.p>

          <motion.h2
            className="mt-4 max-w-lg text-4xl leading-[1.15] font-marcellus text-[var(--color-ink,#1c1c1c)] lg:text-[42px]"
            initial={reduce ? undefined : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            A Gem For Every Birthday, A Story For Every Stone
          </motion.h2>

          <motion.p
            className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--color-stone,#6b6154)]"
            initial={reduce ? undefined : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Vestibulum Vehicula Nunc Ad Fringilla Pretium Ex Ac Praesent Vitae. Conubia Egestas
            Porta Per Maximus Sem Congue! Vulputate Tristique Interdum Consectetur Mollis Nulla
            Etiam Quam Lacinia Molestie.
          </motion.p>

          {/* Stats grid — now part of the same section */}
          <motion.div
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-[var(--color-cream-deep,#f2e4cc)] px-4 py-6 text-center"
              >
                <p className="text-3xl text-[var(--color-ink,#1c1c1c)]">{stat.value}</p>
                <p className="mt-1 text-xs text-[var(--color-stone,#6b6154)] sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.p
            className="mt-6 max-w-lg text-[15px] italic text-[var(--color-stone,#6b6154)]"
            initial={reduce ? undefined : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            &ldquo;Maecenas Porta Id Nibh Quis Imperdiet. Quisque Hendrerit, Justo Egestas Fermentum
            Pulvinar&rdquo;
          </motion.p>

          <motion.div
            className="mt-7"
            initial={reduce ? undefined : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <ShopNowButton />
          </motion.div>
        </div>
      </div>
    </section>
  );
}