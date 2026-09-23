import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email').max(200),
  message: z.string().trim().min(1, 'Message is required').max(4000),
});

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().email('Enter a valid email').max(200),
  source: z.enum(['newsletter_band', 'first_visit_modal']).optional().default('newsletter_band'),
});