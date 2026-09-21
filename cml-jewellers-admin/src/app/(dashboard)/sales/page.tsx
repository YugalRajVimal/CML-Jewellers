"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import * as api from "@/lib/api";
import { PageHeader, Panel, StatCard, Skeleton, Button } from "@/components/ui";
import { PermissionGate } from "@/components/permission-gate";
import { IndianRupee, Receipt, TrendingUp } from "lucide-react";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

// Defaults to the last 30 days, matching the backend's own default range when
// no from/to is supplied.
function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

function SalesInner() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getSalesReport>>["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(today());

  function load(range: { from: string; to: string }) {
    setLoading(true);
    api.getSalesReport(range).then((res) => {
      setData(
        res && res.success && res.data
          ? res.data
          : null
      );
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load({ from, to }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Null-safe: the backend always returns these arrays, but guard anyway so a
  // stale/partial response never throws while rendering.
  const trend = data?.trend ?? [];
  const byCategory = data?.byCategory ?? [];
  const topProducts = data?.topProducts ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Sales"
        description="Revenue performance for the selected date range."
        actions={
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs focus:border-maroon-600"
            />
            <span className="text-xs text-ink-400">to</span>
            <input
              type="date"
              value={to}
              min={from}
              max={today()}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs focus:border-maroon-600"
            />
            <Button size="sm" onClick={() => load({ from, to })} disabled={loading}>
              {loading ? "Loading…" : "Apply"}
            </Button>
          </div>
        }
      />

      {/* Stat Cards */}
      {!data ? (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard
            label="Total revenue"
            value={formatINR(data.totalRevenue)}
            icon={IndianRupee}
            hint="Paid orders in range"
          />
          <StatCard
            label="Avg. order value"
            value={formatINR(Math.round(data.avgOrderValue))}
            icon={Receipt}
          />
          <StatCard
            label="Orders"
            value={String(data.orderCount)}
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Monthly Revenue Chart */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel className="lg:col-span-2 p-5">
          <p className="text-sm font-medium text-ink-900 mb-4">
            Revenue trend
          </p>
          {!data ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={trend} margin={{ left: -20, right: 10 }}>
                <CartesianGrid vertical={false} stroke="#e5ddd4" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#6b5d59" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                  tick={{ fontSize: 11, fill: "#6b5d59" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  formatter={(value) => [formatINR(Number(value)), "Revenue"]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5ddd4",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="revenue" fill="#711a23" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel className="p-5">
          <p className="text-sm font-medium text-ink-900 mb-4">Revenue by category</p>
          {!data ? (
            <Skeleton className="h-40 w-full" />
          ) : byCategory.length === 0 ? (
            <p className="text-sm text-ink-500">No sales in this range.</p>
          ) : (
            <ul className="space-y-2.5">
              {byCategory.map((c) => {
                const max = byCategory[0]?.revenue || 1;
                return (
                  <li key={c.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-ink-700">{c.category}</span>
                      <span className="font-medium text-ink-900">{formatINR(c.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                      <div className="h-full bg-maroon-600 rounded-full" style={{ width: `${Math.max(4, (c.revenue / max) * 100)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel className="p-5">
          <p className="text-sm font-medium text-ink-900 mb-4">Top products</p>
          {!data ? (
            <Skeleton className="h-40 w-full" />
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-ink-500">No sales in this range.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-ink-100/40 text-xs text-ink-500">
                  <tr>
                    <th className="text-left px-3 py-1.5 font-medium">Product</th>
                    <th className="text-right px-3 py-1.5 font-medium">Units</th>
                    <th className="text-right px-3 py-1.5 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.sku} className="border-t border-line">
                      <td className="px-3 py-1.5">
                        <p className="text-ink-900">{p.name}</p>
                        <p className="text-[11px] text-ink-500 font-mono">{p.sku}</p>
                      </td>
                      <td className="px-3 py-1.5 text-right">{p.unitsSold}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs">{formatINR(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default function SalesPage() {
  return (
    <PermissionGate perm="sales:read">
      <SalesInner />
    </PermissionGate>
  );
}