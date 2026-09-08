"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAsync } from "@/lib/use-async";
import type { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ReturnRequestForm } from "@/components/orders/ReturnRequestForm";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [refetchKey, setRefetchKey] = useState(0);
  const state = useAsync(() => apiClient.get<Order>(`/orders/${id}`), () => false, [id, refetchKey]);
  const refetch = () => setRefetchKey((k) => k + 1);

  if (state.status === "loading") {
    return <div className="mx-auto max-w-3xl px-6 py-12"><div className="h-64 skeleton" /></div>;
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-[var(--color-stone)]">
          {state.message.toLowerCase().includes("unauthor") || state.message.toLowerCase().includes("token") ? (
            <>
              Your session has expired.{" "}
              <Link href={`/login?next=/orders/${id}`} className="text-[var(--color-gold)] underline">
                Log in
              </Link>{" "}
              to see this order.
            </>
          ) : (
            <>Couldn&apos;t load this order. ({state.message})</>
          )}
        </p>
      </div>
    );
  }

  if (state.status === "empty") return null;

  const order = state.data;

  return <OrderDetailLoaded order={order} onRefetch={refetch} />;
}

function OrderDetailLoaded({ order, onRefetch }: { order: Order; onRefetch: () => void }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnSubmitted, setReturnSubmitted] = useState(false);

  const canCancel = order.status === "Pending" || order.status === "Confirmed";
  const canReturn = order.status === "Delivered";

  async function handleCancel() {
    setCancelError(null);
    setCancelling(true);
    try {
      await apiClient.post(`/orders/${order.id}/cancel`);
      onRefetch();
    } catch (err) {
      setCancelError(err instanceof ApiClientError ? err.message : "Couldn't cancel this order.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-[var(--color-ink)]">Order #{order.id}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-xs text-[var(--color-stone)]">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>

      <div className="mt-10 overflow-x-auto">
        <OrderTimeline status={order.status} />
      </div>

      {order.trackingNumber && (
        <p className="mt-6 text-sm text-[var(--color-stone)]">
          Tracking: <span className="text-[var(--color-ink)]">{order.trackingNumber}</span>
          {order.trackingCarrier ? ` via ${order.trackingCarrier}` : ""}
        </p>
      )}

      <div className="mt-10 border-t border-[var(--color-stone-light)] pt-8">
        <p className="font-display text-lg text-[var(--color-ink)]">Items</p>
        <div className="mt-4 flex flex-col gap-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-[var(--color-cream-deep)]">
                {item.image && <Image src={item.image} alt={item.productName} fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex-1">
                <Link href={`/product/${item.productSlug}`} className="text-sm text-[var(--color-ink)]">
                  {item.productName}
                </Link>
                <p className="text-xs text-[var(--color-stone)]">
                  {Object.entries(item.variantAttributes)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}{" "}
                  · Qty {item.quantity}
                </p>
              </div>
              <span className="text-sm text-[var(--color-ink)]">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2 border-t border-[var(--color-stone-light)] pt-6 text-sm">
        <div className="flex justify-between text-[var(--color-stone)]">
          <span>Subtotal</span>
          <span>₹{order.subtotal}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-[var(--color-maroon)]">
            <span>Discount</span>
            <span>−₹{order.discount}</span>
          </div>
        )}
        <div className="flex justify-between text-[var(--color-stone)]">
          <span>Shipping</span>
          <span>{order.shipping === 0 ? "Free" : `₹${order.shipping}`}</span>
        </div>
        <div className="flex justify-between border-t border-[var(--color-stone-light)] pt-2 font-display text-lg text-[var(--color-ink)]">
          <span>Total</span>
          <span>₹{order.total}</span>
        </div>
      </div>

      <div className="mt-8 border-t border-[var(--color-stone-light)] pt-6 text-sm">
        <p className="text-[var(--color-stone)]">Delivering to</p>
        <p className="mt-1 text-[var(--color-ink)]">
          {order.address.line1}, {order.address.city}, {order.address.state} {order.address.postalCode}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="border border-[var(--color-maroon)] px-6 py-3 text-sm text-[var(--color-maroon)] disabled:opacity-50"
          >
            {cancelling ? "Cancelling…" : "Cancel order"}
          </button>
        )}
        {canReturn && !showReturnForm && !returnSubmitted && (
          <button onClick={() => setShowReturnForm(true)} className="pill">
            Request return
          </button>
        )}
      </div>

      {cancelError && <p className="mt-3 text-sm text-[var(--color-maroon)]">{cancelError}</p>}

      {showReturnForm && (
        <ReturnRequestForm
          orderId={order.id}
          onCancel={() => setShowReturnForm(false)}
          onSubmitted={() => {
            setShowReturnForm(false);
            setReturnSubmitted(true);
            onRefetch();
          }}
        />
      )}

      {returnSubmitted && (
        <p className="mt-4 text-sm text-[var(--color-maroon)]">
          Your return request has been submitted. We&apos;ll email you once it&apos;s reviewed.
        </p>
      )}
    </div>
  );
}
