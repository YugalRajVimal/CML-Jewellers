import mongoose from 'mongoose';
import { Coupon } from '../models/Coupon.model';
import { Order } from '../models/Order.model';
import { AppError } from '../utils/AppError';

export interface CouponResult {
  code: string;
  discount: number;
}

export async function validateAndComputeDiscount(
  code: string,
  userId: mongoose.Types.ObjectId | string,
  cartSubtotal: number
): Promise<CouponResult> {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) {
    throw AppError.badRequest('Invalid coupon code', 'COUPON_INVALID');
  }
  if (coupon.expiry.getTime() < Date.now()) {
    throw AppError.badRequest('This coupon has expired', 'COUPON_EXPIRED');
  }
  if (cartSubtotal < coupon.minCartValue) {
    throw AppError.badRequest(
      `Cart total must be at least ${coupon.minCartValue} to use this coupon`,
      'COUPON_MIN_CART_NOT_MET'
    );
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw AppError.badRequest('This coupon has reached its usage limit', 'COUPON_LIMIT_REACHED');
  }

  if (coupon.usageLimitPerUser > 0) {
    const userRedemptions = await Order.countDocuments({
      userId,
      couponCode: coupon.code,
      status: { $ne: 'Cancelled' },
    });
    if (userRedemptions >= coupon.usageLimitPerUser) {
      throw AppError.badRequest('You have already used this coupon the maximum number of times', 'COUPON_USER_LIMIT_REACHED');
    }
  }

  let discount = coupon.type === 'flat' ? coupon.value : (cartSubtotal * coupon.value) / 100;

  if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
    discount = coupon.maxDiscountAmount;
  }
  discount = Math.min(discount, cartSubtotal);

  return { code: coupon.code, discount: Math.round(discount * 100) / 100 };
}
