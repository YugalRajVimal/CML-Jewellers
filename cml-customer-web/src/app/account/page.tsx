"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [reloadKey, setReloadKey] = useState(0);

  const state = useAsync(
    async () => {
      const response = await apiClient.get<User>("/users/me");
      return response;
    },
    () => false,
    [reloadKey],
  );

  useEffect(() => {
    if (state.status === "error" && state.httpStatus === 401) {
      router.replace("/login");
    }
  }, [state.status, state, router]);

  if (state.status === "loading") {
    return <div className="h-40 skeleton" aria-busy="true" />;
  }

  if (state.status === "error") {
    if (state.httpStatus === 401) return null; // redirect is in-flight via the effect above
    return (
      <p className="text-sm text-[var(--color-maroon)]">Couldn&apos;t load your profile. ({state.message})</p>
    );
  }
  if (state.status === "empty") return null;

  return <ProfileForm user={state.data} onVerified={() => setReloadKey((k) => k + 1)} />;
}

function ProfileForm({ user, onVerified }: { user: User; onVerified: () => void }) {
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
      // Only send fields that are non-empty and actually changed — an empty string for a
      // field the user never had (e.g. no email on a phone-only account) fails validation
      // (email()/phone regex expect a valid value or nothing at all, not "").
      const updates: { name?: string; email?: string; phone?: string } = {};
      if (name.trim() !== "" && name !== user.name) updates.name = name.trim();
      if (email.trim() !== "" && email !== (user.email ?? "")) updates.email = email.trim();
      if (phone.trim() !== "" && phone !== (user.phone ?? "")) updates.phone = phone.trim();

      await apiClient.patch("/users/me", updates);
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

      <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full border border-[var(--color-stone-light)] px-3 py-2 text-sm"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border border-[var(--color-stone-light)] px-3 py-2 text-sm"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className="w-full border border-[var(--color-stone-light)] px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        {saved && <p className="text-sm text-green-700">Saved.</p>}
        <button type="submit" disabled={busy} className="pill disabled:opacity-50">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div className="mt-10 max-w-md">
        <h2 className="font-display text-xl text-[var(--color-ink)]">Verification</h2>
        {user.email && (
          <VerifyRow label={`Email — ${user.email}`} channel="email" verified={!!user.emailVerified} onVerified={onVerified} />
        )}
        {user.phone && (
          <VerifyRow label={`Phone — ${user.phone}`} channel="sms" verified={!!user.phoneVerified} onVerified={onVerified} />
        )}
      </div>
    </div>
  );
}

function VerifyRow({
  label,
  channel,
  verified,
  onVerified,
}: {
  label: string;
  channel: "email" | "sms";
  verified: boolean;
  onVerified: () => void;
}) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setError(null);
    setSending(true);
    try {
      await apiClient.post("/auth/verify/send", { channel });
      setShowCodeInput(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't send code.");
    } finally {
      setSending(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirming(true);
    try {
      await apiClient.post("/auth/verify/confirm", { channel, code });
      setShowCodeInput(false);
      setCode("");
      onVerified();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Invalid or expired code.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="border-b border-[var(--color-stone-light)] py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm">{label}</span>
        {verified ? (
          <span className="text-xs font-medium text-green-700">Verified</span>
        ) : (
          <button onClick={handleSend} disabled={sending} className="text-xs text-[var(--color-gold)] underline disabled:opacity-50">
            {sending ? "Sending…" : "Verify now"}
          </button>
        )}
      </div>

      {showCodeInput && (
        <form onSubmit={handleConfirm} className="mt-2 flex items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className="border border-[var(--color-stone-light)] px-3 py-2 text-sm"
          />
          <button type="submit" disabled={confirming} className="pill disabled:opacity-60">
            {confirming ? "Verifying…" : "Confirm"}
          </button>
        </form>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}