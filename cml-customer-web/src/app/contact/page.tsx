// // "use client";

// // import { useState } from "react";

// // export default function ContactPage() {
// //   const [submitted, setSubmitted] = useState(false);
// //   const [form, setForm] = useState({ name: "", email: "", message: "" });

// //   function handleSubmit(e: React.FormEvent) {
// //     e.preventDefault();
// //     // No /contact endpoint exists in the API contract yet — this gives the
// //     // person feedback locally until that's added.
// //     setSubmitted(true);
// //   }

// //   return (
// //     <div className="mx-auto max-w-2xl px-6 py-16">
// //       <p className="eyebrow">Get in touch</p>
// //       <h1 className="mt-3 font-display text-4xl text-[var(--color-ink)]">Contact Us</h1>

// //       <div className="mt-8 grid gap-10 sm:grid-cols-2">
// //         <div className="text-sm leading-relaxed text-[var(--color-stone)]">
// //           <p>Customer support</p>
// //           <p className="mt-1 text-[var(--color-ink)]">+91 98765 43210</p>
// //           <p className="mt-4">Email</p>
// //           <p className="mt-1 text-[var(--color-ink)]">support@cmljewellers.com</p>
// //           <p className="mt-4">Hours</p>
// //           <p className="mt-1 text-[var(--color-ink)]">Mon–Sat, 10am–7pm IST</p>
// //         </div>

// //         <div>
// //           {submitted ? (
// //             <p className="text-sm text-[var(--color-maroon)]">
// //               Thanks — we&apos;ve got your message and will reply within a business day.
// //             </p>
// //           ) : (
// //             <form onSubmit={handleSubmit} className="flex flex-col gap-4">
// //               <label className="flex flex-col gap-1">
// //                 <span className="text-xs text-[var(--color-stone)]">Name</span>
// //                 <input
// //                   required
// //                   value={form.name}
// //                   onChange={(e) => setForm({ ...form, name: e.target.value })}
// //                   className="border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
// //                 />
// //               </label>
// //               <label className="flex flex-col gap-1">
// //                 <span className="text-xs text-[var(--color-stone)]">Email</span>
// //                 <input
// //                   type="email"
// //                   required
// //                   value={form.email}
// //                   onChange={(e) => setForm({ ...form, email: e.target.value })}
// //                   className="border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
// //                 />
// //               </label>
// //               <label className="flex flex-col gap-1">
// //                 <span className="text-xs text-[var(--color-stone)]">Message</span>
// //                 <textarea
// //                   required
// //                   rows={4}
// //                   value={form.message}
// //                   onChange={(e) => setForm({ ...form, message: e.target.value })}
// //                   className="border border-[var(--color-stone-light)] bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
// //                 />
// //               </label>
// //               <button type="submit" className="pill mt-2 w-fit justify-center">
// //                 Send message
// //               </button>
// //             </form>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }


// "use client";

// import { useState } from "react";
// import { motion, useReducedMotion } from "framer-motion";
// import { Mail, MapPin, Phone } from "lucide-react";

// const CONTACT_DETAILS = [
//   { Icon: Phone, label: "Customer support", value: "+91 98765 43210" },
//   { Icon: Mail, label: "Email", value: "support@cmljewellers.com" },
//   { Icon: MapPin, label: "Hours", value: "Mon–Sat, 10am–7pm IST" },
// ];

// export default function ContactPage() {
//   const reduce = useReducedMotion();
//   const [submitted, setSubmitted] = useState(false);
//   const [form, setForm] = useState({ name: "", email: "", message: "" });

//   function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     // No /contact endpoint exists in the API contract yet — this gives the
//     // person feedback locally until that's added.
//     setSubmitted(true);
//   }

//   return (
//     <div className="font-marcellus bg-[var(--color-cream,#f6efe4)]">
//       {/* Header */}
//       <section className="px-6 pt-20 pb-10 text-center sm:pt-28">
//         <motion.p
//           className="text-xs tracking-[0.4em] text-[var(--color-gold,#b98a4e)]"
//           initial={reduce ? undefined : { opacity: 0, y: -8 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           GET IN TOUCH
//         </motion.p>
//         <motion.h1
//           className="mt-5 text-[42px] uppercase leading-[1.1] text-[var(--color-ink,#1c1c1c)] sm:text-6xl"
//           initial={reduce ? undefined : { opacity: 0, y: 16 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.1 }}
//         >
//           We&apos;d Love To <span className="text-[var(--color-gold,#b98a4e)]">Hear From You</span>
//         </motion.h1>
//       </section>

