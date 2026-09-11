import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { env } from '../config/env';
import * as authService from '../services/auth.service';
import { User } from '../models/User.model';
import * as otpService from '../services/otp.service';
import { AppError } from '@/utils/AppError';

const REFRESH_COOKIE_NAME = 'refreshToken';

export const sendContactVerification = asyncHandler(async (req: Request, res: Response) => {
  const { channel } = req.body as { channel: 'email' | 'sms' };
  const user = await User.findById(req.user!.sub);
  if (!user) throw AppError.notFound('User not found');

  const identifier = channel === 'email' ? user.email : user.phone;
  if (!identifier) throw AppError.badRequest(`No ${channel === 'email' ? 'email' : 'phone number'} on file`, 'NO_CONTACT_ON_FILE');

  if (channel === 'email' && user.emailVerified) throw AppError.badRequest('Email already verified', 'ALREADY_VERIFIED');
  if (channel === 'sms' && user.phoneVerified) throw AppError.badRequest('Phone already verified', 'ALREADY_VERIFIED');

  await otpService.requestOtp(identifier, channel, 'verify_contact');
  sendSuccess(res, { message: 'Verification code sent' });
});

export const confirmContactVerification = asyncHandler(async (req: Request, res: Response) => {
  const { channel, code } = req.body as { channel: 'email' | 'sms'; code: string };
  const user = await User.findById(req.user!.sub);
  if (!user) throw AppError.notFound('User not found');

  const identifier = channel === 'email' ? user.email : user.phone;
  if (!identifier) throw AppError.badRequest(`No ${channel === 'email' ? 'email' : 'phone number'} on file`, 'NO_CONTACT_ON_FILE');

  await otpService.verifyOtp(identifier, 'verify_contact', code);

  if (channel === 'email') user.emailVerified = true;
  else user.phoneVerified = true;
  await user.save();

  sendSuccess(res, { message: `${channel === 'email' ? 'Email' : 'Phone'} verified`, data: {
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
  }});
});

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/api/v1/auth',
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password, otpCode } = req.body;
  const user = await authService.registerUser({ name, email, phone, password }, otpCode);
  const tokens = authService.issueTokenPair(user._id.toString());
  setRefreshCookie(res, tokens.refreshToken);

  sendSuccess(res, {
    message: 'Registration successful',
    data: {
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
      accessToken: tokens.accessToken,
    },
    statusCode: 201,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone, password } = req.body;
  const user = await authService.loginUser({ email, phone }, password);
  const tokens = authService.issueTokenPair(user._id.toString());
  setRefreshCookie(res, tokens.refreshToken);

  sendSuccess(res, {
    message: 'Login successful',
    data: {
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone,    emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified, },
      accessToken: tokens.accessToken,
    },
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
  sendSuccess(res, { message: 'Logged out successfully' });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  const tokenFromBody = req.body?.refreshToken;
  const refreshToken = tokenFromCookie || tokenFromBody;

  if (!refreshToken) {
    return sendSuccess(res, { message: 'Refresh token missing', statusCode: 400 });
  }

  const tokens = await authService.rotateRefreshToken(refreshToken);
  setRefreshCookie(res, tokens.refreshToken);

  sendSuccess(res, {
    message: 'Token refreshed',
    data: { accessToken: tokens.accessToken },
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone } = req.body;
  const otpService = await import('../services/otp.service');
  const identifier = email || phone;
  const channel = email ? 'email' : 'sms';
  await otpService.requestOtp(identifier, channel, 'password_reset');

  sendSuccess(res, { message: 'If the account exists, a reset code has been sent' });
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, code, newPassword } = req.body;
  await authService.resetPassword(identifier, code, newPassword);
  sendSuccess(res, { message: 'Password reset successful' });
});
