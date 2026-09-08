"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";

const REASONS = ["Doesn't fit", "Not as described", "Changed my mind", "Damaged or defective", "Other"];

export function ReturnRequestForm({
  orderId,
  onSubmitted,
  onCancel,
}: {
  orderId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiClient.post("/returns", { orderId, reason, notes });
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't submit the return request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 border border-[var(--color-stone-light)] p-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-[var(--color-stone)]">Reason</span>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border border-[var(--color-stone-light)] bg-[var(--color-cream)] px-3 py-2 text-sm outline-none"
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-[var(--color-stone)]">Additional notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="border border-[var(--color-stone-light)] bg-[var(--color-cream)] px-3 py-2 text-sm outline-none"
        />
      </label>
      {error && <p className="text-xs text-[var(--color-maroon)]">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="pill text-sm disabled:opacity-50">
          {busy ? "Submitting…" : "Submit return request"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-[var(--color-stone)] underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
