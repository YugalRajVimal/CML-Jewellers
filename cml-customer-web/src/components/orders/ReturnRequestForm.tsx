"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { OrderLineItem, ReturnRequest } from "@/lib/types";

const REASONS = ["Doesn't fit", "Not as described", "Changed my mind", "Damaged or defective", "Other"];

export function ReturnRequestForm({
  orderId,
  items,
  onSubmitted,
  onCancel,
}: {
  orderId: string;
  /** Order line items available to return. Optional so a whole-order return still works without them. */
  items?: OrderLineItem[];
  onSubmitted: (returnId: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleItem(itemId: string) {
    setSelectedItemIds((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // item.id is `${productId}-${variantId}` (see order.controller#serializeOrder) — split it back apart.
      const selectedItems =
        items && selectedItemIds.length > 0
          ? items
              .filter((item) => selectedItemIds.includes(item.id))
              .map((item) => {
                const [orderItemProductId, variantId] = item.id.split("-");
                return { orderItemProductId, variantId, qty: item.quantity, reason };
              })
          : undefined;

      const created = await apiClient.post<ReturnRequest>("/returns", {
        orderId,
        reason,
        notes,
        items: selectedItems,
      });
      onSubmitted(created.id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't submit the return request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 border border-[var(--color-stone-light)] p-4">
      {items && items.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-stone)]">Items to return (leave unchecked to return the whole order)</span>
          {items.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
              <input
                type="checkbox"
                checked={selectedItemIds.includes(item.id)}
                onChange={() => toggleItem(item.id)}
              />
              {item.productName} · Qty {item.quantity}
            </label>
          ))}
        </div>
      )}
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