import { Suspense } from "react";
import { PaymentResult } from "@/components/checkout/PaymentResult";

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={null}>
      <PaymentResult flavor="failure" />
    </Suspense>
  );
}
