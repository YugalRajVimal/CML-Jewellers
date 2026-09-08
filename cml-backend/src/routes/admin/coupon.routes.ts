import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as couponController from '../../controllers/couponAdmin.controller';
import { createCouponSchema, updateCouponSchema } from '../../validators/adminOps.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth, requirePermission(PERMISSIONS.COUPON_MANAGE));
router.use(auditLog('Coupon'));

router.get('/', couponController.adminListCoupons);
router.post('/', validate(createCouponSchema), couponController.adminCreateCoupon);
router.get('/:id', couponController.adminGetCoupon);
router.patch('/:id', validate(updateCouponSchema), couponController.adminUpdateCoupon);
router.delete('/:id', couponController.adminDeleteCoupon);

export default router;
