

// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
// import { ArrowRight } from "lucide-react";

// type HeroLine = {
//   text: string;
//   accent?: string; // optional word inside the line rendered in gold
// };

// type HeroSlide = {
//   eyebrow: string;
//   lines: [HeroLine, HeroLine, HeroLine, HeroLine];
//   image: string;
//   imageAlt: string;
//   quoteImage: string;
//   quoteImageAlt: string;
//   quote: string;
// };

// const SLIDES: HeroSlide[] = [
//   {
//     eyebrow: "Elegance In Every Pair",
//     lines: [
//       { text: "Shine Bright" },
//       { text: "With Earrings", accent: "With" },
//       { text: "That Define" },
//       { text: "Your Style" },
//     ],
//     image: "/Images/I1.jpg",
//     imageAlt: "Model wearing statement earrings",
//     quoteImage: "/Images/I2.jpg",
//     quoteImageAlt: "Layered necklaces detail",
//     quote:
//       "Nascetur Class Vivamus Ut Eleifend Primis Lobortis Dapibus Ridiculus Congue. Congue Duis Suspendisse Dui Per Faucibus.",
//   },
//   {
//     eyebrow: "Timeless By Design",
//     lines: [
//       { text: "Rings Crafted" },
//       { text: "For Every", accent: "For" },
//       { text: "Story You" },
//       { text: "Choose To Tell" },
//     ],
//     image: "/Images/I3.jpg",
//     imageAlt: "Model wearing statement rings",
//     quoteImage: "/Images/I4.jpg",
//     quoteImageAlt: "Ring detail close up",
//     quote:
//       "Nascetur Class Vivamus Ut Eleifend Primis Lobortis Dapibus Ridiculus Congue. Congue Duis Suspendisse Dui Per Faucibus.",
//   },
//   {
//     eyebrow: "Made To Be Kept",
//     lines: [
//       { text: "Necklaces That" },
//       { text: "Carry Every", accent: "Every" },
//       { text: "Memory Close" },
//       { text: "To The Heart" },
//     ],
//     image: "/Images/I2.jpg",
//     imageAlt: "Model wearing layered necklaces",
//     quoteImage: "/Images/I6.jpg",
//     quoteImageAlt: "Necklace detail close up",
//     quote:
//       "Nascetur Class Vivamus Ut Eleifend Primis Lobortis Dapibus Ridiculus Congue. Congue Duis Suspendisse Dui Per Faucibus.",
//   },
// ];

// // Fixed sparkle positions (percent-based), scattered across the whole
// // section the way they are in the reference image. Sizes bumped up so
// // they read clearly against the cream background.
// const SPARKLES = [
//   { top: "7%", left: "2.5%", size: 26 },
//   { top: "27%", left: "8%", size: 16 },
//   { top: "44%", left: "34%", size: 20 },
//   { top: "9%", left: "45%", size: 15 },
//   { top: "62%", left: "5%", size: 22 },
// ];

// function Sparkle({ top, left, size, delay }: { top: string; left: string; size: number; delay: number }) {
//   return (
//     <motion.span
//       className="pointer-events-none absolute text-[var(--color-ink,#251816)]"
//       style={{ top, left }}
//       animate={{
//         opacity: [0.15, 1, 0.15],
//         rotate: [-14, 14, -14],
//       }}
//       transition={{
//         duration: 3.2,
//         delay,
//         repeat: Infinity,
//         ease: "easeInOut",
//       }}
//     >
//       <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
//         <path d="M12 0c.6 4.8 2.2 8 4 9.8 1.8 1.8 5 3.4 8 4-3 .6-6.2 2.2-8 4-1.8 1.8-3.4 5-4 8-.6-3-2.2-6.2-4-8-1.8-1.8-5-3.4-8-4 3-.6 6.2-2.2 8-4 1.8-1.8 3.4-5 4-9.8Z" />
//       </svg>
//     </motion.span>
//   );
// }

// // Text lines alternate entry direction: 1 & 3 slide in from the left,
// // 2 & 4 slide in from the right.
// const lineVariants = {
//   enter: (direction: "left" | "right") => ({
//     opacity: 0,
//     x: direction === "left" ? -60 : 60,
//   }),
//   center: {
//     opacity: 1,
//     x: 0,
//   },
// };

// // Lines 1 & 3 (index 0, 2) sit flush against the left edge of the page —
// // pulled out with a negative margin that cancels the column's own padding.
// // Lines 2 & 4 (index 1, 3) are pushed flush against the right edge of the
// // text column instead.
// const LEFT_FLUSH = "-ml-6 sm:-ml-10 lg:-ml-16 xl:-ml-24";

