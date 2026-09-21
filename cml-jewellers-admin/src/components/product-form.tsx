"use client";

import { Field, TextArea, TextInput } from "@/components/drawer";
import { Select } from "@/components/ui";
import type { NewProductInput, ProductAttributesInput, ProductPatch } from "@/lib/api";
import type { Category, Collection, Product, ProductAttributes, ProductGender } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared form model for the "New product" and "Edit product" drawers (PC-01).
// Images and the starter variant are handled by the pages, not here.
// ---------------------------------------------------------------------------

export const DESCRIPTION_MAX = 5000;
export const GENDERS: ProductGender[] = ["men", "women", "unisex", "kids"];

type TextAttributeKey = Exclude<keyof ProductAttributes, "gender">;

const TEXT_ATTRIBUTES: { key: TextAttributeKey; label: string; placeholder: string }[] = [
  { key: "material", label: "Material", placeholder: "e.g. Gold" },
  { key: "metal", label: "Metal", placeholder: "e.g. Yellow Gold" },
  { key: "purity", label: "Purity", placeholder: "e.g. 22K" },
  { key: "stone", label: "Stone", placeholder: "e.g. Diamond" },
  { key: "occasion", label: "Occasion", placeholder: "e.g. Wedding" },
  { key: "jewelryType", label: "Jewellery type", placeholder: "e.g. Ring" },
];

const ATTRIBUTE_KEYS: (keyof ProductAttributes)[] = [...TEXT_ATTRIBUTES.map((a) => a.key), "gender"];

export interface ProductFormValues {
  name: string;
  sku: string;
  slug: string;
  categoryId: string;
  subcategoryId: string;
  collectionId: string;
  description: string;
  basePrice: string;
  mrp: string;
  status: Product["status"];
  isFeatured: boolean;
  isNewArrival: boolean;
  // Every key is always present; "" means "not set".
  attributes: Record<keyof ProductAttributes, string>;
}

export function emptyProductForm(): ProductFormValues {
  return {
    name: "",
    sku: "",
    slug: "",
    categoryId: "",
    subcategoryId: "",
    collectionId: "",
    description: "",
    basePrice: "",
    mrp: "",
    status: "draft",
    isFeatured: false,
    isNewArrival: false,
    attributes: {
      material: "",
      metal: "",
      purity: "",
      stone: "",
      gender: "",
      occasion: "",
      jewelryType: "",
    },
  };
}

// A reference may arrive as a plain id, or as a populated `{ _id | id }` object.
export function refId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const v = value as { _id?: unknown; id?: unknown };
    return String(v._id ?? v.id ?? "");
  }
  return "";
}

/** Pre-fills the form from a loaded product. */
export function productToForm(product: Product): ProductFormValues {
  const form = emptyProductForm();
  const attrs = (product.attributes ?? {}) as ProductAttributes;
  for (const key of ATTRIBUTE_KEYS) form.attributes[key] = (attrs[key] ?? "").trim();
  return {
    ...form,
    name: product.name ?? "",
    sku: product.sku ?? "",
    slug: product.slug ?? "",
    categoryId: refId(product.categoryId),
    subcategoryId: refId(product.subcategoryId),
    collectionId: refId(product.collectionId),
    description: (product.description ?? "").trim(),
    basePrice: product.basePrice != null ? String(product.basePrice) : "",
    mrp: product.mrp != null ? String(product.mrp) : "",
    status: product.status ?? "draft",
    isFeatured: Boolean(product.isFeatured),
    isNewArrival: Boolean(product.isNewArrival),
  };
}

// ---------------------------------------------------------------------------
// Reference data helpers
// ---------------------------------------------------------------------------

/** Accepts `{ categories: [...] }`, a bare array, or anything else; guarantees an `id` on each row. */
export function normalizeCategories(raw: unknown): Category[] {
  const arr: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { categories?: unknown }).categories)
      ? ((raw as { categories: unknown[] }).categories)
      : [];
  return arr.map((c) => {
    const cat = c as Record<string, unknown>;
    return { ...cat, id: String(cat.id ?? cat._id ?? ""), parentId: refId(cat.parentId) || null } as unknown as Category;
  });
}

export function normalizeCollections(raw: unknown): Collection[] {
  const arr: unknown[] =
    raw && typeof raw === "object" && Array.isArray((raw as { collections?: unknown }).collections)
      ? (raw as { collections: unknown[] }).collections
      : Array.isArray(raw)
        ? raw
        : [];
  return arr.map((c) => {
    const col = c as Record<string, unknown>;
    return { ...col, id: String(col.id ?? col._id ?? "") } as unknown as Collection;
  });
}

