import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional(),
  parentId: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createCollectionSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();

// On PATCH, an attribute sent as "" means "clear it" (the controller $unsets it), so
// blank strings must pass validation here — including for `gender`.
const productAttributesSchema = z.object({
  material: z.string().optional(),
  metal: z.string().optional(),
  purity: z.string().optional(),
  stone: z.string().optional(),
  gender: z.union([z.enum(['men', 'women', 'unisex', 'kids']), z.literal('')]).optional(),
  occasion: z.string().optional(),
  jewelryType: z.string().optional(),
});

export const createVariantSchema = z.object({
  sku: z.string().min(2).max(60),
  attributes: z.record(z.string()).optional(),
  price: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  initialStock: z.number().int().nonnegative().optional(),
  // Used by the Shiprocket integration for shipment creation; optional since
  // most existing variants won't have these backfilled yet.
  weightKg: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  breadthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
});

export const updateVariantSchema = createVariantSchema.partial().omit({ initialStock: true });

// Shared field list for create and update. Kept as a plain object schema so `.omit()` and
// `.partial()` can derive the update schema (a `.refine()` would turn it into ZodEffects).
const productBaseSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(220).optional(),
  categoryId: z.string().min(1),
  // "" is accepted for the optional refs so a form can send a blank select; the controller
  // treats "" as "not set" on create and as "clear" on update.
  subcategoryId: z.string().optional(),
  collectionId: z.string().optional(),
  description: z.string().max(5000).optional(),
  basePrice: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  sku: z.string().min(2).max(60),
  attributes: productAttributesSchema.optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  // Optional starter variant + initial stock, created alongside the product so
  // a newly-created product isn't always "out of stock" with no way to sell it
  // until someone remembers to add a variant separately (BUG-01).
  variant: createVariantSchema.optional(),
});

export const createProductSchema = productBaseSchema.refine((data) => data.mrp >= data.basePrice, {
  message: 'MRP cannot be lower than the base price',
  path: ['mrp'],
});

// `variant` only makes sense on create (it was previously accepted here and silently
// ignored). The mrp >= basePrice rule for updates lives in the controller because a
// PATCH may send only one of the two prices and needs the stored value for the other.
export const updateProductSchema = productBaseSchema.omit({ variant: true }).partial();

export const productListQuerySchema = z.object({
  // Admin-only filter (ignored on the public listing, which always forces
  // status=active regardless of what's sent here) — see BUG-02.
  status: z.enum(['draft', 'active', 'archived']).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  collection: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  gender: z.string().optional(),
  jewelryType: z.string().optional(),
  material: z.string().optional(),
  metal: z.string().optional(),
  purity: z.string().optional(),
  stone: z.string().optional(),
  occasion: z.string().optional(),
  availability: z.enum(['in_stock', 'out_of_stock']).optional(),
  minDiscount: z.string().optional(),
  featured: z.string().optional(),
  newArrival: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(['recommended', 'newest', 'price_asc', 'price_desc', 'popular', 'bestselling', 'discount']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});