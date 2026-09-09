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

const STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "ReturnRequested",
  "Cancelled"
];

function getOrderCustomerName(order: any): string {
  // For orders from API, userId is an object { name: ... }
  if (order.customerName) return order.customerName;
  if (order.userId && typeof order.userId === "object" && order.userId.name) return order.userId.name;
  return "";
}

function getOrderId(order: any): string {
  // prefer id, fallback to _id
  return order.id || order._id || "";
}

function getOrderPaymentStatus(order: any): string {
  // Attempt to get a .paymentStatus, fallback unknown
  return order.paymentStatus || "Unknown";
}

function getOrderItemsCount(order: any): number {
  // Each item expected to have qty
  if (!order.items || !Array.isArray(order.items)) return 0;
  return order.items.reduce((s: number, i: any) => s + (typeof i.qty === "number" ? i.qty : 0), 0);
}

function OrdersInner() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.listOrders({ limit: 100 }).then((res) => {
      // The data from API is shaped as { orders: [...] } or { data: { orders: [...] } } or { data: [...] }
      // From prompt, it's res.data.orders (array) or just res.data (array) - check for both.
      let orderList = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.orders) ? res.data.orders : []);
      setOrders(orderList);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      if (status && o.status !== status) return false;

      const orderNumber: string = o.orderNumber || "";
      const customerName: string = getOrderCustomerName(o);

      if (
        q &&
        !orderNumber.toLowerCase().includes(q.toLowerCase()) &&
        !customerName.toLowerCase().includes(q.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [orders, q, status]);

  const columns: Column<any>[] = [
    {
      key: "order",
      header: "Order",
      sortValue: (o) => o.orderNumber,
      render: (o) => (
        <Link href={`/orders/${getOrderId(o)}`} className="group">
          <span className="block font-medium text-ink-900 group-hover:text-maroon-700">{o.orderNumber}</span>
          <span className="block text-xs text-ink-500">{getOrderCustomerName(o)}</span>
        </Link>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (o) =>
        `${getOrderItemsCount(o)} item(s)`
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      sortValue: (o) => o.total,
      render: (o) => <span className="font-mono text-xs">{formatINR(o.total)}</span>
    },
    {
      key: "payment",
      header: "Payment",
      render: (o) => <StatusPill status={getOrderPaymentStatus(o)} />
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <StatusPill status={o.status} />
    },
    {
      key: "date",
      header: "Placed",
      sortValue: (o) => o.createdAt,
      render: (o) => o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Every order across the store, with status transitions that follow the order state machine."
      />
      <Toolbar>
        <SearchInput
          placeholder="Search order # or customer…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </Toolbar>
      {orders && filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders match your filters"
          description="Try a different status or search term."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          loading={!orders}
          pageSize={8}
        />
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <PermissionGate perm="order:read">
      <OrdersInner />
    </PermissionGate>
  );
}
