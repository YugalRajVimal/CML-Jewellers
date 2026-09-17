"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";

export default function SettingsPage() {
  const [codEnabled, setCodEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSettings()
      .then((s) => setCodEnabled(s.codEnabled))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load settings."));
  }, []);

  async function toggleCod() {
    if (codEnabled === null) return;
    const next = !codEnabled;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await api.updateSettings(next);
      setCodEnabled(updated.codEnabled);
      setNotice(`Cash on Delivery is now ${updated.codEnabled ? "enabled" : "disabled"} at checkout.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-ink-950">Settings</h1>
      <p className="mt-1 text-sm text-ink-500">Site-wide toggles for checkout and fulfilment.</p>

      <div className="mt-6 rounded-xl border border-line bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink-900">Cash on Delivery</p>
            <p className="mt-1 text-sm text-ink-500">
              When enabled, customers can choose to pay on delivery instead of paying online at checkout.
            </p>
          </div>
          <button
            onClick={toggleCod}
            disabled={codEnabled === null || saving}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
              codEnabled ? "bg-maroon-700 text-gold-100" : "bg-ink-100 text-ink-700"
            }`}
          >
            {codEnabled === null ? "Loading…" : codEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
