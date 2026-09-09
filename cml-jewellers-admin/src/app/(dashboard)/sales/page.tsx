"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import * as api from "@/lib/api";
import { PageHeader, Panel, StatCard, Skeleton } from "@/components/ui";
import { PermissionGate } from "@/components/permission-gate";
import { IndianRupee, Receipt, TrendingUp } from "lucide-react";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function SalesInner() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getSalesReport>>["data"] | null>(null);

  useEffect(() => {
    api.getSalesReport().then((res) => {
      console.log("Sales report API response:", res);
      setData(
        res && res.success && res.data
          ? res.data
          : null
      );
    });
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Sales"
        description="Revenue performance across the last few months."
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
            hint="All-time, non-cancelled orders"
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
              <BarChart data={data.trend} margin={{ left: -20, right: 10 }}>
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
      </div>
    </div>
  );
}

export default function SalesPage() {
  return (
    <PermissionGate perm="order:read">
      <SalesInner />
    </PermissionGate>
  );
}
