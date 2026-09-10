// import Link from "next/link";

// const SERVICES = [
//   { label: "Track Order", href: "/orders" },
//   { label: "Returns", href: "/returns" },
//   { label: "Sizing Guide", href: "/sizing-guide" },
// ];

// const SUPPORT = [
//   { label: "Contact Us", href: "/contact" },
//   { label: "FAQs", href: "/faq" },
//   { label: "Shipping Info", href: "/shipping" },
// ];

// const RESOURCES = [
//   { label: "About Us", href: "/about" },
//   { label: "Care Guide", href: "/care" },
//   { label: "Gift Cards", href: "/gift-cards" },
// ];

// export function Footer() {
//   return (
//     <footer
//       className="relative text-[var(--color-stone-light)]"
//       style={{
//         backgroundImage:
//           "linear-gradient(rgba(61, 41, 48, 0.94), rgba(61, 41, 48, 0.94)), url('/footer-bg.jpg')",
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//       }}
//     >
//       <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5">
//         <div className="lg:col-span-2 flex flex-col items-start">
//           <div className="flex flex-col  items-start gap-3">
//             <img
//               src="/logo.png"
//               alt="CML Jewellers Logo"
//               className="h-16  "
//               draggable={false}
//             />
//             <p className="font-display text-2xl text-[var(--color-cream)]">
//               CML <span className="text-[var(--color-gold-light)]">Jewellers</span>
//             </p>
//           </div>
//           <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-stone-light)]/80">
//             Handcrafted gold and gemstone jewellery, made to be kept and passed down.
//           </p>
//         </div>
  

//         <FooterColumn title="Services" links={SERVICES} />
//         <FooterColumn title="Support" links={SUPPORT} />
//         <FooterColumn title="Resources" links={RESOURCES} />
//       </div>

//       <div className="border-t border-white/10">
//         <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-[var(--color-stone-light)]/70 sm:flex-row">
//           <span>© {new Date().getFullYear()} CML Jewellers. All rights reserved.</span>
//           <Link href="/terms" className="hover:text-[var(--color-gold-light)]">
//             Terms &amp; Conditions
//           </Link>
//         </div>
//       </div>
//     </footer>
//   );
// }

// function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
//   return (
//     <div>
//       <p className="font-display text-lg text-[var(--color-cream)]">{title}</p>
//       <ul className="mt-4 space-y-3 text-sm">
//         {links.map((link) => (
//           <li key={link.href}>
//             <Link href={link.href} className="hover:text-[var(--color-gold-light)]">
//               {link.label}
//             </Link>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

import Link from "next/link";
import { Smartphone, Apple, MessageCircle } from "lucide-react";

const SERVICES = [
  { label: "Track Order", href: "/orders" },
  { label: "Returns", href: "/returns" },
  { label: "Sizing Guide", href: "/sizing-guide" },
  { label: "Support Ticket", href: "/support" },
  { label: "Order History", href: "/orders" },
];

const SUPPORT = [
  { label: "Our Story", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQs", href: "/faq" },
  { label: "Shipping Info", href: "/shipping" },
  { label: "Call Us", href: "/contact" },
];

const RESOURCES = [
  { label: "Care Guide", href: "/care" },
  { label: "Gift Cards", href: "/gift-cards" },
  { label: "Events", href: "/events" },
  { label: "Sizing Guide", href: "/sizing-guide" },
  { label: "Accessibility", href: "/accessibility" },
];

const ENQUIRIES = [
  { label: "General", email: "contactus@cmljewellers.com" },
  { label: "Corporate", email: "b2b@cmljewellers.com" },
  { label: "HR", email: "careers@cmljewellers.com" },
  { label: "Complaint", email: "complaint@cmljewellers.com" },
];

const PAYMENT_METHODS = ["Visa", "Mastercard", "PayPal", "Amex", "RuPay", "GPay", "UPI"];

export function Footer() {
  return (
    <footer
      className="relative text-[var(--color-stone-light)]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(61, 41, 48, 0.94), rgba(61, 41, 48, 0.94)), url('/footer-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5">
        {/* Brand + app badges */}
        <div className="lg:col-span-2 flex flex-col items-start">
          <div className="flex flex-col items-start gap-3">
            <img src="/logo.png" alt="CML Jewellers Logo" className="h-16" draggable={false} />
            <p className="font-display text-2xl text-[var(--color-cream)]">
              CML <span className="text-[var(--color-gold-light)]">Jewellers</span>
            </p>
          </div>

          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-stone-light)]/80">
            Handcrafted gold and gemstone jewellery, made to be kept and passed down.
          </p>

          <p className="font-display mt-8 text-lg text-[var(--color-cream)]">Download The CML App</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="#"
              className="flex items-center gap-2 rounded-md border border-white/15 bg-black/40 px-4 py-2.5 transition-colors hover:border-[var(--color-gold-light)]"
            >
              <Smartphone size={22} strokeWidth={1.5} className="text-[var(--color-cream)]" />
              <span className="flex flex-col leading-none text-left">
                <span className="text-[9px] uppercase tracking-wide text-[var(--color-stone-light)]/70">
                  Get it on
                </span>
                <span className="text-sm text-[var(--color-cream)]">Google Play</span>
              </span>
            </a>

            <a
              href="#"
              className="flex items-center gap-2 rounded-md border border-white/15 bg-black/40 px-4 py-2.5 transition-colors hover:border-[var(--color-gold-light)]"
            >
              <Apple size={22} strokeWidth={1.5} className="text-[var(--color-cream)]" />
              <span className="flex flex-col leading-none text-left">
                <span className="text-[9px] uppercase tracking-wide text-[var(--color-stone-light)]/70">
                  Download on the
                </span>
                <span className="text-sm text-[var(--color-cream)]">App Store</span>
              </span>
            </a>
          </div>
        </div>

        <FooterColumn title="Services" links={SERVICES} />
        <FooterColumn title="Support" links={SUPPORT} />
        <FooterColumn title="Resources" links={RESOURCES} />
      </div>

      {/* 24x7 enquiry support strip */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="font-display text-lg text-[var(--color-cream)]">24x7 Enquiry Support (All Days)</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ENQUIRIES.map((item) => (
              <p key={item.label} className="text-sm">
                <span className="font-display text-[var(--color-cream)]">{item.label}:</span>{" "}
                <a href={`mailto:${item.email}`} className="text-[var(--color-stone-light)]/80 hover:text-[var(--color-gold-light)]">
                  {item.email}
                </a>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-[var(--color-stone-light)]/70 sm:flex-row">
          <span>© {new Date().getFullYear()} CML Jewellers. All rights reserved.</span>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="rounded border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[var(--color-stone-light)]/80"
              >
                {method}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-[var(--color-gold-light)]">
              Terms &amp; Conditions
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/privacy" className="hover:text-[var(--color-gold-light)]">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Floating chat affordance */}
      <button
        type="button"
        aria-label="Chat with us"
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-[var(--color-cream)] py-2.5 pl-3 pr-4 text-sm text-[var(--color-ink)] shadow-xl transition-transform hover:scale-105"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-stone-light,#d8c9ab)]">
          <MessageCircle size={18} strokeWidth={1.5} />
        </span>
        Chat with us 👋
      </button>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="font-display text-lg text-[var(--color-cream)]">{title}</p>
      <ul className="mt-4 space-y-3 text-sm">
        {links.map((link, i) => (
          <li key={`${link.href}-${i}`}>
            <Link href={link.href} className="hover:text-[var(--color-gold-light)]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}