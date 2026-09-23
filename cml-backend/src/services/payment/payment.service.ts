
import { Payment, IPayment, canTransitionPayment } from '../../models/Payment.model';
import { Order, IOrder } from '../../models/Order.model';
import { User } from '../../models/User.model';
import { AppError } from '../../utils/AppError';
import { createCashfreeOrder, fetchCashfreeOrderStatus } from './cashfreeClient';
import { markStockSold } from '../inventory.service';
import { env } from '../../config/env';
import crypto from 'crypto'; 
import { logger } from '@/utils/logger';


function normalizePhoneForCashfree(phone?: string): string {
  if (!phone) return '9999999999';
  const digitsOnly = phone.replace(/\D/g, '');
  // Strip a leading "91" country code if present and the remainder is a valid 10-digit number
  const last10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
  return /^\d{10}$/.test(last10) ? last10 : '9999999999';
}


function mapCashfreeStatus(cfStatus: string): 'Pending' | 'Success' | 'Failed' | 'Cancelled' {
  switch (cfStatus) {
    case 'PAID':
      return 'Success';
    case 'ACTIVE':
      return 'Pending';
    case 'EXPIRED':
      return 'Cancelled';
    case 'TERMINATED':
    case 'TERMINATION_REQUESTED':
      return 'Failed';
    default:
      return 'Pending';
  }
}

/**
 * Creates (or reuses, for retry) a Cashfree payment session for a Pending order.
 * Never trusts client-sent amounts — always pulls the authoritative total from
 * the Order document itself.
 */
// export async function createPaymentSession(userId: string, orderId: string) {
//   const order = await Order.findOne({ _id: orderId, userId });
//   if (!order) throw AppError.notFound('Order not found');

//   if (order.status !== 'Pending') {
//     throw AppError.conflict(`Cannot initiate payment for an order in status "${order.status}"`, 'ORDER_NOT_PAYABLE');
//   }

//   // Retry flow: if a non-terminal payment session already exists for this order, reuse it.
//   const existingPayment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });
//   if (existingPayment && ['Created', 'Pending'].includes(existingPayment.status)) {
//     return existingPayment;
//   }

//   const user = await User.findById(userId);
//   if (!user) throw AppError.notFound('User not found');

//   const attemptNumber = (await Payment.countDocuments({ orderId: order._id })) + 1;
//   const cashfreeOrderId = attemptNumber === 1 ? order.orderNumber : `${order.orderNumber}-R${attemptNumber}`;

//   const result = await createCashfreeOrder(
//     cashfreeOrderId,
//     order.total,
//     {
//       customerId: user._id.toString(),
//       customerName: user.name,
//       customerEmail: user.email,
//       customerPhone: user.phone || '9999999999',
//     },
//     `${env.cors.client}/payment/success?orderId=${order._id}`
//   );

//   const payment = await Payment.create({
//     orderId: order._id,
//     provider: 'cashfree',
//     providerRefId: cashfreeOrderId,
//     cfPaymentSessionId: result.paymentSessionId,
//     amount: order.total,
//     status: 'Pending',
//   });

//   return payment;
// }

// export async function createPaymentSession(userId: string, orderId: string) {
//   const order = await Order.findOne({ _id: orderId, userId });
//   if (!order) throw AppError.notFound('Order not found');

//   if (order.status !== 'Pending') {
//     throw AppError.conflict(`Cannot initiate payment for an order in status "${order.status}"`, 'ORDER_NOT_PAYABLE');
//   }

