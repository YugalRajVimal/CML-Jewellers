"use client";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-2 text-sm text-[var(--color-ink)] disabled:opacity-30"
      >
        Prev
      </button>
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i + 1)}
          aria-current={page === i + 1 ? "page" : undefined}
          className={`flex h-10 w-10 items-center justify-center text-sm ${
            page === i + 1 ? "bg-[var(--color-maroon)] text-[var(--color-cream)]" : "text-[var(--color-ink)]"
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-2 text-sm text-[var(--color-ink)] disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}
