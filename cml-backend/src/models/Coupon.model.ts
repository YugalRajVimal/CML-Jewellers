import { Schema, model, Document, Types } from 'mongoose';

export type CouponType = 'flat' | 'percent';

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  type: CouponType;
  value: number; // flat amount or percent (0-100)
  minCartValue: number;
  maxDiscountAmount?: number; // caps percent-based discounts
  expiry: Date;
  usageLimit: number; // total redemptions allowed across all users
  usageLimitPerUser: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ['flat', 'percent'], required: true },
    value: { type: Number, required: true, min: 0 },
    minCartValue: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number },
    expiry: { type: Date, required: true },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usageLimitPerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Coupon = model<ICoupon>('Coupon', couponSchema);
