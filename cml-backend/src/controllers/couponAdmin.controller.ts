import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Coupon } from '../models/Coupon.model';

export const adminListCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  sendSuccess(res, { data: { coupons } });
});

export const adminGetCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const coupon = await Coupon.findById(id);
  if (!coupon) throw AppError.notFound('Coupon not found');
  sendSuccess(res, { data: { coupon } });
});

export const adminCreateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, ...rest } = req.body;
  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) throw AppError.conflict('A coupon with this code already exists', 'COUPON_CODE_EXISTS');

  const coupon = await Coupon.create({ code: code.toUpperCase(), ...rest });
  sendSuccess(res, { message: 'Coupon created', data: { coupon }, statusCode: 201 });
});

export const adminUpdateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.code) updates.code = updates.code.toUpperCase();

  const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!coupon) throw AppError.notFound('Coupon not found');
  sendSuccess(res, { message: 'Coupon updated', data: { coupon } });
});

export const adminDeleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw AppError.notFound('Coupon not found');
  sendSuccess(res, { message: 'Coupon deleted' });
});
