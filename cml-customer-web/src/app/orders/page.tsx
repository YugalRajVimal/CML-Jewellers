"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

type Status = "loading" | "error" | "empty" | "success";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    apiClient
      .getWithMeta<Order[]>("/orders?page=1")
      .then(({ data, meta }) => {
        if (cancelled) return;
        setOrders(data);
        setPage(1);
        setTotalPages(meta?.total && meta?.limit ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1);
        setStatus(data.length === 0 ? "empty" : "success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setMessage(err instanceof ApiClientError ? err.message : "Something went wrong.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const { data, meta } = await apiClient.getWithMeta<Order[]>(`/orders?page=${page + 1}`);
      setOrders((prev) => [...prev, ...data]);
      setPage((p) => p + 1);
      if (meta?.total && meta?.limit) {
        setTotalPages(Math.max(1, Math.ceil(meta.total / meta.limit)));
      }
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : "Couldn't load more orders.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-[var(--color-ink)]">My Orders</h1>

      {status === "loading" && (
        <div className="mt-8 flex flex-col gap-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 skeleton" />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="mt-8 text-sm text-[var(--color-stone)]">
          {message.toLowerCase().includes("unauthor") || message.toLowerCase().includes("token") ? (
            <>
              Your session has expired.{" "}
              <Link href="/login?next=/orders" className="text-[var(--color-gold)] underline">
                Log in
              </Link>{" "}
              to see your orders.
            </>
          ) : (
            <>Couldn&apos;t load your orders right now. ({message})</>
          )}
        </p>
      )}

      {status === "empty" && (
        <div className="mt-16 flex flex-col items-center text-center">
          <Package size={40} strokeWidth={1} className="text-[var(--color-stone-light)]" />
          <p className="mt-4 text-[var(--color-stone)]">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="pill mt-6">
            Start shopping
          </Link>
        </div>
      )}

      {status === "success" && (
        <>
          <div className="mt-8 flex flex-col gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-4 border border-[var(--color-stone-light)] p-5"
              >
                {/* Order # / date / total link to the order detail page. Kept as
                    a sibling of "Resume Payment" below (not a wrapper around it) —
                    nesting an <a> inside an <a> is invalid HTML (BUG-22). */}
                <Link href={`/orders/${order.id}`} className="flex-1">
                  <p className="font-display text-lg text-[var(--color-ink)]">Order #{order.orderNumber}</p>
                  <p className="text-xs text-[var(--color-stone)]">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item
                    {order.items.length === 1 ? "" : "s"} · ₹{order.total}
                  </p>
                </Link>
                <div className="flex items-center gap-3">
                  {order.status === "Pending" && (
                    <Link href={`/checkout/payment?orderId=${order.id}`} className="pill">
                      Resume Payment
                    </Link>
                  )}
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>

          {page < totalPages && (
            <div className="mt-8 flex justify-center">
              <button onClick={loadMore} disabled={loadingMore} className="pill disabled:opacity-50">
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}