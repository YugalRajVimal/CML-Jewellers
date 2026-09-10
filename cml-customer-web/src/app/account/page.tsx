"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const state = useAsync(async () => {
    const response = await apiClient.get<User>("/users/me");
    console.log("User Profile Response:", response);
    return response;
  }, () => false);

  // If error, redirect to /login
  useEffect(() => {
    if (state.status === "error") {
      router.replace("/login");
    }
  }, [state.status, router]);

  if (state.status === "loading") {
    return <div className="h-40 skeleton" aria-busy="true" />;
  }

  // Don't render error text (we redirect instead)
  if (state.status === "error") {
    return null; // Or a spinner if you prefer
  }

  if (state.status === "empty") return null;

  return <ProfileForm user={state.data} />;
}

function ProfileForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await apiClient.patch("/users/me", { name, email, phone });
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof ApiClientError ? err.message : "Couldn't save your profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-[var(--color-ink)]">Profile</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-stone)]">Full name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-stone)]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[var(--color-stone)]">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
          />
        </label>

        {error && <p className="text-sm text-[var(--color-maroon)]">{error}</p>}
        {saved && <p className="text-sm text-[var(--color-maroon)]">Saved.</p>}

        <button type="submit" disabled={busy} className="pill mt-2 w-fit justify-center disabled:opacity-50">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
