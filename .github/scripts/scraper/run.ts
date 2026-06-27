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
    // Sequential — ScrapingAnt free tier allows only 1 concurrent request
    const safeScrape = async (name: string, fn: () => Promise<ScrapedItem[]>): Promise<ScrapedItem[]> => {
      try {
        return await fn();
      } catch (err) {
        console.error(`[run] ${name} failed:`, err);
        return [];
      }
    };

    const myntraItems = await safeScrape('Myntra', () => scrapeMyntra(browser));
    const footlockerItems = await safeScrape('Footlocker', () => scrapeFootlocker(browser));
    const vegNonVegItems = await safeScrape('VegNonVeg', () => scrapeVegNonVeg(browser));

    const allItems: ScrapedItem[] = [...myntraItems, ...footlockerItems, ...vegNonVegItems];

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
