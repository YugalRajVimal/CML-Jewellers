import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import * as paymentController from '../controllers/payment.controller';
import { createPaymentSessionSchema } from '../validators/payment.validators';

const router = Router();

router.post('/cashfree/create', requireAuth, validate(createPaymentSessionSchema), paymentController.createPaymentSession);
router.get('/:id/status', requireAuth, paymentController.getPaymentStatus);
router.post('/orders/:orderId/sync', requireAuth, paymentController.syncOrderPayment);

export default router;
