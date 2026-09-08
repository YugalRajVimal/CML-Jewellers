import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Review } from '../models/Review.model';
import { Product } from '../models/Product.model';
import { Order } from '../models/Order.model';
import { parsePagination, buildMeta } from '../utils/pagination';

// ---------- Public ----------

export const listProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const filter = { productId, status: 'approved' };
  const [items, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name'),
    Review.countDocuments(filter),
  ]);

  sendSuccess(res, { data: { reviews: items }, meta: buildMeta(page, limit, total) });
});

// ---------- Customer ----------

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { productId, rating, title, comment } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw AppError.notFound('Product not found');

  const existing = await Review.findOne({ productId, userId });
  if (existing) throw AppError.conflict('You have already reviewed this product', 'REVIEW_ALREADY_EXISTS');

  // Mark as a verified-purchase review if the user has a Delivered order containing this product.
  const verifiedOrder = await Order.findOne({
    userId,
    status: 'Delivered',
    'items.productId': productId,
  }).select('_id');

  const review = await Review.create({
    productId,
    userId,
    orderId: verifiedOrder?._id,
    rating,
    title,
    comment,
    status: 'pending',
  });

  sendSuccess(res, { message: 'Review submitted for moderation', data: { review }, statusCode: 201 });
});

// ---------- Admin ----------

export const adminListReviews = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  const reviews = await Review.find(filter).sort({ createdAt: -1 }).populate('userId', 'name').populate('productId', 'name slug');
  sendSuccess(res, { data: { reviews } });
});

async function recomputeProductRating(productId: string): Promise<void> {
  const agg = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratingAvg: agg[0]?.avg ? Math.round(agg[0].avg * 10) / 10 : 0,
    ratingCount: agg[0]?.count || 0,
  });
}

export const adminModerateReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, moderationNote } = req.body;

  const review = await Review.findByIdAndUpdate(id, { status, moderationNote }, { new: true });
  if (!review) throw AppError.notFound('Review not found');

  await recomputeProductRating(review.productId.toString());

  sendSuccess(res, { message: `Review ${status}`, data: { review } });
});
