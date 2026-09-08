import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.smtp.email,
        pass: env.smtp.password,
      },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.otp.emailEnabled) {
    logger.warn('Email OTP channel disabled — skipping send', { to });
    return;
  }
  if (!env.smtp.email || !env.smtp.password) {
    logger.warn('SMTP credentials not configured — email not actually sent (dev mode)', { to, subject });
    return;
  }

  await getTransporter().sendMail({
    from: `"CML Jewellers" <${env.smtp.email}>`,
    to,
    subject,
    html,
  });
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await sendEmail(
    to,
    'Your CML Jewellers verification code',
    `<p>Your verification code is <strong>${code}</strong>. It expires in ${env.otp.expiryMinutes} minutes.</p>`
  );
}
