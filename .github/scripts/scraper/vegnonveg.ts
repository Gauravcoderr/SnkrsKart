import { Browser } from 'puppeteer';
import { jitter, sessionUA, scrapingAntFetch, ScrapedItem } from './utils';

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const NIKE_RE = /\bnike\b/i;
const BASE = 'https://www.vegnonveg.com';

function detectBrand(title: string, vendor = ''): 'Nike' | 'Jordan' | null {
  const h = `${title} ${vendor}`;
  if (JORDAN_RE.test(h)) return 'Jordan';
  if (NIKE_RE.test(h)) return 'Nike';
  return null;
}

interface VNVShopifyProduct {
  handle?: string;
  title?: string;
  vendor?: string;
  variants?: { price?: string; compare_at_price?: string | null; available?: boolean; title?: string }[];
  images?: { src?: string }[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

function inferGender(tags: string[]): ScrapedItem['gender'] {
  const s = tags.join(' ').toLowerCase();
  if (/\bwomen\b|\bwomens\b/.test(s)) return 'women';
  if (/\bkids\b|\bjunior\b/.test(s)) return 'kids';
  if (/\bmen\b|\bmens\b/.test(s)) return 'men';
  return 'unisex';
}

function parseShopifyProducts(json: { products?: VNVShopifyProduct[] }, seen: Set<string>): ScrapedItem[] {
  const out: ScrapedItem[] = [];
  for (const p of json.products ?? []) {
    if (!p.handle || !p.title) continue;
    const brand = detectBrand(p.title, p.vendor);
    if (!brand) continue;
    if (!p.images || p.images.length === 0) continue;

    const price = p.variants?.[0]?.price ? Math.round(parseFloat(p.variants[0].price!)) : undefined;
    if (!price || price <= 0) continue;

    const origRaw = p.variants?.[0]?.compare_at_price;
    const originalPrice = origRaw ? Math.round(parseFloat(origRaw)) : undefined;
    const sizes = (p.variants ?? [])
      .filter((v) => v.available !== false)
      .map((v) => v.title ?? '')
      .filter((t) => t && t !== 'Default Title');

    const sourceUrl = `${BASE}/products/${p.handle}`;
    if (seen.has(sourceUrl)) continue;
    seen.add(sourceUrl);

    const vnvListed = p.created_at ?? p.updated_at;
    out.push({
      sourceUrl,
      sourceSite: 'vegnonveg',
      name: p.title,
      brand,
      price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      images: (p.images ?? []).map((i) => i.src ?? '').filter(Boolean),
      sizes,
      tags: p.tags ?? [],
      gender: inferGender(p.tags ?? []),
      sourceListedAt: vnvListed ? new Date(vnvListed) : undefined,
    });
  }
  return out;
}

// ── Primary: ScrapingAnt residential proxy (no JS needed for Shopify JSON) ────
async function scrapeViaApi(seen: Set<string>): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const collections = ['nike', 'jordan', 'air-jordan', 'new-arrivals'];

  for (const col of collections) {
    try {
      const jsonUrl = `${BASE}/collections/${col}/products.json?limit=24&sort_by=created-descending`;
      const body = await scrapingAntFetch(jsonUrl, false); // browser=false → 1 credit
      const data = JSON.parse(body) as { products?: VNVShopifyProduct[] };
      const items = parseShopifyProducts(data, seen);
      results.push(...items);
      console.log(`[vnv] ${col} via ScrapingAnt: ${items.length} items`);
    } catch (err) {
      console.error(`[vnv] ${col} ScrapingAnt failed:`, (err as Error).message);
    }
    await jitter(1000, 2000);
  }
  return results;
}

// ── Fallback: Puppeteer with CF warmup (used when API key missing) ─────────────
async function scrapeViaPuppeteer(browser: Browser, seen: Set<string>): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];

  const warmPage = await browser.newPage();
  try {
    await warmPage.setUserAgent(sessionUA());
    await warmPage.setExtraHTTPHeaders({
      'Accept-Language': 'en-IN,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
    });
    await warmPage.goto(BASE, { waitUntil: 'networkidle2', timeout: 45000 });
    const warmBody = await warmPage.evaluate(() => document.body?.innerText?.slice(0, 500) ?? '');
    const cfChallenge = /checking your browser|just a moment|enable javascript|cloudflare/i.test(warmBody);
    if (cfChallenge) {
      console.warn('[vnv] CF challenge detected on warmup -- waiting extra 8s');
      await jitter(8000, 10000);
    } else {
      await jitter(2000, 3000);
    }
    const cookies = await warmPage.cookies();
    const hasClearance = cookies.some((c) => c.name === 'cf_clearance');
    console.log(`[vnv] homepage warmup done (cf_clearance: ${hasClearance})`);
  } catch (e) {
    console.warn('[vnv] homepage warmup failed:', (e as Error).message);
  } finally {
    await warmPage.close();
  }

  const collections = ['nike', 'jordan', 'air-jordan', 'new-arrivals'];
  for (const col of collections) {
    const page = await browser.newPage();
    let pageResults = 0;
    try {
      await page.setUserAgent(sessionUA());
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': BASE,
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
      });

      const jsonUrl = `${BASE}/collections/${col}/products.json?limit=24&sort_by=created-descending`;
      const response = await page.goto(jsonUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await jitter(1500, 3000);

      const contentType = response?.headers()['content-type'] ?? '';
      if (contentType.includes('json')) {
        const body = await page.evaluate(() => document.body.innerText);
        try {
          const data = JSON.parse(body) as { products?: VNVShopifyProduct[] };
          const items = parseShopifyProducts(data, seen);
          results.push(...items);
          pageResults = items.length;
          console.log(`[vnv] ${col} via Puppeteer JSON: ${pageResults} items`);
          continue;
        } catch { /* fall through to DOM */ }
      }

      await page.goto(`${BASE}/collections/${col}`, { waitUntil: 'networkidle2', timeout: 35000 });
      await jitter(2000, 4000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await jitter(1000, 2000);

      const domItems = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll(
          '.product-item, .grid-product, [class*="ProductCard"], [class*="product-card"], .product, [class*="product-grid"] li'
        ));
        return cards.slice(0, 24).map((card) => ({
          title: (card.querySelector('[class*="title"], [class*="name"], h3, h2')?.textContent ?? '').trim(),
          href: (card.querySelector('a[href*="/products/"]') as HTMLAnchorElement)?.href ?? '',
          vendor: (card.querySelector('[class*="vendor"], [class*="brand"]')?.textContent ?? '').trim(),
          imgSrc:
            (card.querySelector('img') as HTMLImageElement)?.getAttribute('data-src') ??
            (card.querySelector('img') as HTMLImageElement)?.getAttribute('src') ?? '',
          price: (card.querySelector('[class*="price"]')?.textContent ?? '').replace(/[^\d]/g, ''),
        }));
      });

      for (const item of domItems) {
        if (!item.href) continue;
        const brand = detectBrand(item.title, item.vendor);
        if (!brand) continue;
        if (seen.has(item.href)) continue;
        seen.add(item.href);
        const price = item.price ? parseInt(item.price) : undefined;
        if (!price || price <= 0) continue;
        results.push({
          sourceUrl: item.href,
          sourceSite: 'vegnonveg',
          name: item.title,
          brand,
          price,
          images: item.imgSrc ? [item.imgSrc] : [],
          sizes: [],
          tags: ['vegnonveg', brand.toLowerCase()],
          gender: 'unisex',
        });
        pageResults++;
      }
      console.log(`[vnv] ${col} via Puppeteer DOM: ${pageResults} items`);
    } catch (err) {
      console.error(`[vnv] ${col} Puppeteer failed:`, (err as Error).message);
    } finally {
      await page.close();
      await jitter(3000, 6000);
    }
  }
  return results;
}

export async function scrapeVegNonVeg(browser: Browser): Promise<ScrapedItem[]> {
  const seen = new Set<string>();
  if (process.env.SCRAPINGANT_API_KEY) {
    console.log('[vnv] using ScrapingAnt residential proxy');
    const items = await scrapeViaApi(seen);
    if (items.length > 0) return items;
    console.warn('[vnv] ScrapingAnt returned 0 items -- falling back to Puppeteer');
    seen.clear();
  }
  return scrapeViaPuppeteer(browser, seen);
}
