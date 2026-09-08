"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Address } from "@/lib/types";

const EMPTY_ADDRESS = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  phone: "",
};

export default function AddressesPage() {
  const [refetchKey, setRefetchKey] = useState(0);
  const state = useAsync(() => apiClient.get<Address[]>("/users/me/addresses"), (a) => a.length === 0, [refetchKey]);
  const refetch = () => setRefetchKey((k) => k + 1);

  const [editing, setEditing] = useState<Address | "new" | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-[var(--color-ink)]">Addresses</h1>
        {editing === null && (
          <button onClick={() => setEditing("new")} className="pill text-sm">
            Add address
          </button>
        )}
      </div>

      {state.status === "loading" && (
        <div className="mt-8 h-32 skeleton" aria-busy="true" />
      )}

      {state.status === "error" && (
        <p className="mt-8 text-sm text-[var(--color-stone)]">Couldn&apos;t load your addresses. ({state.message})</p>
      )}

      {state.status === "empty" && editing === null && (
        <p className="mt-8 text-sm text-[var(--color-stone)]">You don&apos;t have any saved addresses yet.</p>
      )}

      {state.status === "success" && editing === null && (
        <div className="mt-8 flex flex-col gap-3">
          {state.data.map((address) => (
            <div key={address.id} className="flex items-start justify-between border border-[var(--color-stone-light)] p-4 text-sm">
              <div>
                {address.isDefault && (
                  <span className="mb-1 inline-block rounded-full bg-[var(--color-gold-light)]/40 px-2 py-0.5 text-xs text-[var(--color-ink)]">
                    Default
                  </span>
                )}
                <p className="text-[var(--color-ink)]">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                </p>
                <p className="text-[var(--color-stone)]">
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="text-[var(--color-stone)]">{address.phone}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditing(address)} aria-label="Edit address" className="text-[var(--color-stone)] hover:text-[var(--color-ink)]">
                  <Pencil size={15} strokeWidth={1.5} />
                </button>
                <DeleteAddressButton addressId={address.id} onDeleted={refetch} />
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <AddressForm
          initial={editing === "new" ? null : editing}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function DeleteAddressButton({ addressId, onDeleted }: { addressId: string; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this address?")) return;
    setBusy(true);
    try {
      await apiClient.delete(`/users/me/addresses/${addressId}`);
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={handleDelete} disabled={busy} aria-label="Delete address" className="text-[var(--color-stone)] hover:text-[var(--color-maroon)] disabled:opacity-50">
      <Trash2 size={15} strokeWidth={1.5} />
    </button>
  );
}

function AddressForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Address | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial ?? EMPTY_ADDRESS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.line1.trim()) next.line1 = "Required";
    if (!form.city.trim()) next.city = "Required";
    if (!form.state.trim()) next.state = "Required";
    if (!/^\d{5,6}$/.test(form.postalCode.trim())) next.postalCode = "Enter a valid PIN code";
    if (!/^\+?\d{10,13}$/.test(form.phone.replace(/\s/g, ""))) next.phone = "Enter a valid phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setBusy(true);
    try {
      if (initial) {
        await apiClient.patch(`/users/me/addresses/${initial.id}`, form);
      } else {
        await apiClient.post("/users/me/addresses", form);
      }
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : "Couldn't save that address.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex max-w-md flex-col gap-3 border border-[var(--color-stone-light)] p-4">
      <Field label="Address line 1" error={errors.line1}>
        <input
          value={form.line1}
          onChange={(e) => setForm({ ...form, line1: e.target.value })}
          className="w-full border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none"
        />
      </Field>
      <Field label="Address line 2 (optional)">
        <input
          value={form.line2}
          onChange={(e) => setForm({ ...form, line2: e.target.value })}
          className="w-full border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" error={errors.city}>
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none"
          />
        </Field>
        <Field label="State" error={errors.state}>
          <input
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="w-full border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none"
          />
        </Field>
        <Field label="PIN code" error={errors.postalCode}>
          <input
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            className="w-full border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none"
          />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none"
          />
        </Field>
      </div>

      {submitError && <p className="text-xs text-[var(--color-maroon)]">{submitError}</p>}

      <div className="mt-2 flex gap-3">
        <button type="submit" disabled={busy} className="pill justify-center text-sm disabled:opacity-50">
          {busy ? "Saving…" : "Save address"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-[var(--color-stone)] underline">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-[var(--color-stone)]">{label}</span>
      {children}
      {error && <span className="text-xs text-[var(--color-maroon)]">{error}</span>}
    </label>
  );
}
