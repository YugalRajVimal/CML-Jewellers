import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as settingsAdminController from '../../controllers/settingsAdmin.controller';
import { PERMISSIONS } from '../../constants/permissions';

const updateSettingsSchema = z.object({ codEnabled: z.boolean() });

const router = Router();

router.use(requireAdminAuth);
router.use(auditLog('Setting'));

// Reuses ORDER_WRITE — COD is an order/checkout-level toggle and there's no
// dedicated "settings:manage" permission in the current RBAC scheme. Worth
// splitting into its own permission if more site-wide settings get added.
router.get('/', requirePermission(PERMISSIONS.ORDER_WRITE), settingsAdminController.adminGetSettings);
router.patch(
  '/',
  requirePermission(PERMISSIONS.ORDER_WRITE),
  validate(updateSettingsSchema),
  settingsAdminController.adminUpdateSettings
);

export default router;
