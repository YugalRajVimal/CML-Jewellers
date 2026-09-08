import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import * as otpService from '../services/otp.service';

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { channel, identifier, purpose } = req.body;
  await otpService.requestOtp(identifier, channel, purpose);
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
  await otpService.requestOtp(identifier, channel, purpose);
  sendSuccess(res, { message: 'Verification code resent' });
});
