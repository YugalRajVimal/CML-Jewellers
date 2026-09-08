"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Gem, Pencil, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import { Product, Category } from "@/lib/types";
import { Panel, PageHeader, StatusPill, Button, Skeleton, Select } from "@/components/ui";
import { Drawer, Field, TextInput } from "@/components/drawer";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function ProductDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", categoryId: "", basePrice: "", mrp: "", status: "draft" as Product["status"] });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function load() {
    try {
      const res = await api.getProduct(id);
      setProduct(res.data);
      const cats = await api.listCategories();
      setCategories(cats.data);
      setForm({
        name: res.data.name, categoryId: res.data.categoryId,
        basePrice: String(res.data.basePrice), mrp: String(res.data.mrp), status: res.data.status,
      });
    } catch {
      setNotFound(true);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.categoryId || !form.basePrice) {
      setFormError("Name, category and price are required.");
      return;
    }
    setSaving(true);
    try {
      await api.updateProduct(id, {
        name: form.name.trim(), categoryId: form.categoryId,
        basePrice: Number(form.basePrice), mrp: Number(form.mrp || form.basePrice), status: form.status,
      });
      setEditOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not update product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteProduct(id);
      router.push("/products");
    } finally {
      setDeleting(false);
    }
  }

  const category = categories.find((c) => c.id === product?.categoryId) ?? null;

  if (notFound) {
    return (
      <Panel className="p-10 text-center">
        <p className="font-display text-xl text-ink-950">Product not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/products")}>Back to products</Button>
      </Panel>
    );
  }

  if (!product) {
    return <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div>
      <button onClick={() => router.push("/products")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft size={14} /> Back to products
      </button>
      <PageHeader
        eyebrow={category?.name ?? "Uncategorised"}
        title={product.name}
        description={product.sku}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={product.status} />
            {can("products.write") && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}><Pencil size={13} /> Edit</Button>
                <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Delete</Button>
              </>
            )}
          </div>
        }
      />

      {confirmDelete && (
        <Panel className="p-4 mb-4 border-bad/40 bg-bad/5">
          <p className="text-sm text-ink-900">Delete <strong>{product.name}</strong>? This can&apos;t be undone.</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Yes, delete"}</Button>
            <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          </div>
        </Panel>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2 p-5">
          <p className="text-sm font-medium text-ink-900 mb-3">Variants</p>
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead className="bg-ink-100/40 text-xs text-ink-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">SKU</th>
                  <th className="text-left px-3 py-2 font-medium">Attribute</th>
                  <th className="text-right px-3 py-2 font-medium">Price</th>
                  <th className="text-right px-3 py-2 font-medium">MRP</th>
                  <th className="text-right px-3 py-2 font-medium">Available</th>
                  <th className="text-right px-3 py-2 font-medium">Reserved</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((v) => (
                  <tr key={v.id} className="border-t border-line">
                    <td className="px-3 py-2.5 font-mono text-xs">{v.sku}</td>
                    <td className="px-3 py-2.5">{Object.values(v.attributes).join(", ")}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">{formatINR(v.price)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs text-ink-500">{formatINR(v.mrp)}</td>
                    <td className={`px-3 py-2.5 text-right font-medium ${v.available === 0 ? "text-bad" : ""}`}>{v.available}</td>
                    <td className="px-3 py-2.5 text-right text-ink-500">{v.reserved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-ink-300">Manage stock levels for these variants from Inventory.</p>

          <p className="text-sm font-medium text-ink-900 mt-6 mb-3">Attributes</p>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {Object.entries(product.attributes).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-line px-3 py-2">
                <dt className="text-xs text-ink-500 capitalize">{k}</dt>
                <dd className="text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel className="p-5 flex flex-col items-center text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-gold-100 text-maroon-700 mb-4">
            <Gem size={36} />
          </div>
          <p className="text-xs text-ink-500 mb-1">No image uploaded</p>
          <p className="text-xs text-ink-300">Product photography syncs via the MediaService (Cloudinary) once added.</p>
          <div className="w-full mt-6 space-y-2 text-sm text-left">
            <div className="flex justify-between"><span className="text-ink-500">Base price</span><span className="font-mono">{formatINR(product.basePrice)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">MRP</span><span className="font-mono text-ink-500">{formatINR(product.mrp)}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Rating</span><span>{product.ratingAvg || "—"}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Featured</span><span>{product.isFeatured ? "Yes" : "No"}</span></div>
          </div>
        </Panel>
      </div>

      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="Edit product" description={product.sku}>
        <form onSubmit={submitEdit}>
          <Field label="Product name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Category">
            <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Base price (₹)"><TextInput type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></Field>
            <Field label="MRP (₹)"><TextInput type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} /></Field>
          </div>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Product["status"] })} className="w-full">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          {formError && <p className="text-sm text-bad mb-3">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function ProductDetailPage() {
  return <PermissionGate perm="products.view"><ProductDetailInner /></PermissionGate>;
}
