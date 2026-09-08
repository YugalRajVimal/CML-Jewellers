"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import * as api from "@/lib/api";
import { PageHeader, Panel, StatCard, Skeleton } from "@/components/ui";
import { PermissionGate } from "@/components/permission-gate";
import { IndianRupee, Receipt, TrendingUp } from "lucide-react";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const SLICE_COLORS = ["#711a23", "#c0973f", "#a89c97", "#8a1f29", "#d4ac5c", "#413734"];

function SalesInner() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getSalesReport>>["data"] | null>(null);

  useEffect(() => {
    api.getSalesReport().then((res) => setData(res.data));
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Insights" title="Sales" description="Revenue performance across the last 7 months, by category and by product." />

      {!data ? (
        <div className="grid grid-cols-3 gap-3 mb-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total revenue" value={formatINR(data.totalRevenue)} icon={IndianRupee} hint="All-time, non-cancelled orders" />
          <StatCard label="Avg. order value" value={formatINR(Math.round(data.avgOrderValue))} icon={Receipt} />
          <StatCard label="Orders" value={String(data.orderCount)} icon={TrendingUp} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2 p-5">
          <p className="text-sm font-medium text-ink-900 mb-4">Monthly revenue</p>
          {!data ? <Skeleton className="h-56 w-full" /> : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data.trend} margin={{ left: -20, right: 10 }}>
                <CartesianGrid vertical={false} stroke="#e5ddd4" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b5d59" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 11, fill: "#6b5d59" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip formatter={(value) => [formatINR(Number(value)), "Revenue"]} contentStyle={{ borderRadius: 8, border: "1px solid #e5ddd4", fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#711a23" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel className="p-5">
          <p className="text-sm font-medium text-ink-900 mb-4">Revenue by category</p>
          {!data ? <Skeleton className="h-48 w-full" /> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data.byCategory} dataKey="revenue" nameKey="category" innerRadius={38} outerRadius={62}>
                    {data.byCategory.map((_, i) => <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatINR(Number(value))} contentStyle={{ borderRadius: 8, border: "1px solid #e5ddd4", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 space-y-1.5">
                {data.byCategory.map((c, i) => (
                  <li key={c.category} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-ink-700">
                      <span className="h-2 w-2 rounded-full" style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }} />
                      {c.category}
                    </span>
                    <span className="font-mono text-ink-500">{formatINR(c.revenue)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <Panel className="mt-4 p-5">
        <p className="text-sm font-medium text-ink-900 mb-4">Top products</p>
        {!data ? <Skeleton className="h-40 w-full" /> : (
          <div className="divide-y divide-line">
            {data.topProducts.map((p, i) => (
              <div key={p.sku} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-maroon-700 text-xs font-medium">{i + 1}</span>
                  <div>
                    <p className="text-ink-900">{p.name}</p>
                    <p className="text-xs text-ink-500 font-mono">{p.sku} · {p.unitsSold} sold</p>
                  </div>
                </div>
                <span className="font-mono text-xs">{formatINR(p.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

export default function SalesPage() {
  return <PermissionGate perm="sales.view"><SalesInner /></PermissionGate>;
}
