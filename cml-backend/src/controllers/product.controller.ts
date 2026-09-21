import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Product } from '../models/Product.model';
import { Category } from '../models/Category.model';
import { Collection } from '../models/Collection.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { Inventory } from '../models/Inventory.model';
import { InventoryTransaction } from '../models/InventoryTransaction.model';
import { Wishlist } from '../models/Wishlist.model';
import { slugify } from '../utils/slugify';
import { queryProducts, ProductListQuery } from '../services/productQuery.service';
import { createProductSchema, updateProductSchema, updateVariantSchema } from '../validators/catalog.validators';

type CreateProductInput = z.infer<typeof createProductSchema>;
type UpdateProductInput = z.infer<typeof updateProductSchema>;
type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

// ---------- Admin write helpers (PC-03) ----------

interface FieldIssue {
  path: string;
  message: string;
}

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const ATTRIBUTE_KEYS = ['material', 'metal', 'purity', 'stone', 'gender', 'occasion', 'jewelryType'] as const;

/** Same error shape the zod `validate` middleware produces, so the admin UI can show `details.issues`. */
function validationFailure(issues: FieldIssue[]): AppError {
  return AppError.badRequest('Validation failed', 'VALIDATION_ERROR', { issues });
}

function conflictOn(path: string, message: string, code: string): AppError {
  return AppError.conflict(message, code, { issues: [{ path, message }] });
}

/** MRP is the struck-through price, so it can never be below the selling price. */
function assertPricing(price: number, mrp: number, mrpPath = 'mrp'): void {
  if (mrp < price) throw validationFailure([{ path: mrpPath, message: 'MRP cannot be lower than the price' }]);
}

function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}

/** Trims; returns undefined for blank so callers can skip or unset the field. */
function cleanText(value: string | undefined | null): string | undefined {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? undefined : trimmed;
}

function cleanImages(images: string[]): string[] {
  return images.map((url) => url.trim()).filter((url) => url !== '');
}

/** Create: drop blank attribute values entirely so they are never stored as "". */
function cleanAttributesForCreate(
  attributes: CreateProductInput['attributes']
): Record<string, string> | undefined {
  if (!attributes) return undefined;
  const out: Record<string, string> = {};
  for (const key of ATTRIBUTE_KEYS) {
    const value = cleanText(attributes[key]);
    if (value !== undefined) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Checks that the referenced category / subcategory / collection exist and that the
 * subcategory is a child of the category. `runValidators` cannot do this (it only
 * checks the schema, not other collections or cross-field rules).
 */
async function assertCatalogRefs(refs: {
  categoryId: string;
  subcategoryId?: string;
  collectionId?: string;
}): Promise<void> {
  const issues: FieldIssue[] = [];

  if (!OBJECT_ID_RE.test(refs.categoryId)) {
    issues.push({ path: 'categoryId', message: 'Invalid category' });
  } else if (!(await Category.exists({ _id: refs.categoryId }))) {
    issues.push({ path: 'categoryId', message: 'Category not found' });
  }

  if (refs.subcategoryId) {
    if (!OBJECT_ID_RE.test(refs.subcategoryId)) {
      issues.push({ path: 'subcategoryId', message: 'Invalid subcategory' });
    } else {
      const sub = await Category.findById(refs.subcategoryId).select('parentId');
      if (!sub) {
        issues.push({ path: 'subcategoryId', message: 'Subcategory not found' });
      } else if (!sub.parentId || sub.parentId.toString() !== refs.categoryId) {
        issues.push({ path: 'subcategoryId', message: 'Subcategory does not belong to the selected category' });
      }
    }
  }

  if (refs.collectionId) {
    if (!OBJECT_ID_RE.test(refs.collectionId)) {
      issues.push({ path: 'collectionId', message: 'Invalid collection' });
    } else if (!(await Collection.exists({ _id: refs.collectionId }))) {
      issues.push({ path: 'collectionId', message: 'Collection not found' });
    }
  }

  if (issues.length > 0) throw validationFailure(issues);
}
 
// ---------- Public ----------
 
export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await queryProducts(req.query as ProductListQuery);
 
  if (req.user) {
    const wishlist = await Wishlist.findOne({ userId: req.user.sub }).select('items.productId');
    const wishlisted = new Set((wishlist?.items || []).map((i) => i.productId.toString()));
    for (const item of items) {
      item.isWishlisted = wishlisted.has(item._id.toString());
    }
  }
 
  sendSuccess(res, { data: { products: items }, meta });
});
 