//   // Retry flow: only reuse an existing session if it's recent. Cashfree's
//   // payment_session_id is short-lived (~30 min) even while the underlying
//   // *order* stays ACTIVE for weeks — so "order still ACTIVE" is not a safe
//   // signal to reuse the session. Age is.
//   const existingPayment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });
//   if (existingPayment && ['Created', 'Pending'].includes(existingPayment.status)) {
//     try {
//       const { orderStatus } = await fetchCashfreeOrderStatus(existingPayment.providerRefId);
//       if (orderStatus === 'ACTIVE') {
//         return existingPayment;
//       }
//       // Not ACTIVE anymore (EXPIRED/PAID/TERMINATED) — mark it terminal locally
//       // so we don't keep re-checking it, then fall through to create a fresh attempt.
//       await applyPaymentStatusChange(existingPayment, mapCashfreeStatus(orderStatus));
//     } catch {
//       // Cashfree couldn't confirm status (e.g. network hiccup) — safer to create
//       // a fresh session than to hand back a session_id we can't verify is alive.
//     }
//   }

//   const user = await User.findById(userId);
//   if (!user) throw AppError.notFound('User not found');

//   const attemptNumber = (await Payment.countDocuments({ orderId: order._id })) + 1;
//   const cashfreeOrderId = attemptNumber === 1 ? order.orderNumber : `${order.orderNumber}-R${attemptNumber}`;

//   const result = await createCashfreeOrder(
//     cashfreeOrderId,
//     order.total,
//     {
//       customerId: user._id.toString(),
//       customerName: user.name,
//       customerEmail: user.email,
//       customerPhone: normalizePhoneForCashfree(user.phone),
//     },
//     `${env.cors.client}/payment/success?orderId=${order._id}`
//   );

//   const payment = await Payment.create({
//     orderId: order._id,
//     provider: 'cashfree',
//     providerRefId: cashfreeOrderId,
//     cfPaymentSessionId: result.paymentSessionId,
//     amount: order.total,
//     status: 'Pending',
//   });

//   return payment;
// }

export async function createPaymentSession(userId: string, orderId: string) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw AppError.notFound('Order not found');

  if (order.status !== 'Pending') {
    throw AppError.conflict(`Cannot initiate payment for an order in status "${order.status}"`, 'ORDER_NOT_PAYABLE');
  }

  // Retry flow: only reuse an existing session if it's recent. Cashfree's
  // payment_session_id is short-lived (~30 min) even while the underlying
  // *order* stays ACTIVE for weeks — so "order still ACTIVE" is not a safe
  // signal to reuse the session. Age is.
  const existingPayment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });
  const REUSE_WINDOW_MS = 10 * 60 * 1000;
  if (
    existingPayment &&
    ['Created', 'Pending'].includes(existingPayment.status) &&
    Date.now() - existingPayment.createdAt.getTime() < REUSE_WINDOW_MS
  ) {
    return existingPayment;
  }

  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');

  // Collision-proof ref id — never derived from a count (that races under
  // concurrent calls: StrictMode double-effect, double-click retry, etc).
  const cashfreeOrderId = `${order.orderNumber}-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(2)
    .toString('hex')}`;

  // Create the Payment row BEFORE calling Cashfree, in "Created" status.
  // The unique index on providerRefId becomes our idempotency lock: a genuine
  // double-submit throws E11000 here, before Cashfree is ever called.
  let payment;
  try {
    payment = await Payment.create({
      orderId: order._id,
      provider: 'cashfree',
      providerRefId: cashfreeOrderId,
      amount: order.total,
      status: 'Created',
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      const dup = await Payment.findOne({ providerRefId: cashfreeOrderId });
      if (dup) return dup; // duplicate call — hand back the row the other request created
    }
    throw err;
  }

  try {
    const result = await createCashfreeOrder(
      cashfreeOrderId,
      order.total,
      {
        customerId: user._id.toString(),
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: normalizePhoneForCashfree(user.phone),
      },
      `${env.cors.client}/payment/success?orderId=${order._id}`
    );

    payment.cfPaymentSessionId = result.paymentSessionId;
    payment.status = 'Pending';
    await payment.save();
  } catch (err) {
    // Cashfree call failed after the row was created — mark it Failed instead
    // of leaving an orphaned "Created" row with no session id.
    payment.status = 'Failed';
    payment.failureReason = 'Cashfree order creation failed';
    await payment.save().catch(() => {});
    throw err;
  }

  return payment;
}

