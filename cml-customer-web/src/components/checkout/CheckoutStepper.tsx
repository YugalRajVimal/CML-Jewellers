const STEPS = ["Address", "Shipping", "Review"] as const;

export function CheckoutStepper({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex items-center gap-3">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                i <= activeIndex
                  ? "bg-[var(--color-maroon)] text-[var(--color-cream)]"
                  : "border border-[var(--color-stone-light)] text-[var(--color-stone)]"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm ${i === activeIndex ? "text-[var(--color-ink)]" : "text-[var(--color-stone)]"}`}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && <span className="h-px w-8 bg-[var(--color-stone-light)]" />}
        </div>
      ))}
    </div>
  );
}
