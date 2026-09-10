// "use client";

// import { useEffect, useState } from "react";
// import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// import { Reveal } from "@/components/motion/Reveal";
// import { Sparkle } from "@/components/motion/Sparkle";

// const TESTIMONIALS = [
//   {
//     quote:
//       "The necklace arrived exactly as pictured, and the box alone felt like part of the gift. My mother hasn't taken it off since.",
//     name: "Ananya R.",
//     location: "Mumbai",
//   },
//   {
//     quote:
//       "I asked for a custom ring size and had it in ten days. The finish is better than pieces I've bought abroad.",
//     name: "Devika S.",
//     location: "Bengaluru",
//   },
//   {
//     quote:
//       "Ordered earrings for a wedding and the customer support team helped me pick the right metal tone over chat.",
//     name: "Priya K.",
//     location: "Delhi",
//   },
// ];

// const AUTO_ADVANCE_MS = 6000;

// export function Testimonials() {
//   const [active, setActive] = useState(0);
//   const [paused, setPaused] = useState(false);
//   const reduce = useReducedMotion();
//   const current = TESTIMONIALS[active];

//   useEffect(() => {
//     if (paused || reduce) return;
//     const timer = setTimeout(() => {
//       setActive((i) => (i + 1) % TESTIMONIALS.length);
//     }, AUTO_ADVANCE_MS);
//     return () => clearTimeout(timer);
//   }, [active, paused, reduce]);

//   return (
//     <Reveal>
//       <section
//         className="mx-auto max-w-7xl px-6 py-16"
//         onMouseEnter={() => setPaused(true)}
//         onMouseLeave={() => setPaused(false)}
//       >
//         <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
//           <div>
//             <p className="eyebrow">Customer voices</p>
//             <h2 className="mt-3 font-display text-4xl text-[var(--color-ink)]">Our customers speak for us</h2>

//             <div className="relative mt-6 min-h-[120px]">
//               <AnimatePresence mode="wait">
//                 <motion.p
//                   key={active}
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   transition={{ duration: 0.4 }}
//                   className="max-w-lg text-lg leading-relaxed text-[var(--color-stone)]"
//                 >
//                   &ldquo;{current.quote}&rdquo;
//                 </motion.p>
//               </AnimatePresence>
//             </div>

//             <p className="mt-6 font-display text-lg text-[var(--color-ink)]">
//               — {current.name}, <span className="text-[var(--color-stone)]">{current.location}</span>
//             </p>

//             <div className="mt-8 flex items-center gap-3">
//               {TESTIMONIALS.map((_, i) => (
//                 <button
//                   key={i}
//                   aria-label={`Show testimonial ${i + 1}`}
//                   onClick={() => setActive(i)}
//                   className="relative h-px w-10 overflow-hidden bg-[var(--color-stone-light)]"
//                 >
//                   {i === active && !reduce && (
//                     <motion.span
//                       key={active}
//                       className="absolute inset-y-0 left-0 bg-[var(--color-gold)]"
//                       initial={{ width: "0%" }}
//                       animate={{ width: paused ? undefined : "100%" }}
//                       transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: "linear" }}
//                     />
//                   )}
//                   {i === active && reduce && <span className="absolute inset-0 bg-[var(--color-gold)]" />}
//                   {i < active && <span className="absolute inset-0 bg-[var(--color-gold)]" />}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <div className="relative mx-auto aspect-square w-full max-w-sm">
//             <div className="h-full w-full  rounded-t-[70%] bg-[var(--color-cream-deep)] overflow-hidden" aria-hidden>
//               <img
//                 src="/Images/I6.jpg"
//                 alt="Customer testimonial collage"
//                 className="h-full w-full object-cover object-center"
//                 draggable={false}
//               />
//             </div>
//             <Sparkle className="absolute -right-2 -top-2" size={36} />
//           </div>
//         </div>
//       </section>
//     </Reveal>
//   );
// }



"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";

const TESTIMONIALS = [
  {
    quote:
      "Ullamcorper Bibendum Sociosqu Sapien Sociosqu Praesent Nulla Primis Tincidunt. Ligula Nec Lorem Justo Diam Congue; Magna Elit. Dapibus Laoreet Sit Curabitur Habitant Laoreet Libero. Ut Odio Nulla Orci Ullamcorper Massa Per. Enim Sit Condimentum Mauris Convallis Egestas Gravida Purus Molestie. Efficitur Vivamus Hac Eleifend Faucibus Ultrices Class Sodales Mus.",
    name: "Charlotte",
    location: "France",
    avatar: "/Images/testimonial-1.jpg",
  },
  {
    quote:
      "The necklace arrived exactly as pictured, and the box alone felt like part of the gift. My mother hasn't taken it off since.",
    name: "Ananya",
    location: "Mumbai",
    avatar: "/Images/testimonial-2.jpg",
  },
  {
    quote:
      "I asked for a custom ring size and had it in ten days. The finish is better than pieces I've bought abroad.",
    name: "Devika",
    location: "Bengaluru",
    avatar: "/Images/testimonial-3.jpg",
  },
  {
    quote:
      "Ordered earrings for a wedding and the customer support team helped me pick the right metal tone over chat.",
    name: "Priya",
    location: "Delhi",
    avatar: "/Images/testimonial-4.jpg",
  },
];

const AUTO_ADVANCE_MS = 6000;

