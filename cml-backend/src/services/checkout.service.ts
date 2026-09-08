import mongoose from 'mongoose';
import { ICart } from '../models/Cart.model';
import { Order } from '../models/Order.model';
import { Address } from '../models/Address.model';
import { Product } from '../models/Product.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { AppError } from '../utils/AppError';
import { revalidateCart, computeCartTotals, getOrCreateCart } from './cart.service';
import { reserveStock } from './inventory.service';
import { generateOrderNumber } from '../utils/orderNumber';

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
export async function createOrderFromCart(userId: string, addressId: string) {
  const { cart, address, totals } = await validateCheckout(userId, addressId);

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
      status: 'Pending',
    });

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

export async function cancelOrder(userId: string, orderId: string, reason?: string) {
  const order = await getOrderForUser(userId, orderId);

  if (!['Pending', 'Confirmed'].includes(order.status)) {
    throw AppError.conflict(`Order cannot be cancelled from status "${order.status}"`, 'ORDER_NOT_CANCELLABLE');
  }

  const wasConfirmed = order.status === 'Confirmed';

  const { releaseStock } = await import('./inventory.service');
  await releaseStock(
    order.items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
    order.orderNumber
  );

  order.status = 'Cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = reason;
  await order.save();

  // If the order was already paid for, automatically initiate a refund.
  if (wasConfirmed && order.paymentId) {
    const { Payment } = await import('../models/Payment.model');
    const payment = await Payment.findById(order.paymentId);
    if (payment && payment.status === 'Success') {
      const { initiateRefundForCancelledOrder } = await import('./refund.service');
      await initiateRefundForCancelledOrder(payment, order);
    }
  }

  return order;
}