// export function HeroSection() {
//   const [index, setIndex] = useState(0);
//   const reduce = useReducedMotion();
//   const slide = SLIDES[index];

//   const goTo = useCallback((next: number) => {
//     setIndex((current) => {
//       const total = SLIDES.length;
//       return (next + total) % total;
//     });
//   }, []);

//   const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
//   const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

//   useEffect(() => {
//     function onKeyDown(e: KeyboardEvent) {
//       if (e.key === "ArrowLeft") goPrev();
//       if (e.key === "ArrowRight") goNext();
//     }
//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [goPrev, goNext]);

//   return (
//     <section
//       className="font-marcellus relative grid w-full pl-16 grid-cols-1 overflow-hidden bg-[var(--color-cream,#f6efe4)] lg:min-h-[720px] lg:grid-cols-2 lg:items-center"
//       aria-roledescription="carousel"
//     >
//       {SPARKLES.map((s, i) => (
//         <Sparkle key={i} top={s.top} left={s.left} size={s.size} delay={i * 0.7} />
//       ))}

//       {/* Text column */}
//       <div className="relative z-10 px-6 py-14 sm:px-10 lg:pl-16 lg:pr-6 lg:py-0 xl:pl-24">
//         <AnimatePresence mode="wait">
//           <motion.p
//             key={`eyebrow-${index}`}
//             className="font-marcellus text-xs tracking-[0.4em] text-[var(--color-gold,#b98a4e)]"
//             initial={reduce ? undefined : { opacity: 0, y: -8 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.4 }}
//           >
//             {slide.eyebrow.toUpperCase()}
//           </motion.p>
//         </AnimatePresence>

//         <h1 className="font-marcellus mt-5 text-[52px] uppercase leading-[1.08] text-[var(--color-ink,#1c1c1c)] sm:text-6xl lg:text-[64px] xl:text-7xl">
//           {slide.lines.map((line, i) => {
//             const isLeftFlush = i % 2 === 0; // lines 1 & 3
//             const direction: "left" | "right" = isLeftFlush ? "left" : "right";
//             const words = line.text.split(" ");
//             return (
//               <div
//                 key={`line-wrap-${index}-${i}`}
//                 className={`flex w-full ${isLeftFlush ? "justify-start" : "justify-end"}`}
//               >
//                 <AnimatePresence mode="wait">
//                   <motion.span
//                     key={`line-${index}-${i}`}
//                     className={`block ${isLeftFlush ? LEFT_FLUSH : ""}`}
//                     custom={direction}
//                     variants={reduce ? undefined : lineVariants}
//                     initial="enter"
//                     animate="center"
//                     exit="enter"
//                     transition={{ duration: 0.55, delay: i * 0.12, ease: "easeOut" }}
//                   >
//                     {words.map((word, wi) => (
//                       <span
//                         key={wi}
//                         className={
//                           line.accent && word === line.accent
//                             ? "text-[var(--color-gold,#b98a4e)]"
//                             : undefined
//                         }
//                       >
//                         {word}
//                         {wi < words.length - 1 ? " " : ""}
//                       </span>
//                     ))}
//                   </motion.span>
//                 </AnimatePresence>
//               </div>
//             );
//           })}
//         </h1>

//         <motion.div
//           initial={reduce ? undefined : { opacity: 0, y: 12 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5, delay: 0.6 }}
//         >
//           <button
//             type="button"
//             className="font-marcellus mt-10 inline-flex items-center gap-5 bg-[var(--color-ink,#0a0a0a)] py-3.5 pl-7 pr-2.5 text-[15px] text-white"
//           >
//             Know More
//             <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--color-ink,#0a0a0a)]">
//               <ArrowRight size={15} strokeWidth={2} />
//             </span>
//           </button>
//         </motion.div>

//         {/* Bottom testimonial strip */}
//         <div className="mt-14 flex max-w-md items-start gap-5">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={`quote-image-${index}`}
//               className="h-20 w-20 shrink-0 overflow-hidden"
//               initial={reduce ? undefined : { clipPath: "inset(0 100% 0 0)" }}
//               animate={{ clipPath: "inset(0 0% 0 0)" }}
//               exit={{ opacity: 0 }}
//               transition={{ duration: 0.7, ease: "easeInOut" }}
//             >
//               <img
//                 src={slide.quoteImage}
//                 alt={slide.quoteImageAlt}
//                 className="h-full w-full object-cover"
//                 draggable={false}
//               />
//             </motion.div>
//           </AnimatePresence>

