import { Router } from 'express';
import { validate } from '../middleware/validate';
import { publicFormRateLimiter } from '../middleware/rateLimit.middleware';
import { contactMessageSchema, newsletterSubscribeSchema } from '../validators/public.validators';
import * as publicController from '../controllers/public.controller';

const router = Router();

router.post(
  '/contact',
  publicFormRateLimiter,
  validate(contactMessageSchema),
  publicController.submitContactMessage
);

router.post(
  '/newsletter/subscribe',
  publicFormRateLimiter,
  validate(newsletterSubscribeSchema),
  publicController.subscribeToNewsletter
);

export default router;