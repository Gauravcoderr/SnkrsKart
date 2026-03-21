import { Router } from 'express';
import { getAllBrands, getBrandBySlug } from '../controllers/brandController';

const router = Router();

router.get('/', getAllBrands);
router.get('/:slug', getBrandBySlug);

export default router;