//           <div className="flex-1">
//             <AnimatePresence mode="wait">
//               <motion.span
//                 key={`quote-mark-${index}`}
//                 className="font-marcellus block text-3xl leading-none text-[var(--color-ink,#1c1c1c)]"
//                 initial={reduce ? undefined : { opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0 }}
//                 transition={{ duration: 0.4 }}
//               >
//                 &ldquo;
//               </motion.span>
//             </AnimatePresence>
//             <AnimatePresence mode="wait">
//               <motion.p
//                 key={`quote-text-${index}`}
//                 className="font-marcellus mt-1 text-sm leading-relaxed text-[var(--color-stone,#5c5347)]"
//                 initial={reduce ? undefined : { opacity: 0, x: 24 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0 }}
//                 transition={{ duration: 0.45, delay: 0.1 }}
//               >
//                 {slide.quote}
//               </motion.p>
//             </AnimatePresence>
//           </div>
//         </div>

//         {/* Arrow navigation with counter */}
//         <div className="font-marcellus mt-10 flex items-center gap-5 text-sm text-[var(--color-ink,#1c1c1c)]">
//           <button
//             type="button"
//             aria-label="Previous slide"
//             onClick={goPrev}
//             className="flex items-center transition-opacity hover:opacity-60"
//           >
//             <svg width={40} height={12} viewBox="0 0 40 12" fill="none" aria-hidden>
//               <path
//                 d="M0 6h38M6 1 1 6l5 5"
//                 stroke="currentColor"
//                 strokeWidth={1.2}
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               />
//             </svg>
//           </button>

//           <span className="font-marcellus tabular-nums">
//             {index + 1}/{SLIDES.length}
//           </span>

//           <button
//             type="button"
//             aria-label="Next slide"
//             onClick={goNext}
//             className="flex items-center transition-opacity hover:opacity-60"
//           >
//             <svg width={40} height={12} viewBox="0 0 40 12" fill="none" aria-hidden>
//               <path
//                 d="M40 6H2M34 1l5 5-5 5"
//                 stroke="currentColor"
//                 strokeWidth={1.2}
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               />
//             </svg>
//           </button>
//         </div>
//       </div>

//       {/* Image column — full-bleed, top-right corner rounded, image itself
//           never slides, it reveals left-to-right in place */}
//       <div className="relative flex h-[420px] w-full items-center overflow-hidden sm:h-[560px] lg:h-full lg:min-h-[720px]">
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={`hero-image-${index}`}
//             className="absolute inset-0 flex h-full items-center justify-center"
//             initial={reduce ? undefined : { clipPath: "inset(0 100% 0 0)" }}
//             animate={{ clipPath: "inset(0 0% 0 0)" }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
//           >
//             <img
//               src={slide.image}
//               alt={slide.imageAlt}
//               className="max-h-[600px] object-cover object-center lg:rounded-tr-[420px]"
//               draggable={false}
//             />
//           </motion.div>
//         </AnimatePresence>
//       </div>
//     </section>
//   );
// }

"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

type HeroLine = {
  text: string;
  accent?: string; // optional word inside the line rendered in gold
};

type HeroSlide = {
  eyebrow: string;
  lines: [HeroLine, HeroLine, HeroLine, HeroLine];
  image: string;
  imageAlt: string;
  quoteImage: string;
  quoteImageAlt: string;
  quote: string;
};

