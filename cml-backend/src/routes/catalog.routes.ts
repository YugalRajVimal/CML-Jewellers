import { Router } from 'express';
import { validate } from '../middleware/validate';
import { optionalAuth } from '../middleware/auth.middleware';
import * as productController from '../controllers/product.controller';
import * as categoryController from '../controllers/category.controller';
import * as collectionController from '../controllers/collection.controller';
import * as searchController from '../controllers/search.controller';
import * as bannerController from '../controllers/banner.controller';
import * as homepageController from '../controllers/homepageContent.controller';
import { productListQuerySchema } from '../validators/catalog.validators';

const router = Router();

router.get('/products', optionalAuth, validate(productListQuerySchema, 'query'), productController.listProducts);
router.get('/products/:slug', optionalAuth, productController.getProductBySlug);

router.get('/categories', categoryController.listCategoryTree);
router.get('/categories/:slug/products', categoryController.getCategoryProducts);

router.get('/collections', collectionController.listCollections);

router.get('/search', searchController.search);

router.get('/banners', bannerController.listActiveBanners);
router.get('/homepage', homepageController.getHomepageContent);

export default router;
