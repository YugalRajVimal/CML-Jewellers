"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AuthCard, AuthInput } from "@/components/AuthCard";
import { setAccessToken } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { recheck } = useAuth();

  // Policy (BUG-15): registration doesn't require proving contact ownership up front —
  // the account is created and logged in immediately. Ownership is instead proven later,
  // on demand, via the authenticated /auth/verify/send + /auth/verify/confirm flow (see
  // the "Verify now" control on the account/settings page). We deliberately do NOT call
  // the public /auth/otp/send with purpose "verify_contact" here: that purpose is no
  // longer accepted on the unauthenticated route (it was a spam vector — anyone could
  // trigger an OTP to an arbitrary email/phone), and the authenticated route derives the
  // identifier from the logged-in user instead of trusting client input.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const isEmail = identifier.includes("@");
      const data = await apiClient.post<{ accessToken: string }>(
        "/auth/register",
        {
          name,
          ...(isEmail ? { email: identifier } : { phone: identifier }),
          password,
        },
        { auth: false },
      );
      setAccessToken(data.accessToken);
      recheck();
      router.push("/account");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Join us"
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--color-gold)]">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <AuthInput
          type="text"
          placeholder="Email or phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <AuthInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={submitting} className="pill mt-2 justify-center disabled:opacity-60">
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}