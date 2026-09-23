import mongoose from 'mongoose';
import { ICart } from '../models/Cart.model';
import { Order, IOrder } from '../models/Order.model';
import { Address } from '../models/Address.model';
import { Product } from '../models/Product.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { AppError } from '../utils/AppError';
import { revalidateCart, computeCartTotals, getOrCreateCart } from './cart.service';
import { reserveStock, markStockSold } from './inventory.service';
import { generateOrderNumber } from '../utils/orderNumber';
import { getSettings } from '../models/Setting.model';
import { incrementCouponUsage, decrementCouponUsage } from './coupon.service';
import { logger } from '../utils/logger';

export async function validateCheckout(userId: string, addressId: string) {
  const cart = await getOrCreateCart(userId);
  if (cart.items.length === 0) {
    throw AppError.badRequest('Your cart is empty', 'CART_EMPTY');
  }

  const { issues } = await revalidateCart(cart);

  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) {
    throw AppError.badRequest('Delivery address not found', 'ADDRESS_NOT_FOUND');
  }

  const blockingIssues = issues.filter((i) => i.reason === 'OUT_OF_STOCK' || i.reason === 'PRODUCT_UNAVAILABLE');
  if (blockingIssues.length > 0 || cart.items.length === 0) {
    throw AppError.conflict('Some items in your cart are unavailable', 'CART_HAS_BLOCKING_ISSUES', { issues });
  }

  const totals = await computeCartTotals(cart);

  return { cart, address, totals, issues };
}

/**
 * Creates a PENDING order from the cart: re-validates one final time, atomically
 * reserves inventory for every line (all-or-nothing), snapshots address+items,
 * then clears the cart. Payment creation/verification is wired up in EPIC 4.
 */
export async function createOrderFromCart(userId: string, addressId: string, paymentMethod: 'Prepaid' | 'COD' = 'Prepaid') {
  const { cart, address, totals } = await validateCheckout(userId, addressId);

  if (paymentMethod === 'COD') {
    const settings = await getSettings();
    if (!settings.codEnabled) {
      throw AppError.conflict('Cash on Delivery is not available right now', 'COD_NOT_ENABLED');
    }
  }

  const orderNumber = generateOrderNumber();
  const stockLines = cart.items.map((item) => ({ variantId: item.variantId, qty: item.qty }));
  await reserveStock(stockLines, orderNumber);

  try {
    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const [product, variant] = await Promise.all([
          Product.findById(item.productId).select('name images'),
          ProductVariant.findById(item.variantId).select('sku'),
        ]);
        return {
          productId: item.productId,
          variantId: item.variantId,
          name: product?.name || 'Product',
          sku: variant?.sku || '',
          qty: item.qty,
          price: item.priceSnapshot,
          image: product?.images?.[0],
        };
      })
    );

    const order = await Order.create({
      orderNumber,
      userId,
      items: orderItems,
      addressId: address._id,
      addressSnapshot: address.toObject(),
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      couponCode: totals.couponCode,
      paymentMethod,
      // COD has no payment gateway step to wait on — confirm immediately and
      // move reserved stock straight to sold, the same way a successful
      // Cashfree payment does for a Prepaid order.
      status: paymentMethod === 'COD' ? 'Confirmed' : 'Pending',
    });

    if (paymentMethod === 'COD') {
      await markStockSold(stockLines, orderNumber);
    }

    // Coupon redemption is counted the moment an order is actually placed with it —
    // this was never called anywhere before, so usageLimit could never be enforced
    // (BUG-11). Best-effort: a failure here shouldn't block order placement.
    if (totals.couponCode) {
      await incrementCouponUsage(totals.couponCode).catch((err) => {
        logger.error('Failed to increment coupon usage', {
          code: totals.couponCode,
          orderNumber,
          error: err instanceof Error ? err.message : err,
        });
      });
    }

    // Clear the cart only after the order is successfully persisted.
    cart.items = [] as unknown as ICart['items'];
    cart.couponCode = undefined;
    await cart.save();

    return order;
  } catch (err) {
    // Order persistence failed after we reserved stock — release it back.
    const { releaseStock } = await import('./inventory.service');
    await releaseStock(stockLines, orderNumber);
    throw err;
  }
}

export async function getOrderForUser(userId: string, orderId: string) {
  const order = mongoose.isValidObjectId(orderId)
    ? await Order.findOne({ _id: orderId, userId })
    : await Order.findOne({ orderNumber: orderId, userId });

  if (!order) throw AppError.notFound('Order not found');
  return order;
}

/**
 * Releases/returns stock, frees up a coupon redemption, and — if the order had
 * already been paid for — kicks off a refund. Shared by the customer-initiated
 * cancel path, the admin-initiated cancel path, and the reservation-expiry job
 * (which passes wasConfirmed=false, since an expired-and-never-paid order was
 * never Confirmed and has nothing to refund).
 */
