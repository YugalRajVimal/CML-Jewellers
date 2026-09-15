// "use client";

// import { Suspense, useEffect, useRef, useState } from "react";
// import { useSearchParams } from "next/navigation";
// import Link from "next/link";
// import { apiClient, ApiClientError } from "@/lib/api-client";
// import type { PaymentSession } from "@/lib/types";

// function PaymentHandoff() {
//   const params = useSearchParams();
//   const orderId = params.get("orderId");
//   const [error, setError] = useState<string | null>(null);
//   const [pending, setPending] = useState<boolean>(!!orderId);
//   const requestedRef = useRef(false);

//   useEffect(() => {
//     if (!orderId) return;
//     if (requestedRef.current) return;
//     requestedRef.current = true;

//     let cancelled = false;
//     setPending(true);

//     apiClient
//       .post<PaymentSession>("/payments/cashfree/create", { orderId })
//       .then((session) => {
//         if (cancelled) return;
//         // Hand off to Cashfree's hosted checkout. We never mark the order paid
//         // from the frontend — only the webhook does that.
//         window.location.href = session.paymentLink;
//       })
//       .catch((err: unknown) => {
//         if (cancelled) return;
//         setError(err instanceof ApiClientError ? err.message : "Couldn't start the payment. Please try again.");
//         setPending(false);
//       });

//     return () => {
//       cancelled = true;
//     };
//     // Intentionally exclude orderId from deps, to avoid extra call from query param change
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const missingOrder = !orderId;

//   if (missingOrder || error) {
//     return (
//       <div className="mx-auto max-w-md px-6 py-24 text-center">
//         <h1 className="font-display text-2xl text-[var(--color-ink)]">Couldn&apos;t start payment</h1>
//         <p className="mt-3 text-sm text-[var(--color-stone)]">
//           {missingOrder ? "Missing order — please go back to your cart and try again." : error}
//         </p>
//         <Link href="/cart" className="pill mt-8" aria-disabled={pending} tabIndex={pending ? -1 : undefined}>
//           Back to cart
//         </Link>
//         {/* Optionally, a Retry payment button could go here, disabled={pending} */}
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto max-w-md px-6 py-24 text-center">
//       <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-stone-light)] border-t-[var(--color-maroon)]" />
//       <p className="mt-6 text-sm text-[var(--color-stone)]">Redirecting you to a secure payment page…</p>
//     </div>
//   );
// }

// export default function PaymentHandoffPage() {
//   return (
//     <Suspense fallback={null}>
//       <PaymentHandoff />
//     </Suspense>
//   );
// }


"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { PaymentSession } from "@/lib/types";
import { load } from "@cashfreepayments/cashfree-js";

function PaymentHandoff() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<boolean>(!!orderId);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!orderId) return;
    if (requestedRef.current) return;
    requestedRef.current = true;

    let cancelled = false;
    setPending(true);

    apiClient
      .post<PaymentSession>("/payments/cashfree/create", { orderId })
      .then(async (session) => {
        if (cancelled) return;

        // Hand off to Cashfree's hosted checkout via their official SDK — never
        // hand-build the checkout URL ourselves (see payment.controller.ts).
        // We never mark the order paid from the frontend — only the webhook does that.
       
        const cashfree = await load({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === "production" ? "production" : "sandbox",
        });

        if (cancelled) return;

        // checkout() does NOT throw on failure — with redirectTarget "_self"/"_blank"/"_top"
        // it resolves to { error } or { redirect: true }. If we don't inspect that, a bad
        // session, an un-whitelisted domain, or a blocked frame/popup just leaves the user
        // stuck on this spinner forever with no feedback.
        const result = await cashfree.checkout({
          paymentSessionId: session.paymentSessionId,
          redirectTarget: "_self",
        });

        if (cancelled) return;
        if (result?.error) {
          setError(result.error.message || "Couldn't start the payment. Please try again.");
          setPending(false);
        }
        // else result.redirect === true — the browser is navigating away, leave the spinner up.
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiClientError ? err.message : "Couldn't start the payment. Please try again.");
        setPending(false);
      });

    return () => {
      cancelled = true;
    };
    // Intentionally exclude orderId from deps, to avoid extra call from query param change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const missingOrder = !orderId;

  if (missingOrder || error) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-[var(--color-ink)]">Couldn&apos;t start payment</h1>
        <p className="mt-3 text-sm text-[var(--color-stone)]">
          {missingOrder ? "Missing order — please go back to your cart and try again." : error}
        </p>
        <Link href="/cart" className="pill mt-8" aria-disabled={pending} tabIndex={pending ? -1 : undefined}>
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