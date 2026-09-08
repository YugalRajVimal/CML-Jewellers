import mongoose from 'mongoose';
import { Cart, ICart } from '../models/Cart.model';
import { Product } from '../models/Product.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { Inventory } from '../models/Inventory.model';
import { AppError } from '../utils/AppError';
import { validateAndComputeDiscount } from './coupon.service';
import { computeShipping, computeTax } from './pricing.service';

export interface CartLineIssue {
  variantId: string;
  reason: 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK' | 'PRODUCT_UNAVAILABLE' | 'PRICE_CHANGED';
  message: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string;
}

export async function getOrCreateCart(userId: string): Promise<ICart> {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
}

/**
 * Re-validates every cart line against current Product/Variant/Inventory state:
 * drops items for deleted/inactive products, refreshes price snapshots on change,
 * and reports (without silently removing) items whose stock is insufficient.
 * Called on every cart mutation and again at checkout validation.
 */
export async function revalidateCart(cart: ICart): Promise<{ issues: CartLineIssue[] }> {
  const issues: CartLineIssue[] = [];
  const keptItems = [];

  for (const item of cart.items) {
    const variant = await ProductVariant.findById(item.variantId);
    const product = variant ? await Product.findById(item.productId) : null;

    if (!variant || !variant.isActive || !product || product.status !== 'active') {
      issues.push({
        variantId: item.variantId.toString(),
        reason: 'PRODUCT_UNAVAILABLE',
        message: 'This item is no longer available and was removed from your cart',
      });
      continue;
    }

    const inventory = await Inventory.findOne({ variantId: variant._id });
    const available = inventory?.available ?? 0;

    if (available <= 0) {
      issues.push({
        variantId: item.variantId.toString(),
        reason: 'OUT_OF_STOCK',
        message: `${product.name} is currently out of stock`,
      });
      continue;
    }

    if (available < item.qty) {
      item.qty = available;
      issues.push({
        variantId: item.variantId.toString(),
        reason: 'INSUFFICIENT_STOCK',
        message: `Only ${available} unit(s) of ${product.name} available — quantity adjusted`,
      });
    }

    if (item.priceSnapshot !== variant.price) {
      issues.push({
        variantId: item.variantId.toString(),
        reason: 'PRICE_CHANGED',
        message: `Price for ${product.name} has changed`,
      });
      item.priceSnapshot = variant.price;
    }

    keptItems.push(item);
  }

  cart.items = keptItems as typeof cart.items;
  await cart.save();

  return { issues };
}

export async function addItemToCart(userId: string, variantId: string, qty: number): Promise<ICart> {
  const variant = await ProductVariant.findById(variantId);
  if (!variant || !variant.isActive) throw AppError.notFound('Product variant not found', 'VARIANT_NOT_FOUND');

  const product = await Product.findById(variant.productId);
  if (!product || product.status !== 'active') throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');

  const inventory = await Inventory.findOne({ variantId: variant._id });
  const available = inventory?.available ?? 0;
  if (available < qty) {
    throw AppError.conflict(`Only ${available} unit(s) available`, 'INSUFFICIENT_STOCK', { available });
  }

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((i) => i.variantId.toString() === variantId);

  if (existing) {
    const newQty = existing.qty + qty;
    if (newQty > available) {
      throw AppError.conflict(`Only ${available} unit(s) available`, 'INSUFFICIENT_STOCK', { available });
    }
    existing.qty = newQty;
    existing.priceSnapshot = variant.price;
  } else {
    cart.items.push({
      productId: product._id,
      variantId: variant._id,
      qty,
      priceSnapshot: variant.price,
      addedAt: new Date(),
    } as ICart['items'][number]);
  }

  await cart.save();
  return cart;
}

export async function updateCartItemQty(userId: string, itemId: string, qty: number): Promise<ICart> {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i._id.toString() === itemId);
  if (!item) throw AppError.notFound('Cart item not found');

  const inventory = await Inventory.findOne({ variantId: item.variantId });
  const available = inventory?.available ?? 0;
  if (qty > available) {
    throw AppError.conflict(`Only ${available} unit(s) available`, 'INSUFFICIENT_STOCK', { available });
  }

  item.qty = qty;
  await cart.save();
  return cart;
}

export async function removeCartItem(userId: string, itemId: string): Promise<ICart> {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter((i) => i._id.toString() !== itemId) as typeof cart.items;
  await cart.save();
  return cart;
}

export function computeSubtotal(cart: ICart): number {
  return cart.items.reduce((sum, item) => sum + item.priceSnapshot * item.qty, 0);
}

export async function computeCartTotals(cart: ICart): Promise<CartTotals> {
  const subtotal = computeSubtotal(cart);
  let discount = 0;
  let couponCode: string | undefined;

  if (cart.couponCode) {
    try {
      const result = await validateAndComputeDiscount(cart.couponCode, cart.userId, subtotal);
      discount = result.discount;
      couponCode = result.code;
    } catch {
      // Coupon became invalid (expired/limit reached) since it was applied — drop it silently from totals.
      discount = 0;
      couponCode = undefined;
    }
  }

  const shipping = computeShipping(subtotal - discount);
  const tax = computeTax(subtotal - discount);
  const total = Math.max(0, subtotal - discount) + shipping + tax;

  return { subtotal, discount, shipping, tax, total, couponCode };
}

export async function applyCoupon(userId: string, code: string): Promise<ICart> {
  const cart = await getOrCreateCart(userId);
  const subtotal = computeSubtotal(cart);

  // Throws AppError if invalid — propagates to controller.
  const result = await validateAndComputeDiscount(code, new mongoose.Types.ObjectId(userId), subtotal);

  cart.couponCode = result.code;
  await cart.save();
  return cart;
}

export async function removeCoupon(userId: string): Promise<ICart> {
  const cart = await getOrCreateCart(userId);
  cart.couponCode = undefined;
  await cart.save();
  return cart;
}