export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
 
  const product = await Product.findOne({ slug, status: 'active' })
    .populate('categoryId', 'name slug')
    .populate('subcategoryId', 'name slug')
    .populate('collectionId', 'name slug');
 
  if (!product) throw AppError.notFound('Product not found');
 
  const variants = await ProductVariant.find({ productId: product._id, isActive: true });
  const inventories = await Inventory.find({ variantId: { $in: variants.map((v) => v._id) } });
  const inventoryByVariant = new Map(inventories.map((i) => [i.variantId.toString(), i]));
 
  const variantsWithStock = variants.map((v) => {
    const inv = inventoryByVariant.get(v._id.toString());
    return {
      ...v.toObject(),
      available: inv?.available ?? 0,
    };
  });
 
  const related = await Product.find({
    _id: { $ne: product._id },
    status: 'active',
    categoryId: product.categoryId,
  })
    .limit(8)
    .select('name slug basePrice mrp images ratingAvg');
 
  let isWishlisted = false;
  if (req.user) {
    const wishlist = await Wishlist.findOne({ userId: req.user.sub, 'items.productId': product._id });
    isWishlisted = Boolean(wishlist);
  }
 
  sendSuccess(res, {
    data: { product: { ...product.toObject(), isWishlisted }, variants: variantsWithStock, relatedProducts: related },
  });
});
 
// ---------- Admin ----------
 
export const adminListProducts = asyncHandler(async (req: Request, res: Response) => {
  // Admin needs to see drafts/archived too (and filter by a specific status),
  // unlike the public listing which always forces status=active — see BUG-02.
  const { items, meta } = await queryProducts(
    { ...(req.query as ProductListQuery) },
    { includeAllStatuses: true }
  );
  sendSuccess(res, { data: { products: items }, meta });
});
 
export const adminGetProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw AppError.notFound('Product not found');
 
  const variants = await ProductVariant.find({ productId: product._id });
  const inventories = await Inventory.find({ variantId: { $in: variants.map((v) => v._id) } });
  const inventoryByVariant = new Map(inventories.map((i) => [i.variantId.toString(), i]));
 
  const variantsWithStock = variants.map((v) => {
    const inv = inventoryByVariant.get(v._id.toString());
    return {
      ...v.toObject(),
      available: inv?.available ?? 0,
      reserved: inv?.reserved ?? 0,
      sold: inv?.sold ?? 0,
      lowStockThreshold: inv?.lowStockThreshold,
      hasInventoryRow: Boolean(inv), // lets the UI flag a variant with no Inventory row at all (BUG-19 case)
    };
  });
 
  sendSuccess(res, { data: { product, variants: variantsWithStock } });
});
 
