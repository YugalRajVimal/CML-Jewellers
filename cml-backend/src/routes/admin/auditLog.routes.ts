import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import * as auditLogController from '../../controllers/auditLog.controller';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.get('/', requireAdminAuth, requirePermission(PERMISSIONS.AUDIT_READ), auditLogController.listAuditLog);

export default router;