/**
 * A four-pointed star that continuously tilts a few degrees back and forth
 * while fading in and out — both properties share one timeline so it reads
 * as a single soft "twinkle" rather than a spin.
 */
function TwinkleStar({
  className = "",
  size = 40,
  delay = 0,
  color = "var(--color-gold,#c99b4a)",
}: {
  className?: string;
  size?: number;
  delay?: number;
  color?: string;
}) {
  return (
    <span
      className={`twinkle-star pointer-events-none inline-flex ${className}`}
      style={
        {
          width: size,
          height: size,
          "--twinkle-delay": `${delay}s`,
        } as React.CSSProperties
      }
    >
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M32 0C33 16 34 30 32 32C30 34 16 33 0 32C16 34 30 30 32 32C34 34 33 48 32 64C31 48 30 34 32 32C34 30 48 31 64 32C48 30 34 34 32 32C30 30 31 16 32 0Z"
          fill={color}
        />
      </svg>
      <style jsx>{`
        .twinkle-star {
          transform-origin: 50% 50%;
          animation: twinkle 3.2s ease-in-out infinite;
          animation-delay: var(--twinkle-delay, 0s);
          will-change: transform, opacity;
        }
        @keyframes twinkle {
          0% {
            transform: rotate(-8deg) scale(1);
            opacity: 0.35;
          }
          50% {
            transform: rotate(8deg) scale(1.08);
            opacity: 1;
          }
          100% {
            transform: rotate(-8deg) scale(1);
            opacity: 0.35;
          }
        }
      `}</style>
    </span>
  );
}

export function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const current = TESTIMONIALS[active];
  const total = TESTIMONIALS.length;

  useEffect(() => {
    if (paused || reduce) return;
    const timer = setTimeout(() => {
      setActive((i) => (i + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [active, paused, reduce, total]);

  return (
    <Reveal>
      <section
        className="bg-[var(--color-cream)] px-6 py-20 w-screen relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Move overflow-hidden to the top-level section if w-screen */}
        <div className="absolute inset-0 w-screen h-full overflow-hidden pointer-events-none -z-10" aria-hidden />
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center lg:gap-20 relative z-10">
          {/* Left: copy */}
          <div>
            <p className="eyebrow">Customer voices</p>
            <h2 className="mt-3 font-display text-4xl text-[var(--color-ink)] sm:text-5xl">
              Our Customers Speak For Us
            </h2>

            <div className="relative mt-8">
              <span className="font-display block text-6xl leading-none text-[var(--color-maroon-deep,#5c2a1c)]">
                &ldquo;
              </span>

              <div className="relative min-h-[140px] max-w-xl">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={active}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="text-lg leading-relaxed text-[var(--color-stone)]"
                  >
                    {current.quote}
                  </motion.p>
                </AnimatePresence>
              </div>

              <span className="font-display absolute -bottom-2 right-0 text-4xl leading-none text-[var(--color-maroon-deep,#5c2a1c)] sm:right-8">
                &rdquo;
              </span>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-full bg-[var(--color-cream-deep)]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={active}
                    src={current.avatar}
                    alt={current.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full object-cover object-center"
                    draggable={false}
                  />
                </AnimatePresence>
              </div>

              <p className="font-display text-xl text-[var(--color-ink)]">
                – {current.name}, <span className="font-sans text-sm text-[var(--color-stone)]">{current.location}</span>
              </p>
            </div>

            <div className="mt-10 flex items-center gap-3">
              <span className="text-xs tracking-widest text-[var(--color-stone)]">
                {String(1).padStart(2, "0")}
              </span>

              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Show testimonial ${i + 1}`}
                  onClick={() => setActive(i)}
                  className="relative h-px w-10 bg-[var(--color-stone-light)]"
                >
                  {i === active && !reduce && (
                    <motion.span
                      key={active}
                      className="absolute inset-y-0 left-0 bg-[var(--color-gold)]"
                      initial={{ width: "0%" }}
                      animate={{ width: paused ? undefined : "100%" }}
                      transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: "linear" }}
                      style={{
                        overflow: "hidden", // Ensures span's children don't escape
                        display: "block",
                        height: "100%",
                      }}
                    />
                  )}
                  {i === active && reduce && (
                    <span
                      className="absolute inset-0 bg-[var(--color-gold)]"
                      style={{
                        overflow: "hidden",
                        display: "block",
                        height: "100%",
                      }}
                    />
                  )}
                  {i < active && (
                    <span
                      className="absolute inset-0 bg-[var(--color-gold)]"
                      style={{
                        overflow: "hidden",
                        display: "block",
                        height: "100%",
                      }}
                    />
                  )}
                </button>
              ))}

              <span className="text-xs tracking-widest text-[var(--color-stone)]">
                {String(total).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Right: image with twinkling stars */}
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
            <div className="h-full w-full rounded-t-[70%] bg-[var(--color-cream-deep)]" aria-hidden>
              <AnimatePresence mode="wait">
                <motion.img
                  key={active}
                  src="/Images/I6.jpg"
                  alt="Customer testimonial collage"
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="h-full w-full object-cover object-center"
                  draggable={false}
                />
              </AnimatePresence>
            </div>

            <TwinkleStar className="absolute -right-4 -top-2 sm:-right-6" size={72} delay={0} />
            <TwinkleStar className="absolute -bottom-3 -left-3" size={28} delay={0.4} />
          </div>
        </div>
      </section>
    </Reveal>
  );
}