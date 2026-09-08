import { Payment } from '../../models/Payment.model';
import { AppError } from '../../utils/AppError';
import { verifyCashfreeWebhookSignature } from './cashfreeClient';
import { applyPaymentStatusChange } from './payment.service';
import { logger } from '../../utils/logger';

interface CashfreeWebhookBody {
  type: string; // e.g. "PAYMENT_SUCCESS_WEBHOOK", "PAYMENT_FAILED_WEBHOOK"
  data: {
    order: { order_id: string };
    payment?: { payment_status?: string };
  };
}

function mapWebhookEventToStatus(eventType: string): 'Success' | 'Failed' | 'Cancelled' | null {
  if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') return 'Success';
  if (eventType === 'PAYMENT_FAILED_WEBHOOK') return 'Failed';
  if (eventType === 'PAYMENT_USER_DROPPED_WEBHOOK') return 'Cancelled';
  return null;
}

/**
 * Handles an incoming Cashfree webhook. Verifies the HMAC signature against the
 * *raw* request body before touching anything, then applies the status change
 * idempotently — replayed webhook deliveries for an already-terminal payment are
 * safe no-ops (see applyPaymentStatusChange).
 */
export async function handleCashfreeWebhook(rawBody: string, timestamp: string, signature: string): Promise<void> {
  const isValid = verifyCashfreeWebhookSignature(rawBody, timestamp, signature);
  if (!isValid) {
    throw AppError.unauthorized('Invalid webhook signature', 'WEBHOOK_SIGNATURE_INVALID');
  }

  let body: CashfreeWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw AppError.badRequest('Malformed webhook payload', 'WEBHOOK_PAYLOAD_INVALID');
  }

  const cfOrderId = body.data?.order?.order_id;
  if (!cfOrderId) {
    throw AppError.badRequest('Webhook payload missing order_id', 'WEBHOOK_PAYLOAD_INVALID');
  }

  const payment = await Payment.findOne({ providerRefId: cfOrderId });
  if (!payment) {
    // Don't 500 on a webhook for an order we don't recognize — log and accept it so
    // Cashfree doesn't retry indefinitely for something that will never resolve.
    logger.warn('Webhook received for unknown providerRefId', { cfOrderId });
    return;
  }

  payment.rawWebhookEvents.push({ receivedAt: new Date(), eventType: body.type, payload: body });
  await payment.save();

  const newStatus = mapWebhookEventToStatus(body.type);
  if (!newStatus) {
    logger.info('Ignoring unhandled Cashfree webhook event type', { type: body.type });
    return;
  }

  await applyPaymentStatusChange(payment, newStatus);
}
