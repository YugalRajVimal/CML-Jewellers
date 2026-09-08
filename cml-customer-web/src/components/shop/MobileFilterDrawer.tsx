"use client";

import { X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { FilterPanel, type FilterValues } from "./FilterPanel";

export function MobileFilterDrawer({
  values,
  onChange,
}: {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-[var(--color-stone-light)] px-4 py-2 text-sm lg:hidden"
      >
        <SlidersHorizontal size={14} strokeWidth={1.5} />
        Filters
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-[var(--color-cream)] p-6">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-display text-xl text-[var(--color-ink)]">Filters</p>
              <button onClick={() => setOpen(false)} aria-label="Close filters">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <FilterPanel values={values} onChange={onChange} />
            <button
              onClick={() => setOpen(false)}
              className="pill mt-8 w-full justify-center"
            >
              Show results
            </button>
          </div>
        </div>
      )}
    </>
  );
}
