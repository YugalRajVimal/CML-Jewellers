import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as orderAdminController from '../../controllers/orderAdmin.controller';
import { updateOrderStatusSchema, assignCourierSchema } from '../../validators/adminOps.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth);
router.use(auditLog('Order'));

router.get('/', requirePermission(PERMISSIONS.ORDER_READ), orderAdminController.adminListOrders);
router.get('/:id', requirePermission(PERMISSIONS.ORDER_READ), orderAdminController.adminGetOrder);
router.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.ORDER_WRITE),
  validate(updateOrderStatusSchema),
  orderAdminController.adminUpdateOrderStatus
);

router.get(
  '/:id/shipping/couriers',
  requirePermission(PERMISSIONS.ORDER_WRITE),
  orderAdminController.adminGetShippingCouriers
);
router.post(
  '/:id/shipping/awb',
  requirePermission(PERMISSIONS.ORDER_WRITE),
  validate(assignCourierSchema),
  orderAdminController.adminAssignShippingCourier
);
router.post(
  '/:id/shipping/pickup',
  requirePermission(PERMISSIONS.ORDER_WRITE),
  orderAdminController.adminScheduleShippingPickup
);
router.post(
  '/:id/shipping/sync',
  requirePermission(PERMISSIONS.ORDER_WRITE),
  orderAdminController.adminSyncShippingTracking
);

export default router;
