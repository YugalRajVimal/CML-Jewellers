"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { AuthCard, AuthInput } from "@/components/AuthCard";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const identifier = params.get("identifier") ?? "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(
        "/auth/password/reset",
        { identifier, code, newPassword },
        { auth: false },
      );
      router.push("/login?reset=success");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Invalid or expired code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    try {
      const isEmail = identifier.includes("@");
      await apiClient.post(
        "/auth/password/forgot",
        isEmail ? { email: identifier } : { phone: identifier },
        { auth: false },
      );
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      // resend failures are non-fatal
    }
  }

  return (
    <AuthCard eyebrow="Reset password" title={`Enter the code sent to ${identifier || "you"}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput
          type="text"
          inputMode="numeric"
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <AuthInput
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <AuthInput
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={submitting} className="pill mt-2 justify-center disabled:opacity-60">
          {submitting ? "Resetting…" : "Reset password"}
        </button>
      </form>
      <button
        onClick={handleResend}
        disabled={resendCooldown > 0}
        className="mt-4 text-sm text-[var(--color-stone)] disabled:opacity-60"
      >
        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
      </button>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}