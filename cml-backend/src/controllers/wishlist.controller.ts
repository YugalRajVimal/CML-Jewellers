import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Wishlist } from '../models/Wishlist.model';
import { Product } from '../models/Product.model';

// export const listWishlist = asyncHandler(async (req: Request, res: Response) => {
//   const wishlist = await Wishlist.findOne({ userId: req.user!.sub });
//   const productIds = wishlist?.items.map((i) => i.productId) || [];

//   const products = await Product.find({ _id: { $in: productIds }, status: 'active' }).select(
//     'name slug images basePrice mrp ratingAvg'
//   );

//   sendSuccess(res, { data: { products } });
// });

export const listWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await Wishlist.findOne({ userId: req.user!.sub });
  const productIds = wishlist?.items.map((i) => i.productId) || [];

  const products = await Product.find({ _id: { $in: productIds }, status: 'active' }).select(
    'name slug images basePrice mrp ratingAvg'
  );

  // Pull each product's first active variant so "Move to cart" on the frontend has something to add.
  const { ProductVariant } = await import('../models/ProductVariant.model');
  const variants = await ProductVariant.find({ productId: { $in: productIds }, isActive: true }).sort({ createdAt: 1 });
  const firstVariantByProduct = new Map<string, (typeof variants)[number]>();
  for (const v of variants) {
    const key = v.productId.toString();
    if (!firstVariantByProduct.has(key)) firstVariantByProduct.set(key, v);
  }

  const items = products.map((product) => {
    const variant = firstVariantByProduct.get(product._id.toString());
    return {
      id: product._id.toString(),
      product: {
        ...product.toJSON(),
        price: product.basePrice,
        variants: variant ? [variant.toJSON()] : [],
      },
    };
  });

  sendSuccess(res, { data: items }); // bare array of { id, product }
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.body;
  const userId = req.user!.sub;

  const product = await Product.findById(productId);
  if (!product) throw AppError.notFound('Product not found');

  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, items: [] });
  }

  const alreadyAdded = wishlist.items.some((i) => i.productId.toString() === productId);
  if (!alreadyAdded) {
    wishlist.items.push({ productId: product._id, addedAt: new Date() });
    await wishlist.save();
  }

  sendSuccess(res, { message: 'Added to wishlist', data: { wishlist }, statusCode: 201 });
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const userId = req.user!.sub;

  await Wishlist.updateOne({ userId }, { $pull: { items: { productId } } });
  sendSuccess(res, { message: 'Removed from wishlist' });
});
