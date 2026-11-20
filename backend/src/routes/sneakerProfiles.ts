import { Router, Request, Response } from 'express';
import { SneakerProfile } from '../models/SneakerProfile';
import { getMarkets, pricedProfiles } from '../lib/sneakerMarket';

const router = Router();

// GET /api/v1/sneaker-profiles — all published profiles
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const profiles = await SneakerProfile.find({ published: true })
      .sort({ name: 1 })
      .select('slug name brand tagline category silhouette image releaseYear originalRetailPrice designer')
      .lean();
    res.json(profiles);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sneaker profiles' });
  }
});

// GET /api/v1/sneaker-profiles/count — total published count (sitemap use)
router.get('/count', async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await SneakerProfile.countDocuments({ published: true });
    res.json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to count sneaker profiles' });
  }
});

// GET /api/v1/sneaker-profiles/slugs?page=N&limit=500 — paginated slugs (sitemap use)
router.get('/slugs', async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string || '1'));
    const limit = Math.min(500, parseInt(req.query.limit as string || '500'));
    const skip  = (page - 1) * limit;
    const [profiles, total] = await Promise.all([
      SneakerProfile.find({ published: true }).sort({ name: 1 }).skip(skip).limit(limit).select('slug').lean(),
      SneakerProfile.countDocuments({ published: true }),
    ]);
    res.json({ slugs: profiles.map((p) => p.slug), total, page, limit, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch sneaker profile slugs' });
  }
});

router.get('/prices', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [profiles, markets] = await Promise.all([
      SneakerProfile.find({ published: true })
        .sort({ name: 1 })
        .select('slug name brand image category indiaRetailPrice')
        .lean(),
      getMarkets(),
    ]);
    res.json(pricedProfiles(profiles, markets));
  } catch (err) {
    console.error('[sneaker-profiles prices]', err);
    res.status(500).json({ error: 'Failed to fetch sneaker prices' });
  }
});

// GET /api/v1/sneaker-profiles/:slug — single published profile
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await SneakerProfile.findOne({ slug: req.params.slug, published: true }).lean();
    if (!profile) { res.status(404).json({ error: 'Sneaker profile not found' }); return; }
    let markets;
    try {
      markets = await getMarkets();
    } catch {
      res.status(503).json({ error: 'Sneaker prices are temporarily unavailable' });
      return;
    }
    res.json({ ...profile, market: markets.get(profile.slug) ?? null });
  } catch {
    res.status(500).json({ error: 'Failed to fetch sneaker profile' });
  }
});

export default router;
