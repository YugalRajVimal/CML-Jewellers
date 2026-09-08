import { Return, IReturn, canTransitionReturn, ReturnStatus } from '../models/Return.model';
import { Order } from '../models/Order.model';
import { AppError } from '../utils/AppError';
import {
  markStockReturned,
  restoreReturnedStockToAvailable,
  markReturnedStockDamaged,
} from './inventory.service';
import { initiateRefundForReturn } from './refund.service';

export interface RequestReturnInput {
  orderId: string;
  items: { orderItemProductId: string; variantId: string; qty: number; reason: string }[];
  reason: string;
}

export async function requestReturn(userId: string, input: RequestReturnInput): Promise<IReturn> {
  const order = await Order.findOne({ _id: input.orderId, userId });
  if (!order) throw AppError.notFound('Order not found');

  if (order.status !== 'Delivered') {
    throw AppError.conflict('Returns can only be requested for delivered orders', 'ORDER_NOT_DELIVERED');
  }

  // Validate requested items+qty against what was actually ordered.
  for (const reqItem of input.items) {
    const orderItem = order.items.find((i) => i.variantId.toString() === reqItem.variantId);
    if (!orderItem) {
      throw AppError.badRequest('One or more items are not part of this order', 'INVALID_RETURN_ITEM');
    }
    if (reqItem.qty > orderItem.qty) {
      throw AppError.badRequest(`Cannot return more than ${orderItem.qty} unit(s) of this item`, 'INVALID_RETURN_QTY');
    }
  }

  const returnDoc = await Return.create({
    orderId: order._id,
    userId,
    items: input.items,
    reason: input.reason,
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
  return transition(returnId, 'Approved');
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

/** Approves the return for refund: creates a Refund record and moves the Return to Refunded. */
export async function processReturnRefund(returnId: string): Promise<IReturn> {
  const returnDoc = await Return.findById(returnId);
  if (!returnDoc) throw AppError.notFound('Return not found');

  if (!canTransitionReturn(returnDoc.status, 'Refunded')) {
    throw AppError.conflict(`Cannot refund a return in status "${returnDoc.status}"`, 'INVALID_RETURN_TRANSITION');
  }

  const order = await Order.findById(returnDoc.orderId);
  if (!order || !order.paymentId) {
    throw AppError.conflict('No payment found on the associated order to refund', 'NO_PAYMENT_TO_REFUND');
  }

  const refundAmount = returnDoc.items.reduce((sum, item) => {
    const orderItem = order.items.find((oi) => oi.variantId.toString() === item.variantId.toString());
    return sum + (orderItem?.price || 0) * item.qty;
  }, 0);

  const refund = await initiateRefundForReturn(order.paymentId.toString(), returnDoc._id.toString(), refundAmount);

  returnDoc.status = 'Refunded';
  returnDoc.refundId = refund._id;
  await returnDoc.save();

  return returnDoc;
}
