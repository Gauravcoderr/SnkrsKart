import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { scrapeMyntra } from './myntra';
import { scrapeFootlocker } from './footlocker';
import { scrapeVegNonVeg } from './vegnonveg';
import { scrapeSuperkicks } from './superkicks';
import { scrapeTataCliq, scrapeTataCliqLuxury } from './tatacliq';
import { scrapeAjio } from './ajio';
import { ScrapedItem, isExcludedStyle } from './utils';

puppeteer.use(StealthPlugin());

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';
const SCRAPER_SECRET = process.env.SCRAPER_SECRET ?? '';

async function waitForBackend(maxAttempts = 12, delayMs = 5000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      if (res.ok) {
        console.log(`[run] Backend awake (attempt ${attempt})`);
        return true;
      }
    } catch {
      // Render still spinning up — ignore and retry
    }
    console.log(`[run] Backend not ready, retrying in ${delayMs / 1000}s (attempt ${attempt}/${maxAttempts})...`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  console.warn('[run] Backend did not respond to health check in time, attempting ingest anyway');
  return false;
}

const INGEST_BATCH = 40;

async function postBatch(products: ScrapedItem[]): Promise<{ inserted: number; updated: number; skipped: number; errors: string[] } | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/scraper/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SCRAPER_SECRET}`,
        },
        body: JSON.stringify({ products }),
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (res.ok && contentType.includes('application/json')) {
        return (await res.json()) as { inserted: number; updated: number; skipped: number; errors: string[] };
      }
      const bodySnippet = (await res.text()).slice(0, 300);
      console.error(`[run] Ingest batch failed (attempt ${attempt}): status=${res.status} content-type=${contentType} body=${bodySnippet}`);
      if (res.status === 401 || res.status === 413) return null;
    } catch (err) {
      console.error(`[run] Ingest batch error (attempt ${attempt}):`, (err as Error).message);
    }
    await new Promise((r) => setTimeout(r, 5000 * attempt));
  }
  return null;
}

async function ingest(products: ScrapedItem[]): Promise<void> {
  if (products.length === 0) {
    console.log('[run] No products to ingest');
    return;
  }

  await waitForBackend();

  const totals = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[], failedBatches: 0 };
  for (let i = 0; i < products.length; i += INGEST_BATCH) {
    const data = await postBatch(products.slice(i, i + INGEST_BATCH));
    if (!data) {
      totals.failedBatches++;
      continue;
    }
    totals.inserted += data.inserted;
    totals.updated += data.updated;
    totals.skipped += data.skipped ?? 0;
    totals.errors.push(...data.errors);
  }

  console.log(`[run] Ingest result: inserted=${totals.inserted}, updated=${totals.updated}, skipped=${totals.skipped}, errors=${totals.errors.length}, failedBatches=${totals.failedBatches}`);
  totals.errors.slice(0, 5).forEach((e) => console.warn('[run] Error:', e));
}

async function main(): Promise<void> {
  console.log('[run] GitHub Actions scraper starting...');

  // Fire-and-forget: wake Render backend now so it's warm by the time we ingest
  fetch(`${BACKEND_URL}/health`).catch(() => {});

  const browser = await (puppeteer as any).launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1366,768',
      '--lang=en-IN',
    ],
  });

  try {
    const safeScrape = async (name: string, fn: () => Promise<ScrapedItem[]>): Promise<[string, ScrapedItem[]]> => {
      const started = Date.now();
      try {
        const items = await fn();
        console.log(`[run] ${name}: ${items.length} items in ${Math.round((Date.now() - started) / 1000)}s`);
        return [name, items];
      } catch (err) {
        console.error(`[run] ${name} failed:`, err);
        return [name, []];
      }
    };

    const settled = await Promise.all([
      safeScrape('Myntra', () => scrapeMyntra(browser)),
      safeScrape('Footlocker', () => scrapeFootlocker(browser)),
      safeScrape('VegNonVeg', () => scrapeVegNonVeg(browser)),
      safeScrape('Superkicks', () => scrapeSuperkicks()),
      safeScrape('TataCliq', () => scrapeTataCliq()),
      safeScrape('TataCliqLuxury', () => scrapeTataCliqLuxury()),
      safeScrape('Ajio', () => scrapeAjio(browser)),
    ]);

    const seen = new Set<string>();
    const allItems: ScrapedItem[] = [];
    let excluded = 0;
    for (const [, items] of settled) {
      for (const item of items) {
        if (!item.sourceUrl || !item.price || item.images.length === 0 || seen.has(item.sourceUrl)) continue;
        if (isExcludedStyle(item.name)) {
          excluded++;
          continue;
        }
        seen.add(item.sourceUrl);
        allItems.push(item);
      }
    }

    const byBrand = allItems.reduce<Record<string, number>>((acc, i) => ({ ...acc, [i.brand]: (acc[i.brand] ?? 0) + 1 }), {});
    console.log(`[run] Summary by source: ${settled.map(([n, i]) => `${n}=${i.length}`).join(', ')}`);
    console.log(`[run] Summary by brand: ${Object.entries(byBrand).map(([b, n]) => `${b}=${n}`).join(', ')}`);
    console.log(`[run] Total unique items: ${allItems.length} (excluded ${excluded} sandals/flip-flops)`);
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
