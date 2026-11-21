import { Router, Request, Response, NextFunction } from 'express';
import { SCRAPED_BRANDS, SCRAPED_SITES } from '../models/ScrapedProduct';
import { RejectedUrl } from '../models/RejectedUrl';
import { ScrapedItem } from '../services/scraper/utils';
import { saveScrapedItems } from '../lib/scrapedIngest';

const router = Router();

function scraperAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '').trim();
  if (!process.env.SCRAPER_SECRET || token !== process.env.SCRAPER_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

async function ingestProducts(products: ScrapedItem[]) {
  let skipped = 0;
  const errors: string[] = [];
  const accepted: ScrapedItem[] = [];

  // Pre-fetch all rejected URLs/SKUs for this batch in one query
  const urls = products.map((p) => p?.sourceUrl).filter(Boolean);
  const skus = products.map((p) => p?.sku).filter(Boolean) as string[];
  const rejected = await RejectedUrl.find({
    $or: [
      { sourceUrl: { $in: urls } },
      ...(skus.length ? [{ sku: { $in: skus } }] : []),
    ],
  }).lean();
  const rejectedUrls = new Set(rejected.map((r) => r.sourceUrl));
  const rejectedSkus = new Set(rejected.map((r) => r.sku).filter(Boolean) as string[]);

  for (const p of products) {
    if (!p || typeof p.sourceUrl !== 'string' || typeof p.name !== 'string' || !p.sourceUrl || !p.name || !p.brand) {
      errors.push(`Skipped invalid item: ${typeof p?.name === 'string' ? p.name : 'unnamed'}`);
      continue;
    }
    if (!(SCRAPED_BRANDS as readonly string[]).includes(p.brand) || !(SCRAPED_SITES as readonly string[]).includes(p.sourceSite)) {
      errors.push(`Skipped unsupported brand/site: ${p.brand}/${p.sourceSite} — ${p.sourceUrl}`);
      continue;
    }
    if (rejectedUrls.has(p.sourceUrl) || (p.sku && rejectedSkus.has(p.sku))) {
      skipped++;
      continue;
    }
    accepted.push(p);
  }

  const saved = await saveScrapedItems(accepted);
  return { inserted: saved.inserted, updated: saved.updated, pricePoints: saved.pricePoints, skipped, errors: [...errors, ...saved.errors] };
}

router.post('/ingest', scraperAuth, async (req: Request, res: Response): Promise<void> => {
  const { products } = req.body as { products: ScrapedItem[] };

  if (!Array.isArray(products) || products.length === 0) {
    res.status(400).json({ error: 'products array required' });
    return;
  }

  try {
    res.json(await ingestProducts(products));
  } catch (err) {
    console.error('[ingest] failed:', (err as Error).message);
    res.status(500).json({ error: 'Ingest failed' });
  }
});

export default router;
