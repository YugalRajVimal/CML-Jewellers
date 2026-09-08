"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { setAccessToken } from "@/lib/auth";
import { AuthCard, AuthInput } from "@/components/AuthCard";

function OtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const identifier = params.get("identifier") ?? "";
  const purpose = params.get("purpose") ?? "register";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await apiClient.post<{ accessToken: string }>(
        "/auth/otp/verify",
        { identifier, code, purpose },
        { auth: false },
      );
      setAccessToken(data.accessToken);
      router.push("/account");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Invalid or expired code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    try {
      await apiClient.post(
        "/auth/otp/resend",
        { identifier, channel: identifier.includes("@") ? "email" : "sms", purpose },
        { auth: false },
      );
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      // resend failures are non-fatal — the user can just try again
    }
  }

  return (
    <AuthCard eyebrow="Verify" title={`Enter the code sent to ${identifier || "you"}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput
          type="text"
          inputMode="numeric"
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={submitting} className="pill mt-2 justify-center disabled:opacity-60">
          {submitting ? "Verifying…" : "Verify"}
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

export default function OtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpForm />
    </Suspense>
  );
}
