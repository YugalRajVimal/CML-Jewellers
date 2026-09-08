import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as categoryController from '../../controllers/category.controller';
import { createCategorySchema, updateCategorySchema } from '../../validators/catalog.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth);
router.use(auditLog('Category'));

router.get('/', requirePermission(PERMISSIONS.PRODUCT_READ), categoryController.adminListCategories);
router.post('/', requirePermission(PERMISSIONS.CATEGORY_WRITE), validate(createCategorySchema), categoryController.adminCreateCategory);
router.patch('/:id', requirePermission(PERMISSIONS.CATEGORY_WRITE), validate(updateCategorySchema), categoryController.adminUpdateCategory);
router.delete('/:id', requirePermission(PERMISSIONS.CATEGORY_WRITE), categoryController.adminDeleteCategory);

export default router;
