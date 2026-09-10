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

  // async function handleSubmit(e: React.FormEvent) {
  //   e.preventDefault();
  //   setError(null);
  //   setSubmitting(true);
  //   try {
  //     await apiClient.post("/auth/register", { name, identifier, password }, { auth: false });
  //     await apiClient.post(
  //       "/auth/otp/send",
  //       { channel: identifier.includes("@") ? "email" : "sms", purpose: "register" },
  //       { auth: false },
  //     );
  //     router.push(`/otp?identifier=${encodeURIComponent(identifier)}&purpose=register`);
  //   } catch (err) {
  //     setError(err instanceof ApiClientError ? err.message : "Something went wrong. Try again.");
  //   } finally {
  //     setSubmitting(false);
  //   }
  // }

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
      setAccessToken(data.accessToken); // register already logs you in — no need to wait on OTP
      recheck();
      await apiClient.post(
        "/auth/otp/send",
        { identifier, channel: isEmail ? "email" : "sms", purpose: "verify_contact" },
        { auth: false },
      ).catch(() => {}); // best-effort — verification is optional, don't block account creation on it
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
