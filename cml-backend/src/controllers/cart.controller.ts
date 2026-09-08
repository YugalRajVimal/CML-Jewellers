import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as cartService from '../services/cart.service';

async function buildCartResponse(userId: string) {
  const cart = await cartService.getOrCreateCart(userId);
  const { issues } = await cartService.revalidateCart(cart);
  const totals = await cartService.computeCartTotals(cart);
  return { cart, issues, totals };
}

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { data: { cart, issues, totals } });
});

export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const { variantId, qty } = req.body;
  await cartService.addItemToCart(req.user!.sub, variantId, qty);
  const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { message: 'Item added to cart', data: { cart, issues, totals }, statusCode: 201 });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { qty } = req.body;
  await cartService.updateCartItemQty(req.user!.sub, id, qty);
  const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { message: 'Cart updated', data: { cart, issues, totals } });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await cartService.removeCartItem(req.user!.sub, id);
  const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { message: 'Item removed from cart', data: { cart, issues, totals } });
});

export const applyCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;
  await cartService.applyCoupon(req.user!.sub, code);
  const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { message: 'Coupon applied', data: { cart, issues, totals } });
});

export const removeCoupon = asyncHandler(async (req: Request, res: Response) => {
  await cartService.removeCoupon(req.user!.sub);
  const { cart, issues, totals } = await buildCartResponse(req.user!.sub);
  sendSuccess(res, { message: 'Coupon removed', data: { cart, issues, totals } });
});
