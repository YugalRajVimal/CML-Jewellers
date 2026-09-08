"use client";

import { use } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { ReturnRequest, ReturnStatus } from "@/lib/types";

const HAPPY_PATH: ReturnStatus[] = ["Requested", "Approved", "PickedUp", "Received", "Inspected", "Refunded"];

export default function ReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const state = useAsync(() => apiClient.get<ReturnRequest>(`/returns/${id}`), () => false, [id]);

  if (state.status === "loading") {
    return <div className="mx-auto max-w-2xl px-6 py-12"><div className="h-40 skeleton" /></div>;
  }

  if (state.status === "error" || state.status === "empty") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-sm text-[var(--color-stone)]">Couldn&apos;t load this return request.</p>
      </div>
    );
  }

  const request = state.data;
  const isTerminalNegative = request.status === "Rejected" || request.status === "Cancelled";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-[var(--color-ink)]">Return #{request.id}</h1>
      <p className="mt-1 text-xs text-[var(--color-stone)]">
        For{" "}
        <Link href={`/orders/${request.orderId}`} className="text-[var(--color-gold)] underline">
          order #{request.orderId}
        </Link>{" "}
        · reason: {request.reason}
      </p>

      <div className="mt-10">
        {isTerminalNegative ? (
          <p className="text-sm text-[var(--color-maroon)]">This return request was {request.status.toLowerCase()}.</p>
        ) : (
          <div className="flex items-center overflow-x-auto">
            {HAPPY_PATH.map((step, i) => {
              const done = i <= HAPPY_PATH.indexOf(request.status);
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
                    <span
                      className={`mx-1 h-px flex-1 ${
                        i < HAPPY_PATH.indexOf(request.status) ? "bg-[var(--color-maroon)]" : "bg-[var(--color-stone-light)]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
