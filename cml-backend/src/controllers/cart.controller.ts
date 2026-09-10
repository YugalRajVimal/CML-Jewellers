// import { Request, Response } from 'express';
// import { asyncHandler } from '../utils/asyncHandler';
// import { sendSuccess } from '../utils/apiResponse';
// import * as cartService from '../services/cart.service';

// async function buildCartResponse(userId: string) {
//   const cart = await cartService.getOrCreateCart(userId);
//   const { issues } = await cartService.revalidateCart(cart);
//   const totals = await cartService.computeCartTotals(cart);
//   return { cart, issues, totals };
// }

// export const getCart = asyncHandler(async (req: Request, res: Response) => {
//   const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
//   sendSuccess(res, { data: { cart, issues, totals } });
// });

// export const addItem = asyncHandler(async (req: Request, res: Response) => {
//   const { variantId, qty } = req.body;
//   await cartService.addItemToCart(req.user!.sub, variantId, qty);
//   const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
//   sendSuccess(res, { message: 'Item added to cart', data: { cart, issues, totals }, statusCode: 201 });
// });

// export const updateItem = asyncHandler(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { qty } = req.body;
//   await cartService.updateCartItemQty(req.user!.sub, id, qty);
//   const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
//   sendSuccess(res, { message: 'Cart updated', data: { cart, issues, totals } });
// });

// export const removeItem = asyncHandler(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   await cartService.removeCartItem(req.user!.sub, id);
//   const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
//   sendSuccess(res, { message: 'Item removed from cart', data: { cart, issues, totals } });
// });

// export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
//   const { code } = req.body;
//   await cartService.applyCoupon(req.user!.sub, code);
//   const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
//   sendSuccess(res, { message: 'Coupon applied', data: { cart, issues, totals } });
// });

// export const removeCoupon = asyncHandler(async (req: Request, res: Response) => {
//   await cartService.removeCoupon(req.user!.sub);
//   const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
//   sendSuccess(res, { message: 'Coupon removed', data: { cart, issues, totals } });
// });


import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ICart } from '../models/Cart.model';
import { Product } from '../models/Product.model';
import { ProductVariant } from '../models/ProductVariant.model';
import { Inventory } from '../models/Inventory.model';
import * as cartService from '../services/cart.service';

/** Shapes the cart into exactly what the storefront's Cart/CartItem types expect. */
async function serializeCart(cart: ICart, totals: Awaited<ReturnType<typeof cartService.computeCartTotals>>) {
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
      price: item.priceSnapshot,
      currentPrice: variant?.price ?? item.priceSnapshot,
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
  const serialized = await serializeCart(cart, totals);
  return { ...serialized, issues }; // flat Cart shape + an `issues[]` the frontend can ignore or use
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