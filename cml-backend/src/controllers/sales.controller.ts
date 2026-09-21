import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { Order } from '../models/Order.model';

// Same set of statuses dashboard.controller.ts counts as revenue. A "Pending"
// order hasn't been paid for yet (payment may still fail or the reservation
// may expire) and shouldn't be counted as a sale — the old implementation
// only excluded "Cancelled", which meant Pending orders inflated the totals.
const REVENUE_COUNTED_STATUSES = ['Confirmed', 'Processing', 'Shipped', 'Delivered'];

function parseDateRange(query: Record<string, unknown>): { from: Date; to: Date } {
  const to = query.to ? new Date(String(query.to)) : new Date();
  const from = query.from ? new Date(String(query.from)) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from, to };
}

export const getSalesReport = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req.query as Record<string, unknown>);
  const match = { createdAt: { $gte: from, $lte: to }, status: { $in: REVENUE_COUNTED_STATUSES } };

  // Everything below is aggregated in Mongo instead of loading every order
  // into memory, so this stays cheap as order volume grows.
  const [summaryAgg, trendAgg, topProductsAgg, byCategoryAgg] = await Promise.all([
    Order.aggregate([
      { $match: match },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, orderCount: { $sum: 1 } } },
    ]),

    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, label: '$_id', revenue: 1, orders: 1 } },
    ]),

    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          unitsSold: { $sum: '$items.qty' },
          revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, name: 1, sku: 1, unitsSold: 1, revenue: 1 } },
    ]),

    // Order line items don't carry a categoryId snapshot, so join out to the
    // product (as it is today) to get one. A product that's since been
    // deleted, or has no category, is grouped under "Uncategorized" rather
    // than dropped, so the revenue total for this view still reconciles.
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$category.name', 'Uncategorized'] },
          revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $project: { _id: 0, category: '$_id', revenue: 1 } },
    ]),
  ]);

  const totalRevenue = summaryAgg[0]?.totalRevenue ?? 0;
  const orderCount = summaryAgg[0]?.orderCount ?? 0;
  const avgOrderValue = orderCount ? totalRevenue / orderCount : 0;

  sendSuccess(res, {
    data: {
      range: { from, to },
      trend: trendAgg,
      byCategory: byCategoryAgg,
      topProducts: topProductsAgg,
      totalRevenue,
      avgOrderValue,
      orderCount,
    },
  });
});