import { Router } from 'express';
import { requireAdminAuth, requireAnyPermission } from '../../middleware/adminAuth.middleware';
import { auditLog } from '../../middleware/auditLog.middleware';
import { uploadImage } from '../../middleware/upload.middleware';
import * as mediaController from '../../controllers/media.controller';
import { PERMISSIONS } from '../../constants/permissions';

const router = Router();

router.use(requireAdminAuth);
router.use(auditLog('Media'));

const canUpload = requireAnyPermission(PERMISSIONS.PRODUCT_WRITE, PERMISSIONS.CATEGORY_WRITE, PERMISSIONS.CONTENT_MANAGE);

router.post('/upload', canUpload, uploadImage.single('image'), mediaController.uploadMedia);
router.delete('/:publicId', canUpload, mediaController.deleteMedia);

export default router;
