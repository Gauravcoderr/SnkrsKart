import { Router, Request, Response } from 'express';
import { Drop } from '../models/Drop';

const router = Router();

function sinceDate(query: Request['query']): Date {
  const from = String(query.from ?? '');
  const fromDate = new Date(`${from}T00:00:00Z`);
  const isRealDate = /^\d{4}-\d{2}-\d{2}$/.test(from) && !Number.isNaN(fromDate.getTime()) && fromDate.toISOString().slice(0, 10) === from;
  if (isRealDate) return fromDate;
  const days = Math.min(90, Math.max(0, parseInt(String(query.days ?? '7')) || 7));
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// GET /api/v1/drops?days=N — upcoming published drops plus those released in the last N days (default 7, max 90)
// GET /api/v1/drops?from=YYYY-MM-DD: published drops releasing on or after that date (release calendars)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const since = sinceDate(req.query);
    const drops = await Drop.find({ published: true, releaseDate: { $gte: since } })
      .sort({ releaseDate: 1 })
      .lean();
    res.json(drops);
  } catch {
    res.status(500).json({ error: 'Failed to fetch drops' });
  }
});

// GET /api/v1/drops/count — total published drop count (sitemap use, all-time)
router.get('/count', async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await Drop.countDocuments({ published: true });
    res.json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to count drops' });
  }
});

// GET /api/v1/drops/slugs?page=N&limit=500 — all published drops paginated (sitemap use)
router.get('/slugs', async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string || '1'));
    const limit = Math.min(500, parseInt(req.query.limit as string || '500'));
    const skip  = (page - 1) * limit;
    const [drops, total] = await Promise.all([
      Drop.find({ published: true }).sort({ releaseDate: -1 }).skip(skip).limit(limit).select('slug').lean(),
      Drop.countDocuments({ published: true }),
    ]);
    res.json({ slugs: drops.map((d) => d.slug), total, page, limit, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch drop slugs' });
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