//       {/* Details + form */}
//       <section className="mx-auto grid max-w-6xl gap-14 px-6 pb-24 lg:grid-cols-[1fr_1.4fr]">
//         {/* Details column */}
//         <motion.div
//           className="flex flex-col gap-8"
//           initial={reduce ? undefined : { opacity: 0, x: -30 }}
//           whileInView={{ opacity: 1, x: 0 }}
//           viewport={{ once: true, amount: 0.3 }}
//           transition={{ duration: 0.6 }}
//         >
//           {CONTACT_DETAILS.map(({ Icon, label, value }) => (
//             <div key={label} className="flex items-start gap-4">
//               <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream-deep,#f2e4cc)] text-[var(--color-gold,#b98a4e)]">
//                 <Icon size={18} strokeWidth={1.5} />
//               </span>
//               <div>
//                 <p className="text-xs tracking-[0.2em] text-[var(--color-stone,#6b6154)]">
//                   {label.toUpperCase()}
//                 </p>
//                 <p className="mt-1 text-lg text-[var(--color-ink,#1c1c1c)]">{value}</p>
//               </div>
//             </div>
//           ))}

//           <div className="mt-4 overflow-hidden rounded-tr-[140px]">
//             <img
//               src="/Images/I4.jpg"
//               alt="Jewellery detail"
//               className="h-56 w-full object-cover"
//               draggable={false}
//             />
//           </div>
//         </motion.div>

//         {/* Form column */}
//         <motion.div
//           className="bg-[var(--color-cream-deep,#f2e4cc)] p-8 sm:p-12"
//           initial={reduce ? undefined : { opacity: 0, x: 30 }}
//           whileInView={{ opacity: 1, x: 0 }}
//           viewport={{ once: true, amount: 0.3 }}
//           transition={{ duration: 0.6, delay: 0.1 }}
//         >
//           {submitted ? (
//             <p className="text-[15px] leading-relaxed text-[var(--color-ink,#1c1c1c)]">
//               Thanks — we&apos;ve got your message and will reply within a business day.
//             </p>
//           ) : (
//             <form onSubmit={handleSubmit} className="flex flex-col gap-6">
//               <label className="flex flex-col gap-2">
//                 <span className="text-xs tracking-[0.2em] text-[var(--color-stone,#6b6154)]">NAME</span>
//                 <input
//                   required
//                   value={form.name}
//                   onChange={(e) => setForm({ ...form, name: e.target.value })}
//                   className="border-b border-[var(--color-ink,#1c1c1c)]/25 bg-transparent py-2 text-sm text-[var(--color-ink,#1c1c1c)] outline-none focus-visible:border-[var(--color-gold,#b98a4e)]"
//                 />
//               </label>
//               <label className="flex flex-col gap-2">
//                 <span className="text-xs tracking-[0.2em] text-[var(--color-stone,#6b6154)]">EMAIL</span>
//                 <input
//                   type="email"
//                   required
//                   value={form.email}
//                   onChange={(e) => setForm({ ...form, email: e.target.value })}
//                   className="border-b border-[var(--color-ink,#1c1c1c)]/25 bg-transparent py-2 text-sm text-[var(--color-ink,#1c1c1c)] outline-none focus-visible:border-[var(--color-gold,#b98a4e)]"
//                 />
//               </label>
//               <label className="flex flex-col gap-2">
//                 <span className="text-xs tracking-[0.2em] text-[var(--color-stone,#6b6154)]">MESSAGE</span>
//                 <textarea
//                   required
//                   rows={4}
//                   value={form.message}
//                   onChange={(e) => setForm({ ...form, message: e.target.value })}
//                   className="border border-[var(--color-ink,#1c1c1c)]/25 bg-transparent px-3 py-2 text-sm text-[var(--color-ink,#1c1c1c)] outline-none focus-visible:border-[var(--color-gold,#b98a4e)]"
//                 />
//               </label>
//               <button
//                 type="submit"
//                 className="font-marcellus mt-2 inline-flex w-fit items-center gap-5 bg-[var(--color-ink,#0a0a0a)] py-3.5 pl-7 pr-2.5 text-[15px] text-white"
//               >
//                 Send Message
//                 <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--color-ink,#0a0a0a)]">
//                   →
//                 </span>
//               </button>
//             </form>
//           )}
//         </motion.div>
//       </section>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";

// Updated contact details as per instructions
const CONTACT_DETAILS = [
  {
    Icon: MapPin,
    label: "Address",
    value:
      "H NO. 13-2-267/A/56, SHIV LAL NAGAR, Rahimpura, Hyderabad, Hyderabad, Telangana, 500006",
  },
  {
    Icon: Phone,
    label: "Phone Number",
    value: (
      <a href="tel:7799035111" className="hover:underline">
        7799035111
      </a>
    ),
  },
  {
    Icon: Phone,
    label: "WhatsApp Number",
    value: (
      <a
        href="https://wa.me/7799025111"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        7799025111
      </a>
    ),
  },
  {
    Icon: Mail,
    label: "Email",
    value: (
      <a href="mailto:cmlfashionjewellery@gmail.com" className="hover:underline break-all">
        cmlfashionjewellery@gmail.com
      </a>
    ),
  },
  {
    Icon: MapPin,
    label: "GST",
    value: "36BKXPR3784E2ZC",
  },
  {
    Icon: MapPin,
    label: "Hours",
    value: "Mon–Sat, 10am–7pm IST",
  },
];

