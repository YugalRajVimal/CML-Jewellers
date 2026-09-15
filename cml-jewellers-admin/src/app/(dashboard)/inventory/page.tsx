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
  if (!Array.isArray(res?.data?.inventory)) return [];
  return res.data.inventory.map((item: any) => {
    const variant = typeof item.variantId === "object" ? item.variantId : null;
    return {
      id: item._id,
      variantId: variant?._id ?? item.variantId,
      sku: variant?.sku || "",
      productName:
        variant?.productId?.name || // requires backend populate — see below
        (variant?.attributes?.size ? `Size ${variant.attributes.size}` : variant?.sku || ""),
      available: item.available,
      reserved: item.reserved,
      sold: item.sold,
      damaged: item.damaged,
      returned: item.returned,
      lowStockThreshold: item.lowStockThreshold,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });
}


function InventoryInner() {
  const { can } = useAuth();
  const [rows, setRows] = useState<InventoryRow[] | null>(null);
  const [txns, setTxns] = useState<InventoryTransaction[]>([]);
  const [lowOnly, setLowOnly] = useState(false);
  const [busySku, setBusySku] = useState<string | null>(null);

  // async function load() {
  //   const inv = await api.listInventory({ limit: 100, lowStockOnly: lowOnly });
  //   console.log("Inventory API response:", inv); // Debug
  //   const inventoryRows = normalizeInventoryRows(inv);
  //   setRows(inventoryRows);

  //   // Load transactions for all SKUs in inventoryRows
  //   const allSkus = inventoryRows.map((row) => row.sku);
  //   const txnsResults = await Promise.all(
  //     allSkus.map((sku) => api.listInventoryTransactions(sku))
  //   );
  //   console.log("Inventory transactions API responses:", txnsResults);
  //   setTxns(txnsResults.flatMap((res) => res.data));
  // }


  async function load() {
    const inv = await api.listInventory({ limit: 100, lowStock: lowOnly });
    const inventoryRows = normalizeInventoryRows(inv);
    setRows(inventoryRows);
  }

  // async function loadTransactions(row: InventoryRow) {
  //   setSelectedRow(row);
  //   const res = await api.listInventoryTransactions(row.variantId);
  //   setTxns(res.data);
  // }
  

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowOnly]);

  const [adjustDraft, setAdjustDraft] = useState<{ variantId: string; delta: string; note: string } | null>(null);

async function submitAdjust() {
  if (!adjustDraft) return;
  const delta = parseInt(adjustDraft.delta, 10);
  if (!delta) return;
  setBusySku(adjustDraft.variantId);
  try {
    await api.adjustInventory(adjustDraft.variantId, delta, adjustDraft.note || (delta > 0 ? "manual restock" : "manual correction"));
    setAdjustDraft(null);
    await load();
  } finally {
    setBusySku(null);
  }
}

  async function adjust(variantId: string, delta: number) {
    setBusySku(variantId);
    try {
      await api.adjustInventory(variantId, delta, delta > 0 ? "manual restock" : "manual correction");
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
          adjustDraft?.variantId === r.variantId ? (
            <div className="flex items-center justify-end gap-1">
              <input
                type="number"
                autoFocus
                className="w-16 rounded-md border border-line px-1 py-0.5 text-xs"
                value={adjustDraft.delta}
                onChange={(e) => setAdjustDraft({ ...adjustDraft, delta: e.target.value })}
                placeholder="±qty"
              />
              <button onClick={submitAdjust} disabled={busySku === r.variantId} className="rounded-md border border-line px-2 py-0.5 text-xs hover:bg-ink-100">
                Save
              </button>
              <button onClick={() => setAdjustDraft(null)} className="rounded-md border border-line px-2 py-0.5 text-xs hover:bg-ink-100">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdjustDraft({ variantId: r.variantId, delta: "", note: "" })}
              className="rounded-md border border-line px-2 py-0.5 text-xs hover:bg-ink-100"
            >
              Adjust stock
            </button>
          )
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
