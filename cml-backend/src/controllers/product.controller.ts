// import { Request, Response } from 'express';
// import { asyncHandler } from '../utils/asyncHandler';
// import { sendSuccess } from '../utils/apiResponse';
// import { AppError } from '../utils/AppError';
// import { Product } from '../models/Product.model';
// import { ProductVariant } from '../models/ProductVariant.model';
// import { Inventory } from '../models/Inventory.model';
// import { Wishlist } from '../models/Wishlist.model';
// import { slugify } from '../utils/slugify';
// import { queryProducts, ProductListQuery } from '../services/productQuery.service';

// // ---------- Public ----------

// export const listProducts = asyncHandler(async (req: Request, res: Response) => {
//   const { items, meta } = await queryProducts(req.query as ProductListQuery);

//   if (req.user) {
//     const wishlist = await Wishlist.findOne({ userId: req.user.sub }).select('items.productId');
//     const wishlisted = new Set((wishlist?.items || []).map((i) => i.productId.toString()));
//     for (const item of items) {
//       item.isWishlisted = wishlisted.has(item._id.toString());
//     }
//   }

//   sendSuccess(res, { data: { products: items }, meta });
// });

// export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
//   const { slug } = req.params;

//   const product = await Product.findOne({ slug, status: 'active' })
//     .populate('categoryId', 'name slug')
//     .populate('subcategoryId', 'name slug')
//     .populate('collectionId', 'name slug');

//   if (!product) throw AppError.notFound('Product not found');

//   const variants = await ProductVariant.find({ productId: product._id, isActive: true });
//   const inventories = await Inventory.find({ variantId: { $in: variants.map((v) => v._id) } });
//   const inventoryByVariant = new Map(inventories.map((i) => [i.variantId.toString(), i]));

//   const variantsWithStock = variants.map((v) => {
//     const inv = inventoryByVariant.get(v._id.toString());
//     return {
//       ...v.toObject(),
//       available: inv?.available ?? 0,
//     };
//   });

//   const related = await Product.find({
//     _id: { $ne: product._id },
//     status: 'active',
//     categoryId: product.categoryId,
//   })
//     .limit(8)
//     .select('name slug basePrice mrp images ratingAvg');

//   let isWishlisted = false;
//   if (req.user) {
//     const wishlist = await Wishlist.findOne({ userId: req.user.sub, 'items.productId': product._id });
//     isWishlisted = Boolean(wishlist);
//   }

//   sendSuccess(res, {
//     data: { product: { ...product.toObject(), isWishlisted }, variants: variantsWithStock, relatedProducts: related },
//   });
// });

// // ---------- Admin ----------

// export const adminListProducts = asyncHandler(async (req: Request, res: Response) => {
//   const { items, meta } = await queryProducts({ ...(req.query as ProductListQuery) });
//   sendSuccess(res, { data: { products: items }, meta });
// });

// export const adminGetProduct = asyncHandler(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const product = await Product.findById(id);
//   if (!product) throw AppError.notFound('Product not found');

//   const variants = await ProductVariant.find({ productId: product._id });
//   const inventories = await Inventory.find({ variantId: { $in: variants.map((v) => v._id) } });
//   const inventoryByVariant = new Map(inventories.map((i) => [i.variantId.toString(), i]));

//   const variantsWithStock = variants.map((v) => {
//     const inv = inventoryByVariant.get(v._id.toString());
//     return {
//       ...v.toObject(),
//       available: inv?.available ?? 0,
//       reserved: inv?.reserved ?? 0,
//       sold: inv?.sold ?? 0,
//       lowStockThreshold: inv?.lowStockThreshold,
//       hasInventoryRow: Boolean(inv), // lets the UI flag a variant with no Inventory row at all (BUG-19 case)
//     };
//   });

//   sendSuccess(res, { data: { product, variants: variantsWithStock } });
// });

// export const adminCreateProduct = asyncHandler(async (req: Request, res: Response) => {
//   const { name, slug, sku, ...rest } = req.body;
//   const finalSlug = slug || slugify(name);

//   const existingSlug = await Product.findOne({ slug: finalSlug });
//   if (existingSlug) throw AppError.conflict('A product with this slug already exists', 'PRODUCT_SLUG_EXISTS');

//   const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
//   if (existingSku) throw AppError.conflict('A product with this SKU already exists', 'PRODUCT_SKU_EXISTS');

