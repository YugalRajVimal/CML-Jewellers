const TAGLINES = [
  "Finished by hand, not by machine",
  "Certified stones, honest pricing",
  "Three generations of goldsmithing",
];

export function MarqueeStrip() {
  const separator = (
    <span className="mx-6 inline-block text-[var(--color-gold)]" aria-hidden>
      ◆
    </span>
  );

  const line = (
    <>
      {TAGLINES.map((t, i) => (
        <span key={i} className="inline-flex items-center">
          {t}
          {separator}
        </span>
      ))}
    </>
  );

  return (
    <div className="overflow-hidden border-y border-black/20 bg-[var(--color-maroon-deep)] py-4">
      <div className="animate-marquee flex whitespace-nowrap text-sm tracking-wide text-[var(--color-gold-light)]">
        <span className="flex">{line}</span>
        <span className="flex" aria-hidden>
          {line}
        </span>
      </div>
    </div>
  );
}
