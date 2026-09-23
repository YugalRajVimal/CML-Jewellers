import { Order } from '../../models/Order.model';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import { mapTrackingStatusToOrderStatus } from './shiprocket.service';
import { timingSafeEqual } from 'crypto';

interface ShiprocketWebhookBody {
  awb: string;
  current_status?: string;
  order_id?: string;
  shipment_status?: string;
}

/**
 * Shiprocket webhook authentication.
 *
 * Shiprocket sends the configured shared secret in the x-api-key header.
 * Compared with a constant-time equality check (BUG-18) so response timing
 * can't be used to brute-force the secret one byte at a time.
 */
function isValidShiprocketWebhook(providedSecret: string): boolean {
  if (!env.shiprocket.webhookSecret) {
    logger.warn('SHIPROCKET_WEBHOOK_SECRET not configured — rejecting webhook by default');
    return false;
  }

  if (!providedSecret) {
    return false;
  }

  const expected = Buffer.from(env.shiprocket.webhookSecret);
  const provided = Buffer.from(providedSecret);

  // timingSafeEqual throws on a length mismatch rather than returning false,
  // so check lengths first — a length check alone leaks negligible
  // information compared to the byte-by-byte comparison it protects.
  if (expected.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(expected, provided);
}

/**
 * Handles an incoming Shiprocket tracking webhook. Applies the status update
 * idempotently by AWB — replays for an order that has already moved past the
 * mapped status are safe no-ops because we only ever apply forward transitions
 * (see mapTrackingStatusToOrderStatus / syncTrackingForOrder's forward-only guard).
 */
export async function handleShiprocketWebhook(body: ShiprocketWebhookBody, providedSecret: string): Promise<void> {
  if (!isValidShiprocketWebhook(providedSecret)) {
    throw AppError.unauthorized('Invalid webhook credentials', 'WEBHOOK_AUTH_INVALID');
  }

  const awb = String(body.awb || '').trim();
  const status = String(body.current_status || body.shipment_status || '').trim();

  if (!awb || !status) {
    throw AppError.badRequest('Webhook payload missing awb or status', 'WEBHOOK_PAYLOAD_INVALID');
  }

  const order = await Order.findOne({ 'shipment.awbCode': awb });
  if (!order) {
    logger.warn('Shiprocket webhook received for unknown AWB', { awb });
    // Return normally so Shiprocket doesn't keep retrying an event for an
    // order we don't know.
    return;
  }

  // BUG-18: `order.shipment` is a Mongoose single-nested subdocument — its
  // real field values live behind getters, not as the subdocument's own
  // enumerable properties, so `{ ...order.shipment }` silently drops
  // awbCode/courierName/etc. Update the existing subdocument's fields
  // directly (creating it if it doesn't exist yet) instead of spreading it.
  if (!order.shipment) {
    order.shipment = { lastTrackingStatus: status, lastTrackingSyncedAt: new Date() };
  } else {
    order.shipment.lastTrackingStatus = status;
    order.shipment.lastTrackingSyncedAt = new Date();
  }

  const mappedStatus = mapTrackingStatusToOrderStatus(status);
  const forwardOnly: Record<string, string[]> = {
    Processing: ['Shipped'],
    Shipped: ['Delivered'],
  };
  if (mappedStatus && forwardOnly[order.status]?.includes(mappedStatus)) {
    order.status = mappedStatus as typeof order.status;
  }

  await order.save();

  logger.info('Shiprocket webhook processed', {
    awb,
    status,
    mappedStatus,
    orderId: order._id.toString(),
  });
}