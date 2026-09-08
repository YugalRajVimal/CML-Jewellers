import type { OrderStatus } from "@/lib/types";
import { Check } from "lucide-react";

const HAPPY_PATH: OrderStatus[] = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "Cancelled") {
    return <p className="text-sm text-[var(--color-maroon)]">This order was cancelled.</p>;
  }

  const currentIndex = HAPPY_PATH.indexOf(status === "ReturnRequested" ? "Delivered" : status);

  return (
    <div className="flex items-center">
      {HAPPY_PATH.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  done ? "bg-[var(--color-maroon)] text-[var(--color-cream)]" : "border border-[var(--color-stone-light)]"
                }`}
              >
                {done ? <Check size={13} strokeWidth={2} /> : i + 1}
              </span>
              <span className="mt-2 whitespace-nowrap text-xs text-[var(--color-stone)]">{step}</span>
            </div>
            {i < HAPPY_PATH.length - 1 && (
              <span className={`mx-1 h-px flex-1 ${i < currentIndex ? "bg-[var(--color-maroon)]" : "bg-[var(--color-stone-light)]"}`} />
            )}
          </div>
        );
      })}
      {status === "ReturnRequested" && (
        <p className="mt-3 w-full text-center text-xs text-[var(--color-maroon)]">Return requested</p>
      )}
    </div>
  );
}
