import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { handleShiprocketWebhook } from '../services/shipping/webhook.service';

/**
 * POST /webhooks/shiprocket — no admin/user auth, shared-secret verified
 * instead (see webhook.service.ts). Configure this URL + the same secret
 * (as a custom header, e.g. "x-api-key") in Shiprocket's webhook settings.
 */
export const shiprocketWebhook = asyncHandler(async (req: Request, res: Response) => {
  const providedSecret = req.header('x-api-key') || '';
  await handleShiprocketWebhook(req.body, providedSecret);
  res.status(200).json({ received: true });
});
