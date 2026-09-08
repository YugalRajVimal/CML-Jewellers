"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { PaymentSession } from "@/lib/types";

function PaymentHandoff() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    apiClient
      .post<PaymentSession>("/payments/cashfree/create", { orderId })
      .then((session) => {
        if (cancelled) return;
        // Hand off to Cashfree's hosted checkout. We never mark the order paid
        // from the frontend — only the webhook does that.
        window.location.href = session.paymentLink;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiClientError ? err.message : "Couldn't start the payment. Please try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const missingOrder = !orderId;

  if (missingOrder || error) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-[var(--color-ink)]">Couldn&apos;t start payment</h1>
        <p className="mt-3 text-sm text-[var(--color-stone)]">
          {missingOrder ? "Missing order — please go back to your cart and try again." : error}
        </p>
        <Link href="/cart" className="pill mt-8">
          Back to cart
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-stone-light)] border-t-[var(--color-maroon)]" />
      <p className="mt-6 text-sm text-[var(--color-stone)]">Redirecting you to a secure payment page…</p>
    </div>
  );
}

export default function PaymentHandoffPage() {
  return (
    <Suspense fallback={null}>
      <PaymentHandoff />
    </Suspense>
  );
}
