import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { User } from '../models/User.model';
import { Order } from '../models/Order.model';
import { Address } from '../models/Address.model';
import { parsePagination, buildMeta } from '../utils/pagination';

export const adminListCustomers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const filter: Record<string, unknown> = {};
  if (req.query.q) {
    const regex = { $regex: String(req.query.q), $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, { data: { customers: users }, meta: buildMeta(page, limit, total) });
});

export const adminGetCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) throw AppError.notFound('Customer not found');

  const [orders, addresses, orderStats] = await Promise.all([
    Order.find({ userId: id }).sort({ createdAt: -1 }).limit(20),
    Address.find({ userId: id }),
    Order.aggregate([
      { $match: { userId: user._id, status: { $nin: ['Cancelled'] } } },
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
    ]),
  ]);

  sendSuccess(res, {
    data: {
      customer: user,
      addresses,
      recentOrders: orders,
      stats: orderStats[0] || { totalOrders: 0, totalSpent: 0 },
    },
  });
});

export const adminSetCustomerActive = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!user) throw AppError.notFound('Customer not found');

  sendSuccess(res, { message: `Customer ${isActive ? 'activated' : 'deactivated'}`, data: { customer: user } });
});
