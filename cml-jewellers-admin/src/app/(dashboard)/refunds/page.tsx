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

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function RefundsInner() {
  const { can } = useAuth();
  const [refunds, setRefunds] = useState<Refund[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await api.listRefunds();
    setRefunds(res.data);
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
    { key: "order", header: "Order", render: (r) => <span className="font-medium text-ink-900">{r.orderNumber}</span> },
    { key: "payment", header: "Payment ref", render: (r) => <span className="font-mono text-xs text-ink-500">{r.paymentId}</span> },
    { key: "amount", header: "Amount", align: "right", sortValue: (r) => r.amount, render: (r) => <span className="font-mono text-xs">{formatINR(r.amount)}</span> },
    { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
    {
      key: "actions", header: "", align: "right",
      render: (r) => {
        const allowed = REFUND_TRANSITIONS[r.status];
        if (!can("refunds.write") || allowed.length === 0) return null;
        return (
          <div className="flex justify-end gap-1.5">
            {allowed.map((s) => (
              <Button key={s} size="sm" variant={s === "Failed" ? "danger" : "secondary"} disabled={busy === r.id} onClick={() => move(r.id, s)}>
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
      <PageHeader eyebrow="Fulfilment" title="Refunds" description="Refunds are created automatically once a return is marked Refunded." />
      {refunds && refunds.length === 0 ? (
        <EmptyState icon={Wallet} title="No refunds yet" description="Refunds tied to approved returns will appear here." />
      ) : (
        <DataTable columns={columns} rows={refunds ?? []} loading={!refunds} pageSize={8} />
      )}
    </div>
  );
}

export default function RefundsPage() {
  return <PermissionGate perm="refunds.view"><RefundsInner /></PermissionGate>;
}
