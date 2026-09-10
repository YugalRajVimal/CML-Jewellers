// // import type { Metadata } from "next";

// // export const metadata: Metadata = {
// //   title: "About Us — CML Jewellers",
// // };

// // export default function AboutPage() {
// //   return (
// //     <div className="mx-auto max-w-3xl px-6 py-16">
// //       <p className="eyebrow">Our story</p>
// //       <h1 className="mt-3 font-display text-4xl text-[var(--color-ink)]">Three generations of goldsmithing</h1>
// //       <div className="mt-8 flex flex-col gap-5 text-[15px] leading-relaxed text-[var(--color-stone)]">
// //         <p>
// //           CML Jewellers started as a single workbench, passed from one generation to the next along
// //           with the tools and the habits that came with it — polishing by hand, checking a setting
// //           twice, never letting a piece leave the workshop until someone was willing to put their name
// //           to it.
// //         </p>
// //         <p>
// //           That hasn&apos;t changed as the workshop has grown. Every piece we sell is still finished by
// //           hand, every stone is certified before it&apos;s set, and every order is inspected before it
// //           ships — the same way it would have been decades ago.
// //         </p>
// //         <p>
// //           We build jewellery to be worn, kept, and eventually handed down. If something we made ever
// //           needs a repair or a resize, we&apos;d rather you bring it back to us than replace it.
// //         </p>
// //       </div>
// //     </div>
// //   );
// // }


// "use client";

// import { motion, useReducedMotion } from "framer-motion";

// const MILESTONES = [
//   { year: "1962", label: "First workbench opens" },
//   { year: "1994", label: "Second generation takes over" },
//   { year: "2018", label: "Third generation, first store" },
//   { year: "Today", label: "Still finished by hand" },
// ];

// const VALUES = [
//   {
//     title: "Hand-Finished",
//     body: "Every piece passes through a goldsmith's hands before it ever reaches yours — no shortcuts, no shortcuts on the polish either.",
//   },
//   {
//     title: "Certified Stones",
//     body: "Every stone we set is certified first. If we wouldn't put our name on it, it doesn't go in the case.",
//   },
//   {
//     title: "Made To Be Kept",
//     body: "We build for decades, not seasons — and we'd rather repair a piece we made than sell you a new one.",
//   },
// ];

// export default function AboutPage() {
//   const reduce = useReducedMotion();

//   return (
//     <div className="font-marcellus bg-[var(--color-cream,#f6efe4)]">
//       {/* Hero */}
//       <section className="relative overflow-hidden px-6 py-20 sm:py-28">
//         <motion.p
//           className="text-center text-xs tracking-[0.4em] text-[var(--color-gold,#b98a4e)]"
//           initial={reduce ? undefined : { opacity: 0, y: -8 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           OUR STORY
//         </motion.p>
//         <motion.h1
//           className="mx-auto mt-5 max-w-3xl text-center text-[42px] uppercase leading-[1.1] text-[var(--color-ink,#1c1c1c)] sm:text-6xl"
//           initial={reduce ? undefined : { opacity: 0, y: 16 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.1 }}
//         >
//           Three Generations <span className="text-[var(--color-gold,#b98a4e)]">Of Goldsmithing</span>
//         </motion.h1>
//         <motion.p
//           className="mx-auto mt-6 max-w-xl text-center text-[15px] leading-relaxed text-[var(--color-stone,#5c5347)]"
//           initial={reduce ? undefined : { opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.6, delay: 0.25 }}
//         >
//           CML Jewellers started as a single workbench, passed down along with the tools and the
//           habits that came with it — polishing by hand, checking a setting twice, never letting a
//           piece leave the workshop until someone was willing to put their name to it.
//         </motion.p>
//       </section>

//       {/* Image + narrative split */}
//       <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 lg:grid-cols-2 lg:items-center">
//         <motion.div
//           className="overflow-hidden rounded-tr-[220px]"
//           initial={reduce ? undefined : { opacity: 0, x: -40 }}
//           whileInView={{ opacity: 1, x: 0 }}
//           viewport={{ once: true, amount: 0.3 }}
//           transition={{ duration: 0.7, ease: "easeOut" }}
//         >
//           <img
//             src="/Images/I3.jpg"
//             alt="Goldsmith at the workbench"
//             className="h-[420px] w-full object-cover"
//             draggable={false}
//           />
//         </motion.div>

