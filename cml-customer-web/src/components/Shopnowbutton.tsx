"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ShopNowButton({ href = "/shop", label = "Shop Now" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center gap-4 overflow-hidden border border-[var(--color-ink,#2e1a0f)] bg-[var(--color-ink,#2e1a0f)] py-3.5 pl-7 pr-6 text-[15px] text-white transition-[clip-path,background-color] duration-500 ease-out [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] hover:bg-[var(--color-gold,#a9835a)] hover:pr-10 hover:[clip-path:polygon(0_0,78%_0,100%_50%,78%_100%,0_100%)]"
    >
      <span className="font-marcellus whitespace-nowrap">{label}</span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-ink,#2e1a0f)] transition-[background-color,color] duration-500 group-hover:bg-transparent group-hover:text-white">
        <ArrowRight size={14} strokeWidth={2} />
      </span>
    </Link>
  );
}