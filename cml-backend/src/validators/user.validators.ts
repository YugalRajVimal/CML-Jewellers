import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/)
    .optional(),
});

export const addressSchema = z.object({
  label: z.string().max(50).default('Home'),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4).max(10),
  country: z.string().min(2).default('India'),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = addressSchema.partial();
