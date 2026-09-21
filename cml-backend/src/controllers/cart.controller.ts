import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ICart } from '../models/Cart.model';
import { Product } from '../models/Product.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { Inventory } from '../models/Inventory.model';
import * as cartService from '../services/cart.service';
import { roundMoney } from '../services/pricing.service';

/** Shapes the cart into exactly what the storefront's Cart/CartItem types expect. */
async function serializeCart(
  cart: ICart,
  totals: Awaited<ReturnType<typeof cartService.computeCartTotals>>,
  issues: cartService.CartLineIssue[]
) {
  const productIds = cart.items.map((i) => i.productId);
  const variantIds = cart.items.map((i) => i.variantId);

  const [products, variants, inventories] = await Promise.all([
    Product.find({ _id: { $in: productIds } }).select('name slug images'),
    ProductVariant.find({ _id: { $in: variantIds } }).select('attributes price'),
    Inventory.find({ variantId: { $in: variantIds } }).select('variantId available'),
  ]);

  const productById = new Map(products.map((p) => [p._id.toString(), p]));
  const variantById = new Map(variants.map((v) => [v._id.toString(), v]));
  const stockByVariant = new Map(inventories.map((i) => [i.variantId.toString(), i.available]));

  // revalidateCart() has already refreshed every priceSnapshot by now, so `price` would always equal
  // `currentPrice`. For lines whose price changed during THIS revalidation, report the price the
  // shopper previously saw as `price` so the storefront's "price changed" notice can show it.
  const previousPriceByVariant = new Map<string, number>();
  for (const issue of issues) {
    if (issue.reason === 'PRICE_CHANGED' && typeof issue.previousPrice === 'number') {
      previousPriceByVariant.set(issue.variantId, issue.previousPrice);
    }
  }

  const items = cart.items.map((item) => {
    const product = productById.get(item.productId.toString());
    const variant = variantById.get(item.variantId.toString());
    return {
      id: item._id.toString(),
      productId: item.productId.toString(),
      productName: product?.name ?? 'Product',
      productSlug: product?.slug ?? '',
      image: product?.images?.[0],
      variantId: item.variantId.toString(),
      variantAttributes: variant?.attributes ?? {},
      quantity: item.qty,
      price: roundMoney(previousPriceByVariant.get(item.variantId.toString()) ?? item.priceSnapshot),
      currentPrice: roundMoney(variant?.price ?? item.priceSnapshot),
      stock: stockByVariant.get(item.variantId.toString()) ?? 0,
    };
  });

  return {
    id: cart._id.toString(),
    items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    tax: totals.tax,
    total: totals.total,
    couponCode: totals.couponCode,
  };
}

async function buildCartResponse(userId: string) {
  const cart = await cartService.getOrCreateCart(userId);
  const { issues } = await cartService.revalidateCart(cart);
  const totals = await cartService.computeCartTotals(cart);
  const serialized = await serializeCart(cart, totals, issues);
  return { ...serialized, issues }; // flat Cart shape + `issues[]` (the cart page surfaces these)
}

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { data: cart });
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const { variantId, qty } = req.body;
  await cartService.addItemToCart(req.user!.sub, variantId, qty);
  const cart = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { message: 'Item added to cart', data: cart, statusCode: 201 });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { qty } = req.body;
  await cartService.updateCartItemQty(req.user!.sub, id, qty);
  const cart = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { message: 'Cart updated', data: cart });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await cartService.removeCartItem(req.user!.sub, id);
  const cart = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { message: 'Item removed from cart', data: cart });
});

export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;
  await cartService.applyCoupon(req.user!.sub, code);
  const cart = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { message: 'Coupon applied', data: cart });
});

export const removeCoupon = asyncHandler(async (req: Request, res: Response) => {
  await cartService.removeCoupon(req.user!.sub);
  const cart = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { message: 'Coupon removed', data: cart });
});