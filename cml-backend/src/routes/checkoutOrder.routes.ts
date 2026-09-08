import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import * as checkoutController from '../controllers/checkout.controller';
import * as orderController from '../controllers/order.controller';
import { checkoutValidateSchema, createOrderSchema, cancelOrderSchema } from '../validators/commerce.validators';

const router = Router();

router.use(requireAuth);

router.post('/checkout/validate', validate(checkoutValidateSchema), checkoutController.validate);

router.post('/orders', validate(createOrderSchema), orderController.createOrder);
router.get('/orders', orderController.listMyOrders);
router.get('/orders/:id', orderController.getOrder);
router.post('/orders/:id/cancel', validate(cancelOrderSchema), orderController.cancelOrder);

export default router;
