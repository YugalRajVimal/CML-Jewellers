import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as supplierController from '../../controllers/supplier.controller';
import { createSupplierSchema, updateSupplierSchema } from '../../validators/adminCommerce.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth, requirePermission(PERMISSIONS.PURCHASE_MANAGE));
router.use(auditLog('Supplier'));

router.get('/', supplierController.listSuppliers);
router.post('/', validate(createSupplierSchema), supplierController.createSupplier);
router.get('/:id', supplierController.getSupplier);
router.patch('/:id', validate(updateSupplierSchema), supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

export default router;
