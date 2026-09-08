import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/motion/PageTransition";

// NOTE: this sandbox can't reach fonts.googleapis.com, so the display/body
// faces are wired up as CSS variables with a system fallback for now. With
// normal network access, swap this block for:
//   import { Cormorant_Garamond, Jost } from "next/font/google";
//   const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400","500","600"] });
//   const jost = Jost({ variable: "--font-jost", subsets: ["latin"], weight: ["300","400","500"] });
// and add `${cormorant.variable} ${jost.variable}` to the <html> className below.

export const metadata: Metadata = {
  title: "CML Jewellers",
  description: "Handcrafted gold and gemstone jewellery, made to be kept and passed down.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--color-maroon)] focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--color-cream)]"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
