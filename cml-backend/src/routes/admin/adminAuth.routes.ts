import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { adminAuthRateLimiter } from '../../middleware/rateLimit.middleware';
import { requireAdminAuth } from '../../middleware/adminAuth.middleware';
import * as adminAuthController from '../../controllers/adminAuth.controller';
import { adminLoginSchema } from '../../validators/admin.validators';

const router = Router();

router.post('/login', adminAuthRateLimiter, validate(adminLoginSchema), adminAuthController.adminLogin);
router.post('/logout', requireAdminAuth, adminAuthController.adminLogout);
router.get('/whoami', requireAdminAuth, adminAuthController.whoami);

export default router;
