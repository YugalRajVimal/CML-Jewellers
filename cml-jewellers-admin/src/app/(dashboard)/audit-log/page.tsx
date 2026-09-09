"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { PageHeader } from "@/components/ui";
import { DataTable, Column } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";

// We'll type a log row according to API response shape
type AuditLogRow = {
  _id: string;
  adminUserId: { _id: string; name: string; email: string };
  action: string;
  resource: string;
  resourceId?: string;
  createdAt: string;
  ip?: string;
  after?: any;
};

function AuditLogInner() {
  const [rows, setRows] = useState<AuditLogRow[] | null>(null);

  useEffect(() => {
    api.listAuditLog().then((res) => {
      console.log("Audit Log API response:", res);
      // Backend: { success, message, data: { logs }, meta }
      // Defensive fallback in case of weird response
      const logs = Array.isArray(res?.data?.logs) ? res.data.logs : [];
      setRows(logs);
    });
  }, []);

  const columns: Column<AuditLogRow>[] = [
    {
      key: "actor",
      header: "Actor",
      render: (r) =>
        r.adminUserId ? (
          <span className="font-medium text-ink-900">
            {r.adminUserId.name}
            <span className="ml-2 text-xs text-ink-500">{r.adminUserId.email}</span>
          </span>
        ) : (
          <span className="text-ink-500">Unknown</span>
        ),
    },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <span className="break-all">
          {r.action}
        </span>
      ),
    },
    {
      key: "resource",
      header: "Resource",
      render: (r) => (
        <span className="font-mono text-xs text-ink-500">
          {r.resource}
          {r.resourceId ? ` · ${r.resourceId}` : ""}
        </span>
      ),
    },
    {
      key: "when",
      header: "When",
      sortValue: (r) => r.createdAt,
      render: (r) => new Date(r.createdAt).toLocaleString(),
    },
    {
      key: "ip",
      header: "IP",
      render: (r) => (
        <span className="text-xs text-ink-400">{r.ip ?? ""}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Audit log"
        description="A record of sensitive admin actions across the console."
      />
      <DataTable
        columns={columns}
        rows={rows ?? []}
        loading={!rows}
        pageSize={10}
        rowKey="_id"
      />
    </div>
  );
}

export default function AuditLogPage() {
  return (
    <PermissionGate perm="dashboard:read">
      <AuditLogInner />
    </PermissionGate>
  );
}