/**
 * Pulls the authoritative status from Cashfree (never trusts the frontend success
 * callback alone) and syncs Payment + Order accordingly. Used both by the polling
 * endpoint and internally after a webhook fires, as a double-check.
 */
export async function syncPaymentStatus(payment: IPayment): Promise<IPayment> {
  if (payment.status === 'Success' || payment.status === 'Failed') {
    return payment; // terminal state — nothing to sync
  }

  const { orderStatus } = await fetchCashfreeOrderStatus(payment.providerRefId);
  const mappedStatus = mapCashfreeStatus(orderStatus);

  if (mappedStatus !== payment.status) {
    await applyPaymentStatusChange(payment, mappedStatus);
  }

  return Payment.findById(payment._id) as Promise<IPayment>;
}

/**
 * Handles the case where a payment settles Success for an order that is no
 * longer Pending — e.g. the customer cancelled it, or the reservation-expiry
 * job already cancelled it, while Cashfree's checkout was still open in
 * another tab (BUG-12). The customer has been charged but there is no order
 * left to fulfil, so this auto-refunds the full amount rather than silently
 * leaving them charged with a cancelled order and no money back.
 *
 * `autoRefundClaimedAt` is claimed with a single atomic findOneAndUpdate so a
 * webhook delivery racing the polling sync endpoint can never both fire the
 * refund for the same payment.
 */
async function handleLatePaymentSuccess(payment: IPayment, order: IOrder): Promise<void> {
  if (payment.autoRefundClaimedAt) return; // already handled

  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, autoRefundClaimedAt: { $exists: false } },
    { $set: { autoRefundClaimedAt: new Date() } }
  );
  if (!claimed) return; // another caller (webhook vs. poll) already claimed this

  logger.error('Payment succeeded for an order that is no longer payable — auto-refunding', {
    paymentId: payment._id.toString(),
    orderId: order._id.toString(),
    orderStatus: order.status,
  });

  if (!order.paymentId) {
    order.paymentId = payment._id;
    await order.save();
  }

  const { initiateRefundForCancelledOrder } = await import('../refund.service');
  await initiateRefundForCancelledOrder(payment, order);
}

/** Applies a verified status change to Payment + the associated Order, idempotently. */
export async function applyPaymentStatusChange(
  payment: IPayment,
  newStatus: 'Pending' | 'Success' | 'Failed' | 'Cancelled'
): Promise<void> {
  if (payment.status === newStatus) return; // already applied — idempotent no-op for webhook replays

  if (!canTransitionPayment(payment.status, newStatus)) {
    logger.warn('Rejected illegal payment status transition', {
      paymentId: payment._id,
      from: payment.status,
      to: newStatus,
    });
    return; // silently ignore — a replayed/out-of-order webhook, not an error
  }

  payment.status = newStatus;
  if (newStatus === 'Success') payment.verifiedAt = new Date();
  if (newStatus === 'Failed' || newStatus === 'Cancelled') payment.failureReason = `Cashfree status: ${newStatus}`;
  await payment.save();

  const order = await Order.findById(payment.orderId);
  if (!order) return;

  if (newStatus === 'Success' && order.status === 'Pending') {
    order.status = 'Confirmed';
    order.paymentId = payment._id;
    await order.save();
    await markStockSold(
      order.items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
      order.orderNumber
    );
  } else if (newStatus === 'Success' && order.status !== 'Pending') {
    // Order moved on (cancelled by the customer, or expired) before this payment
    // settled — see handleLatePaymentSuccess above (BUG-12).
    await handleLatePaymentSuccess(payment, order);
  } else if ((newStatus === 'Failed' || newStatus === 'Cancelled') && order.status === 'Pending') {
    // Payment attempt failed/expired — leave the order Pending with stock still
    // reserved so the customer can retry via createPaymentSession(). Stock is only
    // released on explicit order cancellation (see checkout.service#cancelOrder)
    // or by the reservation-expiry job for orders abandoned entirely.
    order.paymentId = payment._id;
    await order.save();
  }
}