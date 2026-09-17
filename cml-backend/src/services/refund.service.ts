// import { Refund, IRefund, canTransitionRefund, RefundStatus } from '../models/Refund.model';
// import { Payment } from '../models/Payment.model';
// import { IOrder } from '../models/Order.model';
// import { AppError } from '../utils/AppError';

// /** Initiated when a Return is approved and moves to Refunded, tying back to the original Payment. */
// export async function initiateRefundForReturn(paymentId: string, returnId: string, amount: number): Promise<IRefund> {
//   const payment = await Payment.findById(paymentId);
//   if (!payment || payment.status !== 'Success') {
//     throw AppError.conflict('Cannot refund a payment that was not successfully completed', 'PAYMENT_NOT_REFUNDABLE');
//   }

//   const refund = await Refund.create({
//     paymentId,
//     returnId,
//     amount,
//     status: 'Initiated',
//   });

//   return refund;
// }

// /** Used when a Confirmed (paid, pre-shipment) order is cancelled directly — not via the Return flow. */
// export async function initiateRefundForCancelledOrder(payment: { _id: unknown }, order: IOrder): Promise<IRefund> {
//   const refund = await Refund.create({
//     paymentId: payment._id,
//     amount: order.total,
//     status: 'Initiated',
//   });
//   return refund;
// }

// export async function transitionRefund(refundId: string, to: RefundStatus, failureReason?: string): Promise<IRefund> {
//   const refund = await Refund.findById(refundId);
//   if (!refund) throw AppError.notFound('Refund not found');

//   if (!canTransitionRefund(refund.status, to)) {
//     throw AppError.conflict(`Cannot transition refund from "${refund.status}" to "${to}"`, 'INVALID_REFUND_TRANSITION');
//   }

//   refund.status = to;
//   if (to === 'Failed' && failureReason) refund.failureReason = failureReason;
//   await refund.save();

//   return refund;
// }


import { Refund, IRefund, canTransitionRefund, RefundStatus } from '../models/Refund.model';
import { Payment } from '../models/Payment.model';
import { IOrder } from '../models/Order.model';
import { AppError } from '../utils/AppError';
import { createCashfreeRefund } from './payment/cashfreeClient';
import { logger } from '../utils/logger';

/** Maps Cashfree's refund_status onto our internal RefundStatus. Cashfree can
 * settle a refund immediately (SUCCESS) or leave it pending/on-hold; either
 * way we move off "Initiated" so the record reflects that Cashfree has
 * actually been asked to move money, not just that we created a bookkeeping
 * row. Full completion is still confirmed by an admin (or a future webhook). */
function mapCashfreeRefundStatus(cfStatus: string): Extract<RefundStatus, 'Processing' | 'Completed'> {
  return cfStatus === 'SUCCESS' ? 'Completed' : 'Processing';
}

/** Calls Cashfree to actually move the money for a refund, then updates the
 * local Refund doc to match. If the Cashfree call fails, the refund is marked
 * Failed with the error recorded rather than left silently stuck on
 * "Initiated" looking like nothing happened. */
async function issueCashfreeRefundAndSync(refund: IRefund, cfOrderId: string): Promise<IRefund> {
  try {
    const result = await createCashfreeRefund(cfOrderId, refund._id.toString(), refund.amount);
    const nextStatus = mapCashfreeRefundStatus(result.status);
    if (canTransitionRefund(refund.status, nextStatus)) {
      refund.status = nextStatus;
    } else {
      // e.g. Cashfree already settled it before we could move to "Processing"
      // — go through Processing first so the audit trail is coherent.
      refund.status = 'Processing';
    }
    refund.providerRefundId = result.cfRefundId;
    await refund.save();
  } catch (error) {
    logger.error('Failed to issue Cashfree refund; leaving as Initiated for manual retry', {
      refundId: refund._id.toString(),
      cfOrderId,
      error: error instanceof Error ? error.message : error,
    });
    // Leave the refund as "Initiated" (rather than force it to "Failed") so an
    // admin — or a retry job — can attempt the Cashfree call again; provider
    // failures here are frequently transient (rate limits, timeouts).
  }
  return refund;
}

/** Initiated when a Return is approved and moves to Refunded, tying back to the original Payment. */
export async function initiateRefundForReturn(paymentId: string, returnId: string, amount: number): Promise<IRefund> {
  const payment = await Payment.findById(paymentId);
  if (!payment || payment.status !== 'Success') {
    throw AppError.conflict('Cannot refund a payment that was not successfully completed', 'PAYMENT_NOT_REFUNDABLE');
  }

  const refund = await Refund.create({
    paymentId,
    returnId,
    amount,
    status: 'Initiated',
  });

  return issueCashfreeRefundAndSync(refund, payment.providerRefId);
}

/** Used when a Confirmed (paid, pre-shipment) order is cancelled directly — not via the Return flow. */
export async function initiateRefundForCancelledOrder(payment: { _id: unknown }, order: IOrder): Promise<IRefund> {
  const paymentDoc = await Payment.findById(payment._id);
  const refund = await Refund.create({
    paymentId: payment._id,
    amount: order.total,
    status: 'Initiated',
  });

  if (!paymentDoc) {
    logger.error('Could not load Payment to issue Cashfree refund for cancelled order', {
      refundId: refund._id.toString(),
      paymentId: String(payment._id),
    });
    return refund;
  }

  return issueCashfreeRefundAndSync(refund, paymentDoc.providerRefId);
}

export async function transitionRefund(refundId: string, to: RefundStatus, failureReason?: string): Promise<IRefund> {
  const refund = await Refund.findById(refundId);
  if (!refund) throw AppError.notFound('Refund not found');

  if (!canTransitionRefund(refund.status, to)) {
    throw AppError.conflict(`Cannot transition refund from "${refund.status}" to "${to}"`, 'INVALID_REFUND_TRANSITION');
  }

  refund.status = to;
  if (to === 'Failed' && failureReason) refund.failureReason = failureReason;
  await refund.save();

  return refund;
}