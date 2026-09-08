import { Suspense } from "react";
import { PaymentResult } from "@/components/checkout/PaymentResult";

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentResult flavor="success" />
    </Suspense>
  );
}
