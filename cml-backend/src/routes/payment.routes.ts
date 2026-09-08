import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import * as paymentController from '../controllers/payment.controller';
import { createPaymentSessionSchema } from '../validators/payment.validators';

const router = Router();

// Webhook: no auth — verified via Cashfree HMAC signature instead.
router.post('/cashfree/webhook', paymentController.cashfreeWebhook);

router.post('/cashfree/create', requireAuth, validate(createPaymentSessionSchema), paymentController.createPaymentSession);
router.get('/:id/status', requireAuth, paymentController.getPaymentStatus);

export default router;
