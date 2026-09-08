import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { Order } from '../models/Order.model';
import { parsePagination, buildMeta } from '../utils/pagination';
import * as checkoutService from '../services/checkout.service';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { addressId } = req.body;
  const order = await checkoutService.createOrderFromCart(req.user!.sub, addressId);
  sendSuccess(res, { message: 'Order placed', data: { order }, statusCode: 201 });
});

export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const [items, total] = await Promise.all([
    Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ userId }),
  ]);

  sendSuccess(res, { data: { orders: items }, meta: buildMeta(page, limit, total) });
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await checkoutService.getOrderForUser(req.user!.sub, id);
  sendSuccess(res, { data: { order } });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const order = await checkoutService.cancelOrder(req.user!.sub, id, reason);
  sendSuccess(res, { message: 'Order cancelled', data: { order } });
});
