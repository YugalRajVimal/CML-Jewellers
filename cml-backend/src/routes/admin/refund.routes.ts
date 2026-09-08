import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as refundController from '../../controllers/refund.controller';
import { updateRefundStatusSchema } from '../../validators/adminCommerce.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth, requirePermission(PERMISSIONS.REFUND_MANAGE));
router.use(auditLog('Refund'));

router.get('/', refundController.adminListRefunds);
router.get('/:id', refundController.adminGetRefund);
router.patch('/:id/status', validate(updateRefundStatusSchema), refundController.adminUpdateRefundStatus);

export default router;
