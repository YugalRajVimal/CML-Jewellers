"use client";

import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No /contact endpoint exists in the API contract yet — this gives the
    // person feedback locally until that's added.
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="eyebrow">Get in touch</p>
      <h1 className="mt-3 font-display text-4xl text-[var(--color-ink)]">Contact Us</h1>

      <div className="mt-8 grid gap-10 sm:grid-cols-2">
        <div className="text-sm leading-relaxed text-[var(--color-stone)]">
          <p>Customer support</p>
          <p className="mt-1 text-[var(--color-ink)]">+91 98765 43210</p>
          <p className="mt-4">Email</p>
          <p className="mt-1 text-[var(--color-ink)]">support@cmljewellers.com</p>
          <p className="mt-4">Hours</p>
          <p className="mt-1 text-[var(--color-ink)]">Mon–Sat, 10am–7pm IST</p>
        </div>

        <div>
          {submitted ? (
            <p className="text-sm text-[var(--color-maroon)]">
              Thanks — we&apos;ve got your message and will reply within a business day.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-stone)]">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-stone)]">Email</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="border-b border-[var(--color-stone-light)] bg-transparent py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-[var(--color-stone)]">Message</span>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="border border-[var(--color-stone-light)] bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-[var(--color-gold)]"
                />
              </label>
              <button type="submit" className="pill mt-2 w-fit justify-center">
                Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
