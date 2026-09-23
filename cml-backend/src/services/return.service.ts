import { Return, IReturn, canTransitionReturn, ReturnStatus } from '../models/Return.model';
import { Order } from '../models/Order.model';
import { Refund } from '../models/Refund.model';
import { AppError } from '../utils/AppError';
import {
  markStockReturned,
  restoreReturnedStockToAvailable,
  markReturnedStockDamaged,
} from './inventory.service';
import { initiateRefundForReturn, initiateManualRefundForReturn, retryRefund } from './refund.service';
import { roundMoney } from './pricing.service';
import { createReverseShipmentForReturn } from './shipping/shiprocket.service';
import { logger } from '../utils/logger';

export interface RequestReturnInput {
  orderId: string;
  items?: { orderItemProductId: string; variantId: string; qty: number; reason: string }[];
  reason: string;
  notes?: string;
}

/** Customer-facing return window — the PDP promises 7 days from delivery. */
const RETURN_WINDOW_DAYS = 7;

// Return statuses that represent "this return is (or was) actively claiming stock/
// refund capacity against the order" — used to compute what's already been
// returned/refunded so a second return on the same order can't double-dip.
const ACTIVE_RETURN_STATUSES: ReturnStatus[] = ['Approved', 'PickedUp', 'Received', 'Inspected', 'Refunded'];

