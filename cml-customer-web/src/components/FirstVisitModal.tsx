// "use client";

// import { useEffect, useState } from "react";
// import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
// import { X } from "lucide-react";

// const SESSION_KEY = "cml_first_visit_modal_shown";

// export function FirstVisitModal() {
//   const [open, setOpen] = useState(false);
//   const [email, setEmail] = useState("");
//   const [submitted, setSubmitted] = useState(false);
//   const reduce = useReducedMotion();

//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if (sessionStorage.getItem(SESSION_KEY)) return;
//     const timer = setTimeout(() => {
//       setOpen(true);
//       sessionStorage.setItem(SESSION_KEY, "1");
//     }, 1200);
//     return () => clearTimeout(timer);
//   }, []);

//   function handleClose() {
//     setOpen(false);
//   }

//   function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     // No newsletter/promo-signup endpoint in the API contract yet — this just
//     // confirms locally until that's added.
//     setSubmitted(true);
//   }

//   return (
//     <AnimatePresence>
//       {open && (
//         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
//           <motion.div
//             className="absolute inset-0 bg-black/50"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={handleClose}
//             aria-hidden
//           />
//           <motion.div
//             role="dialog"
//             aria-modal="true"
//             aria-label="First purchase offer"
//             className="relative grid w-full max-w-2xl overflow-hidden bg-[var(--color-cream)] sm:grid-cols-2"
//             initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
//             animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
//             exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
//             transition={{ duration: 0.25, ease: "easeOut" }}
//           >
//             <button
//               onClick={handleClose}
//               aria-label="Close"
//               className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-cream)] text-[var(--color-ink)] shadow"
//             >
//               <X size={16} strokeWidth={1.5} />
//             </button>

//             <div className="hidden bg-[var(--color-cream-deep)] sm:block" aria-hidden>
//               <img
//                 src="/Images/0.jpg"
//                 alt=""
//                 className="h-full w-full object-cover object-center"
//                 draggable={false}
//               />
//             </div>
      

//             <div className="flex flex-col justify-center p-8">
//               <p className="eyebrow">On your first purchase</p>
//               <h2 className="mt-2 font-display text-2xl text-[var(--color-ink)]">Get 10% Off</h2>
//               <p className="mt-2 text-sm text-[var(--color-stone)]">
//                 Sign up for early access to new collections and a welcome discount.
//               </p>

//               {submitted ? (
//                 <p className="mt-6 text-sm text-[var(--color-maroon)]">
//                   You&apos;re on the list — check your inbox for the code.
//                 </p>
//               ) : (
//                 <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2">
//                   <input
//                     type="email"
//                     required
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     placeholder="Email address"
//                     className="border border-[var(--color-stone-light)] bg-[var(--color-cream)] px-3 py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
//                   />
//                   <button type="submit" className="pill mt-1 w-fit justify-center">
//                     Sign up
//                   </button>
//                 </form>
//               )}
//             </div>
//           </motion.div>
//         </div>
//       )}
//     </AnimatePresence>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { FaFacebookF, FaInstagram, FaYoutube, FaTwitter } from "react-icons/fa";
import { FaThreads } from "react-icons/fa6";

const SESSION_KEY = "cml_first_visit_modal_shown";



export function FirstVisitModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  function handleClose() {
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    // No newsletter/promo-signup endpoint in the API contract yet — this just
    // confirms locally until that's added.
    setSubmitted(true);
  }

  const socialLinks = [
    { Icon: FaFacebookF, label: "Facebook", href: "#" },
    { Icon: FaThreads, label: "Threads", href: "#" },
    { Icon: FaTwitter, label: "X", href: "#" },
    { Icon: FaInstagram, label: "Instagram", href: "#" },
    { Icon: FaYoutube, label: "YouTube", href: "#" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="First purchase offer"
            className="relative grid w-full max-w-5xl overflow-hidden rounded-sm shadow-2xl sm:grid-cols-2"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white transition-colors hover:bg-black/40"
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            {/* Left: model image */}
            <div className="relative hidden min-h-[560px] sm:block" aria-hidden>
              <img
                src="/Images/0.jpg"
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-[70%_20%]"
                draggable={false}
              />
            </div>

            {/* Right: offer panel */}
            <div
              className="flex flex-col justify-center gap-6 px-9 py-10 sm:px-10"
              style={{
                background:
                  "linear-gradient(160deg, #C7A374 0%, #B9925F 55%, #AD8752 100%)",
              }}
            >
              <div>
                <p
                  className="text-[11px] font-medium tracking-[0.3em] text-[#F3E8D8]"
                  style={{ fontFamily: "var(--font-sans, sans-serif)" }}
                >
                  ON YOUR FIRST PURCHASE
                </p>

                <h2
                  className="mt-3 text-[42px] leading-[1.08] text-white sm:text-[46px]"
                  style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)" }}
                >
                  Get Upto 30% <br />
                  Off + Free <br />
                  Shipping
                </h2>
              </div>

              {submitted ? (
                <p className="text-sm leading-relaxed text-[#F3E8D8]">
                  You&apos;re on the list — check your inbox for the code.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex overflow-hidden rounded-sm">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full bg-[#EFE3CC] px-5 py-4 text-[15px] text-[#4A3421] placeholder:text-[#7A6752] outline-none"
                    />
                    <button
                      type="submit"
                      className="shrink-0 whitespace-nowrap bg-[#3E2A16] px-8 py-4 text-[15px] font-medium text-[#F3E8D8] transition-colors hover:bg-[#4A331C] disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={!agreed}
                    >
                      Sign Up
                    </button>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[#F3E8D8]">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[2px] border border-[#F3E8D8] checked:bg-[#3E2A16]"
                    />
                    I agree with the{" "}
                    <a href="#" className="underline underline-offset-2 hover:text-white">
                      Terms &amp; Conditions
                    </a>
                  </label>
                </form>
              )}

              <div className="h-px w-full bg-[#F3E8D8]/40" />

              <div className="flex items-center gap-4">
                <span
                  className="text-[20px] text-white"
                  style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)" }}
                >
                  Social Media :
                </span>
                <div className="flex items-center gap-3">
                  {socialLinks.map(({ Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="flex h-8 w-8 items-center justify-center text-white transition-opacity hover:opacity-75"
                    >
                      <Icon size={18} strokeWidth={1.5} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}