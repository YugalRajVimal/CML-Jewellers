"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Star, Gem } from "lucide-react";
import * as api from "@/lib/api";
import { Product, Category, Collection } from "@/lib/types";
import { PageHeader, Button, StatusPill, Toolbar, SearchInput, Select, EmptyState } from "@/components/ui";
import { Drawer, Field, TextInput } from "@/components/drawer";
import { DataTable, Column } from "@/components/data-table";
import { PermissionGate } from "@/components/permission-gate";
import { ImageGalleryManager } from "@/components/image-gallery-manager";
import {
  ProductFormFields,
  ProductFormValues,
  buildCreatePayload,
  emptyProductForm,
  normalizeCategories,
  normalizeCollections,
  categoryLabel,
  refId,
  validateProductForm,
} from "@/components/product-form";
import { errorMessage } from "@/lib/http";
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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm());
  // Starter variant fields — optional. Without these a new product has no
  // variant/inventory at all, so the storefront always shows it as out of
  // stock with no way to add to cart (BUG-01).
  const [variantForm, setVariantForm] = useState({
    variantSku: "",
    variantPrice: "",
    variantMrp: "",
    variantInitialStock: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Surfaces errors from row-level actions (status change, featured toggle),
  // which previously failed silently (BUG-02).
  const [listError, setListError] = useState<string | null>(null);

  // Server-side status/category filtering (BUG-02): the backend used to force
  // status=active for the admin list too, so draft/archived products never
  // showed up here no matter what this filter was set to. Now that the
  // backend honors these, fetch a fresh page whenever they change instead of
  // filtering an always-active-only result client-side.
  // A subcategory is a category row with a parent; the filter must send it as `subcategory`.
  const filterIsSub = Boolean(
    categoryId && categories.find((c) => getCategoryId(c) === categoryId)?.parentId
  );

  async function load() {
    const [p, c] = await Promise.all([
      api.listProducts({
        limit: 100,
        status: status || undefined,
        // The backend filters on `category` (top-level) or `subcategory` (child), not `categoryId`.
        category: !filterIsSub ? categoryId || undefined : undefined,
        subcategory: filterIsSub ? categoryId : undefined,
      }),
      api.listCategories(),
    ]);
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

    // Categories: accepts c.data.categories or a bare array; ensures `id` on every row.
    setCategories(normalizeCategories(c.data));

    // Collections are only needed for the product form's select; a failure here
    // must not break the product list.
    try {
      const col = await api.listCollections();
      setCollections(normalizeCollections(col.data));
    } catch {
      setCollections([]);
    }
  }

  // Reload from the server whenever the status/category filter changes —
  // these are now applied server-side (BUG-02). Search (`q`) stays a
  // client-side narrowing of the current page, same as before.
  useEffect(() => { load(); }, [status, categoryId]);

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
      return true;
    });
  }, [products, q]);

  // Update product status — rolls back the optimistic change if the request fails.
  async function setStatusFor(productId: string, s: Product["status"]) {
    const previous = products;
    setListError(null);
    setProducts((prev) =>
      Array.isArray(prev)
        ? prev.map((p) =>
            getProductId(p) === productId
              ? { ...p, status: s }
              : p
          )
        : prev
    );
    try {
      await api.updateProductStatus(productId, s);
    } catch (e) {
      setProducts(previous);
      setListError(e instanceof Error ? e.message : "Could not update product status.");
    }
  }

  // Toggle product featured — rolls back the optimistic change if the request fails.
  async function toggleFeatured(productId: string) {
    const previous = products;
    setListError(null);
    setProducts((prev) =>
      Array.isArray(prev)
        ? prev.map((p) =>
            getProductId(p) === productId
              ? { ...p, isFeatured: !p.isFeatured }
              : p
          )
        : prev
    );
    try {
      await api.toggleFeatured(productId);
    } catch (e) {
      setProducts(previous);
      setListError(e instanceof Error ? e.message : "Could not update featured status.");
    }
  }

  function resetCreateForm() {
    setForm(emptyProductForm());
    setVariantForm({ variantSku: "", variantPrice: "", variantMrp: "", variantInitialStock: "" });
    setImages([]);
    setFormError(null);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    resetCreateForm();
  }

  // New product form submission
  async function submitNewProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const invalid = validateProductForm(form, "create");
    if (invalid) {
      setFormError(invalid);
      return;
    }
    // The starter variant is optional, but if any of its fields were filled
    // in, require enough to actually create it (BUG-01).
    const hasVariantInput = Boolean(
      variantForm.variantSku.trim() || variantForm.variantPrice || variantForm.variantMrp || variantForm.variantInitialStock
    );
    if (hasVariantInput && (!variantForm.variantSku.trim() || !variantForm.variantPrice)) {
      setFormError("Starter variant needs at least a SKU and a price.");
      return;
    }
    setSaving(true);
    try {
      await api.createProduct({
        ...buildCreatePayload(form),
        images,
        variant: hasVariantInput
          ? {
              sku: variantForm.variantSku.trim(),
              price: Number(variantForm.variantPrice),
              mrp: Number(variantForm.variantMrp || variantForm.variantPrice),
              initialStock: variantForm.variantInitialStock ? Number(variantForm.variantInitialStock) : undefined,
            }
          : undefined,
      });
      closeDrawer();
      await load();
    } catch (e) {
      // Shows the backend's per-field validation messages, not just "Validation failed".
      setFormError(errorMessage(e, "Could not create product."));
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
      // Shows "Parent › Child" when the product has a subcategory, else the category name.
      render: (p) => {
        const subId = refId(p.subcategoryId);
        const label = categoryLabel(subId || refId(p.categoryId), categories);
        return label || "—";
      },
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
          {[...categories]
            .sort((a, b) => categoryLabel(getCategoryId(a), categories).localeCompare(categoryLabel(getCategoryId(b), categories)))
            .map((c) => (
              <option key={getCategoryId(c)} value={getCategoryId(c)}>
                {categoryLabel(getCategoryId(c), categories) || c.name}
              </option>
            ))}
        </Select>
      </Toolbar>
      {listError && <p className="mb-3 text-sm text-bad">{listError}</p>}
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
        onClose={closeDrawer}
        title="New product"
        description="Creates the base product with a single starter variant. Add sizing/variant detail from the product page after."
      >
        <form onSubmit={submitNewProduct}>
          <div className="mb-4">
            <ImageGalleryManager value={images} onChange={setImages} folder="products" label="Product images" />
          </div>

          <ProductFormFields
            values={form}
            onChange={setForm}
            categories={categories}
            collections={collections}
            mode="create"
          />

          <div className="mt-2 border-t border-line pt-4">
            <p className="text-sm font-medium text-ink-900 mb-1">Starter variant (optional)</p>
            <p className="text-xs text-ink-500 mb-3">
              Without a variant this product has no stock and can&apos;t be added to cart. You can also add one later from the product page.
            </p>
            <Field label="Variant SKU">
              <TextInput
                value={variantForm.variantSku}
                onChange={(e) => setVariantForm({ ...variantForm, variantSku: e.target.value })}
                placeholder="CML-NK-1099-STD"
                className="font-mono"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Variant price (₹)">
                <TextInput
                  type="number"
                  value={variantForm.variantPrice}
                  onChange={(e) => setVariantForm({ ...variantForm, variantPrice: e.target.value })}
                />
              </Field>
              <Field label="Variant MRP (₹)" hint="Defaults to variant price">
                <TextInput
                  type="number"
                  value={variantForm.variantMrp}
                  onChange={(e) => setVariantForm({ ...variantForm, variantMrp: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Initial stock" hint="Leave blank for 0">
              <TextInput
                type="number"
                value={variantForm.variantInitialStock}
                onChange={(e) => setVariantForm({ ...variantForm, variantInitialStock: e.target.value })}
              />
            </Field>
          </div>

          {formError && <p className="text-sm text-bad mb-3 whitespace-pre-line">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeDrawer}>
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