//         <motion.div
//           initial={reduce ? undefined : { opacity: 0, y: 20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true, amount: 0.3 }}
//           transition={{ duration: 0.6, delay: 0.1 }}
//         >
//           <p className="text-xs tracking-[0.35em] text-[var(--color-gold,#b98a4e)]">
//             SAME BENCH, SAME STANDARDS
//           </p>
//           <h2 className="mt-4 max-w-md text-3xl leading-[1.2] text-[var(--color-ink,#1c1c1c)] sm:text-4xl">
//             What Hasn&apos;t Changed As We&apos;ve Grown
//           </h2>
//           <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--color-stone,#5c5347)]">
//             Every piece we sell is still finished by hand, every stone is certified before it&apos;s
//             set, and every order is inspected before it ships — the same way it would have been
//             decades ago. We build jewellery to be worn, kept, and eventually handed down.
//           </p>
//         </motion.div>
//       </section>

//       {/* Milestones strip */}
//       <section className="bg-[var(--color-cream-deep,#f2e4cc)] py-14">
//         <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
//           {MILESTONES.map((m, i) => (
//             <motion.div
//               key={m.year}
//               className="text-center"
//               initial={reduce ? undefined : { opacity: 0, y: 16 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true, amount: 0.4 }}
//               transition={{ duration: 0.5, delay: i * 0.1 }}
//             >
//               <p className="text-3xl text-[var(--color-gold,#b98a4e)]">{m.year}</p>
//               <p className="mt-2 text-xs text-[var(--color-stone,#6b6154)] sm:text-sm">{m.label}</p>
//             </motion.div>
//           ))}
//         </div>
//       </section>

//       {/* Values */}
//       <section className="mx-auto max-w-6xl px-6 py-20">
//         <div className="text-center">
//           <p className="text-xs tracking-[0.35em] text-[var(--color-gold,#b98a4e)]">WHAT WE STAND FOR</p>
//           <h2 className="mt-3 text-4xl text-[var(--color-ink,#1c1c1c)]">Built On A Few Simple Rules</h2>
//         </div>

//         <div className="mt-12 grid grid-cols-1 divide-y divide-[var(--color-ink,#1c1c1c)]/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
//           {VALUES.map((v, i) => (
//             <motion.div
//               key={v.title}
//               className="flex flex-col items-center gap-3 px-6 py-10 text-center first:pt-0 sm:py-0"
//               initial={reduce ? undefined : { opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true, amount: 0.4 }}
//               transition={{ duration: 0.5, delay: i * 0.12 }}
//             >
//               <p className="text-2xl text-[var(--color-ink,#1c1c1c)]">{v.title}</p>
//               <p className="max-w-xs text-[15px] leading-relaxed text-[var(--color-stone,#6b6154)]">
//                 {v.body}
//               </p>
//             </motion.div>
//           ))}
//         </div>
//       </section>
//     </div>
//   );
// }

"use client";

import { motion, useReducedMotion } from "framer-motion";

const MILESTONES = [
  { year: "1962", label: "First workbench opens" },
  { year: "1994", label: "Second generation takes over" },
  { year: "2018", label: "Third generation, first store" },
  { year: "Today", label: "Still finished by hand" },
];

const VALUES = [
  {
    title: "Hand-Finished",
    body: "Every piece passes through a goldsmith's hands before it ever reaches yours — no shortcuts, no shortcuts on the polish either.",
  },
  {
    title: "Certified Stones",
    body: "Every stone we set is certified first. If we wouldn't put our name on it, it doesn't go in the case.",
  },
  {
    title: "Made To Be Kept",
    body: "We build for decades, not seasons — and we'd rather repair a piece we made than sell you a new one.",
  },
];

