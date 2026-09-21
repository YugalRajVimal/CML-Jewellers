
// // "use client";

// // import { useEffect, useState } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import { ArrowLeft, Gem, Pencil, Trash2 } from "lucide-react";
// // import * as api from "@/lib/api";
// // import { Product, Category } from "@/lib/types";
// // import { Panel, PageHeader, StatusPill, Button, Skeleton, Select } from "@/components/ui";
// // import { Drawer, Field, TextInput } from "@/components/drawer";
// // import { PermissionGate } from "@/components/permission-gate";
// // import { ImageUploader } from "@/components/image-uploader";
// // import { useAuth } from "@/lib/auth";

// // function formatINR(n: number) {
// //   return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
// // }

// // /**
// //  * Utility to create a more unique key for variants that may not have a unique 'id'.
// //  * Combines id, SKU, and all attribute values for uniqueness.
// //  **/
// // function getVariantKey(variant: any, idx: number) {
// //   // Prefer a present id, fallback to: sku + attrs, fallback to index
// //   let attrString = "";
// //   if (variant.attributes && typeof variant.attributes === "object") {
// //     attrString = Object.values(variant.attributes).join(",");
// //   }
// //   return (
// //     (variant._id && String(variant._id)) ||
// //     (variant.id && String(variant.id)) ||
// //     (variant.sku ? `${variant.sku}|${attrString}` : undefined) ||
// //     `variant-${idx}`
// //   );
// // }

// // // The API now returns {product, variants}
// // function ProductDetailInner() {
// //   const { id } = useParams<{ id: string }>();
// //   const router = useRouter();
// //   const { can } = useAuth();
// //   const [product, setProduct] = useState<Product | null>(null);
// //   const [variants, setVariants] = useState<any[]>([]);
// //   const [categories, setCategories] = useState<Category[]>([]);
// //   const [notFound, setNotFound] = useState(false);
// //   const [editOpen, setEditOpen] = useState(false);
// //   const [form, setForm] = useState({ name: "", categoryId: "", basePrice: "", mrp: "", status: "draft" as Product["status"] });
// //   const [imageUrl, setImageUrl] = useState<string | null>(null);
// //   const [formError, setFormError] = useState<string | null>(null);
// //   const [saving, setSaving] = useState(false);
// //   const [deleting, setDeleting] = useState(false);
// //   const [confirmDelete, setConfirmDelete] = useState(false);
// //   const [stockDraft, setStockDraft] = useState<{ variantId: string; delta: string; note: string } | null>(null);
// // const [stockSaving, setStockSaving] = useState(false);

// // async function submitStockAdjust() {
// //   if (!stockDraft) return;
// //   const delta = parseInt(stockDraft.delta, 10);
// //   if (!delta) return;
// //   setStockSaving(true);
// //   try {
// //     await api.adjustInventory(stockDraft.variantId, delta, stockDraft.note || (delta > 0 ? "manual restock" : "manual correction"));
// //     setStockDraft(null);
// //     // reload this product's variants so the new "available" shows immediately
// //     const res = await api.getProduct(id);
// //     setVariants(Array.isArray((res.data as any).variants) ? (res.data as any).variants : []);
// //   } finally {
// //     setStockSaving(false);
// //   }
// // }

// //   async function load() {
// //     try {
// //       const res = await api.getProduct(id); // expects { product, variants }
// //       // ---- FIX: don't assign res.data.product to a variable typed Product, just Product
// //       const loadedProduct = res.data && (res.data as any).product ? (res.data as any).product as Product : null;
// //       if (loadedProduct) {
// //         setProduct(loadedProduct);
// //         setVariants(Array.isArray((res.data as any).variants) ? (res.data as any).variants : []);
// //         const cats = await api.listCategories();

// //         // Correctly extract Category array from cats.data.categories, not cats.data.product or cats.data.categories.categories!
// //         if (
// //           cats &&
// //           cats.data &&
// //           typeof cats.data === "object" &&
// //           Array.isArray((cats.data as any).categories) // Explicitly extract .categories, not categories.categories
// //         ) {
// //           setCategories((cats.data as any).categories);
// //         } else {
// //           setCategories([]);
// //         }

// //         setForm({
// //           name: loadedProduct.name,
// //           categoryId: loadedProduct.categoryId,
// //           basePrice: String(loadedProduct.basePrice),
// //           mrp: String(loadedProduct.mrp),
// //           status: loadedProduct.status,
// //         });
// //         setImageUrl(
// //           Array.isArray(loadedProduct.images) && loadedProduct.images.length > 0
// //             ? loadedProduct.images[0]
// //             : null
// //         );
// //       } else {
// //         setNotFound(true);
// //       }
// //     } catch {
// //       setNotFound(true);
// //     }
// //   }

// //   useEffect(() => { load(); }, [id]);

// //   async function submitEdit(e: React.FormEvent) {
// //     e.preventDefault();
// //     setFormError(null);
// //     if (!form.name.trim() || !form.categoryId || !form.basePrice) {
// //       setFormError("Name, category and price are required.");
// //       return;
// //     }
// //     setSaving(true);
// //     try {
// //       await api.updateProduct(id, {
// //         name: form.name.trim(),
// //         categoryId: form.categoryId,
// //         basePrice: Number(form.basePrice),
// //         mrp: Number(form.mrp || form.basePrice),
// //         status: form.status,
// //         images: imageUrl ? [imageUrl] : [],
// //       });
// //       setEditOpen(false);
// //       await load();
// //     } catch (e) {
// //       setFormError(e instanceof Error ? e.message : "Could not update product.");
// //     } finally {
// //       setSaving(false);
// //     }
// //   }

// //   function closeEdit() {
// //     setEditOpen(false);
// //     setImageUrl(
// //       Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : null
// //     );
// //   }

// //   async function handleDelete() {
// //     setDeleting(true);
// //     try {
// //       await api.deleteProduct(id);
// //       router.push("/products");
// //     } finally {
// //       setDeleting(false);
// //     }
// //   }

// //   // Defensive: categories is always [] or array, so .find is safe
// //   const category = Array.isArray(categories)
// //     ? categories.find((c: any) =>
// //         // Support both old types (`id`) and new (`_id`) for compatibility
// //         (c.id === (product?.categoryId ?? (product as any)?.category_id)) ||
// //         (c._id === (product?.categoryId ?? (product as any)?.category_id)) // New API likely returns _id
// //       ) ?? null
// //     : null;

// //   if (notFound) {
// //     return (
// //       <Panel className="p-10 text-center">
// //         <p className="font-display text-xl text-ink-950">Product not found</p>
// //         <Button variant="secondary" className="mt-4" onClick={() => router.push("/products")}>Back to products</Button>
// //       </Panel>
// //     );
// //   }

// //   if (!product) {
// //     return <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
// //   }

// //   // Reflects imageUrl (live edit state) once loaded, so a fresh upload shows
// //   // immediately without waiting for a full reload from the backend.
// //   const productImageUrl = imageUrl ?? null;

// //   return (
// //     <div>
// //       <button onClick={() => router.push("/products")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
// //         <ArrowLeft size={14} /> Back to products
// //       </button>
// //       <PageHeader
// //         eyebrow={category?.name ?? "Uncategorised"}
// //         title={product.name}
// //         description={product.sku}
// //         actions={
// //           <div className="flex items-center gap-2">
// //             <StatusPill status={product.status} />
// //             {can("product:write") && (
// //               <>
// //                 <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}><Pencil size={13} /> Edit</Button>
// //                 <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Delete</Button>
// //               </>
// //             )}
// //           </div>
// //         }
// //       />

// //       {confirmDelete && (
// //         <Panel className="p-4 mb-4 border-bad/40 bg-bad/5">
// //           <p className="text-sm text-ink-900">Delete <strong>{product.name}</strong>? This can&apos;t be undone.</p>
// //           <div className="flex gap-2 mt-3">
// //             <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Yes, delete"}</Button>
// //             <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
// //           </div>
// //         </Panel>
// //       )}

