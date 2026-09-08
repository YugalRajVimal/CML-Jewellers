"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import * as api from "@/lib/api";
import { Order, OrderStatus } from "@/lib/types";
import { PageHeader, StatusPill, Toolbar, SearchInput, Select, EmptyState } from "@/components/ui";
import { DataTable, Column } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const STATUSES: OrderStatus[] = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "ReturnRequested", "Cancelled"];

function OrdersInner() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.listOrders({ limit: 100 }).then((res) => setOrders(res.data));
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      if (status && o.status !== status) return false;
      if (q && !o.orderNumber.toLowerCase().includes(q.toLowerCase()) && !o.customerName.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [orders, q, status]);

  const columns: Column<Order>[] = [
    {
      key: "order", header: "Order", sortValue: (o) => o.orderNumber,
      render: (o) => (
        <Link href={`/orders/${o.id}`} className="group">
          <span className="block font-medium text-ink-900 group-hover:text-maroon-700">{o.orderNumber}</span>
          <span className="block text-xs text-ink-500">{o.customerName}</span>
        </Link>
      ),
    },
    { key: "items", header: "Items", render: (o) => `${o.items.reduce((s, i) => s + i.qty, 0)} item(s)` },
    { key: "total", header: "Total", align: "right", sortValue: (o) => o.total, render: (o) => <span className="font-mono text-xs">{formatINR(o.total)}</span> },
    { key: "payment", header: "Payment", render: (o) => <StatusPill status={o.paymentStatus} /> },
    { key: "status", header: "Status", render: (o) => <StatusPill status={o.status} /> },
    { key: "date", header: "Placed", sortValue: (o) => o.createdAt, render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <PageHeader eyebrow="Fulfilment" title="Orders" description="Every order across the store, with status transitions that follow the order state machine." />
      <Toolbar>
        <SearchInput placeholder="Search order # or customer…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Toolbar>
      {orders && filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders match your filters" description="Try a different status or search term." />
      ) : (
        <DataTable columns={columns} rows={filtered} loading={!orders} pageSize={8} />
      )}
    </div>
  );
}

export default function OrdersPage() {
  return <PermissionGate perm="orders.view"><OrdersInner /></PermissionGate>;
}
