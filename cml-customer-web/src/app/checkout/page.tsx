"use client";

import { useState } from "react";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { AddressStep } from "@/components/checkout/AddressStep";
import { ReviewStep } from "@/components/checkout/ReviewStep";

// Shipping is calculated by the server (flat fee under the free-shipping threshold) and shown as part
// of the order totals on the review step, so there is no client-side shipping choice any more.
export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-[var(--color-ink)]">Checkout</h1>
      <div className="mt-6">
        <CheckoutStepper activeIndex={step} />
      </div>

      <div className="mt-10">
        {step === 0 && (
          <AddressStep selectedId={addressId} onSelect={setAddressId} onNext={() => setStep(1)} />
        )}
        {step === 1 && addressId && <ReviewStep addressId={addressId} onBack={() => setStep(0)} />}
      </div>
    </div>
  );
}