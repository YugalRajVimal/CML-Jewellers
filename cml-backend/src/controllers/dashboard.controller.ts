import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { Order } from '../models/Order.model';
import { Inventory } from '../models/Inventory.model';
import { User } from '../models/User.model';
import { AuditLog } from '../models/AuditLog.model';
import { Return } from '../models/Return.model';

const REVENUE_COUNTED_STATUSES = ['Confirmed', 'Processing', 'Shipped', 'Delivered'];

function parseDateRange(query: Record<string, unknown>): { from: Date; to: Date } {
  const to = query.to ? new Date(String(query.to)) : new Date();
  const from = query.from ? new Date(String(query.from)) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from, to };
}

/** Top-line summary: revenue, order count, average order value, new customers — for a date range. */
export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req.query as Record<string, unknown>);

  const [revenueAgg, newCustomers, lowStockCount, pendingReturns] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: { $in: REVENUE_COUNTED_STATUSES } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orderCount: { $sum: 1 } } },
    ]),
    User.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    Inventory.countDocuments({ $expr: { $lte: ['$available', '$lowStockThreshold'] } }),
    Return.countDocuments({ status: 'Requested' }),
  ]);

  const revenue = revenueAgg[0]?.revenue || 0;
  const orderCount = revenueAgg[0]?.orderCount || 0;

  sendSuccess(res, {
    data: {
      range: { from, to },
      revenue,
      orderCount,
      averageOrderValue: orderCount > 0 ? Math.round((revenue / orderCount) * 100) / 100 : 0,
      newCustomers,
      lowStockCount,
      pendingReturns,
    },
  });
});

/** Revenue + order count trend, bucketed by day, for charting. */
export const getRevenueTrend = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req.query as Record<string, unknown>);

  const trend = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to }, status: { $in: REVENUE_COUNTED_STATUSES } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } },
  ]);

  sendSuccess(res, { data: { trend } });
});

/** Order counts broken down by current status — useful for a fulfillment-pipeline widget. */
export const getOrderStatusBreakdown = asyncHandler(async (_req: Request, res: Response) => {
  const breakdown = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
  ]);

  sendSuccess(res, { data: { breakdown } });
});

/** Top-selling products by units sold within the range, based on order line items. */
export const getTopProducts = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = parseDateRange(req.query as Record<string, unknown>);
  const limit = Math.min(parseInt(String(req.query.limit || '10'), 10) || 10, 50);

  const topProducts = await Order.aggregate([
    { $match: { createdAt: { $gte: from, $lte: to }, status: { $in: REVENUE_COUNTED_STATUSES } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        unitsSold: { $sum: '$items.qty' },
        revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: limit },
  ]);

  sendSuccess(res, { data: { topProducts } });
});

/** Low-stock items needing reorder attention. */
export const getLowStockItems = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10) || 20, 100);

  const items = await Inventory.find({ $expr: { $lte: ['$available', '$lowStockThreshold'] } })
    .populate('variantId', 'sku attributes productId')
    .sort({ available: 1 })
    .limit(limit);

  sendSuccess(res, { data: { items } });
});

/** Recent admin activity feed, sourced from AuditLog. */
export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(String(req.query.limit || '20'), 10) || 20, 100);

  const activity = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('adminUserId', 'name email');

  sendSuccess(res, { data: { activity } });
});
