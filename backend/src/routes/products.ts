import { Router } from 'express';
import {
  getAllProducts,
  getProductBySlug,
  getFeaturedProducts,
  getNewArrivals,
  getTrendingProducts,
  getComingSoonProducts,
} from '../controllers/productController';

const router = Router();

router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/trending', getTrendingProducts);
router.get('/coming-soon', getComingSoonProducts);
router.get('/', getAllProducts);
router.get('/:slug', getProductBySlug);

export default router;
