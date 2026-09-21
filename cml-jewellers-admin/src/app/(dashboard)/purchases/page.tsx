"use client";

import { useEffect, useState } from "react";
import { PackageCheck, Plus, Truck, X as XIcon } from "lucide-react";
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
  variantId: string;
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

// A line item being built in the "New purchase order" drawer. variantId is only
// populated once the person has searched for a SKU and picked a match — the
// backend needs variantId, not the raw SKU text (BUG-04).
interface DraftLineItem {
  variantId: string;
  sku: string;
  productName?: string;
  orderedQty: string;
  cost: string;
}

interface VariantSearchResult {
  _id: string;
  sku: string;
  price: number;
  mrp: number;
  isActive: boolean;
  productName?: string;
}

// Format INR as currency
function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

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

function PurchasesInner() {
  const { can } = useAuth();

  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});

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
  const [items, setItems] = useState<DraftLineItem[]>([]);
  const [poError, setPoError] = useState<string | null>(null);
  const [savingPo, setSavingPo] = useState(false);

  // Variant SKU search, used to resolve a line item to a variantId (BUG-04).
  const [variantQuery, setVariantQuery] = useState("");
  const [variantResults, setVariantResults] = useState<VariantSearchResult[]>([]);
  const [searchingVariant, setSearchingVariant] = useState(false);
  const [variantSearchError, setVariantSearchError] = useState<string | null>(null);

  // Receive-stock drawer — lets the person record a (possibly partial)
  // receipt against a PO, which the backend needs as items:[{variantId, receivedQty}].
  const [receiveDrawerOpen, setReceiveDrawerOpen] = useState(false);
  const [receivingPo, setReceivingPo] = useState<Purchase | null>(null);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({});
  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [savingReceive, setSavingReceive] = useState(false);

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

  function openReceiveDrawer(po: Purchase) {
    const initial: Record<string, string> = {};
    (po.items ?? []).forEach((item) => {
      const remaining = item.orderedQty - (item.receivedQty ?? 0);
      if (remaining > 0) initial[item.variantId] = String(remaining);
    });
    setReceivingPo(po);
    setReceiveQtys(initial);
    setReceiveError(null);
    setReceiveDrawerOpen(true);
  }

  async function submitReceive(e: React.FormEvent) {
    e.preventDefault();
    if (!receivingPo) return;
    setReceiveError(null);

    const receiveItems = Object.entries(receiveQtys)
      .map(([variantId, qty]) => ({ variantId, receivedQty: Number(qty) }))
      .filter((i) => Number.isFinite(i.receivedQty) && i.receivedQty > 0);

    if (receiveItems.length === 0) {
      setReceiveError("Enter a quantity to receive for at least one line.");
      return;
    }

    setSavingReceive(true);
    try {
      await api.receivePurchase(receivingPo._id, { items: receiveItems });
      setReceiveDrawerOpen(false);
      setReceivingPo(null);
      await load();
    } catch (e) {
      setReceiveError(e instanceof Error ? e.message : "Could not record the receipt.");
    } finally {
      setSavingReceive(false);
    }
  }

  async function cancelPo(id: string) {
    setBusy(id);
    setActionError((prev) => ({ ...prev, [id]: "" }));
    try {
      await api.cancelPurchase(id);
      await load();
    } catch (e) {
      setActionError((prev) => ({ ...prev, [id]: e instanceof Error ? e.message : "Could not cancel this purchase order." }));
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
      // Backend createSupplierSchema wants contact/address as nested objects,
      // not joined strings — send only the fields that were actually filled in.
      const contact: SupplierContact = {};
      if (supplierForm.contactPerson) contact.contactPerson = supplierForm.contactPerson;
      if (supplierForm.phone) contact.phone = supplierForm.phone;
      if (supplierForm.email) contact.email = supplierForm.email;

      const address: SupplierAddress = {};
      if (supplierForm.address?.line1) address.line1 = supplierForm.address.line1;
      if (supplierForm.address?.city) address.city = supplierForm.address.city;
      if (supplierForm.address?.state) address.state = supplierForm.address.state;
      if (supplierForm.address?.country) address.country = supplierForm.address.country;
      if (supplierForm.address?.pincode) address.pincode = supplierForm.address.pincode;

      const payload = {
        name: supplierForm.name,
        contact: Object.keys(contact).length ? contact : undefined,
        address: Object.keys(address).length ? address : undefined,
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
    setItems([]);
    setVariantQuery("");
    setVariantResults([]);
    setVariantSearchError(null);
    setPoError(null);
    setPoDrawerOpen(true);
  }

  async function searchVariant() {
    if (!variantQuery.trim()) return;
    setSearchingVariant(true);
    setVariantSearchError(null);
    try {
      const { data } = await api.searchVariants(variantQuery.trim());
      setVariantResults(data?.variants ?? []);
      if (!data?.variants?.length) setVariantSearchError("No variants match that SKU.");
    } catch (e) {
      setVariantSearchError(e instanceof Error ? e.message : "Could not search variants.");
    } finally {
      setSearchingVariant(false);
    }
  }

  function addVariantToPo(variant: VariantSearchResult) {
    if (items.some((i) => i.variantId === variant._id)) return; // already added
    setItems((prev) => [...prev, { variantId: variant._id, sku: variant.sku, productName: variant.productName, orderedQty: "1", cost: String(variant.price ?? "") }]);
    setVariantQuery("");
    setVariantResults([]);
  }

  function updateItem(idx: number, patch: Partial<DraftLineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submitPo(e: React.FormEvent) {
    e.preventDefault();
    setPoError(null);
    if (!poSupplierId || items.length === 0) {
      setPoError("Choose a supplier and add at least one variant.");
      return;
    }
    if (items.some((i) => !i.orderedQty || Number(i.orderedQty) < 1)) {
      setPoError("Every line item needs a quantity of at least 1.");
      return;
    }
    setSavingPo(true);
    try {
      await api.createPurchase({
        supplierId: poSupplierId,
        items: items.map((i) => ({
          variantId: i.variantId,
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
            const canCancel = po.status !== "Cancelled" && po.status !== "Received" && !(po.items ?? []).some((i) => (i.receivedQty ?? 0) > 0);
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
                          <td className="px-3 py-1.5 font-mono text-xs">{item.sku || item.variantId}</td>
                          <td className="px-3 py-1.5 text-right">{item.orderedQty}</td>
                          <td className="px-3 py-1.5 text-right">{item.receivedQty ?? 0}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-xs">{formatINR(item.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {actionError[po._id] && <p className="mt-2 text-xs text-bad">{actionError[po._id]}</p>}
                {can("purchase:manage") && (pending > 0 || canCancel) && (
                  <div className="mt-3 flex justify-end gap-2">
                    {canCancel && (
                      <Button size="sm" variant="secondary" onClick={() => cancelPo(po._id)} disabled={busy === po._id}>
                        {busy === po._id ? "Cancelling…" : "Cancel PO"}
                      </Button>
                    )}
                    {pending > 0 && (
                      <Button size="sm" onClick={() => openReceiveDrawer(po)} disabled={busy === po._id}>
                        <PackageCheck size={13} /> Receive stock
                      </Button>
                    )}
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

      <Drawer open={poDrawerOpen} onClose={() => setPoDrawerOpen(false)} title="New purchase order" description="Search for a variant by SKU and add it as a line item.">
        <form onSubmit={submitPo}>
          <Field label="Supplier">
            <Select value={poSupplierId} onChange={(e) => setPoSupplierId(e.target.value)} className="w-full">
              {Array.isArray(suppliers) && suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
          </Field>

          <p className="text-xs font-medium text-ink-700 mb-1.5">Find a variant</p>
          <div className="flex gap-1.5 mb-2">
            <TextInput
              placeholder="Search by SKU"
              value={variantQuery}
              onChange={(e) => setVariantQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchVariant(); } }}
              className="font-mono text-xs"
            />
            <Button type="button" variant="secondary" onClick={searchVariant} disabled={searchingVariant}>
              {searchingVariant ? "…" : "Search"}
            </Button>
          </div>
          {variantSearchError && <p className="text-xs text-bad mb-2">{variantSearchError}</p>}
          {variantResults.length > 0 && (
            <ul className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-line divide-y divide-line">
              {variantResults.map((v) => (
                <li key={v._id}>
                  <button
                    type="button"
                    onClick={() => addVariantToPo(v)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-ink-100/40 flex items-center justify-between"
                  >
                    <span>
                      <span className="font-mono">{v.sku}</span>
                      {v.productName && <span className="text-ink-500"> — {v.productName}</span>}
                    </span>
                    <span className="text-ink-500">{formatINR(v.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs font-medium text-ink-700 mb-1.5">Line items</p>
          {items.length === 0 && <p className="text-xs text-ink-400 mb-3">No line items yet — search a SKU above and select it.</p>}
          <div className="space-y-2 mb-4">
            {items.map((item, idx) => (
              <div key={item.variantId} className="rounded-lg border border-line p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-mono">{item.sku}</p>
                  <button type="button" onClick={() => removeItem(idx)} className="text-ink-400 hover:text-bad">
                    <XIcon size={13} />
                  </button>
                </div>
                {item.productName && <p className="text-[11px] text-ink-500 mb-1.5">{item.productName}</p>}
                <div className="grid grid-cols-2 gap-1.5">
                  <TextInput type="number" min={1} placeholder="Qty" value={item.orderedQty} onChange={(e) => updateItem(idx, { orderedQty: e.target.value })} />
                  <TextInput type="number" min={0} placeholder="Cost/unit" value={item.cost} onChange={(e) => updateItem(idx, { cost: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
          {poError && <p className="text-sm text-bad mb-3">{poError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPoDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingPo}>{savingPo ? "Creating…" : "Create purchase order"}</Button>
          </div>
        </form>
      </Drawer>

      <Drawer
        open={receiveDrawerOpen}
        onClose={() => setReceiveDrawerOpen(false)}
        title={receivingPo ? `Receive stock — ${receivingPo.purchaseNumber}` : "Receive stock"}
        description="Enter the quantity actually received for each line — partial receipts are fine."
      >
        {receivingPo && (
          <form onSubmit={submitReceive}>
            <div className="space-y-2 mb-4">
              {(receivingPo.items ?? []).map((item) => {
                const remaining = item.orderedQty - (item.receivedQty ?? 0);
                if (remaining <= 0) return null;
                return (
                  <div key={item.variantId} className="rounded-lg border border-line p-2">
                    <p className="text-xs font-mono mb-1">{item.variantId}</p>
               
                    <p className="text-[11px] text-ink-500 mb-1.5">{remaining} of {item.orderedQty} remaining</p>
                    <TextInput
                      type="number"
                      min={0}
                      max={remaining}
                      value={receiveQtys[item.variantId] ?? ""}
                      onChange={(e) => setReceiveQtys((prev) => ({ ...prev, [item.variantId]: e.target.value }))}
                    />
                  </div>
                );
              })}
            </div>
            {receiveError && <p className="text-sm text-bad mb-3">{receiveError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setReceiveDrawerOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={savingReceive}>{savingReceive ? "Recording…" : "Record receipt"}</Button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}

export default function PurchasesPage() {
  return <PermissionGate perm="purchase:manage"><PurchasesInner /></PermissionGate>;
}