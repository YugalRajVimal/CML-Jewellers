import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — CML Jewellers",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="eyebrow">Our story</p>
      <h1 className="mt-3 font-display text-4xl text-[var(--color-ink)]">Three generations of goldsmithing</h1>
      <div className="mt-8 flex flex-col gap-5 text-[15px] leading-relaxed text-[var(--color-stone)]">
        <p>
          CML Jewellers started as a single workbench, passed from one generation to the next along
          with the tools and the habits that came with it — polishing by hand, checking a setting
          twice, never letting a piece leave the workshop until someone was willing to put their name
          to it.
        </p>
        <p>
          That hasn&apos;t changed as the workshop has grown. Every piece we sell is still finished by
          hand, every stone is certified before it&apos;s set, and every order is inspected before it
          ships — the same way it would have been decades ago.
        </p>
        <p>
          We build jewellery to be worn, kept, and eventually handed down. If something we made ever
          needs a repair or a resize, we&apos;d rather you bring it back to us than replace it.
        </p>
      </div>
    </div>
  );
}
