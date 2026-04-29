import { Router, Request, Response } from 'express';
import { Drop } from '../models/Drop';

const router = Router();

// GET /api/v1/drops — upcoming published drops sorted by release date
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    // Include drops from past 7 days so recently released ones still show briefly
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const drops = await Drop.find({ published: true, releaseDate: { $gte: since } })
      .sort({ releaseDate: 1 })
      .lean();
    res.json(drops);
  } catch {
    res.status(500).json({ error: 'Failed to fetch drops' });
  }
});

// GET /api/v1/drops/:slug — single drop
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const drop = await Drop.findOne({ slug: req.params.slug, published: true }).lean();
    if (!drop) { res.status(404).json({ error: 'Drop not found' }); return; }
    res.json(drop);
  } catch {
    res.status(500).json({ error: 'Failed to fetch drop' });
  }
});

export default router;
