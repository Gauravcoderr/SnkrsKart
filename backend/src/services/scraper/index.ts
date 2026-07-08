import { ScrapedProduct } from '../../models/ScrapedProduct';
import { scrapeAllShopify } from './shopify';
import { ScrapedItem } from './utils';

export interface ScraperRunResult {
  inserted: number;
  updated: number;
  shopifyFailed: boolean;
  durationSec: number;
}

export async function runRenderScraper(): Promise<ScraperRunResult> {
  console.log('[scraper] Render run starting...');
  const start = Date.now();
  let inserted = 0;
  let updated = 0;

  const [shopifyResult] = await Promise.allSettled([
    scrapeAllShopify(),
  ]);

  const allItems: ScrapedItem[] = [
    ...(shopifyResult.status === 'fulfilled' ? shopifyResult.value : []),
  ];

  if (shopifyResult.status === 'rejected') {
    console.error('[scraper] Shopify run failed:', shopifyResult.reason);
  }

  console.log(`[scraper] Total items fetched: ${allItems.length}`);

  for (const item of allItems) {
    try {
      const existing = await ScrapedProduct.findOne({ sourceUrl: item.sourceUrl }).lean();
      await ScrapedProduct.findOneAndUpdate(
        { sourceUrl: item.sourceUrl },
        { $set: { ...item, scrapedAt: new Date() } },
        { upsert: true }
      );
      if (existing) updated++;
      else inserted++;
    } catch (err) {
      console.error(`[scraper] Upsert failed for ${item.sourceUrl}:`, (err as Error).message);
    }
  }

  const durationSec = Math.round((Date.now() - start) / 1000);
  console.log(`[scraper] Done in ${durationSec}s — inserted: ${inserted}, updated: ${updated}`);

  return {
    inserted,
    updated,
    shopifyFailed: shopifyResult.status === 'rejected',
    durationSec,
  };
}