// //       <div className="grid lg:grid-cols-3 gap-4">
// //         <Panel className="lg:col-span-2 p-5">
// //         <p className="text-sm font-medium text-ink-900 mb-3">Variants</p>
// //           <div className="overflow-hidden rounded-lg border border-line">
// //             <table className="w-full text-sm">
// //               <thead className="bg-ink-100/40 text-xs text-ink-500">
// //                 <tr>
// //                   <th className="text-left px-3 py-2 font-medium">SKU</th>
// //                   <th className="text-left px-3 py-2 font-medium">Attribute(s)</th>
// //                   <th className="text-right px-3 py-2 font-medium">Price</th>
// //                   <th className="text-right px-3 py-2 font-medium">MRP</th>
// //                   <th className="text-right px-3 py-2 font-medium">Available</th>
// //                   <th className="text-right px-3 py-2 font-medium">Adjust</th>
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 {Array.isArray(variants) && variants.map((v, vIdx) => (
// //                   <tr key={getVariantKey(v, vIdx)} className="border-t border-line">
// //                     <td className="px-3 py-2.5 font-mono text-xs">{v.sku}</td>
// //                     <td className="px-3 py-2.5">{v.attributes ? Object.values(v.attributes).join(", ") : ""}</td>
// //                     <td className="px-3 py-2.5 text-right font-mono text-xs">{formatINR(v.price)}</td>
// //                     <td className="px-3 py-2.5 text-right font-mono text-xs text-ink-500">{formatINR(v.mrp)}</td>
// //                     <td className="px-3 py-2.5 text-right">
// //                       {v.hasInventoryRow === false ? (
// //                         <span className="text-xs text-bad font-medium" title="No inventory record exists for this variant">
// //                           No stock row
// //                         </span>
// //                       ) : (
// //                         <span className={v.available <= (v.lowStockThreshold ?? 0) ? "font-semibold text-bad" : "font-medium text-ink-900"}>
// //                           {v.available}
// //                         </span>
// //                       )}
// //                     </td>
// //                     <td className="px-3 py-2.5 text-right">
// //                       {stockDraft?.variantId === (v._id || v.id) ? (
// //                         <div className="flex items-center justify-end gap-1">
// //                           <input
// //                             type="number"
// //                             autoFocus
// //                             className="w-16 rounded-md border border-line px-1 py-0.5 text-xs"
// //                             value={stockDraft ? stockDraft.delta : ""}
                       
// //                             onChange={(e) =>
// //                               stockDraft &&
// //                               setStockDraft({
// //                                 variantId: stockDraft.variantId,
// //                                 delta: e.target.value,
// //                                 note: stockDraft.note,
// //                               })
// //                             }
// //                             placeholder="±qty"
// //                           />
                    
// //                           <Button size="sm" variant="primary" onClick={submitStockAdjust} disabled={stockSaving}>
// //                             Save
// //                           </Button>
// //                           <Button size="sm" variant="secondary" onClick={() => setStockDraft(null)}>
// //                             Cancel
// //                           </Button>
// //                         </div>
// //                       ) : (
// //                         <Button
// //                           size="sm"
// //                           variant="secondary"
// //                           onClick={() => setStockDraft({ variantId: v._id || v.id, delta: "", note: "" })}
// //                         >
// //                           Adjust stock
// //                         </Button>
// //                       )}
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //           <p className="mt-2 text-[11px] text-ink-300">
// //             Positive numbers add stock, negative numbers remove it (e.g. "50" or "-3"). Full transaction history is on the Inventory page.
// //           </p>
// //           <p className="text-sm font-medium text-ink-900 mt-6 mb-3">Attributes</p>
// //           <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
// //             {product.attributes &&
// //               Object.entries(product.attributes)
// //                 .filter(([, v]) => v)
// //                 .map(([k, v]) => (
// //                   <div key={k} className="rounded-lg border border-line px-3 py-2">
// //                     <dt className="text-xs text-ink-500 capitalize">{k}</dt>
// //                     <dd className="text-ink-900">{v}</dd>
// //                   </div>
// //                 ))}
// //           </dl>
// //           {product.description && (
// //             <div className="mt-6">
// //               <p className="text-sm font-medium text-ink-900 mb-2">Description</p>
// //               <p className="text-sm text-ink-700">{product.description}</p>
// //             </div>
// //           )}
// //         </Panel>

// //         <Panel className="p-5 flex flex-col items-center text-center">
// //           {/* Image, or Fallback Icon if no image */}
// //           <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-gold-100 text-maroon-700 mb-4 overflow-hidden">
// //             {productImageUrl ? (
// //               <img
// //                 src={productImageUrl}
// //                 alt={product.name}
// //                 className="object-cover h-full w-full"
// //               />
// //             ) : (
// //               <Gem size={36} />
// //             )}
// //           </div>
// //           <p className="text-xs text-ink-500 mb-1">
// //             {productImageUrl ? (
// //               <span>1 image uploaded</span>
// //             ) : (
// //               "No image uploaded"
// //             )}
// //           </p>
// //           {can("product:write") && (
// //             <Button size="sm" variant="secondary" className="mb-2" onClick={() => setEditOpen(true)}>
// //               <Pencil size={12} /> {productImageUrl ? "Change image" : "Add image"}
// //             </Button>
// //           )}
// //           <div className="w-full mt-6 space-y-2 text-sm text-left">
// //             <div className="flex justify-between">
// //               <span className="text-ink-500">Base price</span>
// //               <span className="font-mono">{formatINR(product.basePrice)}</span>
// //             </div>
// //             <div className="flex justify-between">
// //               <span className="text-ink-500">MRP</span>
// //               <span className="font-mono text-ink-500">{formatINR(product.mrp)}</span>
// //             </div>
// //             <div className="flex justify-between">
// //               <span className="text-ink-500">Rating</span>
// //               <span>{product.ratingAvg || "—"}</span>
// //             </div>
// //             <div className="flex justify-between">
// //               <span className="text-ink-500">Featured</span>
// //               <span>{product.isFeatured ? "Yes" : "No"}</span>
// //             </div>
// //             <div className="flex justify-between">
// //               <span className="text-ink-500">New Arrival</span>
// //               <span>{product.isNewArrival ? "Yes" : "No"}</span>
// //             </div>
// //           </div>
// //         </Panel>
// //       </div>

// //       <Drawer open={editOpen} onClose={closeEdit} title="Edit product" description={product.sku}>
// //         <form onSubmit={submitEdit}>
// //           <div className="mb-4">
// //             <ImageUploader value={imageUrl} onChange={setImageUrl} folder="products" label="Product image" />
// //           </div>
// //           <Field label="Product name">
// //             <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
// //           </Field>
// //           <Field label="Category">
// //             <Select
// //               value={form.categoryId}
// //               onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
// //               className="w-full"
// //             >
// //               {Array.isArray(categories) && categories.map((c: any) => (
// //                 <option
// //                   key={c._id ?? c.id}
// //                   value={c._id ?? c.id}
// //                 >
// //                   {c.name}
// //                 </option>
// //               ))}
// //             </Select>
// //           </Field>
// //           <div className="grid grid-cols-2 gap-3">
// //             <Field label="Base price (₹)">
// //               <TextInput
// //                 type="number"
// //                 value={form.basePrice}
// //                 onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
// //               />
// //             </Field>
// //             <Field label="MRP (₹)">
// //               <TextInput
// //                 type="number"
// //                 value={form.mrp}
// //                 onChange={(e) => setForm({ ...form, mrp: e.target.value })}
// //               />
// //             </Field>
// //           </div>
// //           <Field label="Status">
// //             <Select
// //               value={form.status}
// //               onChange={(e) => setForm({ ...form, status: e.target.value as Product["status"] })}
// //               className="w-full"
// //             >
// //               <option value="draft">Draft</option>
// //               <option value="active">Active</option>
// //               <option value="archived">Archived</option>
// //             </Select>
// //           </Field>
// //           {formError && <p className="text-sm text-bad mb-3">{formError}</p>}
// //           <div className="flex justify-end gap-2 pt-2">
// //             <Button type="button" variant="secondary" onClick={closeEdit}>
// //               Cancel
// //             </Button>
// //             <Button type="submit" variant="primary" disabled={saving}>
// //               {saving ? "Saving…" : "Save changes"}
// //             </Button>
// //           </div>
// //         </form>
// //       </Drawer>
// //     </div>
// //   );
// // }

// // export default function ProductDetailPage() {
// //   return (
// //     <PermissionGate perm="product:read">
// //       <ProductDetailInner />
// //     </PermissionGate>
// //   );
// // }



// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { ArrowLeft, Gem, Pencil, Trash2 } from "lucide-react";
// import * as api from "@/lib/api";
// import { Product, Category } from "@/lib/types";
// import { Panel, PageHeader, StatusPill, Button, Skeleton, Select } from "@/components/ui";
// import { Drawer, Field, TextInput } from "@/components/drawer";
// import { PermissionGate } from "@/components/permission-gate";
// import { ImageUploader } from "@/components/image-uploader";
// import { useAuth } from "@/lib/auth";

// function formatINR(n: number) {
//   return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
// }

// /**
//  * Utility to create a more unique key for variants that may not have a unique 'id'.
//  * Combines id, SKU, and all attribute values for uniqueness.
//  **/
// function getVariantKey(variant: any, idx: number) {
//   // Prefer a present id, fallback to: sku + attrs, fallback to index
//   let attrString = "";
//   if (variant.attributes && typeof variant.attributes === "object") {
//     attrString = Object.values(variant.attributes).join(",");
//   }
//   return (
//     (variant._id && String(variant._id)) ||
//     (variant.id && String(variant.id)) ||
//     (variant.sku ? `${variant.sku}|${attrString}` : undefined) ||
//     `variant-${idx}`
//   );
// }

// // The API now returns {product, variants}
// function ProductDetailInner() {
//   const { id } = useParams<{ id: string }>();
//   const router = useRouter();
//   const { can } = useAuth();
//   const [product, setProduct] = useState<Product | null>(null);
//   const [variants, setVariants] = useState<any[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [notFound, setNotFound] = useState(false);
//   const [editOpen, setEditOpen] = useState(false);
//   const [form, setForm] = useState({ name: "", categoryId: "", basePrice: "", mrp: "", status: "draft" as Product["status"] });
//   const [imageUrl, setImageUrl] = useState<string | null>(null);
//   const [formError, setFormError] = useState<string | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [confirmDelete, setConfirmDelete] = useState(false);
//   const [stockDraft, setStockDraft] = useState<{ variantId: string; delta: string; note: string } | null>(null);
// const [stockSaving, setStockSaving] = useState(false);
// const [shippingDraft, setShippingDraft] = useState<{
//   variantId: string;
//   weightKg: string;
//   lengthCm: string;
//   breadthCm: string;
//   heightCm: string;
// } | null>(null);
// const [shippingSaving, setShippingSaving] = useState(false);
// const [shippingError, setShippingError] = useState<string | null>(null);

// function openShippingEditor(v: any) {
//   setShippingError(null);
//   setShippingDraft({
//     variantId: v._id || v.id,
//     weightKg: v.weightKg != null ? String(v.weightKg) : "",
//     lengthCm: v.lengthCm != null ? String(v.lengthCm) : "",
//     breadthCm: v.breadthCm != null ? String(v.breadthCm) : "",
//     heightCm: v.heightCm != null ? String(v.heightCm) : "",
//   });
// }

// async function submitShippingEdit() {
//   if (!shippingDraft) return;
//   const parsed = {
//     weightKg: shippingDraft.weightKg ? Number(shippingDraft.weightKg) : undefined,
//     lengthCm: shippingDraft.lengthCm ? Number(shippingDraft.lengthCm) : undefined,
//     breadthCm: shippingDraft.breadthCm ? Number(shippingDraft.breadthCm) : undefined,
//     heightCm: shippingDraft.heightCm ? Number(shippingDraft.heightCm) : undefined,
//   };
//   if (Object.values(parsed).some((n) => n !== undefined && (!(n > 0) || Number.isNaN(n)))) {
//     setShippingError("Weight and dimensions must be positive numbers.");
//     return;
//   }
//   setShippingSaving(true);
//   setShippingError(null);
//   try {
//     await api.updateVariant(shippingDraft.variantId, parsed);
//     setShippingDraft(null);
//     const res = await api.getProduct(id);
//     setVariants(Array.isArray((res.data as any).variants) ? (res.data as any).variants : []);
//   } catch (e) {
//     setShippingError(e instanceof Error ? e.message : "Could not save shipping details.");
//   } finally {
//     setShippingSaving(false);
//   }
// }

// async function submitStockAdjust() {
//   if (!stockDraft) return;
//   const delta = parseInt(stockDraft.delta, 10);
//   if (!delta) return;
//   setStockSaving(true);
//   try {
//     await api.adjustInventory(stockDraft.variantId, delta, stockDraft.note || (delta > 0 ? "manual restock" : "manual correction"));
//     setStockDraft(null);
//     // reload this product's variants so the new "available" shows immediately
//     const res = await api.getProduct(id);
//     setVariants(Array.isArray((res.data as any).variants) ? (res.data as any).variants : []);
//   } finally {
//     setStockSaving(false);
//   }
// }

//   async function load() {
//     try {
//       const res = await api.getProduct(id); // expects { product, variants }
//       // ---- FIX: don't assign res.data.product to a variable typed Product, just Product
//       const loadedProduct = res.data && (res.data as any).product ? (res.data as any).product as Product : null;
//       if (loadedProduct) {
//         setProduct(loadedProduct);
//         setVariants(Array.isArray((res.data as any).variants) ? (res.data as any).variants : []);
//         const cats = await api.listCategories();

//         // Correctly extract Category array from cats.data.categories, not cats.data.product or cats.data.categories.categories!
//         if (
//           cats &&
//           cats.data &&
//           typeof cats.data === "object" &&
//           Array.isArray((cats.data as any).categories) // Explicitly extract .categories, not categories.categories
//         ) {
//           setCategories((cats.data as any).categories);
//         } else {
//           setCategories([]);
//         }

//         setForm({
//           name: loadedProduct.name,
//           categoryId: loadedProduct.categoryId,
//           basePrice: String(loadedProduct.basePrice),
//           mrp: String(loadedProduct.mrp),
//           status: loadedProduct.status,
//         });
//         setImageUrl(
//           Array.isArray(loadedProduct.images) && loadedProduct.images.length > 0
//             ? loadedProduct.images[0]
//             : null
//         );
//       } else {
//         setNotFound(true);
//       }
//     } catch {
//       setNotFound(true);
//     }
//   }

//   useEffect(() => { load(); }, [id]);

//   async function submitEdit(e: React.FormEvent) {
//     e.preventDefault();
//     setFormError(null);
//     if (!form.name.trim() || !form.categoryId || !form.basePrice) {
//       setFormError("Name, category and price are required.");
//       return;
//     }
//     setSaving(true);
//     try {
//       await api.updateProduct(id, {
//         name: form.name.trim(),
//         categoryId: form.categoryId,
//         basePrice: Number(form.basePrice),
//         mrp: Number(form.mrp || form.basePrice),
//         status: form.status,
//         images: imageUrl ? [imageUrl] : [],
//       });
//       setEditOpen(false);
//       await load();
//     } catch (e) {
//       setFormError(e instanceof Error ? e.message : "Could not update product.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   function closeEdit() {
//     setEditOpen(false);
//     setImageUrl(
//       Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : null
//     );
//   }

//   async function handleDelete() {
//     setDeleting(true);
//     try {
//       await api.deleteProduct(id);
//       router.push("/products");
//     } finally {
//       setDeleting(false);
//     }
//   }

//   // Defensive: categories is always [] or array, so .find is safe
//   const category = Array.isArray(categories)
//     ? categories.find((c: any) =>
//         // Support both old types (`id`) and new (`_id`) for compatibility
//         (c.id === (product?.categoryId ?? (product as any)?.category_id)) ||
//         (c._id === (product?.categoryId ?? (product as any)?.category_id)) // New API likely returns _id
//       ) ?? null
//     : null;

//   if (notFound) {
//     return (
//       <Panel className="p-10 text-center">
//         <p className="font-display text-xl text-ink-950">Product not found</p>
//         <Button variant="secondary" className="mt-4" onClick={() => router.push("/products")}>Back to products</Button>
//       </Panel>
//     );
//   }

//   if (!product) {
//     return <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
//   }

//   // Reflects imageUrl (live edit state) once loaded, so a fresh upload shows
//   // immediately without waiting for a full reload from the backend.
//   const productImageUrl = imageUrl ?? null;

//   return (
//     <div>
//       <button onClick={() => router.push("/products")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
//         <ArrowLeft size={14} /> Back to products
//       </button>
//       <PageHeader
//         eyebrow={category?.name ?? "Uncategorised"}
//         title={product.name}
//         description={product.sku}
//         actions={
//           <div className="flex items-center gap-2">
//             <StatusPill status={product.status} />
//             {can("product:write") && (
//               <>
//                 <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}><Pencil size={13} /> Edit</Button>
//                 <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Delete</Button>
//               </>
//             )}
//           </div>
//         }
//       />

//       {confirmDelete && (
//         <Panel className="p-4 mb-4 border-bad/40 bg-bad/5">
//           <p className="text-sm text-ink-900">Delete <strong>{product.name}</strong>? This can&apos;t be undone.</p>
//           <div className="flex gap-2 mt-3">
//             <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Yes, delete"}</Button>
//             <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
//           </div>
//         </Panel>
//       )}

//       <div className="grid lg:grid-cols-3 gap-4">
//         <Panel className="lg:col-span-2 p-5">
//         <p className="text-sm font-medium text-ink-900 mb-3">Variants</p>
//           <div className="overflow-hidden rounded-lg border border-line">
//             <table className="w-full text-sm">
//               <thead className="bg-ink-100/40 text-xs text-ink-500">
//                 <tr>
//                   <th className="text-left px-3 py-2 font-medium">SKU</th>
//                   <th className="text-left px-3 py-2 font-medium">Attribute(s)</th>
//                   <th className="text-right px-3 py-2 font-medium">Price</th>
//                   <th className="text-right px-3 py-2 font-medium">MRP</th>
//                   <th className="text-right px-3 py-2 font-medium">Available</th>
//                   <th className="text-right px-3 py-2 font-medium">Shipping</th>
//                   <th className="text-right px-3 py-2 font-medium">Adjust</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {Array.isArray(variants) && variants.map((v, vIdx) => (
//                   <tr key={getVariantKey(v, vIdx)} className="border-t border-line">
//                     <td className="px-3 py-2.5 font-mono text-xs">{v.sku}</td>
//                     <td className="px-3 py-2.5">{v.attributes ? Object.values(v.attributes).join(", ") : ""}</td>
//                     <td className="px-3 py-2.5 text-right font-mono text-xs">{formatINR(v.price)}</td>
//                     <td className="px-3 py-2.5 text-right font-mono text-xs text-ink-500">{formatINR(v.mrp)}</td>
//                     <td className="px-3 py-2.5 text-right">
//                       {v.hasInventoryRow === false ? (
//                         <span className="text-xs text-bad font-medium" title="No inventory record exists for this variant">
//                           No stock row
//                         </span>
//                       ) : (
//                         <span className={v.available <= (v.lowStockThreshold ?? 0) ? "font-semibold text-bad" : "font-medium text-ink-900"}>
//                           {v.available}
//                         </span>
//                       )}
//                     </td>
//                     <td className="px-3 py-2.5 text-right">
//                       {v.weightKg ? (
//                         <span className="text-xs text-ink-500">
//                           {v.weightKg}kg · {v.lengthCm}×{v.breadthCm}×{v.heightCm}cm
//                         </span>
//                       ) : (
//                         <span className="text-xs text-ink-300">Not set (using default)</span>
//                       )}
//                       {can("product:write") && (
//                         <button
//                           className="ml-2 text-xs text-maroon-700 underline"
//                           onClick={() => openShippingEditor(v)}
//                         >
//                           Edit
//                         </button>
//                       )}
//                     </td>
//                     <td className="px-3 py-2.5 text-right">
//                       {stockDraft?.variantId === (v._id || v.id) ? (
//                         <div className="flex items-center justify-end gap-1">
//                           <input
//                             type="number"
//                             autoFocus
//                             className="w-16 rounded-md border border-line px-1 py-0.5 text-xs"
//                             value={stockDraft ? stockDraft.delta : ""}
                       
//                             onChange={(e) =>
//                               stockDraft &&
//                               setStockDraft({
//                                 variantId: stockDraft.variantId,
//                                 delta: e.target.value,
//                                 note: stockDraft.note,
//                               })
//                             }
//                             placeholder="±qty"
//                           />
                    
//                           <Button size="sm" variant="primary" onClick={submitStockAdjust} disabled={stockSaving}>
//                             Save
//                           </Button>
//                           <Button size="sm" variant="secondary" onClick={() => setStockDraft(null)}>
//                             Cancel
//                           </Button>
//                         </div>
//                       ) : (
//                         <Button
//                           size="sm"
//                           variant="secondary"
//                           onClick={() => setStockDraft({ variantId: v._id || v.id, delta: "", note: "" })}
//                         >
//                           Adjust stock
//                         </Button>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <p className="mt-2 text-[11px] text-ink-300">
//             Positive numbers add stock, negative numbers remove it (e.g. "50" or "-3"). Full transaction history is on the Inventory page.
//           </p>
//           <p className="text-sm font-medium text-ink-900 mt-6 mb-3">Attributes</p>
//           <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
//             {product.attributes &&
//               Object.entries(product.attributes)
//                 .filter(([, v]) => v)
//                 .map(([k, v]) => (
//                   <div key={k} className="rounded-lg border border-line px-3 py-2">
//                     <dt className="text-xs text-ink-500 capitalize">{k}</dt>
//                     <dd className="text-ink-900">{v}</dd>
//                   </div>
//                 ))}
//           </dl>
//           {product.description && (
//             <div className="mt-6">
//               <p className="text-sm font-medium text-ink-900 mb-2">Description</p>
//               <p className="text-sm text-ink-700">{product.description}</p>
//             </div>
//           )}
//         </Panel>

//         <Panel className="p-5 flex flex-col items-center text-center">
//           {/* Image, or Fallback Icon if no image */}
//           <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-gold-100 text-maroon-700 mb-4 overflow-hidden">
//             {productImageUrl ? (
//               <img
//                 src={productImageUrl}
//                 alt={product.name}
//                 className="object-cover h-full w-full"
//               />
//             ) : (
//               <Gem size={36} />
//             )}
//           </div>
//           <p className="text-xs text-ink-500 mb-1">
//             {productImageUrl ? (
//               <span>1 image uploaded</span>
//             ) : (
//               "No image uploaded"
//             )}
//           </p>
//           {can("product:write") && (
//             <Button size="sm" variant="secondary" className="mb-2" onClick={() => setEditOpen(true)}>
//               <Pencil size={12} /> {productImageUrl ? "Change image" : "Add image"}
//             </Button>
//           )}
//           <div className="w-full mt-6 space-y-2 text-sm text-left">
//             <div className="flex justify-between">
//               <span className="text-ink-500">Base price</span>
//               <span className="font-mono">{formatINR(product.basePrice)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-ink-500">MRP</span>
//               <span className="font-mono text-ink-500">{formatINR(product.mrp)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-ink-500">Rating</span>
//               <span>{product.ratingAvg || "—"}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-ink-500">Featured</span>
//               <span>{product.isFeatured ? "Yes" : "No"}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-ink-500">New Arrival</span>
//               <span>{product.isNewArrival ? "Yes" : "No"}</span>
//             </div>
//           </div>
//         </Panel>
//       </div>

//       <Drawer open={editOpen} onClose={closeEdit} title="Edit product" description={product.sku}>
//         <form onSubmit={submitEdit}>
//           <div className="mb-4">
//             <ImageUploader value={imageUrl} onChange={setImageUrl} folder="products" label="Product image" />
//           </div>
//           <Field label="Product name">
//             <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
//           </Field>
//           <Field label="Category">
//             <Select
//               value={form.categoryId}
//               onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
//               className="w-full"
//             >
//               {Array.isArray(categories) && categories.map((c: any) => (
//                 <option
//                   key={c._id ?? c.id}
//                   value={c._id ?? c.id}
//                 >
//                   {c.name}
//                 </option>
//               ))}
//             </Select>
//           </Field>
//           <div className="grid grid-cols-2 gap-3">
//             <Field label="Base price (₹)">
//               <TextInput
//                 type="number"
//                 value={form.basePrice}
//                 onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
//               />
//             </Field>
//             <Field label="MRP (₹)">
//               <TextInput
//                 type="number"
//                 value={form.mrp}
//                 onChange={(e) => setForm({ ...form, mrp: e.target.value })}
//               />
//             </Field>
//           </div>
//           <Field label="Status">
//             <Select
//               value={form.status}
//               onChange={(e) => setForm({ ...form, status: e.target.value as Product["status"] })}
//               className="w-full"
//             >
//               <option value="draft">Draft</option>
//               <option value="active">Active</option>
//               <option value="archived">Archived</option>
//             </Select>
//           </Field>
//           {formError && <p className="text-sm text-bad mb-3">{formError}</p>}
//           <div className="flex justify-end gap-2 pt-2">
//             <Button type="button" variant="secondary" onClick={closeEdit}>
//               Cancel
//             </Button>
//             <Button type="submit" variant="primary" disabled={saving}>
//               {saving ? "Saving…" : "Save changes"}
//             </Button>
//           </div>
//         </form>
//       </Drawer>

//       <Drawer
//         open={shippingDraft !== null}
//         onClose={() => setShippingDraft(null)}
//         title="Shipping details"
//         description="Used by Shiprocket to create shipments. Leave blank to fall back to the default package size."
//       >
//         {shippingDraft && (
//           <div>
//             <div className="grid grid-cols-2 gap-3">
//               <Field label="Weight (kg)">
//                 <TextInput
//                   type="number"
//                   step="0.01"
//                   value={shippingDraft.weightKg}
//                   onChange={(e) => setShippingDraft({ ...shippingDraft, weightKg: e.target.value })}
//                 />
//               </Field>
//               <Field label="Length (cm)">
//                 <TextInput
//                   type="number"
//                   step="0.1"
//                   value={shippingDraft.lengthCm}
//                   onChange={(e) => setShippingDraft({ ...shippingDraft, lengthCm: e.target.value })}
//                 />
//               </Field>
//               <Field label="Breadth (cm)">
//                 <TextInput
//                   type="number"
//                   step="0.1"
//                   value={shippingDraft.breadthCm}
//                   onChange={(e) => setShippingDraft({ ...shippingDraft, breadthCm: e.target.value })}
//                 />
//               </Field>
//               <Field label="Height (cm)">
//                 <TextInput
//                   type="number"
//                   step="0.1"
//                   value={shippingDraft.heightCm}
//                   onChange={(e) => setShippingDraft({ ...shippingDraft, heightCm: e.target.value })}
//                 />
//               </Field>
//             </div>
//             {shippingError && <p className="text-sm text-bad mt-3">{shippingError}</p>}
//             <div className="flex justify-end gap-2 pt-4">
//               <Button type="button" variant="secondary" onClick={() => setShippingDraft(null)}>
//                 Cancel
//               </Button>
//               <Button type="button" variant="primary" onClick={submitShippingEdit} disabled={shippingSaving}>
//                 {shippingSaving ? "Saving…" : "Save"}
//               </Button>
//             </div>
//           </div>
//         )}
//       </Drawer>
//     </div>
//   );
// }

// export default function ProductDetailPage() {
//   return (
//     <PermissionGate perm="product:read">
//       <ProductDetailInner />
//     </PermissionGate>
//   );
// }


// "use client";

// import { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { ArrowLeft, Gem, Pencil, Trash2 } from "lucide-react";
// import * as api from "@/lib/api";
// import { Product, Category } from "@/lib/types";
// import { Panel, PageHeader, StatusPill, Button, Skeleton, Select } from "@/components/ui";
// import { Drawer, Field, TextInput } from "@/components/drawer";
// import { PermissionGate } from "@/components/permission-gate";
// import { ImageUploader } from "@/components/image-uploader";
// import { useAuth } from "@/lib/auth";

// function formatINR(n: number) {
//   return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
// }

// /**
//  * Utility to create a more unique key for variants that may not have a unique 'id'.
//  * Combines id, SKU, and all attribute values for uniqueness.
//  **/
// function getVariantKey(variant: any, idx: number) {
//   // Prefer a present id, fallback to: sku + attrs, fallback to index
//   let attrString = "";
//   if (variant.attributes && typeof variant.attributes === "object") {
//     attrString = Object.values(variant.attributes).join(",");
//   }
//   return (
//     (variant._id && String(variant._id)) ||
//     (variant.id && String(variant.id)) ||
//     (variant.sku ? `${variant.sku}|${attrString}` : undefined) ||
//     `variant-${idx}`
//   );
// }

// // The API now returns {product, variants}
// function ProductDetailInner() {
//   const { id } = useParams<{ id: string }>();
//   const router = useRouter();
//   const { can } = useAuth();
//   const [product, setProduct] = useState<Product | null>(null);
//   const [variants, setVariants] = useState<any[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [notFound, setNotFound] = useState(false);
//   const [editOpen, setEditOpen] = useState(false);
//   const [form, setForm] = useState({ name: "", categoryId: "", basePrice: "", mrp: "", status: "draft" as Product["status"] });
//   const [imageUrl, setImageUrl] = useState<string | null>(null);
//   const [formError, setFormError] = useState<string | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [confirmDelete, setConfirmDelete] = useState(false);
//   const [stockDraft, setStockDraft] = useState<{ variantId: string; delta: string; note: string } | null>(null);
// const [stockSaving, setStockSaving] = useState(false);

// async function submitStockAdjust() {
//   if (!stockDraft) return;
//   const delta = parseInt(stockDraft.delta, 10);
//   if (!delta) return;
//   setStockSaving(true);
//   try {
//     await api.adjustInventory(stockDraft.variantId, delta, stockDraft.note || (delta > 0 ? "manual restock" : "manual correction"));
//     setStockDraft(null);
//     // reload this product's variants so the new "available" shows immediately
//     const res = await api.getProduct(id);
//     setVariants(Array.isArray((res.data as any).variants) ? (res.data as any).variants : []);
//   } finally {
//     setStockSaving(false);
//   }
// }

//   async function load() {
//     try {
//       const res = await api.getProduct(id); // expects { product, variants }
//       // ---- FIX: don't assign res.data.product to a variable typed Product, just Product
//       const loadedProduct = res.data && (res.data as any).product ? (res.data as any).product as Product : null;
//       if (loadedProduct) {
//         setProduct(loadedProduct);
//         setVariants(Array.isArray((res.data as any).variants) ? (res.data as any).variants : []);
//         const cats = await api.listCategories();

//         // Correctly extract Category array from cats.data.categories, not cats.data.product or cats.data.categories.categories!
//         if (
//           cats &&
//           cats.data &&
//           typeof cats.data === "object" &&
//           Array.isArray((cats.data as any).categories) // Explicitly extract .categories, not categories.categories
//         ) {
//           setCategories((cats.data as any).categories);
//         } else {
//           setCategories([]);
//         }

//         setForm({
//           name: loadedProduct.name,
//           categoryId: loadedProduct.categoryId,
//           basePrice: String(loadedProduct.basePrice),
//           mrp: String(loadedProduct.mrp),
//           status: loadedProduct.status,
//         });
//         setImageUrl(
//           Array.isArray(loadedProduct.images) && loadedProduct.images.length > 0
//             ? loadedProduct.images[0]
//             : null
//         );
//       } else {
//         setNotFound(true);
//       }
//     } catch {
//       setNotFound(true);
//     }
//   }

//   useEffect(() => { load(); }, [id]);

//   async function submitEdit(e: React.FormEvent) {
//     e.preventDefault();
//     setFormError(null);
//     if (!form.name.trim() || !form.categoryId || !form.basePrice) {
//       setFormError("Name, category and price are required.");
//       return;
//     }
//     setSaving(true);
//     try {
//       await api.updateProduct(id, {
//         name: form.name.trim(),
//         categoryId: form.categoryId,
//         basePrice: Number(form.basePrice),
//         mrp: Number(form.mrp || form.basePrice),
//         status: form.status,
//         images: imageUrl ? [imageUrl] : [],
//       });
//       setEditOpen(false);
//       await load();
//     } catch (e) {
//       setFormError(e instanceof Error ? e.message : "Could not update product.");
//     } finally {
//       setSaving(false);
//     }
//   }

//   function closeEdit() {
//     setEditOpen(false);
//     setImageUrl(
//       Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : null
//     );
//   }

//   async function handleDelete() {
//     setDeleting(true);
//     try {
//       await api.deleteProduct(id);
//       router.push("/products");
//     } finally {
//       setDeleting(false);
//     }
//   }

//   // Defensive: categories is always [] or array, so .find is safe
//   const category = Array.isArray(categories)
//     ? categories.find((c: any) =>
//         // Support both old types (`id`) and new (`_id`) for compatibility
//         (c.id === (product?.categoryId ?? (product as any)?.category_id)) ||
//         (c._id === (product?.categoryId ?? (product as any)?.category_id)) // New API likely returns _id
//       ) ?? null
//     : null;

//   if (notFound) {
//     return (
//       <Panel className="p-10 text-center">
//         <p className="font-display text-xl text-ink-950">Product not found</p>
//         <Button variant="secondary" className="mt-4" onClick={() => router.push("/products")}>Back to products</Button>
//       </Panel>
//     );
//   }

//   if (!product) {
//     return <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
//   }

//   // Reflects imageUrl (live edit state) once loaded, so a fresh upload shows
//   // immediately without waiting for a full reload from the backend.
//   const productImageUrl = imageUrl ?? null;

//   return (
//     <div>
//       <button onClick={() => router.push("/products")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900">
//         <ArrowLeft size={14} /> Back to products
//       </button>
//       <PageHeader
//         eyebrow={category?.name ?? "Uncategorised"}
//         title={product.name}
//         description={product.sku}
//         actions={
//           <div className="flex items-center gap-2">
//             <StatusPill status={product.status} />
//             {can("product:write") && (
//               <>
//                 <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}><Pencil size={13} /> Edit</Button>
//                 <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Delete</Button>
//               </>
//             )}
//           </div>
//         }
//       />

//       {confirmDelete && (
//         <Panel className="p-4 mb-4 border-bad/40 bg-bad/5">
//           <p className="text-sm text-ink-900">Delete <strong>{product.name}</strong>? This can&apos;t be undone.</p>
//           <div className="flex gap-2 mt-3">
//             <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Yes, delete"}</Button>
//             <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
//           </div>
//         </Panel>
//       )}

//       <div className="grid lg:grid-cols-3 gap-4">
//         <Panel className="lg:col-span-2 p-5">
//         <p className="text-sm font-medium text-ink-900 mb-3">Variants</p>
//           <div className="overflow-hidden rounded-lg border border-line">
//             <table className="w-full text-sm">
//               <thead className="bg-ink-100/40 text-xs text-ink-500">
//                 <tr>
//                   <th className="text-left px-3 py-2 font-medium">SKU</th>
//                   <th className="text-left px-3 py-2 font-medium">Attribute(s)</th>
//                   <th className="text-right px-3 py-2 font-medium">Price</th>
//                   <th className="text-right px-3 py-2 font-medium">MRP</th>
//                   <th className="text-right px-3 py-2 font-medium">Available</th>
//                   <th className="text-right px-3 py-2 font-medium">Adjust</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {Array.isArray(variants) && variants.map((v, vIdx) => (
//                   <tr key={getVariantKey(v, vIdx)} className="border-t border-line">
//                     <td className="px-3 py-2.5 font-mono text-xs">{v.sku}</td>
//                     <td className="px-3 py-2.5">{v.attributes ? Object.values(v.attributes).join(", ") : ""}</td>
//                     <td className="px-3 py-2.5 text-right font-mono text-xs">{formatINR(v.price)}</td>
//                     <td className="px-3 py-2.5 text-right font-mono text-xs text-ink-500">{formatINR(v.mrp)}</td>
//                     <td className="px-3 py-2.5 text-right">
//                       {v.hasInventoryRow === false ? (
//                         <span className="text-xs text-bad font-medium" title="No inventory record exists for this variant">
//                           No stock row
//                         </span>
//                       ) : (
//                         <span className={v.available <= (v.lowStockThreshold ?? 0) ? "font-semibold text-bad" : "font-medium text-ink-900"}>
//                           {v.available}
//                         </span>
//                       )}
//                     </td>
//                     <td className="px-3 py-2.5 text-right">
//                       {stockDraft?.variantId === (v._id || v.id) ? (
//                         <div className="flex items-center justify-end gap-1">
//                           <input
//                             type="number"
//                             autoFocus
//                             className="w-16 rounded-md border border-line px-1 py-0.5 text-xs"
//                             value={stockDraft ? stockDraft.delta : ""}
                       
//                             onChange={(e) =>
//                               stockDraft &&
//                               setStockDraft({
//                                 variantId: stockDraft.variantId,
//                                 delta: e.target.value,
//                                 note: stockDraft.note,
//                               })
//                             }
//                             placeholder="±qty"
//                           />
                    
//                           <Button size="sm" variant="primary" onClick={submitStockAdjust} disabled={stockSaving}>
//                             Save
//                           </Button>
//                           <Button size="sm" variant="secondary" onClick={() => setStockDraft(null)}>
//                             Cancel
//                           </Button>
//                         </div>
//                       ) : (
//                         <Button
//                           size="sm"
//                           variant="secondary"
//                           onClick={() => setStockDraft({ variantId: v._id || v.id, delta: "", note: "" })}
//                         >
//                           Adjust stock
//                         </Button>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <p className="mt-2 text-[11px] text-ink-300">
//             Positive numbers add stock, negative numbers remove it (e.g. "50" or "-3"). Full transaction history is on the Inventory page.
//           </p>
//           <p className="text-sm font-medium text-ink-900 mt-6 mb-3">Attributes</p>
//           <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
//             {product.attributes &&
//               Object.entries(product.attributes)
//                 .filter(([, v]) => v)
//                 .map(([k, v]) => (
//                   <div key={k} className="rounded-lg border border-line px-3 py-2">
//                     <dt className="text-xs text-ink-500 capitalize">{k}</dt>
//                     <dd className="text-ink-900">{v}</dd>
//                   </div>
//                 ))}
//           </dl>
//           {product.description && (
//             <div className="mt-6">
//               <p className="text-sm font-medium text-ink-900 mb-2">Description</p>
//               <p className="text-sm text-ink-700">{product.description}</p>
//             </div>
//           )}
//         </Panel>

//         <Panel className="p-5 flex flex-col items-center text-center">
//           {/* Image, or Fallback Icon if no image */}
//           <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-gold-100 text-maroon-700 mb-4 overflow-hidden">
//             {productImageUrl ? (
//               <img
//                 src={productImageUrl}
//                 alt={product.name}
//                 className="object-cover h-full w-full"
//               />
//             ) : (
//               <Gem size={36} />
//             )}
//           </div>
//           <p className="text-xs text-ink-500 mb-1">
//             {productImageUrl ? (
//               <span>1 image uploaded</span>
//             ) : (
//               "No image uploaded"
//             )}
//           </p>
//           {can("product:write") && (
//             <Button size="sm" variant="secondary" className="mb-2" onClick={() => setEditOpen(true)}>
//               <Pencil size={12} /> {productImageUrl ? "Change image" : "Add image"}
//             </Button>
//           )}
//           <div className="w-full mt-6 space-y-2 text-sm text-left">
//             <div className="flex justify-between">
//               <span className="text-ink-500">Base price</span>
//               <span className="font-mono">{formatINR(product.basePrice)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-ink-500">MRP</span>
//               <span className="font-mono text-ink-500">{formatINR(product.mrp)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-ink-500">Rating</span>
//               <span>{product.ratingAvg || "—"}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-ink-500">Featured</span>
//               <span>{product.isFeatured ? "Yes" : "No"}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-ink-500">New Arrival</span>
//               <span>{product.isNewArrival ? "Yes" : "No"}</span>
//             </div>
//           </div>
//         </Panel>
//       </div>

//       <Drawer open={editOpen} onClose={closeEdit} title="Edit product" description={product.sku}>
//         <form onSubmit={submitEdit}>
//           <div className="mb-4">
//             <ImageUploader value={imageUrl} onChange={setImageUrl} folder="products" label="Product image" />
//           </div>
//           <Field label="Product name">
//             <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
//           </Field>
//           <Field label="Category">
//             <Select
//               value={form.categoryId}
//               onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
//               className="w-full"
//             >
//               {Array.isArray(categories) && categories.map((c: any) => (
//                 <option
//                   key={c._id ?? c.id}
//                   value={c._id ?? c.id}
//                 >
//                   {c.name}
//                 </option>
//               ))}
//             </Select>
//           </Field>
//           <div className="grid grid-cols-2 gap-3">
//             <Field label="Base price (₹)">
//               <TextInput
//                 type="number"
//                 value={form.basePrice}
//                 onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
//               />
//             </Field>
//             <Field label="MRP (₹)">
//               <TextInput
//                 type="number"
//                 value={form.mrp}
//                 onChange={(e) => setForm({ ...form, mrp: e.target.value })}
//               />
//             </Field>
//           </div>
//           <Field label="Status">
//             <Select
//               value={form.status}
//               onChange={(e) => setForm({ ...form, status: e.target.value as Product["status"] })}
//               className="w-full"
//             >
//               <option value="draft">Draft</option>
//               <option value="active">Active</option>
//               <option value="archived">Archived</option>
//             </Select>
//           </Field>
//           {formError && <p className="text-sm text-bad mb-3">{formError}</p>}
//           <div className="flex justify-end gap-2 pt-2">
//             <Button type="button" variant="secondary" onClick={closeEdit}>
//               Cancel
//             </Button>
//             <Button type="submit" variant="primary" disabled={saving}>
//               {saving ? "Saving…" : "Save changes"}
//             </Button>
//           </div>
//         </form>
//       </Drawer>
//     </div>
//   );
// }

// export default function ProductDetailPage() {
//   return (
//     <PermissionGate perm="product:read">
//       <ProductDetailInner />
//     </PermissionGate>
//   );
// }



"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Gem, Pencil, Trash2, Plus } from "lucide-react";
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

function getVariantId(variant: any): string {
  return variant._id || variant.id || "";
}

// Blank slate for the add/edit variant drawer form.
const emptyVariantForm = {
  sku: "",
  size: "",
  color: "",
  price: "",
  mrp: "",
  isActive: true,
  initialStock: "",
};

type VariantForm = typeof emptyVariantForm;

function variantToForm(v: any): VariantForm {
  return {
    sku: v.sku ?? "",
    size: v.attributes?.size ?? "",
    color: v.attributes?.color ?? "",
    price: v.price != null ? String(v.price) : "",
    mrp: v.mrp != null ? String(v.mrp) : "",
    isActive: v.isActive !== false,
    initialStock: "",
  };
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
  const [stockDraft, setStockDraft] = useState<{ variantId: string; delta: string; note: string } | null>(null);
  const [stockSaving, setStockSaving] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [shippingDraft, setShippingDraft] = useState<{
    variantId: string;
    weightKg: string;
    lengthCm: string;
    breadthCm: string;
    heightCm: string;
  } | null>(null);
  const [shippingSaving, setShippingSaving] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Add/Edit variant drawer state. `variantDrawer` is null when closed;
  // `editingVariantId` is null when adding a new variant, else the id of the
  // variant being edited (BUG-01: there was previously no way to add, fully
  // edit, or delete a variant from the admin UI at all).
  const [variantDrawer, setVariantDrawer] = useState<VariantForm | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [variantSaving, setVariantSaving] = useState(false);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);
  const [variantDeleteError, setVariantDeleteError] = useState<string | null>(null);

  function openAddVariant() {
    setVariantError(null);
    setEditingVariantId(null);
    setVariantDrawer({ ...emptyVariantForm });
  }

  function openEditVariant(v: any) {
    setVariantError(null);
    setEditingVariantId(getVariantId(v));
    setVariantDrawer(variantToForm(v));
  }

  function closeVariantDrawer() {
    setVariantDrawer(null);
    setEditingVariantId(null);
    setVariantError(null);
  }

  async function submitVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!variantDrawer) return;
    setVariantError(null);

    if (!variantDrawer.sku.trim() || !variantDrawer.price) {
      setVariantError("SKU and price are required.");
      return;
    }

    const attributes: Record<string, string> = {};
    if (variantDrawer.size.trim()) attributes.size = variantDrawer.size.trim();
    if (variantDrawer.color.trim()) attributes.color = variantDrawer.color.trim();

    setVariantSaving(true);
    try {
      if (editingVariantId) {
        await api.updateVariant(editingVariantId, {
          sku: variantDrawer.sku.trim(),
          attributes,
          price: Number(variantDrawer.price),
          mrp: Number(variantDrawer.mrp || variantDrawer.price),
          isActive: variantDrawer.isActive,
        });
      } else {
        await api.createVariant(id, {
          sku: variantDrawer.sku.trim(),
          attributes,
          price: Number(variantDrawer.price),
          mrp: Number(variantDrawer.mrp || variantDrawer.price),
          isActive: variantDrawer.isActive,
          initialStock: variantDrawer.initialStock ? Number(variantDrawer.initialStock) : undefined,
        });
      }
      closeVariantDrawer();
      await load();
    } catch (e) {
      setVariantError(e instanceof Error ? e.message : "Could not save variant.");
    } finally {
      setVariantSaving(false);
    }
  }

  async function handleDeleteVariant(variantId: string) {
    setVariantDeleteError(null);
    setDeletingVariantId(variantId);
    try {
      await api.deleteVariant(variantId);
      await load();
    } catch (e) {
      setVariantDeleteError(e instanceof Error ? e.message : "Could not delete variant.");
    } finally {
      setDeletingVariantId(null);
    }
  }

  function openShippingEditor(v: any) {
    setShippingError(null);
    setShippingDraft({
      variantId: v._id || v.id,
      weightKg: v.weightKg != null ? String(v.weightKg) : "",
      lengthCm: v.lengthCm != null ? String(v.lengthCm) : "",
      breadthCm: v.breadthCm != null ? String(v.breadthCm) : "",
      heightCm: v.heightCm != null ? String(v.heightCm) : "",
    });
  }

  async function submitShippingEdit() {
    if (!shippingDraft) return;
    const parsed = {
      weightKg: shippingDraft.weightKg ? Number(shippingDraft.weightKg) : undefined,
      lengthCm: shippingDraft.lengthCm ? Number(shippingDraft.lengthCm) : undefined,
      breadthCm: shippingDraft.breadthCm ? Number(shippingDraft.breadthCm) : undefined,
      heightCm: shippingDraft.heightCm ? Number(shippingDraft.heightCm) : undefined,
    };
    if (Object.values(parsed).some((n) => n !== undefined && (!(n > 0) || Number.isNaN(n)))) {
      setShippingError("Weight and dimensions must be positive numbers.");
      return;
    }
    setShippingSaving(true);
    setShippingError(null);
    try {
      await api.updateVariant(shippingDraft.variantId, parsed);
      setShippingDraft(null);
      const res = await api.getProduct(id);
      setVariants(Array.isArray((res.data as any).variants) ? (res.data as any).variants : []);
    } catch (e) {
      setShippingError(e instanceof Error ? e.message : "Could not save shipping details.");
    } finally {
      setShippingSaving(false);
    }
  }

  async function submitStockAdjust() {
    if (!stockDraft) return;
    const delta = parseInt(stockDraft.delta, 10);
    if (!delta) return;
    setStockSaving(true);
    setStockError(null);
    try {
      await api.adjustInventory(stockDraft.variantId, delta, stockDraft.note || (delta > 0 ? "manual restock" : "manual correction"));
      setStockDraft(null);
      // reload this product's variants so the new "available" shows immediately
      const res = await api.getProduct(id);
      setVariants(Array.isArray((res.data as any).variants) ? (res.data as any).variants : []);
    } catch (e) {
      // Errors here used to be silently swallowed — surface them instead (BUG-01).
      setStockError(e instanceof Error ? e.message : "Could not adjust stock.");
    } finally {
      setStockSaving(false);
    }
  }

  async function load() {
    try {
      const res = await api.getProduct(id); // expects { product, variants }
      // ---- FIX: don't assign res.data.product to a variable typed Product, just Product
      const loadedProduct = res.data && (res.data as any).product ? (res.data as any).product as Product : null;
      if (loadedProduct) {
        setProduct(loadedProduct);
        setVariants(Array.isArray((res.data as any).variants) ? (res.data as any).variants : []);
        const cats = await api.listCategories();

        // Correctly extract Category array from cats.data.categories, not cats.data.product or cats.data.categories.categories!
        if (
          cats &&
          cats.data &&
          typeof cats.data === "object" &&
          Array.isArray((cats.data as any).categories) // Explicitly extract .categories, not categories.categories
        ) {
          setCategories((cats.data as any).categories);
        } else {
          setCategories([]);
        }

        setForm({
          name: loadedProduct.name,
          categoryId: loadedProduct.categoryId,
          basePrice: String(loadedProduct.basePrice),
          mrp: String(loadedProduct.mrp),
          status: loadedProduct.status,
        });
        setImageUrl(
          Array.isArray(loadedProduct.images) && loadedProduct.images.length > 0
            ? loadedProduct.images[0]
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
    setImageUrl(
      Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : null
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteProduct(id);
      router.push("/products");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not delete product.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  // Defensive: categories is always [] or array, so .find is safe
  const category = Array.isArray(categories)
    ? categories.find((c: any) =>
        // Support both old types (`id`) and new (`_id`) for compatibility
        (c.id === (product?.categoryId ?? (product as any)?.category_id)) ||
        (c._id === (product?.categoryId ?? (product as any)?.category_id)) // New API likely returns _id
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

      {formError && !editOpen && (
        <Panel className="p-3 mb-4 border-bad/40 bg-bad/5">
          <p className="text-sm text-bad">{formError}</p>
        </Panel>
      )}

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
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink-900">Variants</p>
            {can("product:write") && (
              <Button size="sm" variant="secondary" onClick={openAddVariant}>
                <Plus size={13} /> Add variant
              </Button>
            )}
          </div>
          {variantDeleteError && <p className="text-xs text-bad mb-2">{variantDeleteError}</p>}
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead className="bg-ink-100/40 text-xs text-ink-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">SKU</th>
                  <th className="text-left px-3 py-2 font-medium">Attribute(s)</th>
                  <th className="text-right px-3 py-2 font-medium">Price</th>
                  <th className="text-right px-3 py-2 font-medium">MRP</th>
                  <th className="text-right px-3 py-2 font-medium">Available</th>
                  <th className="text-right px-3 py-2 font-medium">Shipping</th>
                  <th className="text-right px-3 py-2 font-medium">Adjust</th>
                  {can("product:write") && <th className="text-right px-3 py-2 font-medium">Manage</th>}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(variants) && variants.length === 0 && (
                  <tr>
                    <td colSpan={can("product:write") ? 8 : 7} className="px-3 py-6 text-center text-xs text-ink-400">
                      No variants yet — add one so this product can be sold.
                    </td>
                  </tr>
                )}
                {Array.isArray(variants) && variants.map((v, vIdx) => (
                  <tr key={getVariantKey(v, vIdx)} className="border-t border-line">
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {v.sku}
                      {v.isActive === false && (
                        <span className="ml-1.5 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-500">Inactive</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">{v.attributes ? Object.values(v.attributes).join(", ") : ""}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">{formatINR(v.price)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs text-ink-500">{formatINR(v.mrp)}</td>
                    <td className="px-3 py-2.5 text-right">
                      {v.hasInventoryRow === false ? (
                        <span className="text-xs text-bad font-medium" title="No inventory record exists for this variant">
                          No stock row
                        </span>
                      ) : (
                        <span className={v.available <= (v.lowStockThreshold ?? 0) ? "font-semibold text-bad" : "font-medium text-ink-900"}>
                          {v.available}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {v.weightKg ? (
                        <span className="text-xs text-ink-500">
                          {v.weightKg}kg · {v.lengthCm}×{v.breadthCm}×{v.heightCm}cm
                        </span>
                      ) : (
                        <span className="text-xs text-ink-300">Not set (using default)</span>
                      )}
                      {can("product:write") && (
                        <button
                          className="ml-2 text-xs text-maroon-700 underline"
                          onClick={() => openShippingEditor(v)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {stockDraft?.variantId === (v._id || v.id) ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              autoFocus
                              className="w-16 rounded-md border border-line px-1 py-0.5 text-xs"
                              value={stockDraft ? stockDraft.delta : ""}
                              onChange={(e) =>
                                stockDraft &&
                                setStockDraft({
                                  variantId: stockDraft.variantId,
                                  delta: e.target.value,
                                  note: stockDraft.note,
                                })
                              }
                              placeholder="±qty"
                            />
                            <Button size="sm" variant="primary" onClick={submitStockAdjust} disabled={stockSaving}>
                              Save
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => { setStockDraft(null); setStockError(null); }}>
                              Cancel
                            </Button>
                          </div>
                          {stockError && <p className="text-[11px] text-bad">{stockError}</p>}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { setStockError(null); setStockDraft({ variantId: v._id || v.id, delta: "", note: "" }); }}
                        >
                          Adjust stock
                        </Button>
                      )}
                    </td>
                    {can("product:write") && (
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="text-xs text-maroon-700 underline"
                            onClick={() => openEditVariant(v)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-xs text-bad underline disabled:opacity-50"
                            disabled={deletingVariantId === getVariantId(v)}
                            onClick={() => handleDeleteVariant(getVariantId(v))}
                          >
                            {deletingVariantId === getVariantId(v) ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-ink-300">
            Positive numbers add stock, negative numbers remove it (e.g. "50" or "-3"). Full transaction history is on the Inventory page.
          </p>
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

      <Drawer
        open={shippingDraft !== null}
        onClose={() => setShippingDraft(null)}
        title="Shipping details"
        description="Used by Shiprocket to create shipments. Leave blank to fall back to the default package size."
      >
        {shippingDraft && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Weight (kg)">
                <TextInput
                  type="number"
                  step="0.01"
                  value={shippingDraft.weightKg}
                  onChange={(e) => setShippingDraft({ ...shippingDraft, weightKg: e.target.value })}
                />
              </Field>
              <Field label="Length (cm)">
                <TextInput
                  type="number"
                  step="0.1"
                  value={shippingDraft.lengthCm}
                  onChange={(e) => setShippingDraft({ ...shippingDraft, lengthCm: e.target.value })}
                />
              </Field>
              <Field label="Breadth (cm)">
                <TextInput
                  type="number"
                  step="0.1"
                  value={shippingDraft.breadthCm}
                  onChange={(e) => setShippingDraft({ ...shippingDraft, breadthCm: e.target.value })}
                />
              </Field>
              <Field label="Height (cm)">
                <TextInput
                  type="number"
                  step="0.1"
                  value={shippingDraft.heightCm}
                  onChange={(e) => setShippingDraft({ ...shippingDraft, heightCm: e.target.value })}
                />
              </Field>
            </div>
            {shippingError && <p className="text-sm text-bad mt-3">{shippingError}</p>}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShippingDraft(null)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={submitShippingEdit} disabled={shippingSaving}>
                {shippingSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        open={variantDrawer !== null}
        onClose={closeVariantDrawer}
        title={editingVariantId ? "Edit variant" : "Add variant"}
        description={editingVariantId ? undefined : "Creates a new sellable variant with its own stock."}
      >
        {variantDrawer && (
          <form onSubmit={submitVariant}>
            <Field label="SKU">
              <TextInput
                value={variantDrawer.sku}
                onChange={(e) => setVariantDrawer({ ...variantDrawer, sku: e.target.value })}
                placeholder="CML-NK-1099-STD"
                className="font-mono"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Size" hint="Optional">
                <TextInput
                  value={variantDrawer.size}
                  onChange={(e) => setVariantDrawer({ ...variantDrawer, size: e.target.value })}
                />
              </Field>
              <Field label="Color" hint="Optional">
                <TextInput
                  value={variantDrawer.color}
                  onChange={(e) => setVariantDrawer({ ...variantDrawer, color: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)">
                <TextInput
                  type="number"
                  value={variantDrawer.price}
                  onChange={(e) => setVariantDrawer({ ...variantDrawer, price: e.target.value })}
                />
              </Field>
              <Field label="MRP (₹)" hint="Defaults to price">
                <TextInput
                  type="number"
                  value={variantDrawer.mrp}
                  onChange={(e) => setVariantDrawer({ ...variantDrawer, mrp: e.target.value })}
                />
              </Field>
            </div>
            {!editingVariantId && (
              <Field label="Initial stock" hint="Leave blank for 0">
                <TextInput
                  type="number"
                  value={variantDrawer.initialStock}
                  onChange={(e) => setVariantDrawer({ ...variantDrawer, initialStock: e.target.value })}
                />
              </Field>
            )}
            <Field label="Status">
              <Select
                value={variantDrawer.isActive ? "active" : "inactive"}
                onChange={(e) => setVariantDrawer({ ...variantDrawer, isActive: e.target.value === "active" })}
                className="w-full"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
            {variantError && <p className="text-sm text-bad mb-3">{variantError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={closeVariantDrawer}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={variantSaving}>
                {variantSaving ? "Saving…" : editingVariantId ? "Save changes" : "Add variant"}
              </Button>
            </div>
          </form>
        )}
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