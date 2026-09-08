import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as reviewController from '../../controllers/review.controller';
import { moderateReviewSchema } from '../../validators/adminOps.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth, requirePermission(PERMISSIONS.CONTENT_MANAGE));
router.use(auditLog('Review'));

router.get('/', reviewController.adminListReviews);
router.patch('/:id/moderate', validate(moderateReviewSchema), reviewController.adminModerateReview);

export default router;
