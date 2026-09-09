"use client";

import { useEffect, useState } from "react";
import { PackageCheck, Plus, Truck } from "lucide-react";
import * as api from "@/lib/api";
import { PageHeader, Panel, StatusPill, Button, Select } from "@/components/ui";
import { Drawer, Field, TextInput } from "@/components/drawer";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

// Import the types used from your canonical types location.
import type { Supplier as ApiSupplier, Purchase as ApiPurchase } from "@/lib/types";

// Explicit address/contact types instead of inline object types
type SupplierContact = {
  contactPerson?: string;
  email?: string;
  phone?: string;
};

type SupplierAddress = {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
};

// Local uses MUST extend backend types to ensure runtime fields.
type Supplier = Omit<ApiSupplier, "contact" | "address"> & {
  _id: string;
  name: string;
  contact?: SupplierContact;
  address?: SupplierAddress;
};

type PurchaseItem = {
  variantId?: string;
  sku?: string;
  orderedQty: number;
  receivedQty?: number;
  cost: number;
};

type Purchase = ApiPurchase & {
  _id: string;
  purchaseNumber: string;
  supplierId: string;
  createdAt: string;
  notes?: string;
  status: string;
  items?: PurchaseItem[];
};

type ListPurchasesResponse =
  | Purchase[]
  | { purchases: Purchase[] }
  | ApiPurchase[]
  | { purchases: ApiPurchase[] }
  | undefined;

type ListSuppliersResponse =
  | Supplier[]
  | { suppliers: Supplier[] }
  | ApiSupplier[]
  | { suppliers: ApiSupplier[] }
  | undefined;

interface LineItem { sku: string; orderedQty: string; cost: string }

// Helper to convert possibly-shape-mismatched "raw" supplier from backend to local
function toSupplier(raw: ApiSupplier): Supplier {
  return {
    ...raw,
    _id: (raw as any)._id ?? (raw as any).id ?? "",
    name: raw.name,
    contact: raw.contact as SupplierContact | undefined,
    address: raw.address as SupplierAddress | undefined,
  };
}
function toPurchase(raw: ApiPurchase): Purchase {
  return {
    ...raw,
    _id: (raw as any)._id ?? (raw as any).id ?? "",
    purchaseNumber: (raw as any).purchaseNumber ?? "",
    supplierId: (raw as any).supplierId ?? "",
    createdAt: (raw as any).createdAt ?? "",
    notes: (raw as any).notes,
    status: (raw as any).status ?? "",
    items: (raw as any).items ?? [],
  };
}