/** "Parent › Child" for a subcategory, plain name for a top-level category. */
export function categoryLabel(id: string, categories: Category[]): string {
  const cat = categories.find((c) => c.id === id);
  if (!cat) return "";
  const parent = cat.parentId ? categories.find((c) => c.id === cat.parentId) : undefined;
  return parent ? `${parent.name} › ${cat.name}` : cat.name;
}

// ---------------------------------------------------------------------------
// Validation and payload builders
// ---------------------------------------------------------------------------

/** Client-side checks mirroring the backend. Returns a message, or null when OK. */
export function validateProductForm(values: ProductFormValues, mode: "create" | "edit"): string | null {
  const missingSku = mode === "create" && !values.sku.trim();
  if (!values.name.trim() || missingSku || !values.categoryId || values.basePrice === "") {
    return mode === "create"
      ? "Name, SKU, category and price are required."
      : "Name, category and price are required.";
  }
  if (!values.sku.trim()) return "SKU can't be empty.";
  if (mode === "edit" && !values.slug.trim()) return "Slug can't be empty.";

  const base = Number(values.basePrice);
  const mrp = values.mrp === "" ? base : Number(values.mrp);
  if (Number.isNaN(base) || Number.isNaN(mrp) || base < 0 || mrp < 0) return "Prices must be positive numbers.";
  if (mrp < base) return "MRP cannot be lower than the base price.";
  if (values.description.length > DESCRIPTION_MAX) {
    return `Description can be at most ${DESCRIPTION_MAX} characters.`;
  }
  return null;
}

function isGender(value: string): value is ProductGender {
  return (GENDERS as string[]).includes(value);
}

function attributesInput(
  attributes: Record<keyof ProductAttributes, string>,
  keys: (keyof ProductAttributes)[]
): ProductAttributesInput {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = attributes[key].trim();
    if (key === "gender" && value !== "" && !isGender(value)) continue;
    out[key] = value;
  }
  return out as ProductAttributesInput;
}

/** Body for POST /admin/products (without images / starter variant — the page adds those). */
export function buildCreatePayload(values: ProductFormValues): Omit<NewProductInput, "images" | "variant"> {
  const base = Number(values.basePrice);
  const filled = ATTRIBUTE_KEYS.filter((k) => values.attributes[k].trim() !== "");
  return {
    name: values.name.trim(),
    sku: values.sku.trim(),
    ...(values.slug.trim() ? { slug: values.slug.trim() } : {}),
    categoryId: values.categoryId,
    ...(values.subcategoryId ? { subcategoryId: values.subcategoryId } : {}),
    ...(values.collectionId ? { collectionId: values.collectionId } : {}),
    ...(values.description.trim() ? { description: values.description.trim() } : {}),
    basePrice: base,
    mrp: values.mrp === "" ? base : Number(values.mrp),
    status: values.status,
    isFeatured: values.isFeatured,
    isNewArrival: values.isNewArrival,
    ...(filled.length > 0 ? { attributes: attributesInput(values.attributes, filled) } : {}),
  };
}

/**
 * Body for PATCH /admin/products/:id containing ONLY the fields that differ from
 * `original`. Cleared text fields are sent as "" (the backend unsets them).
 * Images are not handled here — see the detail page.
 */
