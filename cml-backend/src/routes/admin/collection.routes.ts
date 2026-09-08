import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as collectionController from '../../controllers/collection.controller';
import { createCollectionSchema, updateCollectionSchema } from '../../validators/catalog.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth);
router.use(auditLog('Collection'));

router.get('/', requirePermission(PERMISSIONS.PRODUCT_READ), collectionController.adminListCollections);
router.post('/', requirePermission(PERMISSIONS.CATEGORY_WRITE), validate(createCollectionSchema), collectionController.adminCreateCollection);
router.patch('/:id', requirePermission(PERMISSIONS.CATEGORY_WRITE), validate(updateCollectionSchema), collectionController.adminUpdateCollection);
router.delete('/:id', requirePermission(PERMISSIONS.CATEGORY_WRITE), collectionController.adminDeleteCollection);

export default router;
