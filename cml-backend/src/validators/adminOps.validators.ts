import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum(['Processing', 'Shipped', 'Delivered', 'Cancelled']),
  // Only used when status === 'Cancelled' — recorded as the order's cancelReason.
  // 'ReturnRequested' is intentionally NOT a valid target here: it is only ever
  // set by the customer-initiated returns flow (see return.service#requestReturn),
  // never by a manual admin status change (BUG-10).
  reason: z.string().max(500).optional(),
});

export const assignCourierSchema = z.object({
  courierId: z.string().min(1),
});

export const setCustomerActiveSchema = z.object({
  isActive: z.boolean(),
});

const couponBaseSchema = z.object({
  code: z.string().min(2).max(40),
  type: z.enum(['flat', 'percent']),
  value: z.number().nonnegative(),
  minCartValue: z.number().nonnegative().optional(),
  maxDiscountAmount: z.number().nonnegative().optional(),
  expiry: z.coerce.date(),
  usageLimit: z.number().int().nonnegative().optional(),
  usageLimitPerUser: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

// A percent-type coupon's value is a percentage, so anything over 100 can never be
// a valid discount (BUG-11) — enforced here rather than trusting every caller.
function checkPercentValue(
  data: {
    value?: number;
    code?: string;
    type?: 'flat' | 'percent' | undefined;
    isActive?: boolean;
    minCartValue?: number;
    maxDiscountAmount?: number;
    expiry?: Date;
    usageLimit?: number;
    usageLimitPerUser?: number;
  },
  ctx: z.RefinementCtx
) {
  if (data.type === 'percent' && data.value !== undefined && data.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'Percent discount cannot exceed 100',
    });
  }
}

export const createCouponSchema = couponBaseSchema.superRefine(checkPercentValue);
export const updateCouponSchema = couponBaseSchema.partial().superRefine(checkPercentValue);

export const createBannerSchema = z.object({
  type: z.enum(['hero', 'promo', 'category', 'strip']),
  title: z.string().max(200).optional(),
  imageUrl: z.string().min(1),
  ctaText: z.string().max(60).optional(),
  ctaUrl: z.string().max(500).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

export const updateBannerSchema = createBannerSchema.partial();

export const upsertHomepageSectionSchema = z.object({
  title: z.string().max(200).optional(),
  data: z.unknown(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateHomepageSectionSchema = upsertHomepageSectionSchema.partial();

export const createAdminUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  roleId: z.string().min(1),
});

export const updateAdminUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  roleId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const resetAdminUserPasswordSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

export const createRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  permissionKeys: z.array(z.string()).optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(150).optional(),
  comment: z.string().max(2000).optional(),
});

export const moderateReviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  moderationNote: z.string().max(500).optional(),
});