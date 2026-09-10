
// "use client";

// import { GiPolarStar } from "react-icons/gi";
// import React, { useRef, useEffect, useState } from "react";

// const TAGLINES = [
//   "Finished By Hand, Not By Machine",
//   "Where Elegance Meets Excellence",
//   "Timeless Beauty, Crafted To Perfection",
//   "Discover The Art Of Luxury",
// ];

// function StarSeparator({ delay = 0 }) {
//   return (
//     <span
//       className="mx-16 inline-flex items-center justify-center"
//       style={
//         {
//           //@ts-ignore for CSS var
//           "--star-delay": `${delay}s`,
//         } as React.CSSProperties
//       }
//     >
//       <span className="star-rotate inline-flex">
//         <span className="star-scale inline-flex">
//           <GiPolarStar />
//         </span>
//       </span>
//       <style jsx>{`
//         .star-rotate {
//           display: inline-flex;
//           animation: spin 1.6s linear infinite;
//           animation-delay: var(--star-delay, 0s);
//           will-change: transform;
//         }
//         .star-scale {
//           display: inline-flex;
//           animation: pulse-scale 1.6s ease-in-out infinite;
//           animation-delay: var(--star-delay, 0s);
//           will-change: transform, opacity;
//         }
//         @keyframes spin {
//           0% {
//             transform: rotate(0deg);
//           }
//           100% {
//             transform: rotate(360deg);
//           }
//         }
//         @keyframes pulse-scale {
//           0% {
//             transform: scale(1);
//             opacity: 1;
//           }
//           50% {
//             transform: scale(0.35);
//             opacity: 0.5;
//           }
//           100% {
//             transform: scale(1);
//             opacity: 1;
//           }
//         }
//       `}</style>
//     </span>
//   );
// }

// // Smoother marquee using two identical blocks for seamless infinite scroll
// export function MarqueeStrip() {
//   const contentRef = useRef<HTMLSpanElement>(null);
//   const [contentWidth, setContentWidth] = useState<number>(0);

//   // Measure the width of ONE content block so we can translate exactly that
//   // distance. Re-measure on resize, on font load (fonts changing width is
//   // what usually causes the "jump/break" right after the last tagline),
//   // and via ResizeObserver in case content reflows for any other reason.
//   useEffect(() => {
//     function measure() {
//       if (contentRef.current) {
//         setContentWidth(contentRef.current.scrollWidth);
//       }
//     }

//     measure();
//     window.addEventListener("resize", measure);

//     let ro: ResizeObserver | undefined;
//     if (contentRef.current && typeof ResizeObserver !== "undefined") {
//       ro = new ResizeObserver(() => measure());
//       ro.observe(contentRef.current);
//     }

//     // Fonts loading after first paint change text width; re-measure once
//     // they're ready so the loop distance matches the final rendered width.
//     if (typeof document !== "undefined" && "fonts" in document) {
//       (document as any).fonts.ready.then(() => measure());
//     }

//     return () => {
//       window.removeEventListener("resize", measure);
//       ro?.disconnect();
//     };
//   }, []);

//   const repeatedBlock = (
//     <span ref={contentRef} className="content-block font-marcellus flex text-2xl sm:text-3xl tracking-wide text-white">
//       {TAGLINES.map((t, i) => (
//         <span key={i} className="flex shrink-0 items-center">
//           {t}
//           <StarSeparator delay={(i * 0.21) % 1.6} />
//         </span>
//       ))}
//     </span>
//   );

//   // The duration adapts automatically for a constant speed (eg. 50px/sec)
//   const speed = 60; // px per second (lower = slower, higher = faster)
//   const duration = contentWidth ? (contentWidth / speed) : 30; // fallback if not measured

//   return (
//     <div className="overflow-hidden border-y border-white/10 bg-[var(--color-ink,#3a1f0f)] py-6">
//       <div
//         key={contentWidth}
//         className="marquee-track-smooth"
//         style={{
//           //@ts-ignore: this is inline for the css var
//           "--marquee-width": `${contentWidth}px`,
//           "--marquee-duration": `${duration}s`
//         } as React.CSSProperties}
//       >
//         {/* Double the content block for seamless looping */}
//         {repeatedBlock}
//         {repeatedBlock}
//       </div>
//       <style jsx>{`
//         .marquee-track-smooth {
//           display: flex;
//           flex-direction: row;
//           width: 100%;
//           overflow: hidden;
//           white-space: nowrap;
//           position: relative;
//         }
//         .marquee-track-smooth > .content-block {
//           display: flex;
//           min-width: max-content;
//         }
//         .marquee-track-smooth {
//           /* Animate both blocks as a group by shifting to the left the width of a block */
//           animation: smooth-marquee var(--marquee-duration, 28s) linear infinite;
//         }
//         @keyframes smooth-marquee {
//           0% {
//             transform: translateX(0);
//           }
//           100% {
//             /* Move exactly one block's width; second block appears seamlessly */
//             transform: translateX(calc(-1 * var(--marquee-width, 1000px)));
//           }
//         }
//       `}</style>
//     </div>
//   );
// }

"use client";

import React from "react";
import { GiPolarStar } from "react-icons/gi";

const TAGLINES = [
  "Finished By Hand, Not By Machine",
  "Where Elegance Meets Excellence",
  "Timeless Beauty, Crafted To Perfection",
  "Discover The Art Of Luxury",
];

function StarSeparator({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="mx-16 inline-flex items-center justify-center"
      style={{ "--star-delay": `${delay}s` } as React.CSSProperties}
    >
      <span className="star-rotate inline-flex">
        <span className="star-scale inline-flex">
          <GiPolarStar />
        </span>
      </span>
      <style jsx>{`
        .star-rotate {
          display: inline-flex;
          animation: spin 1.6s linear infinite;
          animation-delay: var(--star-delay, 0s);
          will-change: transform;
        }
        .star-scale {
          display: inline-flex;
          animation: pulse-scale 1.6s ease-in-out infinite;
          animation-delay: var(--star-delay, 0s);
          will-change: transform, opacity;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse-scale {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(0.35);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </span>
  );
}

function TaglineTrack() {
  return (
    <span className="font-marcellus flex shrink-0 items-center text-2xl tracking-wide text-white sm:text-3xl">
      {TAGLINES.map((t, i) => (
        <span key={i} className="flex shrink-0 items-center">
          {t}
          <StarSeparator delay={(i * 0.21) % 1.6} />
        </span>
      ))}
    </span>
  );
}

/**
 * Two identical tracks, each animated from translateX(0) to translateX(-100%)
 * of ITS OWN width, run in lockstep. Because both tracks contain exactly the
 * same content, they are always exactly the same width, so track A ending
 * lines up pixel-for-pixel with track B starting — no JS measurement, no
 * font-load re-measure, no gap or jump after the last tagline.
 */
export function MarqueeStrip() {
  return (
    <div className="overflow-hidden border-y border-white/10 bg-[var(--color-ink,#3a1f0f)] py-6">
      <div className="group flex w-max">
        <div className="flex w-max shrink-0 animate-[marquee-strip_26s_linear_infinite] items-center group-hover:[animation-play-state:paused]">
          <TaglineTrack />
        </div>
        <div
          className="flex w-max shrink-0 animate-[marquee-strip_26s_linear_infinite] items-center group-hover:[animation-play-state:paused]"
          aria-hidden="true"
        >
          <TaglineTrack />
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-strip {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}