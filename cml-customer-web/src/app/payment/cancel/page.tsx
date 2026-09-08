import { Suspense } from "react";
import { PaymentResult } from "@/components/checkout/PaymentResult";

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={null}>
      <PaymentResult flavor="cancel" />
    </Suspense>
  );
}
