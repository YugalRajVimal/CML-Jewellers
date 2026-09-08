import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as purchaseController from '../../controllers/purchase.controller';
import { createPurchaseSchema, receivePurchaseSchema } from '../../validators/adminCommerce.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth, requirePermission(PERMISSIONS.PURCHASE_MANAGE));
router.use(auditLog('Purchase'));

router.get('/', purchaseController.listPurchases);
router.post('/', validate(createPurchaseSchema), purchaseController.createPurchase);
router.get('/:id', purchaseController.getPurchase);
router.post('/:id/receive', validate(receivePurchaseSchema), purchaseController.receivePurchase);
router.post('/:id/cancel', purchaseController.cancelPurchase);

export default router;
