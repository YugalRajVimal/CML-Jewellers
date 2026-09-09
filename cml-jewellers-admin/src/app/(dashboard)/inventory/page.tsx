"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, History, Minus, Plus } from "lucide-react";
import * as api from "@/lib/api";
import { InventoryRow, InventoryTransaction } from "@/lib/types";
import { PageHeader, Panel, Toolbar, Button } from "@/components/ui";
import { DataTable, Column } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

// Transform the new inventory API response to expected rows
function normalizeInventoryRows(res: any): InventoryRow[] {
  // Shape: res.data.inventory: Array<{ _id, variantId, available, ... }>
  if (!Array.isArray(res?.data?.inventory)) return [];
  return res.data.inventory.map((item: any) => ({
    // Fully flatten to match old InventoryRow shape if needed
    id: item._id,
    sku: typeof item.variantId === "object" ? item.variantId.sku : "",
    productName: item.variantId?.attributes?.size
      ? `Size ${item.variantId.attributes.size}`
      : item.variantId?.sku || "", // Give a fallback name if more info is needed
    available: item.available,
    reserved: item.reserved,
    sold: item.sold,
    damaged: item.damaged,
    returned: item.returned, // May be ignored in view, but included for type completeness
    lowStockThreshold: item.lowStockThreshold,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    // Spread out any other fields that may exist
    ...item,
  }));
}

function InventoryInner() {
  const { can } = useAuth();
  const [rows, setRows] = useState<InventoryRow[] | null>(null);
  const [txns, setTxns] = useState<InventoryTransaction[]>([]);
  const [lowOnly, setLowOnly] = useState(false);
  const [busySku, setBusySku] = useState<string | null>(null);

  async function load() {
    const inv = await api.listInventory({ limit: 100, lowStockOnly: lowOnly });
    console.log("Inventory API response:", inv); // Debug
    const inventoryRows = normalizeInventoryRows(inv);
    setRows(inventoryRows);

    // Load transactions for all SKUs in inventoryRows
    const allSkus = inventoryRows.map((row) => row.sku);
    const txnsResults = await Promise.all(
      allSkus.map((sku) => api.listInventoryTransactions(sku))
    );
    console.log("Inventory transactions API responses:", txnsResults);
    setTxns(txnsResults.flatMap((res) => res.data));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowOnly]);

  async function adjust(sku: string, delta: number) {
    setBusySku(sku);
    try {
      await api.adjustInventory(sku, delta, delta > 0 ? "manual restock" : "manual correction");
      await load();
    } finally {
      setBusySku(null);
    }
  }

  const columns: Column<InventoryRow>[] = [
    {
      key: "product",
      header: "Product / SKU",
      sortValue: (r) => r.productName,
      render: (r) => (
        <div>
          <p className="font-medium text-ink-900">{r.productName}</p>
          <p className="text-xs text-ink-500 font-mono">{r.sku}</p>
        </div>
      ),
    },
    {
      key: "available",
      header: "Available",
      align: "right",
      sortValue: (r) => r.available,
      render: (r) => (
        <span className={r.available <= r.lowStockThreshold ? "font-semibold text-bad" : "font-medium text-ink-900"}>
          {r.available}
        </span>
      ),
    },
    {
      key: "reserved",
      header: "Reserved",
      align: "right",
      sortValue: (r) => r.reserved,
      render: (r) => r.reserved,
    },
    {
      key: "sold",
      header: "Sold",
      align: "right",
      sortValue: (r) => r.sold,
      render: (r) => r.sold,
    },
    {
      key: "damaged",
      header: "Damaged",
      align: "right",
      sortValue: (r) => r.damaged,
      render: (r) => r.damaged,
    },
    {
      key: "actions",
      header: "Adjust",
      align: "right",
      render: (r) =>
        can("inventory:write") ? (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => adjust(r.sku, -1)}
              disabled={busySku === r.sku || r.available === 0}
              className="rounded-md border border-line p-1 hover:bg-ink-100 disabled:opacity-30"
            >
              <Minus size={12} />
            </button>
            <button
              onClick={() => adjust(r.sku, 1)}
              disabled={busySku === r.sku}
              className="rounded-md border border-line p-1 hover:bg-ink-100"
            >
              <Plus size={12} />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Inventory"
        description="Stock on hand across variants, with manual adjustments and a transaction trail."
      />
      <Toolbar>
        <Button
          variant={lowOnly ? "primary" : "secondary"}
          size="sm"
          onClick={() => setLowOnly((v) => !v)}
        >
          <AlertTriangle size={13} /> Low stock only
        </Button>
      </Toolbar>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            rows={rows ?? []}
            loading={!rows}
            pageSize={8}
            emptyLabel="No inventory rows match this filter."
          />
        </div>
        <Panel className="p-5">
          <p className="text-sm font-medium text-ink-900 mb-4 flex items-center gap-2">
            <History size={14} /> Recent transactions
          </p>
          <ul className="space-y-3">
            {txns.slice(0, 8).map((t) => (
              <li key={t.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-700">{t.sku}</span>
                  <span className={t.qty > 0 ? "text-good font-medium" : "text-bad font-medium"}>
                    {t.qty > 0 ? "+" : ""}
                    {t.qty}
                  </span>
                </div>
                <p className="text-xs text-ink-500 capitalize">
                  {t.type} · {t.refId} · {new Date(t.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <PermissionGate perm="inventory:read">
      <InventoryInner />
    </PermissionGate>
  );
}
