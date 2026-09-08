import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse';

/** Baseline limiter applied to all /api/v1 traffic — generous, just guards against gross abuse. */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(res, {
      message: 'Too many requests. Please slow down.',
      code: 'RATE_LIMITED',
      statusCode: 429,
    }),
});

/** General auth endpoints (login/register/password) — generous but bounded. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(res, {
      message: 'Too many attempts. Please try again later.',
      code: 'RATE_LIMITED',
      statusCode: 429,
    }),
});

/** Tighter limiter for OTP send/resend to prevent SMS/email abuse. */
export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(res, {
      message: 'Too many OTP requests. Please wait before retrying.',
      code: 'OTP_RATE_LIMITED',
      statusCode: 429,
    }),
});

/** Admin login limiter — stricter, smaller window abuse is more sensitive. */
export const adminAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(res, {
      message: 'Too many login attempts. Please try again later.',
      code: 'RATE_LIMITED',
      statusCode: 429,
    }),
});
