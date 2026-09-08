import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as adminUserController from '../../controllers/adminUserAdmin.controller';
import {
  createAdminUserSchema,
  updateAdminUserSchema,
  resetAdminUserPasswordSchema,
} from '../../validators/adminOps.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth, requirePermission(PERMISSIONS.ADMIN_USER_MANAGE));
router.use(auditLog('AdminUser'));

router.get('/', adminUserController.adminListAdminUsers);
router.post('/', validate(createAdminUserSchema), adminUserController.adminCreateAdminUser);
router.get('/:id', adminUserController.adminGetAdminUser);
router.patch('/:id', validate(updateAdminUserSchema), adminUserController.adminUpdateAdminUser);
router.post('/:id/reset-password', validate(resetAdminUserPasswordSchema), adminUserController.adminResetAdminUserPassword);
router.post('/:id/deactivate', adminUserController.adminDeactivateAdminUser);

export default router;
