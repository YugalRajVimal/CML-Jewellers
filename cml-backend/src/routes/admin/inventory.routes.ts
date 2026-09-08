import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as inventoryController from '../../controllers/inventoryAdmin.controller';
import { adjustInventorySchema } from '../../validators/adminCommerce.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth);
router.use(auditLog('Inventory'));

router.get('/', requirePermission(PERMISSIONS.INVENTORY_READ), inventoryController.listInventory);
router.get('/:variantId/transactions', requirePermission(PERMISSIONS.INVENTORY_READ), inventoryController.getInventoryTransactions);
router.post('/adjustments', requirePermission(PERMISSIONS.INVENTORY_WRITE), validate(adjustInventorySchema), inventoryController.adjustInventory);

export default router;
