"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { setAccessToken } from "@/lib/auth";
import { AuthCard, AuthInput } from "@/components/AuthCard";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { recheck } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const isEmail = identifier.includes("@");
      const data = await apiClient.post<{ accessToken: string }>(
        "/auth/login",
        {
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
      eyebrow="Welcome back"
      title="Log in to your account"
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="text-[var(--color-gold)]">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <div className="mt-2 block text-sm">
        <Link href="/forgot-password" className="text-[var(--color-stone)] mr-4">
          Forgot your password?
        </Link>
        <Link href="/forgot-password" className="text-[var(--color-gold)]">
          Forgot password?
        </Link>
      </div>
    </AuthCard>
  );
}
