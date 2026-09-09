
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
import { ImageUploader } from "@/components/image-uploader";
import { useAuth } from "@/lib/auth";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

// Helper to normalize product id
function getProductId(product: any) {
  // prefer id, fallback to _id
  return (product.id || product._id || "");
}

// For stock, if variants don't exist, use .totalAvailable
function getAvailableStock(product: any) {
  if ("variants" in product && Array.isArray(product.variants)) {
    return product.variants.reduce(
      (sum: number, v: any) => sum + (typeof v.available === "number" ? v.available : 0),
      0
    );
  }
  if (typeof product.totalAvailable === "number") return product.totalAvailable;
  return 0;
}

function getCategoryId(category: any) {
  // prefer id, fallback to _id
  return category.id || category._id || "";
}

function ProductsInner() {
  const { can } = useAuth();
  const [products, setProducts] = useState<any[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    basePrice: "",
    mrp: "",
    status: "draft" as Product["status"]
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Updated load method to handle both { products: [...] } and direct array
  async function load() {
    const [p, c] = await Promise.all([api.listProducts({ limit: 100 }), api.listCategories()]);
    let loadedProducts: any[] = [];
    if (Array.isArray(p.data)) {
      loadedProducts = p.data;
    } else if (
      p.data &&
      typeof p.data === "object" &&
      p.data !== null &&
      "products" in p.data &&
      Array.isArray((p.data as any).products)
    ) {
      loadedProducts = (p.data as { products: any[] }).products;
    }
    // Accommodate both id/_id
    setProducts(loadedProducts);

    // ---- Handle categories: look for c.data.categories or fallback to c.data ----
    let categoryArr: any[] = [];
    if (
      c &&
      typeof c.data === "object" &&
      c.data !== null &&
      "categories" in c.data &&
      Array.isArray((c.data as any).categories)
    ) {
      categoryArr = (c.data as any).categories;
    } else if (Array.isArray(c.data)) {
      categoryArr = c.data;
    }
    // Map all categories to have an `id` property, falling back to `_id` if needed.
    const normalizedCategories = categoryArr.map((cat: any) => ({
      ...cat,
      id: cat.id || cat._id,
    }));

    setCategories(normalizedCategories);
  }

  useEffect(() => { load(); }, []);

  // Search, filter, and normalize
  const filtered = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((raw) => {
      const name = (raw.name ?? "") as string;
      const sku = (raw.sku ?? "") as string;
      if (
        q &&
        !name.toLowerCase().includes(q.toLowerCase()) &&
        !sku.toLowerCase().includes(q.toLowerCase())
      )
        return false;
      if (status && (raw.status !== status)) return false;
      if (categoryId && raw.categoryId !== categoryId) return false;
      return true;
    });
  }, [products, q, status, categoryId]);

  // Update product status
  async function setStatusFor(productId: string, s: Product["status"]) {
    setProducts((prev) =>
      Array.isArray(prev)
        ? prev.map((p) =>
            getProductId(p) === productId
              ? { ...p, status: s }
              : p
          )
        : prev
    );
    await api.updateProductStatus(productId, s);
  }

  // Toggle product featured
  async function toggleFeatured(productId: string) {
    setProducts((prev) =>
      Array.isArray(prev)
        ? prev.map((p) =>
            getProductId(p) === productId
              ? { ...p, isFeatured: !p.isFeatured }
              : p
          )
        : prev
    );
    await api.toggleFeatured(productId);
  }

  // New product form submission
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
        name: form.name.trim(),
        sku: form.sku.trim(),
        categoryId: form.categoryId,
        basePrice: Number(form.basePrice),
        mrp: Number(form.mrp || form.basePrice),
        status: form.status,
        images: imageUrl ? [imageUrl] : [],
      });
      setDrawerOpen(false);
      setForm({
        name: "",
        sku: "",
        categoryId: "",
        basePrice: "",
        mrp: "",
        status: "draft"
      });
      setImageUrl(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not create product.");
    } finally {
      setSaving(false);
    }
  }

  // Columns
  const columns: Column<any>[] = [
    {
      key: "image",
      header: "",
      render: (p) =>
        Array.isArray(p.images) && p.images.length > 0 ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-100 shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.images[0]} alt={p.name} className="object-cover h-9 w-9" />
          </div>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-100 text-maroon-700 shrink-0">
            <Gem size={15} />
          </span>
        ),
    },
    {
      key: "name",
      header: "Product",
      sortValue: (p) => p.name,
      render: (p) => (
        <Link href={`/products/${getProductId(p)}`} className="flex flex-col gap-0.5 group min-w-0">
          <span className="font-medium text-ink-900 group-hover:text-maroon-700 truncate">{p.name}</span>
          <span className="text-xs text-ink-500 font-mono truncate">{p.sku}</span>
        </Link>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (p) =>
        categories.find((c) => getCategoryId(c) === p.categoryId)?.name ?? "—",
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      sortValue: (p) => p.basePrice,
      render: (p) => (
        <div className="flex flex-col text-right min-w-[80px]">
          <span className="font-mono text-xs">{formatINR(p.basePrice)}</span>
          {p.mrp && p.mrp > p.basePrice ? (
            <span className="text-xs text-ink-400 font-mono line-through">{formatINR(p.mrp)}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      align: "right",
      sortValue: getAvailableStock,
      render: (p) => {
        const total = getAvailableStock(p);
        return (
          <span className={total === 0 ? "text-bad font-medium" : "text-ink-700"}>
            {total} units
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (p) =>
        can("product:write") ? (
          <Select
            value={p.status}
            onChange={(e) => setStatusFor(getProductId(p), e.target.value as Product["status"])}
            className="py-1 text-xs"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
        ) : (
          <StatusPill status={p.status} />
        ),
    },
    {
      key: "featured",
      header: "Featured",
      align: "right",
      render: (p) => (
        <button
          onClick={() => can("product:write") && toggleFeatured(getProductId(p))}
          className="inline-flex"
          aria-label="Toggle featured"
        >
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
        description="Manage base details, pricing, and categories. Changes reflect on the customer site immediately."
        actions={
          can("product:write") && (
            <Button variant="primary" onClick={() => setDrawerOpen(true)}>
              <Plus size={15} /> New product
            </Button>
          )
        }
      />
      <Toolbar>
        <SearchInput
          placeholder="Search name or SKU…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </Select>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={getCategoryId(c)} value={getCategoryId(c)}>
              {c.name}
            </option>
          ))}
        </Select>
      </Toolbar>
      {Array.isArray(products) && filtered.length === 0 ? (
        <EmptyState
          icon={Gem}
          title="No products match your filters"
          description="Try clearing search or filters."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          loading={!Array.isArray(products)}
          pageSize={8}
        />
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setImageUrl(null); }}
        title="New product"
        description="Creates the base product with a single starter variant. Add sizing/variant detail from the product page after."
      >
        <form onSubmit={submitNewProduct}>
          <div className="mb-4">
            <ImageUploader value={imageUrl} onChange={setImageUrl} folder="products" label="Product image" />
          </div>
          <Field label="Product name">
            <TextInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ira Gold Chain"
            />
          </Field>
          <Field label="SKU">
            <TextInput
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="CML-NK-1099"
              className="font-mono"
            />
          </Field>
          <Field label="Category">
            <Select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full"
            >
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={getCategoryId(c)} value={getCategoryId(c)}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Base price (₹)">
              <TextInput
                type="number"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              />
            </Field>
            <Field label="MRP (₹)" hint="Defaults to base price">
              <TextInput
                type="number"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Initial status">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Product["status"] })}
              className="w-full"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </Select>
          </Field>
          {formError && <p className="text-sm text-bad mb-3">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setDrawerOpen(false); setImageUrl(null); }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Creating…" : "Create product"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <PermissionGate perm="product:read">
      <ProductsInner />
    </PermissionGate>
  );
}
