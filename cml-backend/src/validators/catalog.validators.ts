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

const productAttributesSchema = z.object({
  material: z.string().optional(),
  metal: z.string().optional(),
  purity: z.string().optional(),
  stone: z.string().optional(),
  gender: z.enum(['men', 'women', 'unisex', 'kids']).optional(),
  occasion: z.string().optional(),
  jewelryType: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(220).optional(),
  categoryId: z.string().min(1),
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
});

export const updateProductSchema = createProductSchema.partial();

export const createVariantSchema = z.object({
  sku: z.string().min(2).max(60),
  attributes: z.record(z.string()).optional(),
  price: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  initialStock: z.number().int().nonnegative().optional(),
});

export const updateVariantSchema = createVariantSchema.partial().omit({ initialStock: true });

export const productListQuerySchema = z.object({
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
