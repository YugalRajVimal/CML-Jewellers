"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Star, Gem } from "lucide-react";
import * as api from "@/lib/api";
import { Product, Category } from "@/lib/types";
import { PageHeader, Button, StatusPill, Toolbar, SearchInput, Select, EmptyState } from "@/components/ui";
import { Drawer, Field, TextInput } from "@/components/drawer";
import { DataTable, Column } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function ProductsInner() {
  const { can } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", categoryId: "", basePrice: "", mrp: "", status: "draft" as Product["status"] });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [p, c] = await Promise.all([api.listProducts({ limit: 100 }), api.listCategories()]);
    setProducts(p.data);
    setCategories(c.data);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.sku.toLowerCase().includes(q.toLowerCase())) return false;
      if (status && p.status !== status) return false;
      if (categoryId && p.categoryId !== categoryId) return false;
      return true;
    });
  }, [products, q, status, categoryId]);

  async function setStatusFor(id: string, s: Product["status"]) {
    setProducts((prev) => prev!.map((p) => (p.id === id ? { ...p, status: s } : p)));
    await api.updateProductStatus(id, s);
  }

  async function toggleFeatured(id: string) {
    setProducts((prev) => prev!.map((p) => (p.id === id ? { ...p, isFeatured: !p.isFeatured } : p)));
    await api.toggleFeatured(id);
  }

  async function submitNewProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim() || !form.sku.trim() || !form.categoryId || !form.basePrice) {
      setFormError("Name, SKU, category and price are required.");
      return;
    }
    setSaving(true);
    try {
      await api.createProduct({
        name: form.name.trim(), sku: form.sku.trim(), categoryId: form.categoryId,
        basePrice: Number(form.basePrice), mrp: Number(form.mrp || form.basePrice), status: form.status,
      });
      setDrawerOpen(false);
      setForm({ name: "", sku: "", categoryId: "", basePrice: "", mrp: "", status: "draft" });
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not create product.");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Product>[] = [
    {
      key: "name", header: "Product", sortValue: (p) => p.name,
      render: (p) => (
        <Link href={`/products/${p.id}`} className="flex items-center gap-3 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-100 text-maroon-700 shrink-0">
            <Gem size={15} />
          </span>
          <span>
            <span className="block font-medium text-ink-900 group-hover:text-maroon-700">{p.name}</span>
            <span className="block text-xs text-ink-500 font-mono">{p.sku}</span>
          </span>
        </Link>
      ),
    },
    {
      key: "category", header: "Category",
      render: (p) => categories.find((c) => c.id === p.categoryId)?.name ?? "—",
    },
    {
      key: "price", header: "Price", align: "right", sortValue: (p) => p.basePrice,
      render: (p) => <span className="font-mono text-xs">{formatINR(p.basePrice)}</span>,
    },
    {
      key: "stock", header: "Stock", align: "right", sortValue: (p) => p.variants.reduce((s, v) => s + v.available, 0),
      render: (p) => {
        const total = p.variants.reduce((s, v) => s + v.available, 0);
        return <span className={total === 0 ? "text-bad font-medium" : "text-ink-700"}>{total} units</span>;
      },
    },
    {
      key: "status", header: "Status",
      render: (p) => (
        can("products.write") ? (
          <Select value={p.status} onChange={(e) => setStatusFor(p.id, e.target.value as Product["status"])} className="py-1 text-xs">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
        ) : <StatusPill status={p.status} />
      ),
    },
    {
      key: "featured", header: "Featured", align: "right",
      render: (p) => (
        <button onClick={() => can("products.write") && toggleFeatured(p.id)} className="inline-flex" aria-label="Toggle featured">
          <Star size={16} className={p.isFeatured ? "fill-gold-500 text-gold-500" : "text-ink-300"} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage variants, pricing, categories and publish status. Changes reflect on the customer site immediately."
        actions={can("products.write") && (
          <Button variant="primary" onClick={() => setDrawerOpen(true)}><Plus size={15} /> New product</Button>
        )}
      />
      <Toolbar>
        <SearchInput placeholder="Search name or SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </Select>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Toolbar>

      {products && filtered.length === 0 ? (
        <EmptyState icon={Gem} title="No products match your filters" description="Try clearing search or filters." />
      ) : (
        <DataTable columns={columns} rows={filtered} loading={!products} pageSize={8} />
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New product"
        description="Creates the base product with a single starter variant. Add sizing/variant detail from the product page after."
      >
        <form onSubmit={submitNewProduct}>
          <Field label="Product name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ira Gold Chain" /></Field>
          <Field label="SKU"><TextInput value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="CML-NK-1099" className="font-mono" /></Field>
          <Field label="Category">
            <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full">
              <option value="">Select a category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Base price (₹)"><TextInput type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></Field>
            <Field label="MRP (₹)" hint="Defaults to base price"><TextInput type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} /></Field>
          </div>
          <Field label="Initial status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Product["status"] })} className="w-full">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </Select>
          </Field>
          {formError && <p className="text-sm text-bad mb-3">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? "Creating…" : "Create product"}</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function ProductsPage() {
  return <PermissionGate perm="products.view"><ProductsInner /></PermissionGate>;
}
