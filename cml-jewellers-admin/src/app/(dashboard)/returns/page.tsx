"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import * as api from "@/lib/api";
import { Return, ReturnStatus } from "@/lib/types";
import { RETURN_TRANSITIONS } from "@/lib/state-machines";
import { PageHeader, Panel, StatusPill, Button, EmptyState } from "@/components/ui";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

function ReturnsInner() {
  const { can } = useAuth();
  const [returns, setReturns] = useState<Return[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Record<string, string>>({});

  async function load() {
    const res = await api.listReturns();
    setReturns(res.data);
  }
  useEffect(() => { load(); }, []);

  async function move(id: string, to: ReturnStatus) {
    setBusy(id);
    setNotice((n) => ({ ...n, [id]: "" }));
    try {
      await api.transitionReturn(id, to);
      await load();
    } catch (e) {
      setNotice((n) => ({ ...n, [id]: e instanceof Error ? e.message : "Could not update." }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Fulfilment"
        title="Returns"
        description="Approve, receive, inspect and refund customer returns. Refunding restores inventory in lockstep."
      />
      {!returns && <Panel className="p-8 text-center text-sm text-ink-500">Loading…</Panel>}
      {returns && returns.length === 0 && <EmptyState icon={RotateCcw} title="No returns yet" description="Approved returns will show up here." />}
      <div className="space-y-3">
        {returns?.map((r) => {
          const allowed = RETURN_TRANSITIONS[r.status];
          return (
            <Panel key={r.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">
                    Return for <Link href={`/orders/${r.orderId}`} className="text-maroon-600 hover:underline">{r.orderNumber}</Link>
                  </p>
                  <p className="text-xs text-ink-500">{r.items.map((i) => `${i.productName} × ${i.qty}`).join(", ")}</p>
                  <p className="text-xs text-ink-500 mt-1">Reason: {r.reason}</p>
                </div>
                <StatusPill status={r.status} />
              </div>
              {can("returns.write") && allowed.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  {allowed.map((s) => (
                    <Button key={s} size="sm" variant={["Rejected", "Cancelled"].includes(s) ? "danger" : "secondary"} disabled={busy === r.id} onClick={() => move(r.id, s)}>
                      Move to {s}
                    </Button>
                  ))}
                </div>
              )}
              {notice[r.id] && <p className="text-xs text-bad mt-2">{notice[r.id]}</p>}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  return <PermissionGate perm="returns.view"><ReturnsInner /></PermissionGate>;
}
