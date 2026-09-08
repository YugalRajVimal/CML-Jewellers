import { Payment, IPayment } from '../../models/Payment.model';
import { Order } from '../../models/Order.model';
import { User } from '../../models/User.model';
import { AppError } from '../../utils/AppError';
import { createCashfreeOrder, fetchCashfreeOrderStatus } from './cashfreeClient';
import { markStockSold } from '../inventory.service';
import { env } from '../../config/env';

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
export async function createPaymentSession(userId: string, orderId: string) {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw AppError.notFound('Order not found');

  if (order.status !== 'Pending') {
    throw AppError.conflict(`Cannot initiate payment for an order in status "${order.status}"`, 'ORDER_NOT_PAYABLE');
  }

  // Retry flow: if a non-terminal payment session already exists for this order, reuse it.
  const existingPayment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });
  if (existingPayment && ['Created', 'Pending'].includes(existingPayment.status)) {
    return existingPayment;
  }

  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');

  const attemptNumber = (await Payment.countDocuments({ orderId: order._id })) + 1;
  const cashfreeOrderId = attemptNumber === 1 ? order.orderNumber : `${order.orderNumber}-R${attemptNumber}`;

  const result = await createCashfreeOrder(
    cashfreeOrderId,
    order.total,
    {
      customerId: user._id.toString(),
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone || '9999999999',
    },
    `${env.cors.client}/order-confirmation?orderId=${order._id}`
  );

  const payment = await Payment.create({
    orderId: order._id,
    provider: 'cashfree',
    providerRefId: cashfreeOrderId,
    cfPaymentSessionId: result.paymentSessionId,
    amount: order.total,
    status: 'Pending',
  });

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

/** Applies a verified status change to Payment + the associated Order, idempotently. */
export async function applyPaymentStatusChange(
  payment: IPayment,
  newStatus: 'Pending' | 'Success' | 'Failed' | 'Cancelled'
): Promise<void> {
  if (payment.status === newStatus) return; // already applied — idempotent no-op for webhook replays

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
  } else if ((newStatus === 'Failed' || newStatus === 'Cancelled') && order.status === 'Pending') {
    // Payment attempt failed/expired — leave the order Pending with stock still
    // reserved so the customer can retry via createPaymentSession(). Stock is only
    // released on explicit order cancellation (see checkout.service#cancelOrder).
    // NOTE: production deployments should add a reservation-expiry job to release
    // stock for Pending orders whose payment attempts have gone stale entirely.
    order.paymentId = payment._id;
    await order.save();
  }
}
