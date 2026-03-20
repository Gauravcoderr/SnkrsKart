import { Router } from 'express';
import { getAllBrands } from '../controllers/brandController';

const router = Router();

router.get('/', getAllBrands);

export default router;
