import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { Order } from '../models/Order.model';

export const getSalesReport = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await Order.find({ status: { $ne: 'Cancelled' } }).select('total items status createdAt');

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = orders.length;
  const avgOrderValue = orderCount ? totalRevenue / orderCount : 0;

  // Revenue trend bucketed by day (last 30 days) — adjust bucketing to taste.
  const trendMap = new Map<string, { revenue: number; orders: number }>();
  orders.forEach((o) => {
    const label = o.createdAt.toISOString().slice(0, 10);
    const entry = trendMap.get(label) ?? { revenue: 0, orders: 0 };
    entry.revenue += o.total;
    entry.orders += 1;
    trendMap.set(label, entry);
  });
  const trend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, v]) => ({ label, ...v }));

  sendSuccess(res, {
    data: { trend, totalRevenue, avgOrderValue, orderCount },
  });
});