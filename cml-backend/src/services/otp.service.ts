import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Otp, OtpChannel, OtpPurpose } from '../models/Otp.model';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { sendOtpEmail } from './email.service';
import { sendOtpSms } from './sms.service';

function generateCode(): string {
  // 6-digit numeric code
  return crypto.randomInt(100000, 1000000).toString();
}

export async function requestOtp(identifier: string, channel: OtpChannel, purpose: OtpPurpose): Promise<void> {
  if (channel === 'email' && !env.otp.emailEnabled) {
    throw AppError.badRequest('Email OTP is currently disabled', 'OTP_CHANNEL_DISABLED');
  }
  if (channel === 'sms' && !env.otp.smsEnabled) {
    throw AppError.badRequest('SMS OTP is currently disabled', 'OTP_CHANNEL_DISABLED');
  }

  const existing = await Otp.findOne({ identifier, purpose, consumed: false }).sort({ createdAt: -1 });
  if (existing) {
    const secondsSinceLastSend = (Date.now() - existing.lastSentAt.getTime()) / 1000;
    if (secondsSinceLastSend < env.otp.resendCooldownSeconds) {
      throw AppError.tooMany(
        `Please wait ${Math.ceil(env.otp.resendCooldownSeconds - secondsSinceLastSend)}s before requesting another code`,
        'OTP_RESEND_COOLDOWN'
      );
    }
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.otp.expiryMinutes * 60 * 1000);

  // Invalidate any previous unconsumed OTPs for this identifier+purpose
  await Otp.updateMany({ identifier, purpose, consumed: false }, { consumed: true });

  await Otp.create({
    identifier,
    channel,
    purpose,
    codeHash,
    expiresAt,
    maxAttempts: env.otp.maxAttempts,
    lastSentAt: new Date(),
  });

  if (channel === 'email') {
    await sendOtpEmail(identifier, code);
  } else {
    await sendOtpSms(identifier, code);
  }
}

export async function verifyOtp(identifier: string, purpose: OtpPurpose, code: string): Promise<void> {
  const otp = await Otp.findOne({ identifier, purpose, consumed: false }).sort({ createdAt: -1 });
  if (!otp) {
    throw AppError.badRequest('No active verification code found. Please request a new one.', 'OTP_NOT_FOUND');
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    throw AppError.badRequest('Verification code has expired', 'OTP_EXPIRED');
  }

  if (otp.attempts >= otp.maxAttempts) {
    throw AppError.tooMany('Maximum verification attempts exceeded. Please request a new code.', 'OTP_MAX_ATTEMPTS');
  }

  const isValid = await bcrypt.compare(code, otp.codeHash);
  if (!isValid) {
    otp.attempts += 1;
    await otp.save();
    throw AppError.badRequest('Invalid verification code', 'OTP_INVALID');
  }

  otp.consumed = true;
  await otp.save();
}