export default function AboutPage() {
  const reduce = useReducedMotion();

  return (
    <div className="font-marcellus bg-[var(--color-cream,#f6efe4)]">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 py-14 sm:px-6 sm:py-20 lg:py-28">
        <motion.p
          className="text-center text-[10px] tracking-[0.3em] text-[var(--color-gold,#b98a4e)] sm:text-xs sm:tracking-[0.4em]"
          initial={reduce ? undefined : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          OUR STORY
        </motion.p>
        <motion.h1
          className="mx-auto mt-4 max-w-3xl text-center text-3xl uppercase leading-[1.15] text-[var(--color-ink,#1c1c1c)] sm:mt-5 sm:text-5xl sm:leading-[1.1] lg:text-6xl"
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Three Generations <span className="text-[var(--color-gold,#b98a4e)]">Of Goldsmithing</span>
        </motion.h1>
        <motion.p
          className="mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed text-[var(--color-stone,#5c5347)] sm:mt-6 sm:text-[15px]"
          initial={reduce ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          CML Jewellers started as a single workbench, passed down along with the tools and the
          habits that came with it — polishing by hand, checking a setting twice, never letting a
          piece leave the workshop until someone was willing to put their name to it.
        </motion.p>
      </section>

      {/* Image + narrative split */}
      <section className="mx-auto grid max-w-6xl gap-8 px-5 pb-14 sm:gap-12 sm:px-6 sm:pb-20 lg:grid-cols-2 lg:items-center">
        <motion.div
          className="overflow-hidden rounded-tr-[90px] sm:rounded-tr-[160px] lg:rounded-tr-[220px]"
          initial={reduce ? undefined : { opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <img
            src="/Images/I3.jpg"
            alt="Goldsmith at the workbench"
            className="h-[260px] w-full object-cover sm:h-[340px] lg:h-[420px]"
            draggable={false}
          />
        </motion.div>

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="text-[10px] tracking-[0.3em] text-[var(--color-gold,#b98a4e)] sm:text-xs sm:tracking-[0.35em]">
            SAME BENCH, SAME STANDARDS
          </p>
          <h2 className="mt-3 max-w-md text-2xl leading-[1.25] text-[var(--color-ink,#1c1c1c)] sm:mt-4 sm:text-3xl sm:leading-[1.2] lg:text-4xl">
            What Hasn&apos;t Changed As We&apos;ve Grown
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-stone,#5c5347)] sm:mt-5 sm:text-[15px]">
            Every piece we sell is still finished by hand, every stone is certified before it&apos;s
            set, and every order is inspected before it ships — the same way it would have been
            decades ago. We build jewellery to be worn, kept, and eventually handed down.
          </p>
        </motion.div>
      </section>

      {/* Milestones strip */}
      <section className="bg-[var(--color-cream-deep,#f2e4cc)] py-10 sm:py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 sm:grid-cols-4 sm:gap-8 sm:px-6">
          {MILESTONES.map((m, i) => (
            <motion.div
              key={m.year}
              className="text-center"
              initial={reduce ? undefined : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <p className="text-2xl text-[var(--color-gold,#b98a4e)] sm:text-3xl">{m.year}</p>
              <p className="mt-1.5 text-[11px] text-[var(--color-stone,#6b6154)] sm:mt-2 sm:text-sm">
                {m.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.3em] text-[var(--color-gold,#b98a4e)] sm:text-xs sm:tracking-[0.35em]">
            WHAT WE STAND FOR
          </p>
          <h2 className="mt-2 text-2xl text-[var(--color-ink,#1c1c1c)] sm:mt-3 sm:text-4xl">
            Built On A Few Simple Rules
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 divide-y divide-[var(--color-ink,#1c1c1c)]/15 sm:mt-12 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              className="flex flex-col items-center gap-2.5 px-4 py-8 text-center first:pt-0 sm:gap-3 sm:px-6 sm:py-0"
              initial={reduce ? undefined : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <p className="text-xl text-[var(--color-ink,#1c1c1c)] sm:text-2xl">{v.title}</p>
              <p className="max-w-xs text-sm leading-relaxed text-[var(--color-stone,#6b6154)] sm:text-[15px]">
                {v.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}