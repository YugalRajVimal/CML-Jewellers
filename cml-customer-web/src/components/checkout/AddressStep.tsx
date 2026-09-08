"use client";

import { useState } from "react";
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

export function AddressStep({
  selectedId,
  onSelect,
  onNext,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNext: () => void;
}) {
  const [refetchKey, setRefetchKey] = useState(0);
  const state = useAsync(() => apiClient.get<Address[]>("/users/me/addresses"), (a) => a.length === 0, [refetchKey]);
  const [showForm, setShowForm] = useState(false);

  if (state.status === "loading") {
    return <div className="h-32 skeleton" aria-busy="true" />;
  }

  if (state.status === "error") {
    return <p className="text-sm text-[var(--color-stone)]">Couldn&apos;t load your addresses. ({state.message})</p>;
  }

  const addresses = state.status === "success" ? state.data : [];

  return (
    <div>
      {addresses.length > 0 && (
        <div className="flex flex-col gap-3">
          {addresses.map((address) => (
            <label
              key={address.id}
              className={`flex cursor-pointer items-start gap-3 border p-4 text-sm ${
                selectedId === address.id ? "border-[var(--color-gold)]" : "border-[var(--color-stone-light)]"
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={selectedId === address.id}
                onChange={() => onSelect(address.id)}
                className="mt-1"
              />
              <div>
                <p className="text-[var(--color-ink)]">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                </p>
                <p className="text-[var(--color-stone)]">
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="text-[var(--color-stone)]">{address.phone}</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {state.status === "empty" && (
        <p className="text-sm text-[var(--color-stone)]">You don&apos;t have any saved addresses yet.</p>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 text-sm text-[var(--color-gold)] underline"
        >
          + Add a new address
        </button>
      ) : (
        <NewAddressForm
          onSaved={(address) => {
            setShowForm(false);
            setRefetchKey((k) => k + 1);
            onSelect(address.id);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <button
        onClick={onNext}
        disabled={!selectedId}
        className="pill mt-8 w-full justify-center disabled:opacity-50"
      >
        Continue to shipping
      </button>
    </div>
  );
}

function NewAddressForm({ onSaved, onCancel }: { onSaved: (address: Address) => void; onCancel: () => void }) {
  const [form, setForm] = useState(EMPTY_ADDRESS);
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
      const address = await apiClient.post<Address>("/users/me/addresses", form);
      onSaved(address);
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : "Couldn't save that address.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 border border-[var(--color-stone-light)] p-4">
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
