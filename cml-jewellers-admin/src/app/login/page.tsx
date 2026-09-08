"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";

const DEMO_ACCOUNTS = [
  { email: "meera@cmljewellers.com", password: "super123", label: "Super Admin" },
  { email: "rohan@cmljewellers.com", password: "catalog123", label: "Catalog Manager" },
  { email: "priya@cmljewellers.com", password: "ops123", label: "Operations" },
];

export default function LoginPage() {
  const { login, status, error } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authed") router.replace("/dashboard");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch {
      // error surfaced via auth context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-maroon-900 text-gold-100 px-12 py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
        <div className="relative flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-full ring-1 ring-gold-400/60">
            <Image src="/cml-logo.jpg" alt="CML Jewellers" fill className="object-cover scale-[2.6] translate-y-1" />
          </div>
          <span className="font-display text-lg">CML Jewellers</span>
        </div>
        <div className="relative max-w-sm">
          <p className="font-display italic text-3xl leading-snug text-gold-200">
            &ldquo;Every order, every carat of stock, every return — one console.&rdquo;
          </p>
          <p className="mt-4 text-sm text-gold-100/70">
            The operations console for catalog, inventory, purchasing, orders and returns across CML Jewellers.
          </p>
        </div>
        <p className="relative text-xs text-gold-100/50">© 2026 CML Jewellers. Internal use only.</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-gold-400/60">
              <Image src="/cml-logo.jpg" alt="CML Jewellers" fill className="object-cover scale-[2.6] translate-y-1" />
            </div>
            <span className="font-display text-lg text-ink-950">CML Jewellers</span>
          </div>

          <h1 className="font-display text-2xl text-ink-950">Sign in to the console</h1>
          <p className="mt-1 text-sm text-ink-500">Use your admin credentials to continue.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@cmljewellers.com"
                  className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-maroon-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-maroon-600"
                />
              </div>
            </div>

            {error && <p className="text-sm text-bad">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-maroon-700 py-2.5 text-sm font-medium text-gold-100 hover:bg-maroon-600 disabled:opacity-60"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Sign in
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-line bg-ink-100/40 p-3.5">
            <p className="text-xs font-medium text-ink-700 mb-2">Demo accounts</p>
            <ul className="space-y-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <li key={acc.email}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword(acc.password);
                    }}
                    className="text-xs text-ink-500 hover:text-maroon-600 underline decoration-dotted underline-offset-2"
                  >
                    {acc.label} — {acc.email} / {acc.password}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