const SLIDES: HeroSlide[] = [
  {
    eyebrow: "Elegance In Every Pair",
    lines: [
      { text: "Shine Bright" },
      { text: "With Earrings", accent: "With" },
      { text: "That Define" },
      { text: "Your Style" },
    ],
    image: "/Images/I1.jpg",
    imageAlt: "Model wearing statement earrings",
    quoteImage: "/Images/I2.jpg",
    quoteImageAlt: "Layered necklaces detail",
    quote:
      "Nascetur Class Vivamus Ut Eleifend Primis Lobortis Dapibus Ridiculus Congue. Congue Duis Suspendisse Dui Per Faucibus.",
  },
  {
    eyebrow: "Timeless By Design",
    lines: [
      { text: "Rings Crafted" },
      { text: "For Every", accent: "For" },
      { text: "Story You" },
      { text: "Choose To Tell" },
    ],
    image: "/Images/I3.jpg",
    imageAlt: "Model wearing statement rings",
    quoteImage: "/Images/I4.jpg",
    quoteImageAlt: "Ring detail close up",
    quote:
      "Nascetur Class Vivamus Ut Eleifend Primis Lobortis Dapibus Ridiculus Congue. Congue Duis Suspendisse Dui Per Faucibus.",
  },
  {
    eyebrow: "Made To Be Kept",
    lines: [
      { text: "Necklaces That" },
      { text: "Carry Every", accent: "Every" },
      { text: "Memory Close" },
      { text: "To The Heart" },
    ],
    image: "/Images/I2.jpg",
    imageAlt: "Model wearing layered necklaces",
    quoteImage: "/Images/I6.jpg",
    quoteImageAlt: "Necklace detail close up",
    quote:
      "Nascetur Class Vivamus Ut Eleifend Primis Lobortis Dapibus Ridiculus Congue. Congue Duis Suspendisse Dui Per Faucibus.",
  },
];

// Fixed sparkle positions (percent-based). A couple are hidden below `sm`
// so they don't collide with the headline text on narrow screens.
const SPARKLES = [
  { top: "6%", left: "3%", size: 20, hideOnMobile: false },
  { top: "24%", left: "8%", size: 13, hideOnMobile: true },
  { top: "44%", left: "34%", size: 16, hideOnMobile: true },
  { top: "8%", left: "70%", size: 13, hideOnMobile: false },
  { top: "60%", left: "5%", size: 18, hideOnMobile: true },
];

