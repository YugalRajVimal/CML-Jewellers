// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { apiClient, ApiClientError } from "@/lib/api-client";
// import { useAsync } from "@/lib/use-async";
// import type { User } from "@/lib/types";

// export default function ProfilePage() {
//   const router = useRouter();
//   const state = useAsync(async () => {
//     const response = await apiClient.get<User>("/users/me");
//     console.log("User Profile Response:", response);
//     return response;
//   }, () => false);

//   // If error, redirect to /login
//   useEffect(() => {
//     if (state.status === "error") {
//       router.replace("/login");
//     }
//   }, [state.status, router]);

//   if (state.status === "loading") {
//     return <div className="h-40 skeleton" aria-busy="true" />;
//   }

//   // Don't render error text (we redirect instead)
//   if (state.status === "error") {
//     return null; // Or a spinner if you prefer
//   }

//   if (state.status === "empty") return null;

//   return <ProfileForm user={state.data} />;
// }

// function ProfileForm({ user }: { user: User }) {
//   const [name, setName] = useState(user.name);
//   const [email, setEmail] = useState(user.email ?? "");
//   const [phone, setPhone] = useState(user.phone ?? "");
//   const [saved, setSaved] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [busy, setBusy] = useState(false);
//   const router = useRouter();

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setError(null);
//     setSaved(false);
//     setBusy(true);
//     try {
//       await apiClient.patch("/users/me", { name, email, phone });
//       setSaved(true);
//     } catch (err) {
//       if (err instanceof ApiClientError && err.status === 401) {
//         router.replace("/login");
//         return;
//       }
//       setError(err instanceof ApiClientError ? err.message : "Couldn't save your profile.");
//     } finally {
//       setBusy(false);
//     }
//   }

//   return (
//     <div>
//       <h1 className="font-display text-3xl text-[var(--color-ink)]">Profile</h1>
//       <form onSubmit={handleSubmit} className="mt-8 flex max-w-md flex-col gap-4">
//         <label className="flex flex-col gap-1">
//           <span className="text-xs text-[var(--color-stone)]">Full name</span>
//           <input
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
//           />
//         </label>
//         <label className="flex flex-col gap-1">
//           <span className="text-xs text-[var(--color-stone)]">Email</span>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className="border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
//           />
//         </label>
//         <label className="flex flex-col gap-1">
//           <span className="text-xs text-[var(--color-stone)]">Phone</span>
//           <input
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//             className="border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
//           />
//         </label>

//         {error && <p className="text-sm text-[var(--color-maroon)]">{error}</p>}
//         {saved && <p className="text-sm text-[var(--color-maroon)]">Saved.</p>}

//         <button type="submit" disabled={busy} className="pill mt-2 w-fit justify-center disabled:opacity-50">
//           {busy ? "Saving…" : "Save changes"}
//         </button>
//       </form>
//     </div>
//   );
// }


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
    if (state.status === "error") {
      router.replace("/login");
    }
  }, [state.status, router]);

  if (state.status === "loading") {
    return <div className="h-40 skeleton" aria-busy="true" />;
  }

  if (state.status === "error") return null;
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