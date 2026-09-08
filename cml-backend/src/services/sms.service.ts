import twilio from 'twilio';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!client) {
    client = twilio(env.twilio.accountSid, env.twilio.authToken);
  }
  return client;
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (!env.otp.smsEnabled) {
    logger.warn('SMS OTP channel disabled — skipping send', { to });
    return;
  }
  if (!env.twilio.accountSid || !env.twilio.authToken || !env.twilio.phoneNumber) {
    logger.warn('Twilio credentials not configured — SMS not actually sent (dev mode)', { to, body });
    return;
  }

  await getClient().messages.create({
    from: env.twilio.phoneNumber,
    to,
    body,
  });
}

export async function sendOtpSms(to: string, code: string): Promise<void> {
  await sendSms(to, `Your CML Jewellers verification code is ${code}. It expires in ${env.otp.expiryMinutes} minutes.`);
}
