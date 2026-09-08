import { z } from 'zod';

export const addToWishlistSchema = z.object({
  productId: z.string().min(1),
});

export const addToCartSchema = z.object({
  variantId: z.string().min(1),
  qty: z.number().int().min(1).max(50),
});

export const updateCartItemSchema = z.object({
  qty: z.number().int().min(1).max(50),
});

export const applyCouponSchema = z.object({
  code: z.string().min(2).max(40),
});

export const checkoutValidateSchema = z.object({
  addressId: z.string().min(1),
});

export const createOrderSchema = z.object({
  addressId: z.string().min(1),
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const requestReturnSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(3).max(1000),
  items: z
    .array(
      z.object({
        orderItemProductId: z.string().min(1),
        variantId: z.string().min(1),
        qty: z.number().int().min(1),
        reason: z.string().min(3).max(500),
      })
    )
    .min(1),
});
