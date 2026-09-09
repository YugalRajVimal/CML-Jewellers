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

type DashboardStats = {
  revenue30d: number;
  orders30d: number;
  customers: number;
  openOrders: number;
  lowStock: number;
  pendingReturns: number;
};

type DashboardTrend = {
  label: string;
  revenue: number;
  orders: number;
};

type LowStockRow = {
  _id: string;
  variantId: {
    _id: string;
    productId: string;
    sku: string;
    attributes?: {
      size?: string;
    };
  };
  available: number;
  reserved: number;
  sold: number;
  damaged: number;
  returned: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

type InventoryRow = {
  // Minimum properties needed to convert to LowStockRow, plus possible extra fields
  _id: string;
  variantId: {
    _id: string;
    productId: string;
    sku: string;
    attributes?: {
      size?: string;
    };
  };
  available: number;
  reserved: number;
  sold: number;
  damaged: number;
  returned: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  // ...other properties (possibly present on InventoryRow)
};

type RecentOrder = {
  _id: string;
  orderNumber?: string;
  customerName?: string;
  total?: number;
  status?: string;
};

type DashboardData = {
  stats: DashboardStats;
  trend: DashboardTrend[];
  recentOrders: RecentOrder[];
  lowStockRows: LowStockRow[];
};

function getProductNameAndSKU(row: LowStockRow) {
  const productName =
    row.variantId?.attributes?.size != null
      ? `Size ${row.variantId.attributes.size}`
      : row.variantId?.sku || "Product";
  const sku = row.variantId?.sku || "SKU";
  return { productName, sku };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getDashboard()
      .then((res) => {
        // Adapt API response
        if (!cancelled) {
          if (res && res.data) {
            // Workaround: Convert InventoryRow[] to LowStockRow[]
            const raw = res.data;

            // Defensive type assertion; adapt objects if needed
            const lowStockRows: LowStockRow[] = Array.isArray(raw.lowStockRows)
              ? raw.lowStockRows.map((row: any) => {
                  // Only keep properties defined in LowStockRow type
                  return {
                    _id: row._id,
                    variantId: row.variantId,
                    available: row.available,
                    reserved: row.reserved,
                    sold: row.sold,
                    damaged: row.damaged,
                    returned: row.returned,
                    lowStockThreshold: row.lowStockThreshold,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    __v: row.__v,
                  } as LowStockRow;
                })
              : [];

            setData({
              stats: raw.stats,
              trend: raw.trend,
              recentOrders: raw.recentOrders,
              lowStockRows,
            });
          }
        }
      })
      .catch((e) => {
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
        title={`Good to see you, ${user?.name?.split?.(" ")[0]}`}
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
              {data.lowStockRows.map((r, i) => {
                const { productName, sku } = getProductNameAndSKU(r);
                // Use _id and SKU as key, fallback to index
                const key = r._id && sku ? `${r._id}-${sku}` : r._id || sku || i;
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="text-ink-900">{productName}</p>
                      <p className="text-xs text-ink-500 font-mono">{sku}</p>
                    </div>
                    <span className="font-medium text-bad">{r.available} left</span>
                  </li>
                );
              })}
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
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-ink-500 py-3">No recent orders.</p>
            ) : (
              data.recentOrders.map((o) => (
                <Link
                  key={o._id}
                  href={`/orders/${o._id}`}
                  className="flex items-center justify-between py-2.5 text-sm hover:bg-ink-100/30 -mx-2 px-2 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-ink-900">{o.orderNumber || o._id}</p>
                    <p className="text-xs text-ink-500">{o.customerName || "—"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-ink-700 font-mono text-xs">{o.total !== undefined ? formatINR(o.total) : "—"}</span>
                    <StatusPill status={o.status || "unknown"} />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
