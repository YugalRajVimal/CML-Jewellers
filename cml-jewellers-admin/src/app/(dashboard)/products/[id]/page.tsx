
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Gem, Pencil, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import { Product, Category } from "@/lib/types";
import { Panel, PageHeader, StatusPill, Button, Skeleton, Select } from "@/components/ui";
import { Drawer, Field, TextInput } from "@/components/drawer";
import { PermissionGate } from "@/components/permission-gate";
import { ImageUploader } from "@/components/image-uploader";
import { useAuth } from "@/lib/auth";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

/**
 * Utility to create a more unique key for variants that may not have a unique 'id'.
 * Combines id, SKU, and all attribute values for uniqueness.
 **/
function getVariantKey(variant: any, idx: number) {
  // Prefer a present id, fallback to: sku + attrs, fallback to index
  let attrString = "";
  if (variant.attributes && typeof variant.attributes === "object") {
    attrString = Object.values(variant.attributes).join(",");
  }
  return (
    (variant._id && String(variant._id)) ||
    (variant.id && String(variant.id)) ||
    (variant.sku ? `${variant.sku}|${attrString}` : undefined) ||
    `variant-${idx}`
  );
}

// The API now returns {product, variants}
function ProductDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", categoryId: "", basePrice: "", mrp: "", status: "draft" as Product["status"] });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function load() {
    try {
      const res = await api.getProduct(id); // expects { product, variants }
      if (res.data && res.data.product) {
        setProduct(res.data.product);
        setVariants(Array.isArray(res.data.variants) ? res.data.variants : []);
        const cats = await api.listCategories();

        // SET categories CORRECTLY from new API shape:
        // {success: true, message: "...", data: {categories: Category[]}}
        if (
          cats &&
          cats.data &&
          typeof cats.data === "object" &&
          Array.isArray(cats.data.categories)
        ) {
          setCategories(cats.data.categories);
        } else {
          setCategories([]);
        }

        setForm({
          name: res.data.product.name,
          categoryId: res.data.product.categoryId,
          basePrice: String(res.data.product.basePrice),
          mrp: String(res.data.product.mrp),
          status: res.data.product.status,
        });
        setImageUrl(
          Array.isArray(res.data.product.images) && res.data.product.images.length > 0
            ? res.data.product.images[0]
            : null
        );
      } else {
        setNotFound(true);
      }
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
        name: form.name.trim(),
        categoryId: form.categoryId,
        basePrice: Number(form.basePrice),
        mrp: Number(form.mrp || form.basePrice),
        status: form.status,
        images: imageUrl ? [imageUrl] : [],
      });
      setEditOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not update product.");
    } finally {
      setSaving(false);
    }
  }

  function closeEdit() {
    setEditOpen(false);
    // Discard any uploaded-but-unsaved image so the display panel doesn't
    // show a Cloudinary upload that was never actually saved to the product.
    setImageUrl(
      Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : null
    );
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

  // Defensive: categories is always [] or array, so .find is safe
  const category = Array.isArray(categories)
    ? categories.find((c: any) =>
        // Support both old types (`id`) and new (`_id`) for compatibility
        (c.id === (product?.categoryId ?? product?.category_id)) ||
        (c._id === (product?.categoryId ?? product?.category_id)) // New API likely returns _id
      ) ?? null
    : null;

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

  // Reflects imageUrl (live edit state) once loaded, so a fresh upload shows
  // immediately without waiting for a full reload from the backend.
  const productImageUrl = imageUrl ?? null;

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
            {can("product:write") && (
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
                  <th className="text-left px-3 py-2 font-medium">Attribute(s)</th>
                  <th className="text-right px-3 py-2 font-medium">Price</th>
                  <th className="text-right px-3 py-2 font-medium">MRP</th>
                  {/* Stock fields only if present in variant */}
                  {/* <th className="text-right px-3 py-2 font-medium">Available</th>
                  <th className="text-right px-3 py-2 font-medium">Reserved</th> */}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(variants) && variants.map((v, vIdx) => (
                  <tr key={getVariantKey(v, vIdx)} className="border-t border-line">
                    <td className="px-3 py-2.5 font-mono text-xs">{v.sku}</td>
                    <td className="px-3 py-2.5">{v.attributes ? Object.values(v.attributes).join(", ") : ""}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">{formatINR(v.price)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs text-ink-500">{formatINR(v.mrp)}</td>
                    {/* Show available/reserved only if present */}
                    {/* v.available/v.reserved */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-ink-300">Manage stock levels for these variants from Inventory.</p>

          <p className="text-sm font-medium text-ink-900 mt-6 mb-3">Attributes</p>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {product.attributes &&
              Object.entries(product.attributes)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line px-3 py-2">
                    <dt className="text-xs text-ink-500 capitalize">{k}</dt>
                    <dd className="text-ink-900">{v}</dd>
                  </div>
                ))}
          </dl>
          {product.description && (
            <div className="mt-6">
              <p className="text-sm font-medium text-ink-900 mb-2">Description</p>
              <p className="text-sm text-ink-700">{product.description}</p>
            </div>
          )}
        </Panel>

        <Panel className="p-5 flex flex-col items-center text-center">
          {/* Image, or Fallback Icon if no image */}
          <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-gold-100 text-maroon-700 mb-4 overflow-hidden">
            {productImageUrl ? (
              <img
                src={productImageUrl}
                alt={product.name}
                className="object-cover h-full w-full"
              />
            ) : (
              <Gem size={36} />
            )}
          </div>
          <p className="text-xs text-ink-500 mb-1">
            {productImageUrl ? (
              <span>1 image uploaded</span>
            ) : (
              "No image uploaded"
            )}
          </p>
          {can("product:write") && (
            <Button size="sm" variant="secondary" className="mb-2" onClick={() => setEditOpen(true)}>
              <Pencil size={12} /> {productImageUrl ? "Change image" : "Add image"}
            </Button>
          )}
          <div className="w-full mt-6 space-y-2 text-sm text-left">
            <div className="flex justify-between">
              <span className="text-ink-500">Base price</span>
              <span className="font-mono">{formatINR(product.basePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">MRP</span>
              <span className="font-mono text-ink-500">{formatINR(product.mrp)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Rating</span>
              <span>{product.ratingAvg || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Featured</span>
              <span>{product.isFeatured ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">New Arrival</span>
              <span>{product.isNewArrival ? "Yes" : "No"}</span>
            </div>
          </div>
        </Panel>
      </div>

      <Drawer open={editOpen} onClose={closeEdit} title="Edit product" description={product.sku}>
        <form onSubmit={submitEdit}>
          <div className="mb-4">
            <ImageUploader value={imageUrl} onChange={setImageUrl} folder="products" label="Product image" />
          </div>
          <Field label="Product name">
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Category">
            <Select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full"
            >
              {Array.isArray(categories) && categories.map((c: any) => (
                <option
                  key={c._id ?? c.id}
                  value={c._id ?? c.id}
                >
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
            <Field label="MRP (₹)">
              <TextInput
                type="number"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Product["status"] })}
              className="w-full"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          {formError && <p className="text-sm text-bad mb-3">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeEdit}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <PermissionGate perm="product:read">
      <ProductDetailInner />
    </PermissionGate>
  );
}