export async function requestReturn(userId: string, input: RequestReturnInput): Promise<IReturn> {
  const order = await Order.findOne({ _id: input.orderId, userId });
  if (!order) throw AppError.notFound('Order not found');

  if (order.status !== 'Delivered') {
    throw AppError.conflict('Returns can only be requested for delivered orders', 'ORDER_NOT_DELIVERED');
  }

  // 7-day return window, measured from delivery (BUG-17 — previously unenforced).
  if (order.deliveredAt) {
    const deadline = new Date(order.deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    if (Date.now() > deadline.getTime()) {
      throw AppError.conflict('The return window for this order has passed', 'RETURN_WINDOW_EXPIRED');
    }
  }

  // No item-level breakdown from the client — default to returning every line in full.
  const items =
    input.items ??
    order.items.map((oi) => ({
      orderItemProductId: oi.productId.toString(),
      variantId: oi.variantId.toString(),
      qty: oi.qty,
      reason: input.reason,
    }));

  // Reject duplicate lines for the same variant within this one request — otherwise
  // the same unit could be counted (and refunded) twice (BUG-17).
  const seenVariants = new Set<string>();
  for (const reqItem of items) {
    if (seenVariants.has(reqItem.variantId)) {
      throw AppError.badRequest('Each item can only appear once in a return request', 'DUPLICATE_RETURN_ITEM');
    }
    seenVariants.add(reqItem.variantId);
  }

  // Cumulative-quantity guard: a variant can't be returned more times in total
  // (across any prior active returns on this order) than was originally ordered.
  const priorReturns = await Return.find({ orderId: order._id, status: { $in: ACTIVE_RETURN_STATUSES } }).select('items');
  const alreadyReturnedByVariant = new Map<string, number>();
  for (const r of priorReturns) {
    for (const i of r.items) {
      const key = i.variantId.toString();
      alreadyReturnedByVariant.set(key, (alreadyReturnedByVariant.get(key) ?? 0) + i.qty);
    }
  }

  for (const reqItem of items) {
    const orderItem = order.items.find((i) => i.variantId.toString() === reqItem.variantId);
    if (!orderItem) {
      throw AppError.badRequest('One or more items are not part of this order', 'INVALID_RETURN_ITEM');
    }
    const alreadyReturned = alreadyReturnedByVariant.get(reqItem.variantId) ?? 0;
    if (alreadyReturned + reqItem.qty > orderItem.qty) {
      throw AppError.badRequest(
        `Cannot return more than ${orderItem.qty - alreadyReturned} remaining unit(s) of this item`,
        'INVALID_RETURN_QTY'
      );
    }
  }

  const fullReason = input.notes ? `${input.reason} — ${input.notes}` : input.reason;

  const returnDoc = await Return.create({
    orderId: order._id,
    userId,
    items,
    reason: fullReason,
    status: 'Requested',
  });

  order.status = 'ReturnRequested';
  await order.save();

  return returnDoc;
}

async function transition(returnId: string, to: ReturnStatus): Promise<IReturn> {
  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw AppError.notFound('Return not found');

  if (!canTransitionReturn(returnDoc.status, to)) {
    throw AppError.conflict(`Cannot transition return from "${returnDoc.status}" to "${to}"`, 'INVALID_RETURN_TRANSITION');
  }

  returnDoc.status = to;
  await returnDoc.save();
  return returnDoc;
}

export async function approveReturn(returnId: string): Promise<IReturn> {
  const returnDoc = await transition(returnId, 'Approved');

  // Per the chosen return-logistics approach: use Shiprocket's own
  // return-order API, which auto-generates the reverse-pickup AWB, rather
  // than a manual "PickedUp" admin click. If this call fails, the return
  // stays Approved and an admin can still fall back to the manual PickedUp
  // action — this shouldn't block approvals on a Shiprocket outage.
  const order = await Order.findById(returnDoc.orderId);
  if (order) {
    try {
      await createReverseShipmentForReturn(returnDoc, order);
    } catch (error) {
      logger.error('Failed to auto-create Shiprocket reverse pickup for approved return', {
        returnId: returnDoc._id.toString(),
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  return returnDoc;
}

export async function rejectReturn(returnId: string, reason: string): Promise<IReturn> {
  const returnDoc = await transition(returnId, 'Rejected');
  returnDoc.rejectionReason = reason;
  await returnDoc.save();

  // Order stays out of the return flow — revert it to Delivered so the customer isn't stuck.
  const order = await Order.findById(returnDoc.orderId);
  if (order && order.status === 'ReturnRequested') {
    order.status = 'Delivered';
    await order.save();
  }

  return returnDoc;
}

export async function markPickedUp(returnId: string): Promise<IReturn> {
  return transition(returnId, 'PickedUp');
}

export async function markReceived(returnId: string): Promise<IReturn> {
  const returnDoc = await transition(returnId, 'Received');

  await markStockReturned(
    returnDoc.items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
    returnDoc._id.toString()
  );

  return returnDoc;
}

/** Inspection outcome decides whether stock is restored to sale or written off as damaged. */
export async function inspectReturn(returnId: string, passed: boolean, notes?: string): Promise<IReturn> {
  const returnDoc = await transition(returnId, 'Inspected');
  returnDoc.inspectionNotes = notes;
  await returnDoc.save();

  const stockLines = returnDoc.items.map((i) => ({ variantId: i.variantId, qty: i.qty }));
  if (passed) {
    await restoreReturnedStockToAvailable(stockLines, returnDoc._id.toString());
  } else {
    await markReturnedStockDamaged(stockLines, returnDoc._id.toString());
  }

  return returnDoc;
}

/**
 * Approves the return for refund: computes a pro-rated refund amount, caps it
 * against whatever's already been refunded on this order, then either calls out
 * to Cashfree (Prepaid orders) or books a manual refund (COD orders — BUG-17,
 * these previously had no refund path at all and got stuck here forever).
 * The Return only moves to "Refunded" once the refund has actually completed;
 * otherwise it stays "Inspected" so `retryReturnRefund` can be used to retry it,
 * rather than a failed Cashfree call silently reporting success (BUG-17).
 */
export async function processReturnRefund(returnId: string): Promise<IReturn> {
  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw AppError.notFound('Return not found');

  if (!canTransitionReturn(returnDoc.status, 'Refunded')) {
    throw AppError.conflict(`Cannot refund a return in status "${returnDoc.status}"`, 'INVALID_RETURN_TRANSITION');
  }

  const order = await Order.findById(returnDoc.orderId);
  if (!order) {
    throw AppError.conflict('The order associated with this return no longer exists', 'ORDER_NOT_FOUND');
  }

  // Pro-rate the order-level discount and tax across the returned items instead of
  // refunding gross item price, which ignored both (BUG-17).
  const itemsSubtotal = order.items.reduce((sum, oi) => sum + oi.price * oi.qty, 0);
  const returnedItemsSubtotal = returnDoc.items.reduce((sum, item) => {
    const orderItem = order.items.find((oi) => oi.variantId.toString() === item.variantId.toString());
    return sum + (orderItem?.price || 0) * item.qty;
  }, 0);
  const proration = itemsSubtotal > 0 ? returnedItemsSubtotal / itemsSubtotal : 0;
  const discountShare = roundMoney(order.discount * proration);
  const taxShare = roundMoney(order.tax * proration);
  let refundAmount = roundMoney(Math.max(0, returnedItemsSubtotal - discountShare + taxShare));

  // Cap cumulative refunds against this order so repeated retries or multiple
  // partial returns can never refund more in total than was actually paid (BUG-17).
  const priorRefunds = await Refund.find({ orderId: order._id, status: { $ne: 'Failed' } }).select('amount');
  const alreadyRefunded = priorRefunds.reduce((sum, r) => sum + r.amount, 0);
  const remaining = roundMoney(Math.max(0, order.total - alreadyRefunded));
  refundAmount = Math.min(refundAmount, remaining);

  if (refundAmount <= 0) {
    throw AppError.conflict('There is nothing left to refund on this order', 'NOTHING_TO_REFUND');
  }

  const refund = order.paymentId
    ? await initiateRefundForReturn(order.paymentId.toString(), returnDoc._id.toString(), refundAmount)
    : await initiateManualRefundForReturn(order._id.toString(), returnDoc._id.toString(), refundAmount);

  returnDoc.refundId = refund._id;
  if (refund.status === 'Completed') {
    returnDoc.status = 'Refunded';
  }
  // Otherwise the refund is Initiated/Processing/Failed — the return stays
  // "Inspected" (not falsely "Refunded") so it can be retried below.
  await returnDoc.save();

  return returnDoc;
}

/** Retries a return's refund after a prior provider failure left it stuck
 * (BUG-17's "add an admin retry refund action"). */
export async function retryReturnRefund(returnId: string): Promise<IReturn> {
  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw AppError.notFound('Return not found');
  if (!returnDoc.refundId) {
    throw AppError.conflict('No refund has been initiated for this return yet', 'NO_REFUND_TO_RETRY');
  }

  const refund = await retryRefund(returnDoc.refundId.toString());

  if (refund.status === 'Completed' && returnDoc.status !== 'Refunded') {
    returnDoc.status = 'Refunded';
    await returnDoc.save();
  }

  return returnDoc;
}