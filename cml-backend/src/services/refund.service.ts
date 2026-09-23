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
 * local Refund doc to match. If the Cashfree call fails, the refund is left on
 * "Initiated" (not force-moved to a false "Completed"/"Processing") so the
 * caller can tell the refund didn't actually go through and offer a retry
 * (BUG-17) — previously nothing distinguished this from a real success. */
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
    // admin — or the retry action below — can attempt the Cashfree call again;
    // provider failures here are frequently transient (rate limits, timeouts).
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
    orderId: payment.orderId,
    returnId,
    amount,
    method: 'cashfree',
    status: 'Initiated',
  });

  return issueCashfreeRefundAndSync(refund, payment.providerRefId);
}

/** Records a manual refund for a return on a COD order — there is no gateway
 * Payment to call out to, so this simply books the refund; an admin marks it
 * Completed (or Failed) once the money has actually been paid back to the
 * customer outside the payment gateway. Previously COD returns had no refund
 * path at all and got stuck at "Inspected" forever (BUG-17). */
export async function initiateManualRefundForReturn(orderId: string, returnId: string, amount: number): Promise<IRefund> {
  return Refund.create({
    orderId,
    returnId,
    amount,
    method: 'manual',
    status: 'Processing',
  });
}

/** Used when a Confirmed (paid, pre-shipment) order is cancelled directly — not via the Return flow. */
export async function initiateRefundForCancelledOrder(payment: { _id: unknown }, order: IOrder): Promise<IRefund> {
  const paymentDoc = await Payment.findById(payment._id);
  const refund = await Refund.create({
    paymentId: payment._id,
    orderId: order._id,
    amount: order.total,
    method: 'cashfree',
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

/** Re-attempts a Cashfree refund call for a refund stuck on "Initiated" after a
 * prior provider failure (BUG-17). Manual (COD) refunds have no gateway call to
 * retry — those are moved to Completed/Failed directly via transitionRefund. */
export async function retryRefund(refundId: string): Promise<IRefund> {
  const refund = await Refund.findById(refundId);
  if (!refund) throw AppError.notFound('Refund not found');

  if (refund.method === 'manual') {
    throw AppError.conflict('Manual refunds are completed directly, not retried', 'MANUAL_REFUND_NOT_RETRYABLE');
  }
  if (refund.status !== 'Initiated') {
    throw AppError.conflict(`Cannot retry a refund in status "${refund.status}"`, 'REFUND_NOT_RETRYABLE');
  }
  if (!refund.paymentId) {
    throw AppError.conflict('Refund has no associated payment to retry', 'NO_PAYMENT_TO_REFUND');
  }

  const payment = await Payment.findById(refund.paymentId);
  if (!payment) throw AppError.notFound('Payment not found');

  return issueCashfreeRefundAndSync(refund, payment.providerRefId);
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