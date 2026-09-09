import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import * as salesController from '../../controllers/sales.controller';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.get('/', requireAdminAuth, requirePermission(PERMISSIONS.SALES_READ), salesController.getSalesReport);

export default router;