//   const product = await Product.create({ name, slug: finalSlug, sku, ...rest });
//   sendSuccess(res, { message: 'Product created', data: { product }, statusCode: 201 });
// });

// export const adminUpdateProduct = asyncHandler(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const product = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
//   if (!product) throw AppError.notFound('Product not found');
//   sendSuccess(res, { message: 'Product updated', data: { product } });
// });

// export const adminDeleteProduct = asyncHandler(async (req: Request, res: Response) => {
//   const { id } = req.params;

//   const hasVariants = await ProductVariant.exists({ productId: id });
//   if (hasVariants) {
//     throw AppError.conflict('Delete or reassign variants before deleting this product', 'PRODUCT_HAS_VARIANTS');
//   }

//   const product = await Product.findByIdAndDelete(id);
//   if (!product) throw AppError.notFound('Product not found');
//   sendSuccess(res, { message: 'Product deleted' });
// });

// // ---------- Admin: Variants ----------

// export const adminListVariants = asyncHandler(async (req: Request, res: Response) => {
//   const { productId } = req.params;
//   const variants = await ProductVariant.find({ productId });
//   const inventories = await Inventory.find({ variantId: { $in: variants.map((v) => v._id) } });
//   const inventoryByVariant = new Map(inventories.map((i) => [i.variantId.toString(), i]));

//   const variantsWithStock = variants.map((v) => ({
//     ...v.toObject(),
//     available: inventoryByVariant.get(v._id.toString())?.available ?? 0,
//     hasInventoryRow: inventoryByVariant.has(v._id.toString()),
//   }));

//   sendSuccess(res, { data: { variants: variantsWithStock } });
// });

// export const adminCreateVariant = asyncHandler(async (req: Request, res: Response) => {
//   const { productId } = req.params;
//   const { initialStock, ...variantData } = req.body;

//   const product = await Product.findById(productId);
//   if (!product) throw AppError.notFound('Product not found');

//   const existingSku = await ProductVariant.findOne({ sku: variantData.sku.toUpperCase() });
//   if (existingSku) throw AppError.conflict('A variant with this SKU already exists', 'VARIANT_SKU_EXISTS');

//   const variant = await ProductVariant.create({ ...variantData, productId });
//   await Inventory.create({ variantId: variant._id, available: initialStock ?? 0 });

//   sendSuccess(res, { message: 'Variant created', data: { variant }, statusCode: 201 });
// });

// export const adminUpdateVariant = asyncHandler(async (req: Request, res: Response) => {
//   const { variantId } = req.params;
//   const variant = await ProductVariant.findByIdAndUpdate(variantId, req.body, { new: true, runValidators: true });
//   if (!variant) throw AppError.notFound('Variant not found');
//   sendSuccess(res, { message: 'Variant updated', data: { variant } });
// });

// export const adminDeleteVariant = asyncHandler(async (req: Request, res: Response) => {
//   const { variantId } = req.params;

//   const inventory = await Inventory.findOne({ variantId });
//   if (inventory && (inventory.reserved > 0 || inventory.sold > 0)) {
//     throw AppError.conflict('Cannot delete a variant with reserved or sold stock history', 'VARIANT_HAS_ACTIVITY');
//   }

//   const variant = await ProductVariant.findByIdAndDelete(variantId);
//   if (!variant) throw AppError.notFound('Variant not found');
//   await Inventory.deleteOne({ variantId });

//   sendSuccess(res, { message: 'Variant deleted' });
// });


import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Product } from '../models/Product.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { Inventory } from '../models/Inventory.model';
import { InventoryTransaction } from '../models/InventoryTransaction.model';
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
  const { name, slug, sku, variant, ...rest } = req.body;
  const finalSlug = slug || slugify(name);

  const existingSlug = await Product.findOne({ slug: finalSlug });
  if (existingSlug) throw AppError.conflict('A product with this slug already exists', 'PRODUCT_SLUG_EXISTS');

  const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
  if (existingSku) throw AppError.conflict('A product with this SKU already exists', 'PRODUCT_SKU_EXISTS');

  if (variant) {
    const existingVariantSku = await ProductVariant.findOne({ sku: variant.sku.toUpperCase() });
    if (existingVariantSku) {
      throw AppError.conflict('A variant with this SKU already exists', 'VARIANT_SKU_EXISTS');
    }
  }

  const product = await Product.create({ name, slug: finalSlug, sku, ...rest });

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