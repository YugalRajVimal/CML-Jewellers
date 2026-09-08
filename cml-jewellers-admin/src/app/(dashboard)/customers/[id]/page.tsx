"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, Phone, XCircle } from "lucide-react";
import * as api from "@/lib/api";
import { Customer, Order } from "@/lib/types";
import { PageHeader, Panel, StatusPill, Skeleton, Button } from "@/components/ui";
import { PermissionGate } from "@/components/permission-gate";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function CustomerDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.getCustomer(id).then((res) => {
      setCustomer(res.data.customer);
      setOrders(res.data.orders);
    }).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <Panel className="p-10 text-center">
        <p className="font-display text-xl text-ink-950">Customer not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/customers")}>Back to customers</Button>
      </Panel>
    );
  }

  if (!customer) return <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div>
      <button onClick={() => router.push("/customers")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Back to customers
      </button>
      <PageHeader eyebrow="Customer" title={customer.name} description={`Customer since ${new Date(customer.createdAt).toLocaleDateString()}`} />

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="p-5">
          <p className="text-sm font-medium text-ink-900 mb-3">Contact</p>
          <p className="text-sm text-ink-700 flex items-center gap-2"><Mail size={13} className="text-ink-400" /> {customer.email} {customer.emailVerified ? <CheckCircle2 size={13} className="text-good" /> : <XCircle size={13} className="text-ink-300" />}</p>
          <p className="text-sm text-ink-700 flex items-center gap-2 mt-2"><Phone size={13} className="text-ink-400" /> {customer.phone} {customer.phoneVerified ? <CheckCircle2 size={13} className="text-good" /> : <XCircle size={13} className="text-ink-300" />}</p>
          <div className="mt-4 pt-4 border-t border-line grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="font-display text-xl text-ink-950">{customer.ordersCount}</p>
              <p className="text-xs text-ink-500">Orders</p>
            </div>
            <div>
              <p className="font-display text-xl text-ink-950">{formatINR(customer.lifetimeValue)}</p>
              <p className="text-xs text-ink-500">Lifetime value</p>
            </div>
          </div>
        </Panel>

        <Panel className="lg:col-span-2 p-5">
          <p className="text-sm font-medium text-ink-900 mb-3">Order history</p>
          {orders.length === 0 ? (
            <p className="text-sm text-ink-500">No orders yet.</p>
          ) : (
            <div className="divide-y divide-line">
              {orders.map((o) => (
                <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between py-2.5 text-sm hover:bg-ink-100/30 -mx-2 px-2 rounded-lg">
                  <div>
                    <p className="font-medium text-ink-900">{o.orderNumber}</p>
                    <p className="text-xs text-ink-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs">{formatINR(o.total)}</span>
                    <StatusPill status={o.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  return <PermissionGate perm="customers.view"><CustomerDetailInner /></PermissionGate>;
}