// Format INR as currency
function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function PurchasesInner() {
  const { can } = useAuth();

  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const [supplierDrawerOpen, setSupplierDrawerOpen] = useState(false);
  // NO spread type in state, explicitly typed SupplierForm
  type SupplierForm = {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address: SupplierAddress;
  };
  const [supplierForm, setSupplierForm] = useState<SupplierForm>({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: { line1: "", city: "", state: "", country: "", pincode: "" }
  });
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [savingSupplier, setSavingSupplier] = useState(false);

  const [poDrawerOpen, setPoDrawerOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ sku: "", orderedQty: "", cost: "" }]);
  const [poError, setPoError] = useState<string | null>(null);
  const [savingPo, setSavingPo] = useState(false);

  // Data loader (mapping backend shape to what we show)
  async function load() {
    const [{ data: poRespData }, { data: supRespData }] = await Promise.all([
      api.listPurchases(), // Purchase[] or { purchases: Purchase[] }
      api.listSuppliers(), // Supplier[] or { suppliers: Supplier[] }
    ]);
    // Coerce results to arrays for consistency, remap types appropriately
    let poArr: Purchase[] = [];
    if (Array.isArray(poRespData)) {
      poArr = poRespData.map(toPurchase);
    } else if (poRespData && typeof poRespData === "object" && "purchases" in poRespData && Array.isArray((poRespData as any).purchases)) {
      poArr = ((poRespData as any).purchases as ApiPurchase[]).map(toPurchase);
    }
    let supArr: Supplier[] = [];
    if (Array.isArray(supRespData)) {
      supArr = supRespData.map(toSupplier);
    } else if (supRespData && typeof supRespData === "object" && "suppliers" in supRespData && Array.isArray((supRespData as any).suppliers)) {
      supArr = ((supRespData as any).suppliers as ApiSupplier[]).map(toSupplier);
    }
    setPurchases(poArr);
    setSuppliers(supArr);
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
      // Compose contact and address as strings for API compatibility
      const contactParts: string[] = [];
      if (supplierForm.contactPerson) contactParts.push(supplierForm.contactPerson);
      if (supplierForm.phone) contactParts.push(supplierForm.phone);
      if (supplierForm.email) contactParts.push(supplierForm.email);
      const addressParts: string[] = [];
      if (supplierForm.address?.line1) addressParts.push(supplierForm.address.line1);
      if (supplierForm.address?.city) addressParts.push(supplierForm.address.city);
      if (supplierForm.address?.state) addressParts.push(supplierForm.address.state);
      if (supplierForm.address?.country) addressParts.push(supplierForm.address.country);
      if (supplierForm.address?.pincode) addressParts.push(supplierForm.address.pincode);
      const payload = {
        name: supplierForm.name,
        contact: contactParts.join(", "),
        address: addressParts.join(", "),
      };
      await api.createSupplier(payload);
      setSupplierDrawerOpen(false);
      setSupplierForm({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: { line1: "", city: "", state: "", country: "", pincode: "" }
      });
      await load();
    } catch (e) {
      setSupplierError(e instanceof Error ? e.message : "Could not add supplier.");
    } finally {
      setSavingSupplier(false);
    }
  }

  function openPoDrawer() {
    setPoSupplierId(suppliers[0]?._id ?? "");
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
        items: cleaned.map((i) => ({
          sku: i.sku.trim(),
          orderedQty: Number(i.orderedQty),
          cost: Number(i.cost || 0)
        })),
      });
      setPoDrawerOpen(false);
      await load();
    } catch (e) {
      setPoError(e instanceof Error ? e.message : "Could not create purchase order.");
    } finally {
      setSavingPo(false);
    }
  }

  // Helper: Get supplier name by ID from suppliers array
  function getSupplierName(id: string) {
    const sup = suppliers.find(s => s._id === id);
    return sup ? sup.name : id;
  }

  // Helper: Compose supplier address string
  function supplierAddress(addr: SupplierAddress | undefined) {
    if (!addr) return "";
    return [
      addr.line1,
      addr.city,
      addr.state,
      addr.country,
      addr.pincode
    ].filter(Boolean).join(", ");
  }

  // Helper: Compose supplier contact
  function supplierContact(contact: SupplierContact | undefined) {
    if (!contact) return "";
    return [
      contact.contactPerson ? contact.contactPerson : null,
      contact.phone ? contact.phone : null,
      contact.email ? contact.email : null,
    ].filter(Boolean).join(", ");
  }

  // Defensive: ensure .map will not throw if purchases is not array
  const hasPurchases = Array.isArray(purchases) && purchases.length > 0;

  return (
    <div>
      <PageHeader
        eyebrow="Fulfilment"
        title="Purchases"
        description="Track supplier purchase orders. Receiving a PO updates on-hand inventory automatically."
        actions={can("purchase:manage") && <Button variant="primary" onClick={openPoDrawer}><Plus size={15} /> New purchase order</Button>}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {!Array.isArray(purchases) && <Panel className="p-8 text-center text-sm text-ink-500">Loading…</Panel>}
          {Array.isArray(purchases) && purchases.length === 0 && <Panel className="p-8 text-center text-sm text-ink-500">No purchase orders yet.</Panel>}
          {Array.isArray(purchases) && purchases.map((po) => {
            const pending = po.items?.reduce
              ? po.items.reduce((s: number, i: any) => s + (i.orderedQty - (i.receivedQty ?? 0)), 0)
              : 0;
            return (
              <Panel key={po._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink-900">{po.purchaseNumber} — {getSupplierName(po.supplierId)}</p>
                    <p className="text-xs text-ink-500">{new Date(po.createdAt).toLocaleDateString()}</p>
                    {po.notes && <p className="mt-1 text-xs text-ink-600">{po.notes}</p>}
                  </div>
                  <StatusPill status={po.status} />
                </div>
                <div className="mt-3 overflow-hidden rounded-lg border border-line">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-100/40 text-xs text-ink-500">
                      <tr>
                        <th className="text-left px-3 py-1.5 font-medium">SKU (Variant ID)</th>
                        <th className="text-right px-3 py-1.5 font-medium">Ordered</th>
                        <th className="text-right px-3 py-1.5 font-medium">Received</th>
                        <th className="text-right px-3 py-1.5 font-medium">Cost/unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.items?.map?.((item: PurchaseItem, idx: number) => (
                        <tr key={item.variantId || item.sku || idx} className="border-t border-line">
                          <td className="px-3 py-1.5 font-mono text-xs">{item.variantId || item.sku}</td>
                          <td className="px-3 py-1.5 text-right">{item.orderedQty}</td>
                          <td className="px-3 py-1.5 text-right">{item.receivedQty ?? 0}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs">{formatINR(item.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {can("purchase:manage") && pending > 0 && (
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" onClick={() => receive(po._id)} disabled={busy === po._id}>
                      <PackageCheck size={13} /> {busy === po._id ? "Receiving…" : `Receive ${pending} pending`}
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
            {can("purchase:manage") && (
              <button onClick={() => setSupplierDrawerOpen(true)} className="text-xs font-medium text-maroon-600 hover:underline">+ Add</button>
            )}
          </div>
          <ul className="space-y-3">
            {Array.isArray(suppliers) && suppliers.map((s) => (
              <li key={s._id} className="text-sm border-b border-line last:border-0 pb-3 last:pb-0">
                <p className="font-medium text-ink-900">{s.name}</p>
                <p className="text-xs text-ink-500">{supplierContact(s.contact)}</p>
                <p className="text-xs text-ink-500">{supplierAddress(s.address)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Drawer open={supplierDrawerOpen} onClose={() => setSupplierDrawerOpen(false)} title="Add supplier">
        <form onSubmit={submitSupplier}>
          <Field label="Supplier name">
            <TextInput value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} />
          </Field>
          <Field label="Contact person">
            <TextInput value={supplierForm.contactPerson ?? ""} onChange={e => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} />
          </Field>
          <Field label="Contact number">
            <TextInput value={supplierForm.phone ?? ""} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="+91 …" />
          </Field>
          <Field label="Email">
            <TextInput value={supplierForm.email ?? ""} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} />
          </Field>
          <Field label="Address line 1">
            <TextInput value={supplierForm.address.line1 ?? ""} onChange={e => setSupplierForm({ ...supplierForm, address: { ...supplierForm.address, line1: e.target.value }})} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="City">
              <TextInput value={supplierForm.address.city ?? ""} onChange={e => setSupplierForm({ ...supplierForm, address: { ...supplierForm.address, city: e.target.value } })} />
            </Field>
            <Field label="State">
              <TextInput value={supplierForm.address.state ?? ""} onChange={e => setSupplierForm({ ...supplierForm, address: { ...supplierForm.address, state: e.target.value } })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Country">
              <TextInput value={supplierForm.address.country ?? ""} onChange={e => setSupplierForm({ ...supplierForm, address: { ...supplierForm.address, country: e.target.value } })} />
            </Field>
            <Field label="Pincode">
              <TextInput value={supplierForm.address.pincode ?? ""} onChange={e => setSupplierForm({ ...supplierForm, address: { ...supplierForm.address, pincode: e.target.value } })} />
            </Field>
          </div>
          {supplierError && <p className="text-sm text-bad mb-3">{supplierError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setSupplierDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingSupplier}>{savingSupplier ? "Saving…" : "Add supplier"}</Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={poDrawerOpen} onClose={() => setPoDrawerOpen(false)} title="New purchase order" description="Enter existing variant IDs — receiving the PO later adds these quantities to inventory.">
        <form onSubmit={submitPo}>
          <Field label="Supplier">
            <Select value={poSupplierId} onChange={(e) => setPoSupplierId(e.target.value)} className="w-full">
              {Array.isArray(suppliers) && suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
          </Field>
          <p className="text-xs font-medium text-ink-700 mb-1.5">Line items</p>
          <div className="space-y-2 mb-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1.5fr_0.8fr_0.9fr] gap-1.5">
                <TextInput placeholder="Variant ID" value={item.sku} onChange={(e) => updateItem(idx, { sku: e.target.value })} className="font-mono text-xs" />
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
  return <PermissionGate perm="purchase:manage"><PurchasesInner /></PermissionGate>;
}
