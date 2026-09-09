"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import * as api from "@/lib/api";
import { Refund, RefundStatus } from "@/lib/types";
import { REFUND_TRANSITIONS } from "@/lib/state-machines";
import { PageHeader, StatusPill, Button, EmptyState } from "@/components/ui";
import { DataTable, Column } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

// Get the Order Number string from the refund data.
// The shape of refund appears to NOT include orderNumber directly; only returnId or related IDs are present.
function getOrderNumber(refund: any): string {
  // If Refund has orderNumber, show that, otherwise fallback to returnId, otherwise show '-'
  return refund.orderNumber || refund.returnId || "-";
}

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function getRefundId(r: any) {
  // prefer id, fallback to _id
  return r.id || r._id || "";
}

function RefundsInner() {
  const { can } = useAuth();
  const [refunds, setRefunds] = useState<Refund[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await api.listRefunds();
    // Shape of res.data: { refunds: [...] } or sometimes just { ... }
    // Defensive shape handling for API: Accept .refunds array or .data array fallback, or [].
    let refundArr: Refund[] =
      Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.refunds) ? res.data.refunds : []);
    console.log("Refunds loaded:", refundArr);
    setRefunds(refundArr);
  }

  useEffect(() => { load(); }, []);

  async function move(id: string, to: RefundStatus) {
    setBusy(id);
    try {
      await api.transitionRefund(id, to);
      await load();
    } finally {
      setBusy(null);
    }
  }

  const columns: Column<Refund>[] = [
    {
      key: "order",
      header: "Order / Return",
      render: (r) => (
        <span className="font-medium text-ink-900">
          {getOrderNumber(r)}
        </span>
      ),
    },
    {
      key: "payment",
      header: "Payment ref",
      render: (r) => (
        <span className="font-mono text-xs text-ink-500">
          {r.paymentId || "-"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (r) => r.amount,
      render: (r) => (
        <span className="font-mono text-xs">
          {formatINR(r.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusPill status={r.status} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => {
        const allowed = REFUND_TRANSITIONS[r.status] || [];
        if (!can("refund:manage") || allowed.length === 0) return null;
        const refundId = getRefundId(r);
        return (
          <div className="flex justify-end gap-1.5">
            {allowed.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === "Failed" ? "danger" : "secondary"}
                disabled={busy === refundId}
                onClick={() => move(refundId, s)}
              >
                {s}
              </Button>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Fulfilment"
        title="Refunds"
        description="Refunds are created automatically once a return is marked Refunded."
      />
      {refunds && refunds.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No refunds yet"
          description="Refunds tied to approved returns will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={refunds ?? []}
          loading={!refunds}
          pageSize={8}
        />
      )}
    </div>
  );
}

export default function RefundsPage() {
  return (
    <PermissionGate perm="refund:manage">
      <RefundsInner />
    </PermissionGate>
  );
}
