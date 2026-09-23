import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { User } from '../models/User.model';
import { normalizePhone } from '../utils/phone';
import * as otpService from '../services/otp.service';

/**
 * BUG-15: this route is unauthenticated, so for 'login' and 'password_reset' — purposes
 * that only make sense against an existing account — we check the account exists first and
 * silently no-op (same generic success response either way) rather than sending an OTP to
 * an arbitrary identifier. This also stops it being used to enumerate which emails/phones
 * are registered. 'register' is exempt: by definition no account exists yet at that point.
 */
async function accountExists(identifier: string, channel: 'email' | 'sms'): Promise<boolean> {
  const query = channel === 'email' ? { email: identifier } : { phone: normalizePhone(identifier) };
  const user = await User.findOne(query).select('_id');
  return !!user;
}

async function shouldActuallySend(identifier: string, channel: 'email' | 'sms', purpose: string): Promise<boolean> {
  if (purpose === 'register') return true;
  return accountExists(identifier, channel);
}

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { channel, identifier, purpose } = req.body;
  if (await shouldActuallySend(identifier, channel, purpose)) {
    await otpService.requestOtp(identifier, channel, purpose);
  }
  sendSuccess(res, { message: 'Verification code sent' });
});

export const verifyOtpHandler = asyncHandler(async (req: Request, res: Response) => {
  const { channel, identifier, purpose, code } = req.body;
  void channel;
  await otpService.verifyOtp(identifier, purpose, code);
  sendSuccess(res, { message: 'Verification successful' });
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { channel, identifier, purpose } = req.body;
  if (await shouldActuallySend(identifier, channel, purpose)) {
    await otpService.requestOtp(identifier, channel, purpose);
  }
  sendSuccess(res, { message: 'Verification code resent' });
});