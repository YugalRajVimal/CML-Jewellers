import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import * as wishlistController from '../controllers/wishlist.controller';
import { addToWishlistSchema } from '../validators/commerce.validators';

const router = Router();

router.use(requireAuth);

router.get('/', wishlistController.listWishlist);
router.post('/', validate(addToWishlistSchema), wishlistController.addToWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

export default router;
