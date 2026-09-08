"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { AuditLogEntry } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { DataTable, Column } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";

function AuditLogInner() {
  const [rows, setRows] = useState<AuditLogEntry[] | null>(null);

  useEffect(() => {
    api.listAuditLog().then((res) => setRows(res.data));
  }, []);

  const columns: Column<AuditLogEntry>[] = [
    { key: "actor", header: "Actor", render: (r) => <span className="font-medium text-ink-900">{r.actor}</span> },
    { key: "action", header: "Action", render: (r) => r.action },
    { key: "entity", header: "Entity", render: (r) => <span className="font-mono text-xs text-ink-500">{r.entity} · {r.entityId}</span> },
    { key: "when", header: "When", sortValue: (r) => r.createdAt, render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <PageHeader eyebrow="System" title="Audit log" description="A record of sensitive admin actions across the console." />
      <DataTable columns={columns} rows={rows ?? []} loading={!rows} pageSize={10} />
    </div>
  );
}

export default function AuditLogPage() {
  return <PermissionGate perm="audit.view"><AuditLogInner /></PermissionGate>;
}
