"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, User } from "lucide-react";
import * as api from "@/lib/api";
import { Order, OrderStatus } from "@/lib/types";
import { ORDER_TRANSITIONS } from "@/lib/state-machines";
import { PageHeader, Panel, StatusPill, Button, Skeleton } from "@/components/ui";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const ORDER_FLOW: OrderStatus[] = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

function OrderDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    const res = await api.getOrder(id);
    setOrder(res.data);
  }

  useEffect(() => { load(); }, [id]);

  async function move(to: OrderStatus) {
    setBusy(true);
    setNotice(null);
    try {
      await api.transitionOrder(id, to);
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not update order.");
    } finally {
      setBusy(false);
    }
  }

  if (!order) return <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;

  const allowed = ORDER_TRANSITIONS[order.status];
  const currentIndex = ORDER_FLOW.indexOf(order.status);
  const derailed = order.status === "Cancelled" || order.status === "ReturnRequested";

  return (
    <div>
      <button onClick={() => router.push("/orders")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Back to orders
      </button>
      <PageHeader eyebrow="Order" title={order.orderNumber} description={`Placed ${new Date(order.createdAt).toLocaleString()}`} actions={<StatusPill status={order.status} />} />

      {!derailed && (
        <Panel className="p-5 mb-4">
          <div className="flex items-center">
            {ORDER_FLOW.map((step, i) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${i <= currentIndex ? "bg-maroon-700" : "bg-ink-100 border border-line"}`} />
                  <span className={`text-[11px] whitespace-nowrap ${i <= currentIndex ? "text-ink-900 font-medium" : "text-ink-300"}`}>{step}</span>
                </div>
                {i < ORDER_FLOW.length - 1 && <div className={`h-px flex-1 mx-1 ${i < currentIndex ? "bg-maroon-700" : "bg-line"}`} />}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2 p-5">
          <p className="text-sm font-medium text-ink-900 mb-3">Items</p>
          <div className="divide-y divide-line">
            {order.items.map((item) => (
              <div key={item.sku} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="text-ink-900">{item.productName}</p>
                  <p className="text-xs text-ink-500 font-mono">{item.sku} · Qty {item.qty}</p>
                </div>
                <span className="font-mono text-xs">{formatINR(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-line pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-500"><span>Subtotal</span><span className="font-mono">{formatINR(order.subtotal)}</span></div>
            <div className="flex justify-between text-ink-500"><span>Discount</span><span className="font-mono">−{formatINR(order.discount)}</span></div>
            <div className="flex justify-between text-ink-500"><span>Shipping</span><span className="font-mono">{formatINR(order.shipping)}</span></div>
            <div className="flex justify-between text-ink-500"><span>Tax</span><span className="font-mono">{formatINR(order.tax)}</span></div>
            <div className="flex justify-between text-ink-900 font-medium pt-1 border-t border-line"><span>Total</span><span className="font-mono">{formatINR(order.total)}</span></div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-5">
            <p className="text-sm font-medium text-ink-900 mb-3 flex items-center gap-2"><User size={14} /> Customer</p>
            <p className="text-sm text-ink-900">{order.customerName}</p>
            <p className="text-xs text-ink-500 mt-1 flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 shrink-0" /> {order.addressLine}</p>
          </Panel>

          <Panel className="p-5">
            <p className="text-sm font-medium text-ink-900 mb-2">Payment</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-500">{order.paymentId}</span>
              <StatusPill status={order.paymentStatus} />
            </div>
          </Panel>

          {can("orders.write") && (
            <Panel className="p-5">
              <p className="text-sm font-medium text-ink-900 mb-3">Update status</p>
              {allowed.length === 0 ? (
                <p className="text-xs text-ink-500">This is a terminal state — no further transitions allowed.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allowed.map((s) => (
                    <Button key={s} size="sm" variant={s === "Cancelled" ? "danger" : "secondary"} onClick={() => move(s)} disabled={busy}>
                      Move to {s}
                    </Button>
                  ))}
                </div>
              )}
              {notice && <p className="text-xs text-bad mt-2">{notice}</p>}
              <p className="mt-3 text-[11px] text-ink-300">Illegal jumps (e.g. Pending → Delivered) are rejected by the state machine.</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return <PermissionGate perm="orders.view"><OrderDetailInner /></PermissionGate>;
}
