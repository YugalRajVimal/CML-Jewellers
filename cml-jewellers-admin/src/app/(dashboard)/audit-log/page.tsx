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

// DataTable expects objects with an 'id' field
type DataTableRow = {
  id: string;
  actor: { name: string; email: string } | null;
  action: string;
  resource: string;
  resourceId?: string;
  createdAt: string;
  ip?: string;
  raw: AuditLogRow;
};

// Explicitly type possible API response shapes
type AuditLogApiArrayResponse = { data: AuditLogRow[] };
type AuditLogApiObjectResponse = { data: { logs: AuditLogRow[] } };
type AuditLogApiResponse = AuditLogApiArrayResponse | AuditLogApiObjectResponse | { data: unknown } | undefined;

function AuditLogInner() {
  const [rows, setRows] = useState<DataTableRow[] | null>(null);

  useEffect(() => {
    api.listAuditLog().then((res: AuditLogApiResponse) => {
      console.log("Audit Log API response:", res);
      // Defensive fallback in case of weird response
      // API may sometimes return just an array of logs or an object containing logs
      let logs: AuditLogRow[] = [];

      // Safely narrow types to avoid 'logs' does not exist on 'never'
      if (res && Array.isArray((res as AuditLogApiArrayResponse).data)) {
        logs = (res as AuditLogApiArrayResponse).data;
      } else if (res && res.data && typeof res.data === "object" && Array.isArray((res.data as any).logs)) {
        logs = (res.data as { logs: AuditLogRow[] }).logs;
      }

      // Adapt shape for DataTable
      const tableRows: DataTableRow[] = logs.map((log: AuditLogRow & { id?: string; actor?: string; entity?: string; entityId?: string }) => ({
        id: log._id ?? log.id, // fallback for alternate API shape
        actor: log.adminUserId
          ? { name: log.adminUserId.name, email: log.adminUserId.email }
          : log.actor
            ? { name: log.actor, email: "" }
            : null,
        action: log.action,
        resource: log.resource ?? log.entity ?? "",
        resourceId: log.resourceId ?? log.entityId,
        createdAt: log.createdAt,
        ip: log.ip,
        raw: log,
      }));
      setRows(tableRows);
    });
  }, []);

  const columns: Column<DataTableRow>[] = [
    {
      key: "actor",
      header: "Actor",
      render: (r) =>
        r.actor ? (
          <span className="font-medium text-ink-900">
            {r.actor.name}
            {r.actor.email && (
              <span className="ml-2 text-xs text-ink-500">{r.actor.email}</span>
            )}
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
