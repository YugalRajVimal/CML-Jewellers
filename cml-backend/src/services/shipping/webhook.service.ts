// import { Order } from '../../models/Order.model';
// import { AppError } from '../../utils/AppError';
// import { logger } from '../../utils/logger';
// import { env } from '../../config/env';
// import { mapTrackingStatusToOrderStatus } from './shiprocket.service';

// interface ShiprocketWebhookBody {
//   awb: string;
//   current_status: string;
//   order_id?: string; // this is Shiprocket's own order id, not ours
//   shipment_status?: string;
// }

// /** Shiprocket's webhook auth is a shared secret configured in their dashboard
//  * and echoed back in a custom header on every call — no HMAC over the body,
//  * so verification is a constant-time string compare. */
// function isValidShiprocketWebhook(providedSecret: string): boolean {
//   if (!env.shiprocket.webhookSecret) {
//     logger.warn('SHIPROCKET_WEBHOOK_SECRET not configured — rejecting webhook by default');
//     return false;
//   }
//   return providedSecret === env.shiprocket.webhookSecret;
// }

// /**
//  * Handles an incoming Shiprocket tracking webhook. Applies the status update
//  * idempotently by AWB — replays for an order that has already moved past the
//  * mapped status are safe no-ops because we only ever apply forward transitions
//  * (see mapTrackingStatusToOrderStatus / syncTrackingForOrder's forward-only guard).
//  */
// export async function handleShiprocketWebhook(body: ShiprocketWebhookBody, providedSecret: string): Promise<void> {
//   if (!isValidShiprocketWebhook(providedSecret)) {
//     throw AppError.unauthorized('Invalid webhook credentials', 'WEBHOOK_SIGNATURE_INVALID');
//   }

//   const awb = body.awb;
//   const status = body.current_status || body.shipment_status;
//   if (!awb || !status) {
//     throw AppError.badRequest('Webhook payload missing awb or status', 'WEBHOOK_PAYLOAD_INVALID');
//   }

//   const order = await Order.findOne({ 'shipment.awbCode': awb });
//   if (!order) {
//     logger.warn('Shiprocket webhook received for unknown AWB', { awb });
//     return;
//   }

//   order.shipment = { ...(order.shipment ?? {}), lastTrackingStatus: status, lastTrackingSyncedAt: new Date() };

//   const mappedStatus = mapTrackingStatusToOrderStatus(status);
//   const forwardOnly: Record<string, string[]> = {
//     Processing: ['Shipped'],
//     Shipped: ['Delivered'],
//   };
//   if (mappedStatus && forwardOnly[order.status]?.includes(mappedStatus)) {
//     order.status = mappedStatus as typeof order.status;
//   }

//   await order.save();
// }


import { Order } from '../../models/Order.model';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import { mapTrackingStatusToOrderStatus } from './shiprocket.service';

interface ShiprocketWebhookBody {
  awb: string;
  current_status?: string;
  order_id?: string;
  shipment_status?: string;
}

/**
 * Shiprocket webhook authentication.
 *
 * Shiprocket sends the configured shared secret in the
 * x-api-key header.
 */
function isValidShiprocketWebhook(
  providedSecret: string
): boolean {
  if (!env.shiprocket.webhookSecret) {
    logger.warn(
      'SHIPROCKET_WEBHOOK_SECRET not configured — rejecting webhook by default'
    );

    return false;
  }

  if (!providedSecret) {
    return false;
  }

  return (
    providedSecret ===
    env.shiprocket.webhookSecret
  );
}

/**
 * Handles an incoming Shiprocket tracking webhook.
 */
export async function handleShiprocketWebhook(
  body: ShiprocketWebhookBody,
  providedSecret: string
): Promise<void> {
  if (
    !isValidShiprocketWebhook(
      providedSecret
    )
  ) {
    throw AppError.unauthorized(
      'Invalid webhook credentials',
      'WEBHOOK_AUTH_INVALID'
    );
  }

  const awb = String(
    body.awb || ''
  ).trim();

  const status = String(
    body.current_status ||
      body.shipment_status ||
      ''
  ).trim();

  if (!awb || !status) {
    throw AppError.badRequest(
      'Webhook payload missing awb or status',
      'WEBHOOK_PAYLOAD_INVALID'
    );
  }

  const order = await Order.findOne({
    'shipment.awbCode': awb,
  });

  if (!order) {
    logger.warn(
      'Shiprocket webhook received for unknown AWB',
      { awb }
    );

    // Return normally so Shiprocket doesn't keep
    // retrying an event for an order we don't know.
    return;
  }

  order.shipment = {
    ...(order.shipment ?? {}),

    lastTrackingStatus:
      status,

    lastTrackingSyncedAt:
      new Date(),
  };

  const mappedStatus =
    mapTrackingStatusToOrderStatus(
      status
    );

  const forwardOnly: Record<
    string,
    string[]
  > = {
    Processing: ['Shipped'],
    Shipped: ['Delivered'],
  };

  if (
    mappedStatus &&
    forwardOnly[order.status]?.includes(
      mappedStatus
    )
  ) {
    order.status =
      mappedStatus as typeof order.status;
  }

  await order.save();

  logger.info(
    'Shiprocket webhook processed',
    {
      awb,
      status,
      mappedStatus,
      orderId: order._id.toString(),
    }
  );
}