import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as productController from '../../controllers/product.controller';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  productListQuerySchema,
} from '../../validators/catalog.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth);
router.use(auditLog('Product'));

router.get('/', requirePermission(PERMISSIONS.PRODUCT_READ), validate(productListQuerySchema, 'query'), productController.adminListProducts);
router.post('/', requirePermission(PERMISSIONS.PRODUCT_WRITE), validate(createProductSchema), productController.adminCreateProduct);
router.get('/:id', requirePermission(PERMISSIONS.PRODUCT_READ), productController.adminGetProduct);
router.patch('/:id', requirePermission(PERMISSIONS.PRODUCT_WRITE), validate(updateProductSchema), productController.adminUpdateProduct);
router.delete('/:id', requirePermission(PERMISSIONS.PRODUCT_WRITE), productController.adminDeleteProduct);

router.get('/:productId/variants', requirePermission(PERMISSIONS.PRODUCT_READ), productController.adminListVariants);
router.post(
  '/:productId/variants',
  requirePermission(PERMISSIONS.PRODUCT_WRITE),
  validate(createVariantSchema),
  productController.adminCreateVariant
);
router.patch(
  '/variants/:variantId',
  requirePermission(PERMISSIONS.PRODUCT_WRITE),
  validate(updateVariantSchema),
  productController.adminUpdateVariant
);
router.delete('/variants/:variantId', requirePermission(PERMISSIONS.PRODUCT_WRITE), productController.adminDeleteVariant);

export default router;