export const adminCreateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, sku, variant, description, subcategoryId, collectionId, attributes, images, ...rest } =
    req.body as CreateProductInput;

  const cleanName = name.trim();
  const finalSlug = slugify(slug ?? cleanName);
  if (!finalSlug) {
    throw validationFailure([
      {
        path: 'slug',
        message: slug
          ? 'Slug can only contain letters, numbers and hyphens'
          : 'A slug could not be generated from the name — enter one manually',
      },
    ]);
  }
  const finalSku = normalizeSku(sku);

  // Blank optional refs from a form ("") mean "not set".
  const cleanSubcategoryId = cleanText(subcategoryId);
  const cleanCollectionId = cleanText(collectionId);
  await assertCatalogRefs({
    categoryId: rest.categoryId,
    subcategoryId: cleanSubcategoryId,
    collectionId: cleanCollectionId,
  });

  const existingSlug = await Product.findOne({ slug: finalSlug });
  if (existingSlug) throw conflictOn('slug', 'A product with this slug already exists', 'PRODUCT_SLUG_EXISTS');

  const existingSku = await Product.findOne({ sku: finalSku });
  if (existingSku) throw conflictOn('sku', 'A product with this SKU already exists', 'PRODUCT_SKU_EXISTS');

  if (variant) {
    const existingVariantSku = await ProductVariant.findOne({ sku: variant.sku.toUpperCase() });
    if (existingVariantSku) {
      throw AppError.conflict('A variant with this SKU already exists', 'VARIANT_SKU_EXISTS');
    }
  }
 
  const cleanDescription = cleanText(description);
  const cleanAttributes = cleanAttributesForCreate(attributes);
  const product = await Product.create({
    name: cleanName,
    slug: finalSlug,
    sku: finalSku,
    ...rest,
    ...(cleanDescription ? { description: cleanDescription } : {}),
    ...(cleanSubcategoryId ? { subcategoryId: cleanSubcategoryId } : {}),
    ...(cleanCollectionId ? { collectionId: cleanCollectionId } : {}),
    ...(cleanAttributes ? { attributes: cleanAttributes } : {}),
    ...(images ? { images: cleanImages(images) } : {}),
  });
 
  // Optionally create a starter variant + inventory row in the same request so a
  // new product isn't always "out of stock" with no way to sell it (BUG-01).
  // No multi-document transaction here (matches the rest of the codebase, e.g.
  // inventory.service's reserveStock, which rolls back manually rather than
  // relying on a Mongo session) — if anything after the product fails, we
  // delete what we already created instead of leaving an orphaned product.
  let createdVariant = null;
  if (variant) {
    const { initialStock, ...variantData } = variant;
    try {
      createdVariant = await ProductVariant.create({ ...variantData, productId: product._id });
      const inventory = await Inventory.create({ variantId: createdVariant._id, available: initialStock ?? 0 });
      if (initialStock) {
        await InventoryTransaction.create({
          inventoryId: inventory._id,
          variantId: createdVariant._id,
          type: 'purchase',
          qty: initialStock,
          note: 'Initial stock on product creation',
        });
      }
    } catch (err) {
      if (createdVariant) {
        await ProductVariant.findByIdAndDelete(createdVariant._id);
        await Inventory.deleteOne({ variantId: createdVariant._id });
      }
      await Product.findByIdAndDelete(product._id);
      throw err;
    }
  }
 
  sendSuccess(res, {
    message: 'Product created',
    data: { product, variant: createdVariant },
    statusCode: 201,
  });
});
 
