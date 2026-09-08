"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { Order } from "@/lib/types";

export type PaymentFlavor = "success" | "failure" | "cancel";

type ResolvedOutcome = "checking" | "success" | "failed" | "cancelled" | "pending" | "error";

const POLL_ATTEMPTS = 4;
const POLL_INTERVAL_MS = 2500;

/**
 * Cashfree redirects to a distinct URL per outcome (success/failure/cancel), but we never
 * trust that path alone — the order's real status always comes from the backend, since only
 * the webhook is allowed to confirm a payment. `flavor` only decides how long we're willing
 * to keep polling before giving up and showing that route's outcome:
 *  - "success" flavor: poll patiently — a webhook lag shouldn't look like a failure.
 *  - "failure"/"cancel" flavor: check once for the rare race where the webhook already
 *    landed, then show that outcome without making the person wait.
 */
export function PaymentResult({ flavor }: { flavor: PaymentFlavor }) {
  const params = useSearchParams();
  const orderId = params.get("orderId");

  const [outcome, setOutcome] = useState<ResolvedOutcome>("checking");
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const attemptRef = useRef(0);
  const missingOrderId = !orderId;

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    const maxAttempts = flavor === "success" ? POLL_ATTEMPTS : 1;

    async function poll() {
      try {
        const fetchedOrder = await apiClient.get<Order>(`/orders/${orderId}`);
        if (cancelled) return;
        setOrder(fetchedOrder);

        if (fetchedOrder.status === "Confirmed" || fetchedOrder.status === "Processing") {
          setOutcome("success");
          return;
        }
        if (fetchedOrder.status === "Cancelled") {
          setOutcome(flavor === "cancel" ? "cancelled" : "failed");
          return;
        }

        attemptRef.current += 1;
        if (attemptRef.current >= maxAttempts) {
          setOutcome(flavor === "success" ? "pending" : flavor === "cancel" ? "cancelled" : "failed");
        } else {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(err instanceof ApiClientError ? err.message : "Couldn't confirm your payment status.");
        setOutcome("error");
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [orderId, flavor]);

  if (outcome === "checking" && !missingOrderId) {
    return (
      <Shell>
        <Spinner />
        <p className="mt-6 text-sm text-[var(--color-stone)]">Confirming your payment…</p>
      </Shell>
    );
  }

  if (outcome === "success") {
    return (
      <Shell>
        <h1 className="font-display text-2xl text-[var(--color-ink)]">Payment successful</h1>
        <p className="mt-3 text-sm text-[var(--color-stone)]">
          Order <strong>{order?.id}</strong> is confirmed. We&apos;ll email you as it ships.
        </p>
        <Link href={`/orders/${order?.id}`} className="pill mt-8">
          View order
        </Link>
      </Shell>
    );
  }

  if (outcome === "failed") {
    return (
      <Shell>
        <h1 className="font-display text-2xl text-[var(--color-ink)]">Payment failed</h1>
        <p className="mt-3 text-sm text-[var(--color-stone)]">
          Your payment didn&apos;t go through. Your order hasn&apos;t been charged.
        </p>
        <Link href={`/checkout/payment?orderId=${orderId}`} className="pill mt-8">
          Retry payment
        </Link>
      </Shell>
    );
  }

  if (outcome === "cancelled") {
    return (
      <Shell>
        <h1 className="font-display text-2xl text-[var(--color-ink)]">Payment cancelled</h1>
        <p className="mt-3 text-sm text-[var(--color-stone)]">
          You cancelled the payment. Your cart items are still reserved for a short while.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={`/checkout/payment?orderId=${orderId}`} className="pill">
            Try again
          </Link>
          <Link href="/cart" className="border border-[var(--color-maroon)] px-6 py-3 text-sm text-[var(--color-maroon)]">
            Back to cart
          </Link>
        </div>
      </Shell>
    );
  }

  if (outcome === "pending") {
    return (
      <Shell>
        <h1 className="font-display text-2xl text-[var(--color-ink)]">Still confirming</h1>
        <p className="mt-3 text-sm text-[var(--color-stone)]">
          This is taking longer than usual. We&apos;ll update your order automatically — you can also check
          back here.
        </p>
        <Link href={`/orders/${orderId}`} className="pill mt-8">
          Check order status
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-2xl text-[var(--color-ink)]">Couldn&apos;t confirm payment</h1>
      <p className="mt-3 text-sm text-[var(--color-stone)]">
        {missingOrderId ? "Missing order reference." : errorMessage}
      </p>
      <Link href="/orders" className="pill mt-8">
        View my orders
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-md px-6 py-24 text-center">{children}</div>;
}

function Spinner() {
  return (
    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-stone-light)] border-t-[var(--color-maroon)]" />
  );
}