function Sparkle({
  top,
  left,
  size,
  delay,
  hideOnMobile,
}: {
  top: string;
  left: string;
  size: number;
  delay: number;
  hideOnMobile: boolean;
}) {
  return (
    <motion.span
      className={`pointer-events-none absolute text-[var(--color-ink,#251816)] ${
        hideOnMobile ? "hidden sm:block" : ""
      }`}
      style={{ top, left }}
      animate={{
        opacity: [0.15, 1, 0.15],
        rotate: [-14, 14, -14],
      }}
      transition={{
        duration: 3.2,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 0c.6 4.8 2.2 8 4 9.8 1.8 1.8 5 3.4 8 4-3 .6-6.2 2.2-8 4-1.8 1.8-3.4 5-4 8-.6-3-2.2-6.2-4-8-1.8-1.8-5-3.4-8-4 3-.6 6.2-2.2 8-4 1.8-1.8 3.4-5 4-9.8Z" />
      </svg>
    </motion.span>
  );
}

// Text lines alternate entry direction: 1 & 3 slide in from the left,
// 2 & 4 slide in from the right.
const lineVariants = {
  enter: (direction: "left" | "right") => ({
    opacity: 0,
    x: direction === "left" ? -40 : 40,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
};

// Lines 1 & 3 sit flush against the left edge of the page on larger screens,
// where there's room to pull them past the column's own padding. On mobile
// they stay inside the column so nothing clips off-screen.
const LEFT_FLUSH = "sm:-ml-10 lg:-ml-16 xl:-ml-24";

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const slide = SLIDES[index];

  const goTo = useCallback((next: number) => {
    setIndex((current) => {
      const total = SLIDES.length;
      return (next + total) % total;
    });
  }, []);

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  return (
    <section
      className="font-marcellus md:pl-6 lg:pl-16 relative grid w-full grid-cols-1 overflow-hidden bg-[var(--color-cream,#f6efe4)] lg:min-h-[720px] lg:grid-cols-2 lg:items-center"
      aria-roledescription="carousel"
    >
      {SPARKLES.map((s, i) => (
        <Sparkle key={i} top={s.top} left={s.left} size={s.size} delay={i * 0.7} hideOnMobile={s.hideOnMobile} />
      ))}

      {/* Text column */}
      <div className="relative z-10 px-5 py-10 sm:px-10 sm:py-14 lg:pl-16 lg:pr-6 lg:py-0 xl:pl-24">
        <AnimatePresence mode="wait">
          <motion.p
            key={`eyebrow-${index}`}
            className="font-marcellus text-[10px] tracking-[0.3em] text-[var(--color-gold,#b98a4e)] sm:text-xs sm:tracking-[0.4em]"
            initial={reduce ? undefined : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {slide.eyebrow.toUpperCase()}
          </motion.p>
        </AnimatePresence>

        <h1 className="font-marcellus mt-3 text-[34px] uppercase leading-[1.12] text-[var(--color-ink,#1c1c1c)] sm:mt-5 sm:text-5xl sm:leading-[1.1] md:text-6xl lg:text-[56px] xl:text-7xl">
          {slide.lines.map((line, i) => {
            const isLeftFlush = i % 2 === 0; // lines 1 & 3
            const direction: "left" | "right" = isLeftFlush ? "left" : "right";
            const words = line.text.split(" ");
            return (
              <div
                key={`line-wrap-${index}-${i}`}
                className={`flex w-full ${isLeftFlush ? "justify-start" : "justify-end"}`}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`line-${index}-${i}`}
                    className={`block ${isLeftFlush ? LEFT_FLUSH : ""}`}
                    custom={direction}
                    variants={reduce ? undefined : lineVariants}
                    initial="enter"
                    animate="center"
                    exit="enter"
                    transition={{ duration: 0.55, delay: i * 0.12, ease: "easeOut" }}
                  >
                    {words.map((word, wi) => (
                      <span
                        key={wi}
                        className={
                          line.accent && word === line.accent
                            ? "text-[var(--color-gold,#b98a4e)]"
                            : undefined
                        }
                      >
                        {word}
                        {wi < words.length - 1 ? " " : ""}
                      </span>
                    ))}
                  </motion.span>
                </AnimatePresence>
              </div>
            );
          })}
        </h1>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <button
            type="button"
            className="font-marcellus mt-7 inline-flex items-center gap-4 bg-[var(--color-ink,#0a0a0a)] py-3 pl-6 pr-2 text-sm text-white sm:mt-10 sm:gap-5 sm:py-3.5 sm:pl-7 sm:pr-2.5 sm:text-[15px]"
          >
            Know More
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--color-ink,#0a0a0a)] sm:h-9 sm:w-9">
              <ArrowRight size={14} strokeWidth={2} className="sm:hidden" />
              <ArrowRight size={15} strokeWidth={2} className="hidden sm:block" />
            </span>
          </button>
        </motion.div>

        {/* Bottom testimonial strip */}
        <div className="mt-10 flex max-w-md items-start gap-4 sm:mt-14 sm:gap-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={`quote-image-${index}`}
              className="h-16 w-16 shrink-0 overflow-hidden sm:h-20 sm:w-20"
              initial={reduce ? undefined : { clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            >
              <img
                src={slide.quoteImage}
                alt={slide.quoteImageAlt}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.span
                key={`quote-mark-${index}`}
                className="font-marcellus block text-2xl leading-none text-[var(--color-ink,#1c1c1c)] sm:text-3xl"
                initial={reduce ? undefined : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                &ldquo;
              </motion.span>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p
                key={`quote-text-${index}`}
                className="font-marcellus mt-1 text-[13px] leading-relaxed text-[var(--color-stone,#5c5347)] sm:text-sm"
                initial={reduce ? undefined : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
              >
                {slide.quote}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Arrow navigation with counter */}
        <div className="font-marcellus mt-8 flex items-center gap-4 text-sm text-[var(--color-ink,#1c1c1c)] sm:mt-10 sm:gap-5">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={goPrev}
            className="flex items-center transition-opacity hover:opacity-60"
          >
            <svg width={32} height={12} viewBox="0 0 40 12" fill="none" aria-hidden className="sm:w-10">
              <path
                d="M0 6h38M6 1 1 6l5 5"
                stroke="currentColor"
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <span className="font-marcellus tabular-nums">
            {index + 1}/{SLIDES.length}
          </span>

          <button
            type="button"
            aria-label="Next slide"
            onClick={goNext}
            className="flex items-center transition-opacity hover:opacity-60"
          >
            <svg width={32} height={12} viewBox="0 0 40 12" fill="none" aria-hidden className="sm:w-10">
              <path
                d="M40 6H2M34 1l5 5-5 5"
                stroke="currentColor"
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Image column — full-bleed, top-right corner rounded on large screens,
          image itself never slides, it reveals left-to-right in place */}
      <div className="relative flex h-[280px] w-full items-center justify-center overflow-hidden sm:h-[420px] md:h-[500px] lg:h-full lg:min-h-[720px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`hero-image-${index}`}
            className="absolute inset-0 flex h-full w-full items-center justify-center"
            initial={reduce ? undefined : { clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
          >
            <img
              src={slide.image}
              alt={slide.imageAlt}
              className="h-full w-full object-cover object-center lg:h-auto lg:max-h-[600px] lg:w-auto lg:rounded-tr-[420px]"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}