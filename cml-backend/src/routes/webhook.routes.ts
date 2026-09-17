import { Router } from 'express';
import { shiprocketWebhook } from '../controllers/shiprocketWebhook.controller';

const router = Router();

// No requireAuth here — Shiprocket calls this directly. Authenticity is
// checked inside the controller via the shared-secret header instead.
router.post('/shiprocket', shiprocketWebhook);

export default router;
