"use client";

import { useEffect, useState } from "react";
import { PackageCheck, Plus, Truck } from "lucide-react";
import * as api from "@/lib/api";
import { Purchase, Supplier } from "@/lib/types";
import { PageHeader, Panel, StatusPill, Button, Select } from "@/components/ui";
import { Drawer, Field, TextInput } from "@/components/drawer";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

interface LineItem { sku: string; orderedQty: string; cost: string }

function PurchasesInner() {
  const { can } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const [supplierDrawerOpen, setSupplierDrawerOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: "", contact: "", address: "" });
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [savingSupplier, setSavingSupplier] = useState(false);

  const [poDrawerOpen, setPoDrawerOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ sku: "", orderedQty: "", cost: "" }]);
  const [poError, setPoError] = useState<string | null>(null);
  const [savingPo, setSavingPo] = useState(false);

  async function load() {
    const [po, sup] = await Promise.all([api.listPurchases(), api.listSuppliers()]);
    setPurchases(po.data);
    setSuppliers(sup.data);
  }

  useEffect(() => { load(); }, []);

  async function receive(id: string) {
    setBusy(id);
    try {
      await api.receivePurchase(id);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function submitSupplier(e: React.FormEvent) {
    e.preventDefault();
    setSupplierError(null);
    if (!supplierForm.name.trim()) { setSupplierError("Supplier name is required."); return; }
    setSavingSupplier(true);
    try {
      await api.createSupplier(supplierForm);
      setSupplierDrawerOpen(false);
      setSupplierForm({ name: "", contact: "", address: "" });
      await load();
    } catch (e) {
      setSupplierError(e instanceof Error ? e.message : "Could not add supplier.");
    } finally {
      setSavingSupplier(false);
    }
  }

  function openPoDrawer() {
    setPoSupplierId(suppliers[0]?.id ?? "");
    setItems([{ sku: "", orderedQty: "", cost: "" }]);
    setPoError(null);
    setPoDrawerOpen(true);
  }

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function submitPo(e: React.FormEvent) {
    e.preventDefault();
    setPoError(null);
    const cleaned = items.filter((i) => i.sku.trim() && i.orderedQty);
    if (!poSupplierId || cleaned.length === 0) {
      setPoError("Choose a supplier and add at least one SKU with quantity.");
      return;
    }
    setSavingPo(true);
    try {
      await api.createPurchase({
        supplierId: poSupplierId,
        items: cleaned.map((i) => ({ sku: i.sku.trim(), orderedQty: Number(i.orderedQty), cost: Number(i.cost || 0) })),
      });
      setPoDrawerOpen(false);
      await load();
    } catch (e) {
      setPoError(e instanceof Error ? e.message : "Could not create purchase order.");
    } finally {
      setSavingPo(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Fulfilment"
        title="Purchases"
        description="Track supplier purchase orders. Receiving a PO updates on-hand inventory automatically."
        actions={can("purchases.write") && <Button variant="primary" onClick={openPoDrawer}><Plus size={15} /> New purchase order</Button>}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {!purchases && <Panel className="p-8 text-center text-sm text-ink-500">Loading…</Panel>}
          {purchases?.length === 0 && <Panel className="p-8 text-center text-sm text-ink-500">No purchase orders yet.</Panel>}
          {purchases?.map((po) => {
            const pending = po.items.reduce((s, i) => s + (i.orderedQty - i.receivedQty), 0);
            return (
              <Panel key={po.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink-900">{po.id.toUpperCase()} — {po.supplierName}</p>
                    <p className="text-xs text-ink-500">{new Date(po.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StatusPill status={po.status} />
                </div>
                <div className="mt-3 overflow-hidden rounded-lg border border-line">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-100/40 text-xs text-ink-500">
                      <tr>
                        <th className="text-left px-3 py-1.5 font-medium">SKU</th>
                        <th className="text-right px-3 py-1.5 font-medium">Ordered</th>
                        <th className="text-right px-3 py-1.5 font-medium">Received</th>
                        <th className="text-right px-3 py-1.5 font-medium">Cost/unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.items.map((item) => (
                        <tr key={item.sku} className="border-t border-line">
                          <td className="px-3 py-1.5 font-mono text-xs">{item.sku}</td>
                          <td className="px-3 py-1.5 text-right">{item.orderedQty}</td>
                          <td className="px-3 py-1.5 text-right">{item.receivedQty}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs">{formatINR(item.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {can("purchases.write") && pending > 0 && (
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" onClick={() => receive(po.id)} disabled={busy === po.id}>
                      <PackageCheck size={13} /> {busy === po.id ? "Receiving…" : `Receive ${pending} pending`}
                    </Button>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>

        <Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-ink-900 flex items-center gap-2"><Truck size={14} /> Suppliers</p>
            {can("purchases.write") && (
              <button onClick={() => setSupplierDrawerOpen(true)} className="text-xs font-medium text-maroon-600 hover:underline">+ Add</button>
            )}
          </div>
          <ul className="space-y-3">
            {suppliers.map((s) => (
              <li key={s.id} className="text-sm border-b border-line last:border-0 pb-3 last:pb-0">
                <p className="font-medium text-ink-900">{s.name}</p>
                <p className="text-xs text-ink-500">{s.contact}</p>
                <p className="text-xs text-ink-500">{s.address}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Drawer open={supplierDrawerOpen} onClose={() => setSupplierDrawerOpen(false)} title="Add supplier">
        <form onSubmit={submitSupplier}>
          <Field label="Supplier name"><TextInput value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} /></Field>
          <Field label="Contact number"><TextInput value={supplierForm.contact} onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })} placeholder="+91 …" /></Field>
          <Field label="Address"><TextInput value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} /></Field>
          {supplierError && <p className="text-sm text-bad mb-3">{supplierError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setSupplierDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingSupplier}>{savingSupplier ? "Saving…" : "Add supplier"}</Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={poDrawerOpen} onClose={() => setPoDrawerOpen(false)} title="New purchase order" description="Enter existing variant SKUs — receiving the PO later adds these quantities to inventory.">
        <form onSubmit={submitPo}>
          <Field label="Supplier">
            <Select value={poSupplierId} onChange={(e) => setPoSupplierId(e.target.value)} className="w-full">
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <p className="text-xs font-medium text-ink-700 mb-1.5">Line items</p>
          <div className="space-y-2 mb-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1.5fr_0.8fr_0.9fr] gap-1.5">
                <TextInput placeholder="SKU" value={item.sku} onChange={(e) => updateItem(idx, { sku: e.target.value })} className="font-mono text-xs" />
                <TextInput type="number" placeholder="Qty" value={item.orderedQty} onChange={(e) => updateItem(idx, { orderedQty: e.target.value })} />
                <TextInput type="number" placeholder="Cost/unit" value={item.cost} onChange={(e) => updateItem(idx, { cost: e.target.value })} />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setItems((prev) => [...prev, { sku: "", orderedQty: "", cost: "" }])} className="text-xs font-medium text-maroon-600 hover:underline mb-4">
            + Add line item
          </button>
          {poError && <p className="text-sm text-bad mb-3">{poError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPoDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingPo}>{savingPo ? "Creating…" : "Create purchase order"}</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function PurchasesPage() {
  return <PermissionGate perm="purchases.view"><PurchasesInner /></PermissionGate>;
}
