"use client";

const METALS = ["Gold", "Rose Gold", "Silver", "Platinum"];

export interface FilterValues {
  minPrice?: number;
  maxPrice?: number;
  metal?: string;
}

export function FilterPanel({
  values,
  onChange,
}: {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-display text-lg text-[var(--color-ink)]">Price</p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="number"
            placeholder="Min"
            value={values.minPrice ?? ""}
            onChange={(e) =>
              onChange({ ...values, minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full border border-[var(--color-stone-light)] bg-[var(--color-cream)] px-3 py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
          />
          <span className="text-[var(--color-stone)]">–</span>
          <input
            type="number"
            placeholder="Max"
            value={values.maxPrice ?? ""}
            onChange={(e) =>
              onChange({ ...values, maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full border border-[var(--color-stone-light)] bg-[var(--color-cream)] px-3 py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
          />
        </div>
      </div>

      <div>
        <p className="font-display text-lg text-[var(--color-ink)]">Metal</p>
        <div className="mt-3 flex flex-col gap-2">
          {METALS.map((metal) => (
            <label key={metal} className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
              <input
                type="radio"
                name="metal"
                checked={values.metal === metal}
                onChange={() => onChange({ ...values, metal })}
              />
              {metal}
            </label>
          ))}
          {values.metal && (
            <button
              onClick={() => onChange({ ...values, metal: undefined })}
              className="mt-1 w-fit text-xs text-[var(--color-stone)] underline"
            >
              Clear metal filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