export default function ContactPage() {
  const reduce = useReducedMotion();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="font-marcellus bg-[var(--color-cream,#f6efe4)]">
      {/* Header */}
      <section className="px-5 pb-8 pt-14 text-center sm:px-6 sm:pb-10 sm:pt-20 lg:pt-28">
        <motion.p
          className="text-[10px] tracking-[0.3em] text-[var(--color-gold,#b98a4e)] sm:text-xs sm:tracking-[0.4em]"
          initial={reduce ? undefined : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          GET IN TOUCH
        </motion.p>
        <motion.h1
          className="mt-4 text-3xl uppercase leading-[1.15] text-[var(--color-ink,#1c1c1c)] sm:mt-5 sm:text-5xl sm:leading-[1.1] lg:text-6xl"
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          We&apos;d Love To <span className="text-[var(--color-gold,#b98a4e)]">Hear From You</span>
        </motion.h1>
      </section>

      {/* Details + form */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 sm:gap-14 sm:px-6 sm:pb-24 lg:grid-cols-[1fr_1.4fr]">
        {/* Details column */}
        <motion.div
          className="flex flex-col gap-6 sm:gap-8"
          initial={reduce ? undefined : { opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          {CONTACT_DETAILS.map(({ Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 sm:gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream-deep,#f2e4cc)] text-[var(--color-gold,#b98a4e)] sm:h-11 sm:w-11">
                <Icon size={16} strokeWidth={1.5} className="sm:hidden" />
                <Icon size={18} strokeWidth={1.5} className="hidden sm:block" />
              </span>
              <div>
                <p className="text-[10px] tracking-[0.15em] text-[var(--color-stone,#6b6154)] sm:text-xs sm:tracking-[0.2em]">
                  {label.toUpperCase()}
                </p>
                <p className="mt-1 text-base text-[var(--color-ink,#1c1c1c)] sm:text-lg break-all">{value}</p>
              </div>
            </div>
          ))}

          <div className="mt-2 overflow-hidden rounded-tr-[80px] sm:mt-4 sm:rounded-tr-[140px]">
            <img
              src="/Images/I4.jpg"
              alt="Jewellery detail"
              className="h-40 w-full object-cover sm:h-56"
              draggable={false}
            />
          </div>
        </motion.div>

        {/* Form column */}
        <motion.div
          className="bg-[var(--color-cream-deep,#f2e4cc)] p-6 sm:p-8 lg:p-12"
          initial={reduce ? undefined : { opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {submitted ? (
            <p className="text-sm leading-relaxed text-[var(--color-ink,#1c1c1c)] sm:text-[15px]">
              Thanks — we&apos;ve got your message and will reply within a business day.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-[10px] tracking-[0.15em] text-[var(--color-stone,#6b6154)] sm:text-xs sm:tracking-[0.2em]">
                  NAME
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border-b border-[var(--color-ink,#1c1c1c)]/25 bg-transparent py-2 text-sm text-[var(--color-ink,#1c1c1c)] outline-none focus-visible:border-[var(--color-gold,#b98a4e)]"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[10px] tracking-[0.15em] text-[var(--color-stone,#6b6154)] sm:text-xs sm:tracking-[0.2em]">
                  EMAIL
                </span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="border-b border-[var(--color-ink,#1c1c1c)]/25 bg-transparent py-2 text-sm text-[var(--color-ink,#1c1c1c)] outline-none focus-visible:border-[var(--color-gold,#b98a4e)]"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-[10px] tracking-[0.15em] text-[var(--color-stone,#6b6154)] sm:text-xs sm:tracking-[0.2em]">
                  MESSAGE
                </span>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="border border-[var(--color-ink,#1c1c1c)]/25 bg-transparent px-3 py-2 text-sm text-[var(--color-ink,#1c1c1c)] outline-none focus-visible:border-[var(--color-gold,#b98a4e)]"
                />
              </label>
              <button
                type="submit"
                className="font-marcellus mt-1 inline-flex w-fit items-center gap-4 bg-[var(--color-ink,#0a0a0a)] py-3 pl-6 pr-2 text-sm text-white sm:mt-2 sm:gap-5 sm:py-3.5 sm:pl-7 sm:pr-2.5 sm:text-[15px]"
              >
                Send Message
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--color-ink,#0a0a0a)] sm:h-9 sm:w-9">
                  →
                </span>
              </button>
            </form>
          )}
        </motion.div>
      </section>
    </div>
  );
}