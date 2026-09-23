import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Order, canTransitionOrder, OrderStatus } from '../models/Order.model';
import { parsePagination, buildMeta } from '../utils/pagination';
import { logger } from '../utils/logger';
import * as shiprocketService from '../services/shipping/shiprocket.service';
import * as checkoutService from '../services/checkout.service';

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
 *
 * Moving Confirmed -> Processing also creates the Shiprocket order for this
 * shipment (but does NOT auto-assign a courier/AWB — per the chosen workflow
 * an admin picks the courier manually via the /shipping/* endpoints below).
 * If Shiprocket isn't configured yet or the call fails, the status change
 * still goes through — shipment creation can be retried from the order detail
 * page rather than blocking fulfilment on a third-party outage.
 */
export const adminUpdateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body as { status: OrderStatus; reason?: string };

  if (status === 'Confirmed') {
    throw AppError.badRequest(
      'Order confirmation happens automatically once payment succeeds, not via manual status update',
      'MANUAL_CONFIRM_NOT_ALLOWED'
    );
  }

  // Returns are only ever initiated by the customer through the returns flow
  // (see return.service#requestReturn) — an admin manually forcing an order into
  // ReturnRequested would bypass that flow's own validation entirely (BUG-10).
  if (status === ('ReturnRequested' as OrderStatus)) {
    throw AppError.badRequest(
      'Return requests are created by the customer through the returns flow, not set manually',
      'MANUAL_RETURN_REQUEST_NOT_ALLOWED'
    );
  }

  // Cancelling is not a plain status flip: it must release/return stock, free up
  // a used coupon slot, and refund a paid order — all of which
  // checkout.service#cancelOrderByAdmin now handles (BUG-10; previously this just
  // set status='Cancelled' and did nothing else).
  if (status === 'Cancelled') {
    const order = await checkoutService.cancelOrderByAdmin(id, reason);
    sendSuccess(res, { message: 'Order cancelled', data: { order } });
    return;
  }

  const order = await Order.findById(id);
  if (!order) throw AppError.notFound('Order not found');

  if (!canTransitionOrder(order.status, status)) {
    throw AppError.conflict(`Cannot transition order from "${order.status}" to "${status}"`, 'INVALID_ORDER_TRANSITION');
  }

  const wasConfirmed = order.status === 'Confirmed';
  order.status = status;
  await order.save();

  let shipmentWarning: string | undefined;
  if (wasConfirmed && status === 'Processing' && !order.shipment?.shiprocketShipmentId) {
    try {
      await shiprocketService.createShipmentForOrder(order);
    } catch (error) {
      logger.error('Failed to auto-create Shiprocket shipment on Confirmed -> Processing', {
        orderId: order._id.toString(),
        error: error instanceof Error ? error.message : error,
      });
      shipmentWarning = 'Order status updated, but creating the Shiprocket shipment failed — retry from this order.';
    }
  }

  sendSuccess(res, {
    message: shipmentWarning ?? `Order status updated to ${status}`,
    data: { order },
  });
});

// ---------------------------------------------------------------------------
// Shipping (Shiprocket) — manual courier selection workflow:
//   1. GET  /:id/shipping/couriers   -> serviceability check, list couriers
//   2. POST /:id/shipping/awb        -> assign the admin-chosen courier's AWB
//   3. POST /:id/shipping/pickup     -> schedule courier pickup
//   4. POST /:id/shipping/sync       -> defensive tracking sync (webhook may not fire)
// ---------------------------------------------------------------------------

export const adminGetShippingCouriers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) throw AppError.notFound('Order not found');

  const couriers = await shiprocketService.checkServiceabilityForOrder(order);
  sendSuccess(res, { data: { couriers } });
});

export const adminAssignShippingCourier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { courierId } = req.body as { courierId: string };
  const order = await Order.findById(id);
  if (!order) throw AppError.notFound('Order not found');

  const result = await shiprocketService.assignCourierToOrder(order, courierId);
  sendSuccess(res, { message: 'Courier assigned', data: { order, awb: result } });
});

export const adminSchedulePickup = asyncHandler(async (req: Request, res: Response) => {});

export const adminScheduleShippingPickup = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) throw AppError.notFound('Order not found');

  const result = await shiprocketService.schedulePickupForOrder(order);
  sendSuccess(res, { message: 'Pickup scheduled', data: { order, pickup: result } });
});

export const adminSyncShippingTracking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) throw AppError.notFound('Order not found');

  const updated = await shiprocketService.syncTrackingForOrder(order);
  sendSuccess(res, { data: { order: updated } });
});