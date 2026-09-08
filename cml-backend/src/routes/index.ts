import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import catalogRoutes from './catalog.routes';
import wishlistRoutes from './wishlist.routes';
import cartRoutes from './cart.routes';
import checkoutOrderRoutes from './checkoutOrder.routes';
import paymentRoutes from './payment.routes';
import returnRoutes from './return.routes';
import reviewRoutes from './review.routes';
import adminRoutes from './admin/index';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/', catalogRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/cart', cartRoutes);
router.use('/', checkoutOrderRoutes);
router.use('/payments', paymentRoutes);
router.use('/returns', returnRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);

export default router;
