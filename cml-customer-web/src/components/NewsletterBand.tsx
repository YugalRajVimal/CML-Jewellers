// "use client";

// import { useState } from "react";
// import { motion, useReducedMotion } from "framer-motion";
// import { Reveal } from "@/components/motion/Reveal";

// // Rough continent-shaped dot clusters, positioned like the reference's dotted
// // world map. Approximate, not geographically precise.
// const DOT_CLUSTERS = [
//   // North America
//   { cx: 90, cy: 60, rows: 6, cols: 8 },
//   // South America
//   { cx: 130, cy: 160, rows: 7, cols: 4 },
//   // Europe/Africa
//   { cx: 260, cy: 90, rows: 9, cols: 5 },
//   // Asia
//   { cx: 340, cy: 60, rows: 6, cols: 9 },
//   // Australia
//   { cx: 400, cy: 180, rows: 3, cols: 4 },
// ];

// const PINS = [
//   { x: 70, y: 55, delay: 0 },
//   { x: 300, y: 45, delay: 0.6 },
//   { x: 160, y: 145, delay: 1.2 },
//   { x: 405, y: 165, delay: 1.8 },
// ];

// function DottedMap() {
//   const dots: { x: number; y: number }[] = [];
//   for (const cluster of DOT_CLUSTERS) {
//     for (let r = 0; r < cluster.rows; r++) {
//       for (let c = 0; c < cluster.cols; c++) {
//         dots.push({ x: cluster.cx + c * 7 - (cluster.cols * 7) / 2, y: cluster.cy + r * 7 });
//       }
//     }
//   }

//   // Add the background image using absolute positioning in a wrapper div
//   return (
//     <div className="relative h-full w-full">
//       {/* Background Image */}
//       <img
//         src="/dot-map.webp"
//         alt=""
//         aria-hidden
//         className="absolute inset-0 z-0 h-full w-full object-cover"
//         draggable={false}
//       />
//       {/* SVG Dots and Pins */}
//       <svg viewBox="0 0 460 220" className="relative z-10 h-full w-full" aria-hidden>
//         {/* {dots.map((d, i) => (
//           <circle key={i} cx={d.x} cy={d.y} r={1.6} fill="var(--color-stone)" opacity={0.5} />
//         ))} */}
//         {PINS.map((pin, i) => (
//           <Pin key={i} x={pin.x} y={pin.y} delay={pin.delay} />
//         ))}
//       </svg>
//     </div>
//   );
// }

// function Pin({ x, y, delay }: { x: number; y: number; delay: number }) {
//   const reduce = useReducedMotion();
//   return (
//     <g transform={`translate(${x}, ${y})`}>
//       {!reduce && (
//         <motion.circle
//           r={4}
//           fill="var(--color-gold)"
//           initial={{ opacity: 0.6, scale: 1 }}
//           animate={{ opacity: 0, scale: 3.2 }}
//           transition={{ duration: 2, delay, repeat: Infinity, ease: "easeOut" }}
//         />
//       )}
//       <circle r={4} fill="var(--color-gold)" />
//       <circle r={1.6} fill="var(--color-cream)" />
//     </g>
//   );
// }

// export function NewsletterBand() {
//   const [email, setEmail] = useState("");
//   const [submitted, setSubmitted] = useState(false);
//   const [agreed, setAgreed] = useState(false);

//   function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     // No newsletter/signup endpoint exists in the API contract yet — this
//     // just confirms locally until that's added.
//     setSubmitted(true);
//   }

//   return (
//     <section className="bg-[var(--color-cream-deep)]">
//       <Reveal className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center">
//         <div className="hidden lg:block">
//           <DottedMap />
//         </div>

//         <div>
//           <h2 className="font-marcellus text-3xl text-[var(--color-ink)]">Stay Informed, Stay Ahead</h2>
//           <p className="mt-3 font-marcellus text-sm text-[var(--color-stone)]">
//             New collections and workshop notes, a couple of times a month.
//           </p>

//           {submitted ? (
//             <p className="mt-6 text-sm text-[var(--color-maroon)]">You&apos;re on the list — thank you.</p>
//           ) : (
//             <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
//               <div className="flex max-w-md gap-0">
//                 <input
//                   type="email"
//                   required
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="Email Address"
//                   className="w-full border border-[var(--color-stone-light)] bg-[var(--color-cream)] px-4 py-3 text-sm outline-none focus-visible:border-[var(--color-gold)]"
//                 />
//                 <button type="submit" className="shrink-0 bg-[var(--color-ink)] px-6 py-3 text-sm text-[var(--color-cream)]">
//                   Send Message
//                 </button>
//               </div>
//               <label className="flex items-center gap-2 text-xs text-[var(--color-stone)]">
//                 <input
//                   type="checkbox"
//                   checked={agreed}
//                   onChange={(e) => setAgreed(e.target.checked)}
//                   required
//                 />
//                 I agree with the <span className="underline">Terms &amp; Conditions</span>
//               </label>
//             </form>
//           )}
//         </div>
//       </Reveal>
//     </section>
//   );
// }

"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const reduce = useReducedMotion();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No newsletter/signup endpoint exists in the API contract yet — this
    // just confirms locally until that's added.
    setSubmitted(true);
  }

  return (
    <section className="font-marcellus relative overflow-hidden">
      <img
        src="/banner-bg.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-[var(--color-cream-deep,#f2e0c8)]/60" />

      <motion.div
        className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-8"
        initial={reduce ? undefined : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Wooden @ symbol */}
        <div className="shrink-0">
          <img
            src="/bannerAtTheRate.webp"
            alt="Wooden at-symbol ornament"
            className="h-32 w-auto object-contain sm:h-36"
            draggable={false}
          />
        </div>

        {/* Heading + copy */}
        <div className="max-w-md text-center lg:text-left">
          <h2 className="text-3xl text-[var(--color-ink,#1c1c1c)] sm:text-4xl">Stay Informed, Always</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-stone,#6b6154)]">
            Dolor Sagittis Rutrum Ipsum, Enim Arcu Consequat. Aliquam Odio Ornare Porta, Rutrum
            Urna Metus Urna Lacus Risus Arcu Imperdiet Maximus Vitae.
          </p>
        </div>

        {/* Form */}
        <div className="w-full max-w-md shrink-0">
          {submitted ? (
            <p className="text-sm text-[var(--color-ink,#1c1c1c)]">
              You&apos;re on the list — thank you.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex overflow-hidden">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-[var(--color-cream,#fdf3ea)] px-5 py-4 text-[15px] text-[var(--color-ink,#1c1c1c)] outline-none placeholder:text-[var(--color-stone,#9a8f7c)]"
                />
                <button
                  type="submit"
                  className="shrink-0 whitespace-nowrap bg-[var(--color-ink,#1c1c1c)] px-7 py-4 text-[15px] text-white transition-colors hover:bg-[var(--color-ink,#1c1c1c)]/85"
                >
                  Send Message
                </button>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-[var(--color-ink,#1c1c1c)]">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                  className="h-4 w-4 shrink-0 cursor-pointer appearance-none border border-[var(--color-ink,#1c1c1c)] checked:bg-[var(--color-ink,#1c1c1c)]"
                />
                I agree with the{" "}
                <a href="#" className="underline underline-offset-2">
                  Terms &amp; Conditions
                </a>
              </label>
            </form>
          )}
        </div>
      </motion.div>
    </section>
  );
}