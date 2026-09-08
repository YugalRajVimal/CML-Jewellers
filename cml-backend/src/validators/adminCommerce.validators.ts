import { z } from 'zod';

export const adjustInventorySchema = z.object({
  variantId: z.string().min(1),
  delta: z.number().int().refine((v) => v !== 0, 'delta must be non-zero'),
  note: z.string().max(500).optional(),
});

export const rejectReturnSchema = z.object({
  reason: z.string().min(3).max(1000),
});

export const inspectReturnSchema = z.object({
  passed: z.boolean(),
  notes: z.string().max(1000).optional(),
});

export const updateRefundStatusSchema = z.object({
  status: z.enum(['Processing', 'Completed', 'Failed']),
  failureReason: z.string().max(500).optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(150),
  contact: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      contactPerson: z.string().optional(),
    })
    .optional(),
  address: z
    .object({
      line1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        orderedQty: z.number().int().min(1),
        cost: z.number().nonnegative(),
      })
    )
    .min(1),
  notes: z.string().max(1000).optional(),
});

export const receivePurchaseSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        receivedQty: z.number().int().min(1),
      })
    )
    .min(1),
});
