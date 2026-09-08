import axios from 'axios';
import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';

const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

const cfClient = axios.create({
  baseURL: CASHFREE_BASE_URL,
  headers: {
    'x-client-id': env.cashfree.appId,
    'x-client-secret': env.cashfree.secretKey,
    'x-api-version': '2023-08-01',
    'Content-Type': 'application/json',
  },
});

export interface CashfreeOrderResult {
  cfOrderId: string;
  paymentSessionId: string;
  orderStatus: string;
}

export interface CashfreeCustomer {
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
}

/** Creates a Cashfree order and returns a payment_session_id for the hosted checkout. */
export async function createCashfreeOrder(
  orderId: string,
  amount: number,
  customer: CashfreeCustomer,
  returnUrl: string
): Promise<CashfreeOrderResult> {
  if (!env.cashfree.appId || !env.cashfree.secretKey) {
    throw AppError.internal('Cashfree credentials are not configured', 'CASHFREE_NOT_CONFIGURED');
  }

  try {
    const response = await cfClient.post('/orders', {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customer.customerId,
        customer_name: customer.customerName,
        customer_email: customer.customerEmail || 'noreply@cmljewellers.in',
        customer_phone: customer.customerPhone,
      },
      order_meta: {
        return_url: returnUrl,
      },
    });

    return {
      cfOrderId: response.data.cf_order_id || response.data.order_id,
      paymentSessionId: response.data.payment_session_id,
      orderStatus: response.data.order_status,
    };
  } catch (error) {
    logger.error('Cashfree order creation failed', (error as Error).message);
    throw AppError.internal('Failed to create payment session', 'CASHFREE_ORDER_CREATE_FAILED');
  }
}

/** Fetches the authoritative order/payment status directly from Cashfree — never trust the client callback alone. */
export async function fetchCashfreeOrderStatus(orderId: string): Promise<{ orderStatus: string; raw: unknown }> {
  try {
    const response = await cfClient.get(`/orders/${orderId}`);
    return { orderStatus: response.data.order_status, raw: response.data };
  } catch (error) {
    logger.error('Cashfree order status fetch failed', (error as Error).message);
    throw AppError.internal('Failed to fetch payment status', 'CASHFREE_STATUS_FETCH_FAILED');
  }
}

/**
 * Verifies the Cashfree webhook signature per their HMAC-SHA256 scheme:
 * signature = base64(HMAC_SHA256(timestamp + rawBody, webhookSecret))
 */
export function verifyCashfreeWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
  if (!env.cashfree.webhookSecret) {
    logger.warn('CASHFREE_WEBHOOK_SECRET not configured — rejecting webhook by default');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.cashfree.webhookSecret)
    .update(timestamp + rawBody)
    .digest('base64');

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch {
    return false; // length mismatch etc. — treat as invalid rather than throwing
  }
}
