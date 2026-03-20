import { Router, Request, Response } from 'express';
import { Banner } from '../models/Banner';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ order: 1 }).lean();
    res.json(banners);
  } catch {
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

export default router;
