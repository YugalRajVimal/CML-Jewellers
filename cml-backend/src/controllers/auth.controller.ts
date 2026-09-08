import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { env } from '../config/env';
import * as authService from '../services/auth.service';

const REFRESH_COOKIE_NAME = 'refreshToken';

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
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
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
