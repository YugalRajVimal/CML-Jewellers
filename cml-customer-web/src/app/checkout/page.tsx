"use client";

import { useState } from "react";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { AddressStep } from "@/components/checkout/AddressStep";
import { ShippingStep } from "@/components/checkout/ShippingStep";
import { ReviewStep } from "@/components/checkout/ReviewStep";

export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [shippingMethodId, setShippingMethodId] = useState("standard");

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
        {step === 1 && (
          <ShippingStep
            selectedId={shippingMethodId}
            onSelect={setShippingMethodId}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && addressId && (
          <ReviewStep addressId={addressId} shippingMethodId={shippingMethodId} onBack={() => setStep(1)} />
        )}
      </div>
    </div>
  );
}
