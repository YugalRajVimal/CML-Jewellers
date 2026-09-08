import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { requireAdminAuth, requirePermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import * as bannerController from '../../controllers/banner.controller';
import * as homepageController from '../../controllers/homepageContent.controller';
import { createBannerSchema, updateBannerSchema, upsertHomepageSectionSchema } from '../../validators/adminOps.validators';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth, requirePermission(PERMISSIONS.CONTENT_MANAGE));
router.use(auditLog('Content'));

router.get('/banners', bannerController.adminListBanners);
router.post('/banners', validate(createBannerSchema), bannerController.adminCreateBanner);
router.patch('/banners/:id', validate(updateBannerSchema), bannerController.adminUpdateBanner);
router.delete('/banners/:id', bannerController.adminDeleteBanner);

router.get('/homepage', homepageController.adminListHomepageContent);
router.put('/homepage/:section', validate(upsertHomepageSectionSchema), homepageController.adminUpsertHomepageSection);
router.delete('/homepage/:section', homepageController.adminDeleteHomepageSection);

export default router;