async function applyCancelSideEffects(order: IOrder, wasConfirmed: boolean): Promise<void> {
  const { releaseStock, returnSoldStockToAvailable } = await import('./inventory.service');
  const stockLines = order.items.map((i) => ({ variantId: i.variantId, qty: i.qty }));
  if (wasConfirmed) {
    await returnSoldStockToAvailable(stockLines, order.orderNumber);
  } else {
    await releaseStock(stockLines, order.orderNumber);
  }

  if (order.couponCode) {
    await decrementCouponUsage(order.couponCode).catch((err) => {
      logger.error('Failed to decrement coupon usage on cancellation', {
        code: order.couponCode,
        orderNumber: order.orderNumber,
        error: err instanceof Error ? err.message : err,
      });
    });
  }

  // If the order was already paid for, automatically initiate a refund.
  if (wasConfirmed && order.paymentId) {
    const { Payment } = await import('../models/Payment.model');
    const payment = await Payment.findById(order.paymentId);
    if (payment && payment.status === 'Success') {
      const { initiateRefundForCancelledOrder } = await import('./refund.service');
      await initiateRefundForCancelledOrder(payment, order);
    }
  }

  if (order.shipment?.shiprocketShipmentId) {
    // No Shiprocket "cancel shipment" call exists yet (tracked separately) — flag it
    // loudly so an admin cancels the pickup/shipment in the Shiprocket dashboard
    // rather than it silently continuing to ship a cancelled order.
    logger.error('Order cancelled after a Shiprocket shipment was created — cancel it manually in Shiprocket', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      shiprocketShipmentId: order.shipment.shiprocketShipmentId,
    });
  }
}

/**
 * Cancels a customer's own order. Uses a single conditional findOneAndUpdate
 * (status must still be Pending/Confirmed at the moment of the write) so two
 * concurrent cancel requests — or a cancel racing the expiry job — can never
 * both apply the stock/refund side effects for the same order (BUG-10).
 */
export async function cancelOrder(userId: string, orderId: string, reason?: string) {
  const baseFilter = mongoose.isValidObjectId(orderId) ? { _id: orderId, userId } : { orderNumber: orderId, userId };

  const previous = await Order.findOneAndUpdate(
    { ...baseFilter, status: { $in: ['Pending', 'Confirmed'] } },
    { $set: { status: 'Cancelled', cancelledAt: new Date(), cancelReason: reason } }
  );

  if (!previous) {
    const existing = await Order.findOne(baseFilter);
    if (!existing) throw AppError.notFound('Order not found');
    throw AppError.conflict(`Order cannot be cancelled from status "${existing.status}"`, 'ORDER_NOT_CANCELLABLE');
  }

  await applyCancelSideEffects(previous, previous.status === 'Confirmed');

  return getOrderForUser(userId, orderId);
}

/**
 * Admin-initiated cancellation (BUG-10): previously `adminUpdateOrderStatus` just
 * flipped `status` with no side effects, so cancelling from the admin panel never
 * released reserved/sold stock and never refunded a paid order. Routes through the
 * exact same atomic guard + side effects as the customer cancel path above.
 */
export async function cancelOrderByAdmin(orderId: string, reason?: string): Promise<IOrder> {
  if (!mongoose.isValidObjectId(orderId)) {
    throw AppError.badRequest('Invalid order id', 'INVALID_ORDER_ID');
  }

  const previous = await Order.findOneAndUpdate(
    { _id: orderId, status: { $in: ['Pending', 'Confirmed'] } },
    { $set: { status: 'Cancelled', cancelledAt: new Date(), cancelReason: reason ?? 'Cancelled by admin' } }
  );

  if (!previous) {
    const existing = await Order.findById(orderId);
    if (!existing) throw AppError.notFound('Order not found');
    throw AppError.conflict(`Order cannot be cancelled from status "${existing.status}"`, 'ORDER_NOT_CANCELLABLE');
  }

  await applyCancelSideEffects(previous, previous.status === 'Confirmed');

  return (await Order.findById(orderId)) as IOrder;
}

/**
 * Cancels stale Pending orders (no successful payment within the window) and
 * releases their reserved stock. Before giving up on a reservation, first syncs
 * the order's latest payment with Cashfree (BUG-12) — a webhook can be missed,
 * and without this check a payment that actually succeeded moments before the
 * window closed would otherwise get its order cancelled out from under it.
 */
export async function releaseExpiredReservations(olderThanMinutes = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const { Payment } = await import('../models/Payment.model');
  const { syncPaymentStatus } = await import('./payment/payment.service');

  const staleOrders = await Order.find({ status: 'Pending', createdAt: { $lt: cutoff } });

  let releasedCount = 0;

  for (const order of staleOrders) {
    const latestPayment = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });
    if (latestPayment && latestPayment.status !== 'Success' && latestPayment.status !== 'Failed') {
      try {
        await syncPaymentStatus(latestPayment);
      } catch (err) {
        logger.warn('releaseExpiredReservations: could not sync payment status before expiring reservation', {
          orderId: order._id.toString(),
          error: err instanceof Error ? err.message : err,
        });
      }
    }

    // Re-fetch: syncPaymentStatus may have just confirmed the order (or otherwise
    // moved it on) via applyPaymentStatusChange — don't cancel out from under that.
    const fresh = await Order.findOne({ _id: order._id, status: 'Pending' });
    if (!fresh) continue;

    await applyCancelSideEffects(fresh, false);
    fresh.status = 'Cancelled';
    fresh.cancelledAt = new Date();
    fresh.cancelReason = 'Reservation expired — no successful payment';
    await fresh.save();
    releasedCount++;
  }

  return releasedCount;
}