import { ScrapedProduct } from '../../models/ScrapedProduct';
import { scrapeAllShopify } from './shopify';
import { scrapeNikeIndia } from './nike';
import { ScrapedItem } from './utils';

export async function runRenderScraper(): Promise<void> {
  console.log('[scraper] Render run starting...');
  const start = Date.now();
  let inserted = 0;
  let updated = 0;

  const [shopifyResult, nikeResult] = await Promise.allSettled([
    scrapeAllShopify(),
    scrapeNikeIndia(),
  ]);

  const allItems: ScrapedItem[] = [
    ...(shopifyResult.status === 'fulfilled' ? shopifyResult.value : []),
    ...(nikeResult.status === 'fulfilled' ? nikeResult.value : []),
  ];

  if (shopifyResult.status === 'rejected') {
    console.error('[scraper] Shopify run failed:', shopifyResult.reason);
  }
  if (nikeResult.status === 'rejected') {
    console.error('[scraper] Nike run failed:', nikeResult.reason);
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

  const duration = Math.round((Date.now() - start) / 1000);
  console.log(`[scraper] Done in ${duration}s — inserted: ${inserted}, updated: ${updated}`);
}
