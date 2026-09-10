// import { z } from 'zod';

// export const updateProfileSchema = z.object({
//   name: z.string().min(2).max(100).optional(),
//   email: z.string().email().optional(),
//   phone: z
//     .string()
//     .regex(/^\+?[1-9]\d{7,14}$/)
//     .optional(),
// });

// export const addressSchema = z.object({
//   label: z.string().max(50).default('Home'),
//   line1: z.string().min(3),
//   line2: z.string().optional(),
//   city: z.string().min(2),
//   state: z.string().min(2),
//   pincode: z.string().min(4).max(10),
//   country: z.string().min(2).default('India'),
//   isDefault: z.boolean().optional(),
// });

// export const updateAddressSchema = addressSchema.partial();


import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/)
    .optional(),
});

export const addressSchema = z
  .object({
    label: z.string().max(50).default('Home'),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(4).max(10).optional(),
    postalCode: z.string().min(4).max(10).optional(), // NEW — alias accepted from the frontend
    phone: z.string().min(6).max(20).optional(), // NEW
    country: z.string().min(2).default('India'),
    isDefault: z.boolean().optional(),
  })
  .refine((data) => data.pincode || data.postalCode, {
    message: 'Postal code is required',
    path: ['postalCode'],
  })
  .transform((data) => ({ ...data, pincode: data.pincode ?? data.postalCode }));

export const updateAddressSchema = z
  .object({
    label: z.string().max(50).optional(),
    line1: z.string().min(3).optional(),
    line2: z.string().optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    pincode: z.string().min(4).max(10).optional(),
    postalCode: z.string().min(4).max(10).optional(),
    phone: z.string().min(6).max(20).optional(),
    country: z.string().min(2).optional(),
    isDefault: z.boolean().optional(),
  })
  .transform((data) => (data.postalCode ? { ...data, pincode: data.postalCode } : data));