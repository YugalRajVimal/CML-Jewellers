import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as customerAdminController from '../../controllers/customerAdmin.controller';
import { setCustomerActiveSchema } from '../../validators/adminOps.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth, requirePermission(PERMISSIONS.CUSTOMER_READ));
router.use(auditLog('Customer'));

router.get('/', customerAdminController.adminListCustomers);
router.get('/:id', customerAdminController.adminGetCustomer);
router.patch('/:id/active', validate(setCustomerActiveSchema), customerAdminController.adminSetCustomerActive);

export default router;
