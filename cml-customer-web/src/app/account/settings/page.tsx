"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { clearTokens } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // even if the backend call fails, clear local state and send them to login
    } finally {
      clearTokens();
      router.push("/login");
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-[var(--color-ink)]">Settings</h1>

      <div className="mt-8 max-w-md">
        <p className="text-sm text-[var(--color-stone)]">
          To change your password, use{" "}
          <a href="/password/forgot" className="text-[var(--color-gold)] underline">
            forgot password
          </a>{" "}
          from the login screen.
        </p>

        <button onClick={handleLogout} disabled={busy} className="pill mt-8 disabled:opacity-50">
          {busy ? "Logging out…" : "Log out"}
        </button>
      </div>
    </div>
  );
}