// PATCH semantics (PC-03): only the fields present in the body change.
//  - description / subcategoryId / collectionId: "" clears the field.
//  - attributes: merged per key; a key sent as "" is unset, a key not sent is left alone.
//  - images: replaces the whole array when sent (so callers must send the full list).
// The document is loaded and saved (rather than findByIdAndUpdate) so the schema's
// pre('save') hook and validators run and `publishedAt` is set when going active.
export const adminUpdateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input = req.body as UpdateProductInput;

  const product = await Product.findById(id);
  if (!product) throw AppError.notFound('Product not found');

  const previousBasePrice = product.basePrice;
  const previousMrp = product.mrp;

  if (input.name !== undefined) product.name = input.name.trim();

  if (input.slug !== undefined) {
    const nextSlug = slugify(input.slug);
    if (!nextSlug) {
      throw validationFailure([{ path: 'slug', message: 'Slug can only contain letters, numbers and hyphens' }]);
    }
    if (nextSlug !== product.slug) {
      const clash = await Product.exists({ slug: nextSlug, _id: { $ne: product._id } });
      if (clash) throw conflictOn('slug', 'A product with this slug already exists', 'PRODUCT_SLUG_EXISTS');
      product.slug = nextSlug;
    }
  }

  if (input.sku !== undefined) {
    const nextSku = normalizeSku(input.sku);
    if (nextSku !== product.sku) {
      const clash = await Product.exists({ sku: nextSku, _id: { $ne: product._id } });
      if (clash) throw conflictOn('sku', 'A product with this SKU already exists', 'PRODUCT_SKU_EXISTS');
      product.sku = nextSku;
    }
  }

  // Cross-field rules that runValidators cannot express. Checked against the values the
  // product will have AFTER this update, so sending only one of the two prices still works.
  if (input.basePrice !== undefined || input.mrp !== undefined) {
    const nextBase = input.basePrice ?? product.basePrice;
    const nextMrp = input.mrp ?? product.mrp;
    if (nextMrp < nextBase) {
      throw validationFailure([{ path: 'mrp', message: 'MRP cannot be lower than the base price' }]);
    }
    product.basePrice = nextBase;
    product.mrp = nextMrp;
  }

  if (input.categoryId !== undefined || input.subcategoryId !== undefined || input.collectionId !== undefined) {
    const nextCategoryId = input.categoryId ?? product.categoryId.toString();
    const nextSubcategoryId =
      input.subcategoryId !== undefined ? cleanText(input.subcategoryId) : product.subcategoryId?.toString();
    const nextCollectionId =
      input.collectionId !== undefined ? cleanText(input.collectionId) : product.collectionId?.toString();

    await assertCatalogRefs({
      categoryId: nextCategoryId,
      subcategoryId: nextSubcategoryId,
      collectionId: nextCollectionId,
    });

    product.categoryId = new Types.ObjectId(nextCategoryId);
    product.subcategoryId = nextSubcategoryId ? new Types.ObjectId(nextSubcategoryId) : undefined;
    product.collectionId = nextCollectionId ? new Types.ObjectId(nextCollectionId) : undefined;
  }

  if (input.description !== undefined) product.description = cleanText(input.description);

  if (input.attributes) {
    for (const key of ATTRIBUTE_KEYS) {
      const value = input.attributes[key];
      if (value === undefined) continue;
      // Assigning undefined makes mongoose $unset the path instead of storing "".
      product.set(`attributes.${key}`, cleanText(value));
    }
  }

  if (input.images !== undefined) product.images = cleanImages(input.images);
  if (input.status !== undefined) product.status = input.status;
  if (input.isFeatured !== undefined) product.isFeatured = input.isFeatured;
  if (input.isNewArrival !== undefined) product.isNewArrival = input.isNewArrival;

  // The pre('save') hook only fires when `status` itself changes; this also repairs
  // products that were made active before this fix and still have no publishedAt,
  // so the "newest" sort (publishedAt desc) is correct.
  if (product.status === 'active' && !product.publishedAt) product.publishedAt = new Date();

  await product.save();

  // PC-04: cart and checkout charge the VARIANT price, while listings show the product's
  // basePrice/mrp, so editing only the product price used to change nothing customers pay.
  // Rule: if the product has exactly one variant and that variant was still in step with
  // the old product price (or MRP), move it to the new one. Products with several variants,
  // or a variant deliberately priced differently, are left alone — edit those per variant.
  let variantPriceSynced = false;
  if (input.basePrice !== undefined || input.mrp !== undefined) {
    const variants = await ProductVariant.find({ productId: product._id });
    if (variants.length === 1) {
      const variant = variants[0];
      const nextPrice = input.basePrice !== undefined && variant.price === previousBasePrice ? product.basePrice : variant.price;
      const nextMrp = input.mrp !== undefined && variant.mrp === previousMrp ? product.mrp : variant.mrp;
      if ((nextPrice !== variant.price || nextMrp !== variant.mrp) && nextMrp >= nextPrice) {
        variant.price = nextPrice;
        variant.mrp = nextMrp;
        await variant.save();
        variantPriceSynced = true;
      }
    }
  }

  sendSuccess(res, { message: 'Product updated', data: { product, variantPriceSynced } });
});

export const adminDeleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
 
  const hasVariants = await ProductVariant.exists({ productId: id });
  if (hasVariants) {
    throw AppError.conflict('Delete or reassign variants before deleting this product', 'PRODUCT_HAS_VARIANTS');
  }
 
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw AppError.notFound('Product not found');
  sendSuccess(res, { message: 'Product deleted' });
});
 
// ---------- Admin: Variants ----------
 
export const adminListVariants = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const variants = await ProductVariant.find({ productId });
  const inventories = await Inventory.find({ variantId: { $in: variants.map((v) => v._id) } });
  const inventoryByVariant = new Map(inventories.map((i) => [i.variantId.toString(), i]));
 
  const variantsWithStock = variants.map((v) => ({
    ...v.toObject(),
    available: inventoryByVariant.get(v._id.toString())?.available ?? 0,
    hasInventoryRow: inventoryByVariant.has(v._id.toString()),
  }));
 
  sendSuccess(res, { data: { variants: variantsWithStock } });
});
 
export const adminCreateVariant = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { initialStock, ...variantData } = req.body;
 
  const product = await Product.findById(productId);
  if (!product) throw AppError.notFound('Product not found');

  assertPricing(variantData.price, variantData.mrp);
 
  const existingSku = await ProductVariant.findOne({ sku: variantData.sku.toUpperCase() });
  if (existingSku) throw AppError.conflict('A variant with this SKU already exists', 'VARIANT_SKU_EXISTS');
 
  const variant = await ProductVariant.create({ ...variantData, productId });
 
  try {
    const inventory = await Inventory.create({ variantId: variant._id, available: initialStock ?? 0 });
    if (initialStock) {
      await InventoryTransaction.create({
        inventoryId: inventory._id,
        variantId: variant._id,
        type: 'purchase',
        qty: initialStock,
        note: 'Initial stock on variant creation',
      });
    }
  } catch (err) {
    // Don't leave a variant behind with no inventory row at all.
    await ProductVariant.findByIdAndDelete(variant._id);
    throw err;
  }
 
  sendSuccess(res, { message: 'Variant created', data: { variant }, statusCode: 201 });
});
 
