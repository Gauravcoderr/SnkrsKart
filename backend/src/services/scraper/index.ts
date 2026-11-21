import { saveScrapedItems } from '../../lib/scrapedIngest';
import { scrapeAllShopify } from './shopify';
import { ScrapedItem } from './utils';

export interface ScraperRunResult {
  inserted: number;
  updated: number;
  shopifyFailed: boolean;
  failed: number;
  durationSec: number;
}

export async function runRenderScraper(): Promise<ScraperRunResult> {
  console.log('[scraper] Render run starting...');
  const start = Date.now();
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

  const { inserted, updated, pricePoints, errors } = await saveScrapedItems(allItems);
  for (const message of errors) console.error(`[scraper] Not saved: ${message}`);

  const durationSec = Math.round((Date.now() - start) / 1000);
  console.log(`[scraper] Done in ${durationSec}s, inserted: ${inserted}, updated: ${updated}, price points: ${pricePoints}, not saved: ${errors.length}`);

  return {
    inserted,
    updated,
    shopifyFailed: shopifyResult.status === 'rejected',
    failed: errors.length,
    durationSec,
  };
}
