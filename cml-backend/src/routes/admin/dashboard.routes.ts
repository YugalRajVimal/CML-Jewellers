import { Router } from 'express';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import * as dashboardController from '../../controllers/dashboard.controller';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth, requirePermission(PERMISSIONS.DASHBOARD_READ));

// Read-only analytics — no audit logging needed (GET requests are skipped by auditLog anyway).
router.get('/summary', dashboardController.getDashboardSummary);
router.get('/revenue-trend', dashboardController.getRevenueTrend);
router.get('/order-status-breakdown', dashboardController.getOrderStatusBreakdown);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/low-stock', dashboardController.getLowStockItems);
router.get('/recent-activity', dashboardController.getRecentActivity);

export default router;
