"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import * as api from "@/lib/api";
import { Customer } from "@/lib/types";
import { PageHeader, Toolbar, SearchInput } from "@/components/ui";
import { DataTable, Column } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function CustomersInner() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.listCustomers({ limit: 100 }).then((res) => setCustomers(res.data));
  }, []);

  const filtered = useMemo(() => {
    if (!customers) return [];
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase()));
  }, [customers, q]);

  const columns: Column<Customer>[] = [
    {
      key: "name", header: "Customer", sortValue: (c) => c.name,
      render: (c) => (
        <Link href={`/customers/${c.id}`} className="group">
          <p className="font-medium text-ink-900 group-hover:text-maroon-700">{c.name}</p>
          <p className="text-xs text-ink-500">{c.email}</p>
        </Link>
      ),
    },
    { key: "phone", header: "Phone", render: (c) => <span className="font-mono text-xs">{c.phone}</span> },
    {
      key: "verified", header: "Verified",
      render: (c) => (
        <div className="flex items-center gap-3 text-xs text-ink-500">
          <span className="flex items-center gap-1">{c.emailVerified ? <CheckCircle2 size={13} className="text-good" /> : <XCircle size={13} className="text-ink-300" />} Email</span>
          <span className="flex items-center gap-1">{c.phoneVerified ? <CheckCircle2 size={13} className="text-good" /> : <XCircle size={13} className="text-ink-300" />} Phone</span>
        </div>
      ),
    },
    { key: "orders", header: "Orders", align: "right", sortValue: (c) => c.ordersCount, render: (c) => c.ordersCount },
    { key: "ltv", header: "Lifetime value", align: "right", sortValue: (c) => c.lifetimeValue, render: (c) => <span className="font-mono text-xs">{formatINR(c.lifetimeValue)}</span> },
  ];

  return (
    <div>
      <PageHeader eyebrow="Customers" title="Customers" description="Order history and verification status for every registered customer." />
      <Toolbar><SearchInput placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} /></Toolbar>
      <DataTable columns={columns} rows={filtered} loading={!customers} pageSize={8} />
    </div>
  );
}

export default function CustomersPage() {
  return <PermissionGate perm="customers.view"><CustomersInner /></PermissionGate>;
}
