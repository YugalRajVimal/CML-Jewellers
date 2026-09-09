import { Router } from 'express';
import adminAuthRoutes from './adminAuth.routes';
import categoryRoutes from './category.routes';
import collectionRoutes from './collection.routes';
import productRoutes from './product.routes';
import mediaRoutes from './media.routes';
import returnRoutes from './return.routes';
import refundRoutes from './refund.routes';
import supplierRoutes from './supplier.routes';
import purchaseRoutes from './purchase.routes';
import inventoryRoutes from './inventory.routes';
import orderRoutes from './order.routes';
import customerRoutes from './customer.routes';
import couponRoutes from './coupon.routes';
import contentRoutes from './content.routes';
import adminUserRoutes from './adminUser.routes';
import roleRoutes from './role.routes';
import dashboardRoutes from './dashboard.routes';
import reviewRoutes from './review.routes';
import paymentAdminRoutes from './paymentAdmin.routes';
import salesRoutes from './sales.routes';
import auditLogRoutes from './auditLog.routes';

const router = Router();

router.use('/auth', adminAuthRoutes);
router.use('/categories', categoryRoutes);
router.use('/collections', collectionRoutes);
router.use('/products', productRoutes);
router.use('/media', mediaRoutes);
router.use('/returns', returnRoutes);
router.use('/refunds', refundRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/coupons', couponRoutes);
router.use('/content', contentRoutes);
router.use('/users', adminUserRoutes);
router.use('/roles', roleRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reviews', reviewRoutes);
router.use('/payments', paymentAdminRoutes);
router.use('/sales', salesRoutes);
router.use('/audit-log', auditLogRoutes);

router.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found', error: { code: 'NOT_FOUND' } });
  });

export default router;
