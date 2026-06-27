import { Browser } from 'puppeteer';
import { jitter, sessionUA, ScrapedItem } from './utils';

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const NIKE_RE = /\bnike\b/i;

function detectBrand(title: string): 'Nike' | 'Jordan' | null {
  if (JORDAN_RE.test(title)) return 'Jordan';
  if (NIKE_RE.test(title)) return 'Nike';
  return null;
}

function inferGender(g: string): ScrapedItem['gender'] {
  const s = g.toLowerCase();
  if (s.includes('women') || s.includes('female') || s.includes('girl')) return 'women';
  if (s.includes('kid') || s.includes('child') || s.includes('boy')) return 'kids';
  if (s.includes('men') || s.includes('male')) return 'men';
  return 'unisex';
}

interface MyntraProduct {
  productId?: number;
  productName?: string;
  product?: string;
  brand?: string;
  mrp?: number;
  price?: number;
  searchImage?: string;
  images?: { view?: string; src?: string }[];
  sizes?: string;
  inventoryInfo?: { label?: string; available?: boolean }[];
  gender?: string;
  landingPageUrl?: string;
  catalogDate?: number;
}

function buildProductUrl(p: MyntraProduct): string {
  if (p.landingPageUrl) return `https://www.myntra.com/${p.landingPageUrl}`;
  return `https://www.myntra.com/${p.productId ?? ''}`;
}

function extractSizes(p: MyntraProduct): string[] {
  if (typeof p.sizes === 'string' && p.sizes) {
    return p.sizes.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(p.inventoryInfo)) {
    return p.inventoryInfo
      .filter((i) => i.available !== false)
      .map((i) => i.label ?? '')
      .filter(Boolean);
  }
  return [];
}

function mapProducts(products: MyntraProduct[], seen: Set<string>): ScrapedItem[] {
  const out: ScrapedItem[] = [];
  for (const p of products) {
    const name = p.productName ?? p.product ?? '';
    if (!name) continue;
    const brand = detectBrand(name);
    if (!brand) continue;
    const pageUrl = buildProductUrl(p);
    if (!pageUrl || seen.has(pageUrl)) continue;
    seen.add(pageUrl);
    const price = p.price ?? p.mrp;
    if (!price || price <= 0) continue;
    const imgs = (p.images ?? []).map((i) => i.src ?? '').filter(Boolean);
    if (imgs.length === 0 && p.searchImage) imgs.push(p.searchImage);
    out.push({
      sourceUrl: pageUrl,
      sourceSite: 'myntra',
      name,
      brand,
      price,
      originalPrice: p.mrp && p.mrp > price ? p.mrp : undefined,
      images: imgs,
      sizes: extractSizes(p),
      gender: inferGender(p.gender ?? ''),
      tags: ['myntra', brand.toLowerCase()],
      sourceListedAt: p.catalogDate ? new Date(p.catalogDate) : undefined,
    });
  }
  return out;
}

export async function scrapeMyntra(browser: Browser): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  const queries = [
    { url: 'https://www.myntra.com/shoes?rawQuery=nike+shoes&sort=new', label: 'nike' },
    { url: 'https://www.myntra.com/shoes?rawQuery=jordan+shoes&sort=new', label: 'jordan' },
  ];

  for (const { url, label } of queries) {
    const page = await browser.newPage();
    try {
      await page.setUserAgent(sessionUA());
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': 'https://www.myntra.com',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
      });

      // Intercept Myntra's search API — current pattern observed in network traffic
      const intercepted: MyntraProduct[] = [];
      page.on('response', async (response) => {
        const rUrl = response.url();
        if (
          rUrl.includes('myntra.com') &&
          (rUrl.includes('/gateway/v2/product/list') ||
            rUrl.includes('/search/search') ||
            rUrl.includes('/api/v2/catalog') ||
            rUrl.includes('/v2/search') ||
            (rUrl.includes('search') && rUrl.includes('json'))) &&
          response.headers()['content-type']?.includes('json')
        ) {
          try {
            const json = (await response.json()) as Record<string, unknown>;
            const products: MyntraProduct[] =
              ((json.searchData as Record<string, unknown>)?.results as Record<string, unknown>)?.products as MyntraProduct[] ??
              (json.products as MyntraProduct[]) ??
              [];
            if (products.length > 0) {
              intercepted.push(...products.slice(0, 50));
              console.log(`[myntra] ${label}: intercepted ${products.length} products from ${rUrl}`);
            }
          } catch {
            // non-JSON or parse fail
          }
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await jitter(3000, 5000);

      const title = await page.title();
      if (title.toLowerCase().includes('access denied') || title.toLowerCase().includes('robot')) {
        console.warn(`[myntra] ${label}: bot detection (title: ${title})`);
        continue;
      }

      // Primary: read window.__myx embedded SSR state (fastest, no extra requests)
      const ssrProducts = await page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const myx = (window as any).__myx;
        return (myx?.searchData?.results?.products ?? []) as unknown[];
      }) as MyntraProduct[];

      if (ssrProducts.length > 0) {
        const items = mapProducts(ssrProducts, seen);
        results.push(...items);
        console.log(`[myntra] ${label}: ${items.length} items via window.__myx`);
      } else if (intercepted.length > 0) {
        const items = mapProducts(intercepted, seen);
        results.push(...items);
        console.log(`[myntra] ${label}: ${items.length} items via intercepted API`);
      } else {
        console.warn(`[myntra] ${label}: 0 items — window.__myx empty and no API intercept`);
      }
    } catch (err) {
      console.error(`[myntra] ${label} failed:`, (err as Error).message);
    } finally {
      await page.close();
      await jitter(3000, 5000);
    }
  }

  return results;
}
