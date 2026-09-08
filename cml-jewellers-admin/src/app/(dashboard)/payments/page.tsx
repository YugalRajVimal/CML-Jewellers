"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import * as api from "@/lib/api";
import { Payment } from "@/lib/types";
import { PageHeader, StatusPill, Toolbar, SearchInput, Select, EmptyState } from "@/components/ui";
import { DataTable, Column } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function PaymentsInner() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.listPayments().then((res) => setPayments(res.data));
  }, []);

  const filtered = useMemo(() => {
    if (!payments) return [];
    return payments.filter((p) => {
      if (status && p.status !== status) return false;
      if (q && !p.orderNumber.toLowerCase().includes(q.toLowerCase()) && !p.providerRefId.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [payments, q, status]);

  const columns: Column<Payment>[] = [
    {
      key: "order", header: "Order", sortValue: (p) => p.orderNumber,
      render: (p) => <Link href={`/orders/${p.orderId}`} className="font-medium text-ink-900 hover:text-maroon-700">{p.orderNumber}</Link>,
    },
    { key: "provider", header: "Provider", render: (p) => <span className="capitalize">{p.provider}</span> },
    { key: "ref", header: "Provider ref", render: (p) => <span className="font-mono text-xs text-ink-500">{p.providerRefId}</span> },
    { key: "amount", header: "Amount", align: "right", sortValue: (p) => p.amount, render: (p) => <span className="font-mono text-xs">{formatINR(p.amount)}</span> },
    { key: "status", header: "Status", render: (p) => <StatusPill status={p.status} /> },
    {
      key: "verified", header: "Verified", sortValue: (p) => p.verifiedAt ?? "",
      render: (p) => (p.verifiedAt ? new Date(p.verifiedAt).toLocaleString() : "—"),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Fulfilment"
        title="Payments"
        description="Cashfree transactions verified against webhook signatures. The frontend never marks a payment successful — only the backend does, on webhook receipt."
      />
      <Toolbar>
        <SearchInput placeholder="Search order # or provider ref…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Created">Created</option>
          <option value="Pending">Pending</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
          <option value="Cancelled">Cancelled</option>
        </Select>
      </Toolbar>
      {payments && filtered.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments match your filters" description="Try a different status or search term." />
      ) : (
        <DataTable columns={columns} rows={filtered} loading={!payments} pageSize={8} />
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return <PermissionGate perm="payments.view"><PaymentsInner /></PermissionGate>;
}