export function buildUpdatePatch(original: ProductFormValues, current: ProductFormValues): ProductPatch {
  const patch: ProductPatch = {};

  if (current.name.trim() !== original.name.trim()) patch.name = current.name.trim();
  if (current.sku.trim() !== original.sku.trim()) patch.sku = current.sku.trim();
  if (current.slug.trim() !== original.slug.trim()) patch.slug = current.slug.trim();

  if (current.categoryId !== original.categoryId) patch.categoryId = current.categoryId;
  if (current.subcategoryId !== original.subcategoryId) patch.subcategoryId = current.subcategoryId;
  if (current.collectionId !== original.collectionId) patch.collectionId = current.collectionId;

  if (current.description.trim() !== original.description.trim()) patch.description = current.description.trim();

  const currentBase = Number(current.basePrice);
  const currentMrp = current.mrp === "" ? currentBase : Number(current.mrp);
  if (currentBase !== Number(original.basePrice)) patch.basePrice = currentBase;
  if (currentMrp !== Number(original.mrp)) patch.mrp = currentMrp;

  if (current.status !== original.status) patch.status = current.status;
  if (current.isFeatured !== original.isFeatured) patch.isFeatured = current.isFeatured;
  if (current.isNewArrival !== original.isNewArrival) patch.isNewArrival = current.isNewArrival;

  const changed = ATTRIBUTE_KEYS.filter(
    (k) => current.attributes[k].trim() !== original.attributes[k].trim()
  );
  if (changed.length > 0) patch.attributes = attributesInput(current.attributes, changed);

  return patch;
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

export function ProductFormFields({
  values,
  onChange,
  categories,
  collections,
  mode,
}: {
  values: ProductFormValues;
  onChange: (next: ProductFormValues) => void;
  categories: Category[];
  collections: Collection[];
  mode: "create" | "edit";
}) {
  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function setAttribute(key: keyof ProductAttributes, value: string) {
    onChange({ ...values, attributes: { ...values.attributes, [key]: value } });
  }

  function setCategory(categoryId: string) {
    // A subcategory only makes sense under its own parent, so changing the
    // category always resets it.
    onChange({ ...values, categoryId, subcategoryId: "" });
  }

  const topLevel = categories.filter((c) => !c.parentId);
  // A product saved before subcategories were enforced may point at a child as its
  // category; keep that option selectable so the select doesn't silently go blank.
  const currentIsNested = values.categoryId !== "" && !topLevel.some((c) => c.id === values.categoryId);
  const subcategories = categories.filter((c) => c.parentId && c.parentId === values.categoryId);

  return (
    <>
      <Field label="Product name">
        <TextInput
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Ira Gold Chain"
        />
      </Field>
      <Field label="SKU">
        <TextInput
          value={values.sku}
          onChange={(e) => set("sku", e.target.value)}
          placeholder="CML-NK-1099"
          className="font-mono"
        />
      </Field>
      <Field
        label="Slug"
        hint={
          mode === "create"
            ? "Optional — generated from the name if left blank. It becomes the product's URL."
            : "Changing the slug changes the product's URL on the storefront."
        }
      >
        <TextInput
          value={values.slug}
          onChange={(e) => set("slug", e.target.value)}
          placeholder="ira-gold-chain"
          className="font-mono"
        />
      </Field>

      <Field label="Category">
        <Select value={values.categoryId} onChange={(e) => setCategory(e.target.value)} className="w-full">
          <option value="">Select a category…</option>
          {topLevel.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          {currentIsNested && (
            <option value={values.categoryId}>{categoryLabel(values.categoryId, categories) || "Current category"}</option>
          )}
        </Select>
      </Field>
      <Field label="Subcategory" hint={values.categoryId && subcategories.length === 0 ? "This category has no subcategories." : undefined}>
        <Select
          value={values.subcategoryId}
          onChange={(e) => set("subcategoryId", e.target.value)}
          disabled={!values.categoryId || subcategories.length === 0}
          className="w-full"
        >
          <option value="">None</option>
          {subcategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Collection">
        <Select value={values.collectionId} onChange={(e) => set("collectionId", e.target.value)} className="w-full">
          <option value="">None</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.isActive === false ? " (inactive)" : ""}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Base price (₹)">
          <TextInput
            type="number"
            min="0"
            value={values.basePrice}
            onChange={(e) => set("basePrice", e.target.value)}
          />
        </Field>
        <Field label="MRP (₹)" hint="Defaults to base price">
          <TextInput type="number" min="0" value={values.mrp} onChange={(e) => set("mrp", e.target.value)} />
        </Field>
      </div>
      <Field label={mode === "create" ? "Initial status" : "Status"}>
        <Select
          value={values.status}
          onChange={(e) => set("status", e.target.value as Product["status"])}
          className="w-full"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          {mode === "edit" && <option value="archived">Archived</option>}
        </Select>
      </Field>

      <Field
        label="Description"
        hint={`${values.description.length}/${DESCRIPTION_MAX} characters. Line breaks are kept.`}
      >
        <TextArea
          rows={5}
          maxLength={DESCRIPTION_MAX}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Tell customers about this piece…"
        />
      </Field>

      <div className="mt-2 border-t border-line pt-4">
        <p className="text-sm font-medium text-ink-900 mb-3">Attributes</p>
        <div className="grid grid-cols-2 gap-3">
          {TEXT_ATTRIBUTES.map((a) => (
            <Field key={a.key} label={a.label}>
              <TextInput
                value={values.attributes[a.key]}
                onChange={(e) => setAttribute(a.key, e.target.value)}
                placeholder={a.placeholder}
              />
            </Field>
          ))}
          <Field label="Gender">
            <Select
              value={values.attributes.gender}
              onChange={(e) => setAttribute("gender", e.target.value)}
              className="w-full"
            >
              <option value="">Not specified</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {mode === "edit" && (
          <p className="-mt-2 mb-4 text-[11px] text-ink-400">Clear a field to remove that attribute from the product.</p>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-ink-900">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(e) => set("isFeatured", e.target.checked)}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-900">
          <input
            type="checkbox"
            checked={values.isNewArrival}
            onChange={(e) => set("isNewArrival", e.target.checked)}
          />
          New arrival
        </label>
      </div>
    </>
  );
}