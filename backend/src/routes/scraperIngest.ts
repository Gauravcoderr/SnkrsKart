import { Router, Request, Response, NextFunction } from 'express';
import { ScrapedProduct } from '../models/ScrapedProduct';
import { RejectedUrl } from '../models/RejectedUrl';
import { ScrapedItem } from '../services/scraper/utils';

const router = Router();

function scraperAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '').trim();
  if (!process.env.SCRAPER_SECRET || token !== process.env.SCRAPER_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

router.post('/ingest', scraperAuth, async (req: Request, res: Response): Promise<void> => {
  const { products } = req.body as { products: ScrapedItem[] };

  if (!Array.isArray(products) || products.length === 0) {
    res.status(400).json({ error: 'products array required' });
    return;
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Pre-fetch all rejected URLs/SKUs for this batch in one query
  const urls = products.map((p) => p.sourceUrl).filter(Boolean);
  const skus = products.map((p) => p.sku).filter(Boolean) as string[];
  const rejected = await RejectedUrl.find({
    $or: [
      { sourceUrl: { $in: urls } },
      ...(skus.length ? [{ sku: { $in: skus } }] : []),
    ],
  }).lean();
  const rejectedUrls = new Set(rejected.map((r) => r.sourceUrl));
  const rejectedSkus = new Set(rejected.map((r) => r.sku).filter(Boolean) as string[]);

  for (const p of products) {
    if (!p.sourceUrl || !p.name || !p.brand) {
      errors.push(`Skipped invalid item: ${p.name ?? 'unnamed'}`);
      continue;
    }
    if (rejectedUrls.has(p.sourceUrl) || (p.sku && rejectedSkus.has(p.sku))) {
      skipped++;
      continue;
    }
    try {
      const existing = await ScrapedProduct.findOne({ sourceUrl: p.sourceUrl }).lean();
      await ScrapedProduct.findOneAndUpdate(
        { sourceUrl: p.sourceUrl },
        { $set: { ...p, scrapedAt: new Date() } },
        { upsert: true }
      );
      if (existing) updated++;
      else inserted++;
    } catch (err) {
      errors.push(`${p.sourceUrl}: ${(err as Error).message}`);
    }
  }

  res.json({ inserted, updated, skipped, errors });
});

export default router;
