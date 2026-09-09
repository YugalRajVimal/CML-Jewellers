import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import * as paymentAdminController from '../../controllers/paymentAdmin.controller';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth);
router.get('/', requirePermission(PERMISSIONS.PAYMENT_READ), paymentAdminController.listPayments);

export default router;