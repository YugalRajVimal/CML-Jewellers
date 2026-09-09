"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { FeaturedCategories } from "@/components/FeaturedCategories";
import { StatBand } from "@/components/StatBand";
import { EditorialSplit } from "@/components/EditorialSplit";
import { ProductTabsSection } from "@/components/ProductTabsSection";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { SplitPromoBanner } from "@/components/SplitPromoBanner";
import { PromoTiles } from "@/components/PromoTiles";
import { LogoStrip } from "@/components/LogoStrip";
import { Testimonials } from "@/components/Testimonials";
import { NewsletterBand } from "@/components/NewsletterBand";
import { FirstVisitModal } from "@/components/FirstVisitModal";
import { Sparkle } from "@/components/motion/Sparkle";

export default function Home() {
  const reduce = useReducedMotion();

  return (
    <>
      <FirstVisitModal />

      <section className="relative mx-auto grid max-w-7xl gap-10 overflow-hidden px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <Sparkle className="absolute left-8 top-10 hidden lg:block" size={14} delay={0} />
        <Sparkle className="absolute left-24 top-28 hidden lg:block" size={9} delay={0.8} />
        <Sparkle className="absolute left-[38%] top-16 hidden lg:block" size={11} delay={1.4} />

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="eyebrow">Crafted since generations</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.08] text-[var(--color-ink)] lg:text-6xl">
            Jewellery <span className="text-[var(--color-gold)]">worth</span>
            <br />
            handing down
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--color-stone)]">
            Gold, diamond, and gemstone pieces made by hand, for the moments you&apos;ll want to
            remember them by.
          </p>
          <Link href="/shop" className="pill mt-8">
            Shop the collection
            <span className="pill-icon">
              <ArrowRight size={13} strokeWidth={2} />
            </span>
          </Link>
        </motion.div>

        <div className="aspect-[4/5] w-full rounded-tr-[70%] bg-[var(--color-cream-deep)] overflow-hidden flex items-center justify-center">
          <img
            src="/Images/I1.jpg"
            alt="Gold and gemstone jewellery"
            className="h-full w-full object-cover object-center"
            draggable={false}
          />
        </div>
  
  
      </section>

      <FeaturedCategories />
      <StatBand />
      <EditorialSplit />
      <ProductTabsSection />
      <MarqueeStrip />
      <SplitPromoBanner />
      <PromoTiles />
      <LogoStrip />
      <Testimonials />
      <NewsletterBand />
    </>
  );
}
