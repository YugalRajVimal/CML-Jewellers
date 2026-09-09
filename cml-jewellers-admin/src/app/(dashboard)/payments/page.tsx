"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import * as api from "@/lib/api";
import { PageHeader, StatusPill, Toolbar, SearchInput, Select, EmptyState } from "@/components/ui";
import { DataTable, Column } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";

// Util: format as INR currency
function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

// Our API returns nested order info under payment.orderId object, need to surface flattened fields for table
type NormalizedPayment = {
  _id: string;
  orderId: string;             // order _id
  orderNumber: string;         // from orderId.orderNumber
  provider: string;
  providerRefId: string;
  cfPaymentSessionId?: string;
  amount: number;
  status: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
};

function normalizePayments(data: unknown): NormalizedPayment[] {
  // Defensive extraction for: { data: { payments: [ ... ] } }
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    data.data &&
    typeof (data as any).data === "object" &&
    "payments" in (data as any).data &&
    Array.isArray((data as any).data.payments)
  ) {
    const paymentsArr: any[] = (data as any).data.payments;
    return paymentsArr.map((p) => {
      const order = p.orderId ?? {};
      return {
        _id: p._id,
        orderId: (typeof order === "object" && order._id) ? order._id : typeof order === "string" ? order : "",
        orderNumber: typeof order === "object" && order.orderNumber ? order.orderNumber : "",
        provider: p.provider,
        providerRefId: p.providerRefId,
        cfPaymentSessionId: p.cfPaymentSessionId,
        amount: p.amount,
        status: p.status,
        verifiedAt: p.verifiedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });
  }
  // Defensive fallback: support legacy { payments: [ ... ] }
  if (
    data &&
    typeof data === "object" &&
    "payments" in data &&
    Array.isArray((data as any).payments)
  ) {
    const paymentsArr: any[] = (data as any).payments;
    return paymentsArr.map((p) => {
      const order = p.orderId ?? {};
      return {
        _id: p._id,
        orderId: (typeof order === "object" && order._id) ? order._id : typeof order === "string" ? order : "",
        orderNumber: typeof order === "object" && order.orderNumber ? order.orderNumber : "",
        provider: p.provider,
        providerRefId: p.providerRefId,
        cfPaymentSessionId: p.cfPaymentSessionId,
        amount: p.amount,
        status: p.status,
        verifiedAt: p.verifiedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });
  }
  // Fallback: empty array
  return [];
}

function PaymentsInner() {
  const [payments, setPayments] = useState<NormalizedPayment[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.listPayments().then((res) => {
      // Expecting the shape you provided
      setPayments(normalizePayments(res));
    });
  }, []);

  const filtered = useMemo(() => {
    if (!payments) return [];
    return payments.filter((p) => {
      if (status && p.status !== status) return false;

      if (
        q &&
        !(
          (p.orderNumber && p.orderNumber.toLowerCase().includes(q.toLowerCase())) ||
          (p.providerRefId && p.providerRefId.toLowerCase().includes(q.toLowerCase()))
        )
      )
        return false;
      return true;
    });
  }, [payments, q, status]);

  const columns: Column<NormalizedPayment>[] = [
    {
      key: "order",
      header: "Order",
      sortValue: (p) => p.orderNumber,
      render: (p) =>
        p.orderId ? (
          <Link
            href={`/orders/${p.orderId}`}
            className="font-medium text-ink-900 hover:text-maroon-700"
          >
            {p.orderNumber}
          </Link>
        ) : (
          <span className="text-ink-500">—</span>
        ),
    },
    {
      key: "provider",
      header: "Provider",
      render: (p) => <span className="capitalize">{p.provider}</span>,
    },
    {
      key: "ref",
      header: "Provider ref",
      render: (p) => (
        <span className="font-mono text-xs text-ink-500">
          {p.providerRefId}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (p) => p.amount,
      render: (p) => (
        <span className="font-mono text-xs">{formatINR(p.amount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusPill status={p.status} />,
    },
    {
      key: "verified",
      header: "Verified",
      sortValue: (p) => p.verifiedAt ?? "",
      render: (p) =>
        p.verifiedAt ? new Date(p.verifiedAt).toLocaleString() : "—",
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
        <SearchInput
          placeholder="Search order # or provider ref…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
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
        <EmptyState
          icon={CreditCard}
          title="No payments match your filters"
          description="Try a different status or search term."
        />
      ) : (
        <DataTable
          columns={columns as any}
          rows={filtered.map((p) => ({ ...p, id: p._id }))}
          loading={!payments}
          pageSize={8}
        />
  
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <PermissionGate perm="order:read">
      <PaymentsInner />
    </PermissionGate>
  );
}
