"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { IndianRupee, ShoppingBag, Users, PackageX, RotateCcw, AlertTriangle } from "lucide-react";
import * as api from "@/lib/api";
import { PageHeader, Panel, StatCard, StatusPill, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getDashboard>>["data"] | null>(null);

  // useEffect(() => {
  //   api.getDashboard().then((res) => setData(res.data));
  // }, []);

  useEffect(() => {
    let cancelled = false;
    api.getDashboard()
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((e) => {
        // 401 is already handled globally (unauthorizedHandler clears the
        // session and the layout redirects to /login) — just avoid an
        // unhandled rejection here.
        if (!(e instanceof api.ApiRequestError && e.status === 401)) {
          console.error("Failed to load dashboard", e);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Good to see you, ${user?.name.split(" ")[0]}`}
        description="Here's how the store is trending across catalog, orders and fulfilment."
      />

      {!data ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard label="Revenue (30d)" value={formatINR(data.stats.revenue30d)} icon={IndianRupee} hint="Across active orders" />
          <StatCard label="Orders (30d)" value={String(data.stats.orders30d)} icon={ShoppingBag} />
          <StatCard label="Customers" value={String(data.stats.customers)} icon={Users} />
          <StatCard label="Open orders" value={String(data.stats.openOrders)} icon={PackageX} tone="warn" hint="Not yet delivered" />
          <StatCard label="Low stock SKUs" value={String(data.stats.lowStock)} icon={AlertTriangle} tone="bad" />
          <StatCard label="Pending returns" value={String(data.stats.pendingReturns)} icon={RotateCcw} tone="warn" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Panel className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-ink-900">Revenue trend</p>
              <p className="text-xs text-ink-500">Last 7 months, gross order value</p>
            </div>
          </div>
          {!data ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={data.trend} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#711a23" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#711a23" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e5ddd4" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b5d59" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                  tick={{ fontSize: 11, fill: "#6b5d59" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  formatter={(value) => [formatINR(Number(value)), "Revenue"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5ddd4", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#711a23" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel className="p-5">
          <p className="text-sm font-medium text-ink-900 mb-4">Low stock</p>
          {!data ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : data.lowStockRows.length === 0 ? (
            <p className="text-sm text-ink-500">Everything is above threshold.</p>
          ) : (
            <ul className="space-y-3">
              {data.lowStockRows.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-ink-900">{r.productName}</p>
                    <p className="text-xs text-ink-500 font-mono">{r.sku}</p>
                  </div>
                  <span className="font-medium text-bad">{r.available} left</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/inventory" className="mt-4 inline-block text-xs font-medium text-maroon-600 hover:underline">
            View inventory →
          </Link>
        </Panel>
      </div>

      <Panel className="mt-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-ink-900">Recent orders</p>
          <Link href="/orders" className="text-xs font-medium text-maroon-600 hover:underline">View all →</Link>
        </div>
        {!data ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : (
          <div className="divide-y divide-line">
            {data.recentOrders.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between py-2.5 text-sm hover:bg-ink-100/30 -mx-2 px-2 rounded-lg">
                <div>
                  <p className="font-medium text-ink-900">{o.orderNumber}</p>
                  <p className="text-xs text-ink-500">{o.customerName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-ink-700 font-mono text-xs">{formatINR(o.total)}</span>
                  <StatusPill status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
