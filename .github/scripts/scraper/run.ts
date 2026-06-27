import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { scrapeMyntra } from './myntra';
import { scrapeFootlocker } from './footlocker';
import { scrapeVegNonVeg } from './vegnonveg';
import { ScrapedItem } from './utils';

puppeteer.use(StealthPlugin());

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';
const SCRAPER_SECRET = process.env.SCRAPER_SECRET ?? '';

async function ingest(products: ScrapedItem[]): Promise<void> {
  if (products.length === 0) {
    console.log('[run] No products to ingest');
    return;
  }
  const res = await fetch(`${BACKEND_URL}/api/v1/scraper/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SCRAPER_SECRET}`,
    },
    body: JSON.stringify({ products }),
  });
  const data = (await res.json()) as { inserted: number; updated: number; errors: string[] };
  console.log(`[run] Ingest result: inserted=${data.inserted}, updated=${data.updated}, errors=${data.errors.length}`);
  if (data.errors.length > 0) {
    data.errors.slice(0, 5).forEach((e) => console.warn('[run] Error:', e));
  }
}

async function main(): Promise<void> {
  console.log('[run] GitHub Actions scraper starting...');

  const browser = await (puppeteer as any).launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1366,768',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-web-security',
    ],
  });

  try {
    const [myntraResult, footlockerResult, vegNonVegResult] = await Promise.allSettled([
      scrapeMyntra(browser),
      scrapeFootlocker(browser),
      scrapeVegNonVeg(browser),
    ]);

    const allItems: ScrapedItem[] = [
      ...(myntraResult.status === 'fulfilled' ? myntraResult.value : []),
      ...(footlockerResult.status === 'fulfilled' ? footlockerResult.value : []),
      ...(vegNonVegResult.status === 'fulfilled' ? vegNonVegResult.value : []),
    ];

    if (myntraResult.status === 'rejected') {
      console.error('[run] Myntra failed:', myntraResult.reason);
    }
    if (footlockerResult.status === 'rejected') {
      console.error('[run] Footlocker failed:', footlockerResult.reason);
    }
    if (vegNonVegResult.status === 'rejected') {
      console.error('[run] VegNonVeg failed:', vegNonVegResult.reason);
    }

    console.log(`[run] Total items scraped: ${allItems.length}`);
    await ingest(allItems);
  } finally {
    await browser.close();
  }

  console.log('[run] Done.');
}

main().catch((err) => {
  console.error('[run] Fatal error:', err);
  process.exit(1);
});
