import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import * as reviewController from '../controllers/review.controller';
import { createReviewSchema } from '../validators/adminOps.validators';

const router = Router();

router.get('/product/:productId', reviewController.listProductReviews);
router.post('/', requireAuth, validate(createReviewSchema), reviewController.createReview);

export default router;
