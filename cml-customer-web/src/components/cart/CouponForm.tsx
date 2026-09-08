"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";

export function CouponForm({
  appliedCode,
  onApplied,
  onRemoved,
}: {
  appliedCode?: string;
  onApplied: () => void;
  onRemoved: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiClient.post("/cart/coupon", { code });
      setCode("");
      onApplied();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.code === "COUPON_EXPIRED"
            ? "That coupon has expired."
            : err.code === "COUPON_INVALID"
              ? "That coupon code isn't valid."
              : err.message
          : "Couldn't apply that coupon.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await apiClient.delete("/cart/coupon");
      onRemoved();
    } finally {
      setBusy(false);
    }
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between border border-[var(--color-gold)] bg-[var(--color-cream-deep)] px-4 py-3 text-sm">
        <span>
          Coupon <strong>{appliedCode}</strong> applied
        </span>
        <button onClick={handleRemove} disabled={busy} className="text-[var(--color-stone)] underline disabled:opacity-50">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Coupon code"
          className="w-full border border-[var(--color-stone-light)] bg-[var(--color-cream)] px-3 py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
        />
        <button
          type="submit"
          disabled={busy || !code}
          className="shrink-0 border border-[var(--color-maroon)] px-4 py-2 text-sm text-[var(--color-maroon)] disabled:opacity-50"
        >
          Apply
        </button>
      </div>
      {error && <p className="text-xs text-[var(--color-maroon)]">{error}</p>}
    </form>
  );
}
