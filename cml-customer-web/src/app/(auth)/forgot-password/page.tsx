"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { AuthCard, AuthInput } from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const isEmail = identifier.includes("@");
      await apiClient.post("/auth/password/forgot",
        isEmail ? { email: identifier } : { phone: identifier },
        { auth: false });
      router.push(`/reset-password?identifier=${encodeURIComponent(identifier)}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard eyebrow="Reset password" title="Forgot your password?">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput placeholder="Email or phone" value={identifier}
          onChange={(e) => setIdentifier(e.target.value)} required />
        {error && <p className="text-sm text-[var(--color-maroon)]">{error}</p>}
        <button className="pill justify-center" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset code"}
        </button>
      </form>
    </AuthCard>
  );
}