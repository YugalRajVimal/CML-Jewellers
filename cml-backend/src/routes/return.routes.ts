import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import * as returnController from '../controllers/return.controller';
import { requestReturnSchema } from '../validators/commerce.validators';

const router = Router();

router.use(requireAuth);

router.post('/', validate(requestReturnSchema), returnController.createReturn);
router.get('/:id', returnController.getMyReturn);

export default router;
