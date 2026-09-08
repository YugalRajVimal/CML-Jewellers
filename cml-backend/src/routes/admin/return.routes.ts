import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as returnController from '../../controllers/return.controller';
import { rejectReturnSchema, inspectReturnSchema } from '../../validators/adminCommerce.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth, requirePermission(PERMISSIONS.RETURN_MANAGE));
router.use(auditLog('Return'));

router.get('/', returnController.adminListReturns);
router.get('/:id', returnController.adminGetReturn);
router.post('/:id/approve', returnController.adminApproveReturn);
router.post('/:id/reject', validate(rejectReturnSchema), returnController.adminRejectReturn);
router.post('/:id/pickup', returnController.adminMarkPickedUp);
router.post('/:id/received', returnController.adminMarkReceived);
router.post('/:id/inspect', validate(inspectReturnSchema), returnController.adminInspectReturn);
router.post('/:id/refund', returnController.adminProcessRefund);

export default router;
