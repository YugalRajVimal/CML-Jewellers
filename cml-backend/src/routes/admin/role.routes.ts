import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as roleController from '../../controllers/role.controller';
import { createRoleSchema, updateRoleSchema } from '../../validators/adminOps.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth, requirePermission(PERMISSIONS.ROLE_MANAGE));
router.use(auditLog('Role'));

router.get('/permissions', roleController.listPermissions);
router.get('/', roleController.adminListRoles);
router.post('/', validate(createRoleSchema), roleController.adminCreateRole);
router.get('/:id', roleController.adminGetRole);
router.patch('/:id', validate(updateRoleSchema), roleController.adminUpdateRole);
router.delete('/:id', roleController.adminDeleteRole);

export default router;
