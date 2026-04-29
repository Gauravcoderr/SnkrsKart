import { Router, Request, Response } from 'express';
import { SneakerProfile } from '../models/SneakerProfile';

const router = Router();

// GET /api/v1/sneaker-profiles — all published profiles
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const profiles = await SneakerProfile.find({ published: true })
      .sort({ name: 1 })
      .select('slug name brand tagline category silhouette image')
      .lean();
    res.json(profiles);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sneaker profiles' });
  }
});

// GET /api/v1/sneaker-profiles/:slug — single published profile
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await SneakerProfile.findOne({ slug: req.params.slug, published: true }).lean();
    if (!profile) { res.status(404).json({ error: 'Sneaker profile not found' }); return; }
    res.json(profile);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sneaker profile' });
  }
});

export default router;