// PATCH semantics (PC-04): only fields present in the body change. `attributes` and `images`
// REPLACE the stored value, so the admin UI must send the full object / array.
export const adminUpdateVariant = asyncHandler(async (req: Request, res: Response) => {
  const { variantId } = req.params;
  const input = req.body as UpdateVariantInput;

  const variant = await ProductVariant.findById(variantId);
  if (!variant) throw AppError.notFound('Variant not found');

  if (input.sku !== undefined) {
    const nextSku = normalizeSku(input.sku);
    if (nextSku !== variant.sku) {
      const clash = await ProductVariant.exists({ sku: nextSku, _id: { $ne: variant._id } });
      if (clash) throw conflictOn('sku', 'A variant with this SKU already exists', 'VARIANT_SKU_EXISTS');
      variant.sku = nextSku;
    }
  }

  if (input.price !== undefined || input.mrp !== undefined) {
    const nextPrice = input.price ?? variant.price;
    const nextMrp = input.mrp ?? variant.mrp;
    assertPricing(nextPrice, nextMrp);
    variant.price = nextPrice;
    variant.mrp = nextMrp;
  }

  if (input.attributes !== undefined) {
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(input.attributes)) {
      const trimmed = value.trim();
      if (key.trim() !== '' && trimmed !== '') cleaned[key.trim()] = trimmed;
    }
    variant.attributes = cleaned;
    variant.markModified('attributes'); // Mixed type: mongoose can't detect the change itself
  }

  if (input.images !== undefined) variant.images = cleanImages(input.images);
  if (input.isActive !== undefined) variant.isActive = input.isActive;
  if (input.weightKg !== undefined) variant.weightKg = input.weightKg;
  if (input.lengthCm !== undefined) variant.lengthCm = input.lengthCm;
  if (input.breadthCm !== undefined) variant.breadthCm = input.breadthCm;
  if (input.heightCm !== undefined) variant.heightCm = input.heightCm;

  await variant.save();
  sendSuccess(res, { message: 'Variant updated', data: { variant } });
});

export const adminDeleteVariant = asyncHandler(async (req: Request, res: Response) => {
  const { variantId } = req.params;
 
  const inventory = await Inventory.findOne({ variantId });
  if (inventory && (inventory.reserved > 0 || inventory.sold > 0)) {
    throw AppError.conflict('Cannot delete a variant with reserved or sold stock history', 'VARIANT_HAS_ACTIVITY');
  }
 
  const variant = await ProductVariant.findByIdAndDelete(variantId);
  if (!variant) throw AppError.notFound('Variant not found');
  await Inventory.deleteOne({ variantId });
 
  sendSuccess(res, { message: 'Variant deleted' });
});
 
// BUG-04: Purchase orders reference variants by variantId, but a person creating a
// PO only knows the SKU printed on the supplier's paperwork — this lets the admin
// UI look a SKU up and get back the variantId (plus enough context to confirm it's
// the right item) to send on the actual create-purchase request.
export const adminSearchVariants = asyncHandler(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) {
    sendSuccess(res, { data: { variants: [] } });
    return;
  }
 
  // Escape regex metacharacters so a SKU like "18K.5" or "R+1" can't be
  // interpreted as a pattern (and can't be used to build a catastrophic-backtracking one).
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
 
  const variants = await ProductVariant.find({ sku: { $regex: escaped, $options: 'i' } })
    .select('sku price mrp attributes isActive productId')
    .populate('productId', 'name')
    .limit(20);
 
  sendSuccess(res, {
    data: {
      variants: variants.map((v) => ({
        _id: v._id,
        sku: v.sku,
        price: v.price,
        mrp: v.mrp,
        attributes: v.attributes,
        isActive: v.isActive,
        productName: (v.productId as unknown as { name?: string })?.name,
      })),
    },
  });
});