import Link from "next/link";

const SERVICES = [
  { label: "Track Order", href: "/orders" },
  { label: "Returns", href: "/returns" },
  { label: "Sizing Guide", href: "/sizing-guide" },
];

const SUPPORT = [
  { label: "Contact Us", href: "/contact" },
  { label: "FAQs", href: "/faq" },
  { label: "Shipping Info", href: "/shipping" },
];

const RESOURCES = [
  { label: "About Us", href: "/about" },
  { label: "Care Guide", href: "/care" },
  { label: "Gift Cards", href: "/gift-cards" },
];

export function Footer() {
  return (
    <footer className="bg-[var(--color-maroon-deep)] text-[var(--color-stone-light)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="font-display text-2xl text-[var(--color-cream)]">
            CML <span className="text-[var(--color-gold-light)]">Jewellers</span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-stone-light)]/80">
            Handcrafted gold and gemstone jewellery, made to be kept and passed down.
          </p>
        </div>

        <FooterColumn title="Services" links={SERVICES} />
        <FooterColumn title="Support" links={SUPPORT} />
        <FooterColumn title="Resources" links={RESOURCES} />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-[var(--color-stone-light)]/70 sm:flex-row">
          <span>© {new Date().getFullYear()} CML Jewellers. All rights reserved.</span>
          <Link href="/terms" className="hover:text-[var(--color-gold-light)]">
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="font-display text-lg text-[var(--color-cream)]">{title}</p>
      <ul className="mt-4 space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-[var(--color-gold-light)]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
