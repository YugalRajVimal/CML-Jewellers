import { Refund, IRefund, canTransitionRefund, RefundStatus } from '../models/Refund.model';
import { Payment } from '../models/Payment.model';
import { IOrder } from '../models/Order.model';
import { AppError } from '../utils/AppError';

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

  return refund;
}

/** Used when a Confirmed (paid, pre-shipment) order is cancelled directly — not via the Return flow. */
export async function initiateRefundForCancelledOrder(payment: { _id: unknown }, order: IOrder): Promise<IRefund> {
  const refund = await Refund.create({
    paymentId: payment._id,
    amount: order.total,
    status: 'Initiated',
  });
  return refund;
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
