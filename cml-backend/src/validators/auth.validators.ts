import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128);

export const registerSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number')
      .optional(),
    password: passwordSchema,
  })
  .refine((data) => data.email || data.phone, {
    message: 'Either email or phone is required',
    path: ['email'],
  });

export const loginSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(1),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Either email or phone is required',
    path: ['email'],
  });

// BUG-15: 'verify_contact' is deliberately excluded here. It has its own authenticated
// route (/auth/verify/send + /auth/verify/confirm, which derive the identifier from the
// logged-in user) — allowing it on this unauthenticated route let anyone trigger an OTP
// send to an arbitrary email/phone with no rate-limited relationship to an account, which
// is a spam/harassment vector as well as being redundant.
const publicOtpPurpose = z.enum(['register', 'login', 'password_reset']);

export const sendOtpSchema = z.object({
  channel: z.enum(['email', 'sms']),
  identifier: z.string().min(3),
  purpose: publicOtpPurpose,
});

export const verifyOtpSchema = z.object({
  channel: z.enum(['email', 'sms']),
  identifier: z.string().min(3),
  purpose: publicOtpPurpose,
  code: z.string().length(6),
});

export const resendOtpSchema = sendOtpSchema;

export const forgotPasswordSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
  path: ['email'],
});

export const resetPasswordSchema = z.object({
  identifier: z.string().min(3),
  code: z.string().length(6),
  newPassword: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10).optional(), // optional because it may arrive via httpOnly cookie
});

export const sendContactVerificationSchema = z.object({
  channel: z.enum(['email', 'sms']),
});

export const confirmContactVerificationSchema = z.object({
  channel: z.enum(['email', 'sms']),
  code: z.string().length(6),
});