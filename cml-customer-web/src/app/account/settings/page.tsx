// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { apiClient, ApiClientError } from "@/lib/api-client";
// import { clearTokens } from "@/lib/auth";
// import { useAuth } from "@/lib/auth-context";

// function VerifyBadge({ label, verified, onVerify }: { label: string; verified: boolean; onVerify: () => void }) {
//   return (
//     <div className="flex items-center justify-between border-b border-[var(--color-stone-light)] py-3">
//       <span className="text-sm">{label}</span>
//       {verified ? (
//         <span className="text-xs font-medium text-green-700">Verified</span>
//       ) : (
//         <button onClick={onVerify} className="text-xs text-[var(--color-gold)] underline">
//           Verify now
//         </button>
//       )}
//     </div>
//   );
// }

// export default function SettingsPage() {
//   const router = useRouter();
//   const [busy, setBusy] = useState(false);
//   const { recheck } = useAuth();
//   const [verifyChannel, setVerifyChannel] = useState<"email" | "sms" | null>(null);
// const [verifyCode, setVerifyCode] = useState("");
// const [verifyError, setVerifyError] = useState<string | null>(null);
// const [verifySubmitting, setVerifySubmitting] = useState(false);

// async function startVerify(channel: "email" | "sms") {
//   setVerifyError(null);
//   try {
//     await apiClient.post("/auth/verify/send", { channel });
//     setVerifyChannel(channel);
//   } catch (err) {
//     setVerifyError(err instanceof ApiClientError ? err.message : "Couldn't send code.");
//   }
// }

// async function confirmVerify(e: React.FormEvent) {
//   e.preventDefault();
//   if (!verifyChannel) return;
//   setVerifySubmitting(true);
//   setVerifyError(null);
//   try {
//     await apiClient.post("/auth/verify/confirm", { channel: verifyChannel, code: verifyCode });
//     setVerifyChannel(null);
//     setVerifyCode("");
//     // refetch profile so emailVerified/phoneVerified update in the UI
//     loadProfile();
//   } catch (err) {
//     setVerifyError(err instanceof ApiClientError ? err.message : "Invalid or expired code.");
//   } finally {
//     setVerifySubmitting(false);
//   }
// }

//   async function handleLogout() {
//     setBusy(true);
//     try {
//       await apiClient.post("/auth/logout");
//     } catch {
//       // even if the backend call fails, clear local state and send them to login
//     } finally {
//       clearTokens();
//       recheck();
//       router.push("/login");
//     }
//   }

  

//   return (
//     <div>
//       <h1 className="font-display text-3xl text-[var(--color-ink)]">Settings</h1>

//       <VerifyBadge label={`Email — ${user.email}`} verified={user.emailVerified} onVerify={() => startVerify("email")} />
// {user.phone && (
//   <VerifyBadge label={`Phone — ${user.phone}`} verified={user.phoneVerified} onVerify={() => startVerify("sms")} />
// )}

// {verifyChannel && (
//   <form onSubmit={confirmVerify} className="mt-3 flex items-center gap-2">
//     <input
//       value={verifyCode}
//       onChange={(e) => setVerifyCode(e.target.value)}
//       placeholder="6-digit code"
//       className="border border-[var(--color-stone-light)] px-3 py-2 text-sm"
//     />
//     <button type="submit" disabled={verifySubmitting} className="pill disabled:opacity-60">
//       {verifySubmitting ? "Verifying…" : "Confirm"}
//     </button>
//     {verifyError && <p className="text-xs text-red-700">{verifyError}</p>}
//   </form>
// )}

//       <div className="mt-8 max-w-md">
//         <p className="text-sm text-[var(--color-stone)]">
//           To change your password, use{" "}
//           <a href="/forgot-password" className="text-[var(--color-gold)] underline">
//             forgot password
//           </a>{" "}
//           from the login screen.
//         </p>

//         <button onClick={handleLogout} disabled={busy} className="pill mt-8 disabled:opacity-50">
//           {busy ? "Logging out…" : "Log out"}
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import { clearTokens } from "@/lib/auth";
import type { User } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const state = useAsync(
    () => apiClient.get<User>("/users/me"),
    () => false,
    [reloadKey],
  );

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
          <a href="/forgot-password" className="text-[var(--color-gold)] underline">
            forgot password
          </a>{" "}
          from the login screen.
        </p>

        {state.status === "loading" && <div className="mt-8 h-24 skeleton" aria-busy="true" />}

        {state.status === "success" && (
          <div className="mt-10">
            <h2 className="font-display text-xl text-[var(--color-ink)]">Verification</h2>
            {state.data.email && (
              <VerifyRow
                label={`Email — ${state.data.email}`}
                channel="email"
                verified={!!state.data.emailVerified}
                onVerified={() => setReloadKey((k) => k + 1)}
              />
            )}
            {state.data.phone && (
              <VerifyRow
                label={`Phone — ${state.data.phone}`}
                channel="sms"
                verified={!!state.data.phoneVerified}
                onVerified={() => setReloadKey((k) => k + 1)}
              />
            )}
          </div>
        )}

        <button onClick={handleLogout} disabled={busy} className="pill mt-8 disabled:opacity-50">
          {busy ? "Logging out…" : "Log out"}
        </button>
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