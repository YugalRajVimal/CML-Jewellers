"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

export default function OrdersPage() {
  const state = useAsync(() => apiClient.get<Order[]>("/orders"), (orders) => orders.length === 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-[var(--color-ink)]">My Orders</h1>

      {state.status === "loading" && (
        <div className="mt-8 flex flex-col gap-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 skeleton" />
          ))}
        </div>
      )}

      {state.status === "error" && (
        <p className="mt-8 text-sm text-[var(--color-stone)]">
          {state.message.toLowerCase().includes("unauthor") || state.message.toLowerCase().includes("token") ? (
            <>
              Your session has expired.{" "}
              <Link href="/login?next=/orders" className="text-[var(--color-gold)] underline">
                Log in
              </Link>{" "}
              to see your orders.
            </>
          ) : (
            <>Couldn&apos;t load your orders right now. ({state.message})</>
          )}
        </p>
      )}

      {state.status === "empty" && (
        <div className="mt-16 flex flex-col items-center text-center">
          <Package size={40} strokeWidth={1} className="text-[var(--color-stone-light)]" />
          <p className="mt-4 text-[var(--color-stone)]">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="pill mt-6">
            Start shopping
          </Link>
        </div>
      )}

      {state.status === "success" && (
        <div className="mt-8 flex flex-col gap-4">
          {state.data.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between border border-[var(--color-stone-light)] p-5"
            >
              <div>
                <p className="font-display text-lg text-[var(--color-ink)]">Order #{order.id}</p>
                <p className="text-xs text-[var(--color-stone)]">
                  {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item
                  {order.items.length === 1 ? "" : "s"} · ₹{order.total}
                </p>
                {order.status === "Pending" && (
                  <Link href={`/checkout/payment?orderId=${order.id}`} className="pill mt-2 inline-block">
                    Resume Payment
                  </Link>
                )}
              </div>
              <OrderStatusBadge status={order.status} />
            </Link>
       
          ))}
        </div>
      )}
    </div>
  );
}
