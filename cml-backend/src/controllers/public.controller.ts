import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { ContactMessage } from '../models/ContactMessage.model';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.model';
import { sendEmail } from '../services/email.service';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/** POST /contact — stores the message and best-effort emails the store. Never lets an
 * email failure fail the request; the message is already saved either way. */
export const submitContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, message } = req.body;

  const doc = await ContactMessage.create({ name, email, message });

  try {
    await sendEmail(
      env.contact.notifyEmail,
      `New contact form message from ${name}`,
      `<p><strong>From:</strong> ${name} (${email})</p><p>${message.replace(/\n/g, '<br/>')}</p>`
    );
  } catch (err) {
    // The submission itself succeeded (it's saved) — a notification-email failure
    // shouldn't turn into a 500 for the customer.
    logger.error('Failed to send contact form notification email', err);
  }

  sendSuccess(res, {
    message: "Thanks — we've got your message and will reply within a business day.",
    data: { id: doc._id },
    statusCode: 201,
  });
});

/** POST /newsletter/subscribe — idempotent: re-subscribing with the same email is a no-op
 * success rather than a duplicate-key error. */
export const subscribeToNewsletter = asyncHandler(async (req: Request, res: Response) => {
  const { email, source } = req.body;

  await NewsletterSubscriber.findOneAndUpdate(
    { email },
    { $setOnInsert: { email, source } },
    { upsert: true, new: true }
  );

  sendSuccess(res, { message: "You're on the list — thank you.", statusCode: 201 });
});