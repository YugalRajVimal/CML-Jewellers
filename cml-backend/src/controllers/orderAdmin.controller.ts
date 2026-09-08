import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Order, canTransitionOrder, OrderStatus } from '../models/Order.model';
import { parsePagination, buildMeta } from '../utils/pagination';

export const adminListOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.userId) filter.userId = req.query.userId;
  if (req.query.q) {
    filter.orderNumber = { $regex: String(req.query.q), $options: 'i' };
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name email phone'),
    Order.countDocuments(filter),
  ]);

  sendSuccess(res, { data: { orders: items }, meta: buildMeta(page, limit, total) });
});

export const adminGetOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await Order.findById(id).populate('userId', 'name email phone');
  if (!order) throw AppError.notFound('Order not found');
  sendSuccess(res, { data: { order } });
});

/**
 * Manually advances order fulfillment status (Confirmed -> Processing -> Shipped ->
 * Delivered). Payment-driven transitions (Pending -> Confirmed) happen automatically
 * via the payment webhook and are rejected here to avoid double-handling.
 */
export const adminUpdateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: OrderStatus };

  const order = await Order.findById(id);
  if (!order) throw AppError.notFound('Order not found');

  if (status === 'Confirmed') {
    throw AppError.badRequest(
      'Order confirmation happens automatically once payment succeeds, not via manual status update',
      'MANUAL_CONFIRM_NOT_ALLOWED'
    );
  }

  if (!canTransitionOrder(order.status, status)) {
    throw AppError.conflict(`Cannot transition order from "${order.status}" to "${status}"`, 'INVALID_ORDER_TRANSITION');
  }

  order.status = status;
  await order.save();

  sendSuccess(res, { message: `Order status updated to ${status}`, data: { order } });
});
