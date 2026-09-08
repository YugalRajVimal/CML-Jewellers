import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Product } from '../models/Product.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { Inventory } from '../models/Inventory.model';
import { Wishlist } from '../models/Wishlist.model';
import { slugify } from '../utils/slugify';
import { queryProducts, ProductListQuery } from '../services/productQuery.service';

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
  const { items, meta } = await queryProducts({ ...(req.query as ProductListQuery) });
  sendSuccess(res, { data: { products: items }, meta });
});

export const adminGetProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw AppError.notFound('Product not found');

  const variants = await ProductVariant.find({ productId: product._id });
  sendSuccess(res, { data: { product, variants } });
});

export const adminCreateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, sku, ...rest } = req.body;
  const finalSlug = slug || slugify(name);

  const existingSlug = await Product.findOne({ slug: finalSlug });
  if (existingSlug) throw AppError.conflict('A product with this slug already exists', 'PRODUCT_SLUG_EXISTS');

  const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
  if (existingSku) throw AppError.conflict('A product with this SKU already exists', 'PRODUCT_SKU_EXISTS');

  const product = await Product.create({ name, slug: finalSlug, sku, ...rest });
  sendSuccess(res, { message: 'Product created', data: { product }, statusCode: 201 });
});

export const adminUpdateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!product) throw AppError.notFound('Product not found');
  sendSuccess(res, { message: 'Product updated', data: { product } });
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
  sendSuccess(res, { data: { variants } });
});

export const adminCreateVariant = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { initialStock, ...variantData } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw AppError.notFound('Product not found');

  const existingSku = await ProductVariant.findOne({ sku: variantData.sku.toUpperCase() });
  if (existingSku) throw AppError.conflict('A variant with this SKU already exists', 'VARIANT_SKU_EXISTS');

  const variant = await ProductVariant.create({ ...variantData, productId });
  await Inventory.create({ variantId: variant._id, available: initialStock ?? 0 });

  sendSuccess(res, { message: 'Variant created', data: { variant }, statusCode: 201 });
});

export const adminUpdateVariant = asyncHandler(async (req: Request, res: Response) => {
  const { variantId } = req.params;
  const variant = await ProductVariant.findByIdAndUpdate(variantId, req.body, { new: true, runValidators: true });
  if (!variant) throw AppError.notFound('Variant not found');
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
