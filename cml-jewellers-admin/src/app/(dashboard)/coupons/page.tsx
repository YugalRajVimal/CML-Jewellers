"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import { Coupon } from "@/lib/types";
import { PageHeader, StatusPill, Button, Select } from "@/components/ui";
import { Drawer, Field, TextInput } from "@/components/drawer";
import { DataTable, Column } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

const emptyForm = { code: "", type: "percent" as Coupon["type"], value: "", minCartValue: "", expiry: "", usageLimit: "" };

function CouponsInner() {
  const { can } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function load() {
    const res = await api.listCoupons();
    setCoupons(res.data);
  }
  useEffect(() => { load(); }, []);

  async function toggle(id: string) {
    await api.toggleCoupon(id);
    await load();
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setDrawerOpen(true);
  }

  function openEdit(c: Coupon) {
    setEditing(c);
    setForm({ code: c.code, type: c.type, value: String(c.value), minCartValue: String(c.minCartValue), expiry: c.expiry, usageLimit: String(c.usageLimit) });
    setFormError(null);
    setDrawerOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.code.trim() || !form.value || !form.expiry) {
      setFormError("Code, discount value and expiry are required.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.updateCoupon(editing.id, {
          value: Number(form.value), minCartValue: Number(form.minCartValue || 0),
          expiry: form.expiry, usageLimit: Number(form.usageLimit || 0),
        });
      } else {
        await api.createCoupon({
          code: form.code, type: form.type, value: Number(form.value),
          minCartValue: Number(form.minCartValue || 0), expiry: form.expiry, usageLimit: Number(form.usageLimit || 0),
        });
      }
      setDrawerOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save coupon.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await api.deleteCoupon(id);
    setPendingDelete(null);
    await load();
  }

  const columns: Column<Coupon>[] = [
    { key: "code", header: "Code", sortValue: (c) => c.code, render: (c) => <span className="font-mono font-medium text-ink-900">{c.code}</span> },
    { key: "value", header: "Discount", render: (c) => (c.type === "percent" ? `${c.value}% off` : `₹${c.value} flat`) },
    { key: "min", header: "Min cart", align: "right", render: (c) => `₹${c.minCartValue.toLocaleString("en-IN")}` },
    { key: "usage", header: "Used", align: "right", sortValue: (c) => c.used, render: (c) => `${c.used} / ${c.usageLimit}` },
    { key: "expiry", header: "Expires", sortValue: (c) => c.expiry, render: (c) => new Date(c.expiry).toLocaleDateString() },
    {
      key: "status", header: "Status",
      render: (c) => (
        can("coupons.write") ? (
          <button onClick={() => toggle(c.id)}><StatusPill status={c.isActive ? "active" : "archived"} /></button>
        ) : <StatusPill status={c.isActive ? "active" : "archived"} />
      ),
    },
    {
      key: "actions", header: "", align: "right",
      render: (c) => can("coupons.write") ? (
        <div className="flex justify-end gap-1">
          <button onClick={() => openEdit(c)} className="rounded-md p-1 hover:bg-ink-100" aria-label="Edit"><Pencil size={13} className="text-ink-500" /></button>
          <button onClick={() => setPendingDelete(c.id)} className="rounded-md p-1 hover:bg-ink-100" aria-label="Delete"><Trash2 size={13} className="text-bad" /></button>
        </div>
      ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Customers"
        title="Coupons"
        description="Discount codes with usage caps and cart minimums."
        actions={can("coupons.write") && <Button variant="primary" onClick={openCreate}><Plus size={15} /> New coupon</Button>}
      />
      <DataTable columns={columns} rows={coupons ?? []} loading={!coupons} pageSize={8} />

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-panel">
            <p className="text-sm text-ink-900">Delete this coupon? This can&apos;t be undone.</p>
            <div className="flex gap-2 mt-4 justify-end">
              <Button size="sm" variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(pendingDelete)}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit coupon" : "New coupon"}>
        <form onSubmit={submit}>
          <Field label="Coupon code">
            <TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="FEST2500" className="font-mono" disabled={!!editing} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={form.type} disabled={!!editing} onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })} className="w-full">
                <option value="percent">Percent off</option>
                <option value="flat">Flat amount</option>
              </Select>
            </Field>
            <Field label={form.type === "percent" ? "Percent (%)" : "Amount (₹)"}>
              <TextInput type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min cart value (₹)"><TextInput type="number" value={form.minCartValue} onChange={(e) => setForm({ ...form, minCartValue: e.target.value })} /></Field>
            <Field label="Usage limit"><TextInput type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></Field>
          </div>
          <Field label="Expiry date"><TextInput type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} /></Field>
          {formError && <p className="text-sm text-bad mb-3">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create coupon"}</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function CouponsPage() {
  return <PermissionGate perm="coupons.view"><CouponsInner /></PermissionGate>;
}
