"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export function SearchBox({
  value,
  onChange,
  placeholder = "Search products",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  if (prevValue !== value) {
    setPrevValue(value);
    if (draft !== value) setDraft(value);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="flex items-center gap-2 border-b border-[var(--color-stone-light)] py-2">
      <Search size={16} strokeWidth={1.5} className="text-[var(--color-stone)]" />
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-stone)]"
      />
    </div>
  );
}
