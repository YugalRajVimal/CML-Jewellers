import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { Payment } from '../models/Payment.model';
import * as paymentService from '../services/payment/payment.service';
import { handleCashfreeWebhook } from '../services/payment/webhook.service';

// export const createPaymentSession = asyncHandler(async (req: Request, res: Response) => {
//   const { orderId } = req.body;
//   const payment = await paymentService.createPaymentSession(req.user!.sub, orderId);

//   sendSuccess(res, {
//     message: 'Payment session created',
//     data: {
//       paymentId: payment._id,
//       paymentSessionId: payment.cfPaymentSessionId,
//       amount: payment.amount,
//       status: payment.status,
//     },
//     statusCode: 201,
//   });
// });

export const createPaymentSession = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const payment = await paymentService.createPaymentSession(req.user!.sub, orderId);

  const checkoutHost =
    process.env.CASHFREE_ENV === 'production'
      ? 'https://payments.cashfree.com'
      : 'https://payments-test.cashfree.com';

  sendSuccess(res, {
    message: 'Payment session created',
    data: {
      paymentId: payment._id,
      paymentSessionId: payment.cfPaymentSessionId,
      paymentLink: `${checkoutHost}/order/#${payment.cfPaymentSessionId}`, // NEW — what the frontend redirects to
      amount: payment.amount,
      status: payment.status,
    },
    statusCode: 201,
  });
});

export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payment = await Payment.findById(id);
  if (!payment) throw AppError.notFound('Payment not found');

  const { Order } = await import('../models/Order.model');
  const order = await Order.findOne({ _id: payment.orderId, userId: req.user!.sub });
  if (!order) throw AppError.notFound('Payment not found');

  const synced = await paymentService.syncPaymentStatus(payment);
  sendSuccess(res, { data: { payment: synced } });
});

/**
 * POST /payments/cashfree/webhook — no auth, signature-verified instead.
 * Uses req.rawBody (captured by the global express.json verify hook in app.ts)
 * so the HMAC is computed over the exact bytes Cashfree signed.
 */
export const cashfreeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.header('x-webhook-signature') || '';
  const timestamp = req.header('x-webhook-timestamp') || '';
  const rawBody = req.rawBody || JSON.stringify(req.body);

  await handleCashfreeWebhook(rawBody, timestamp, signature);

  // Cashfree expects a 200 to stop retrying — respond plainly, not the standard envelope.
  res.status(200).json({ received: true });
});
