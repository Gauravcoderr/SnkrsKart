import { Browser } from 'puppeteer';
import { jitter, randomUA, ScrapedItem } from './utils';

const BASE = 'https://www.footlocker.co.in';

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const NIKE_RE = /\bnike\b/i;

function detectBrand(title: string): 'Nike' | 'Jordan' | null {
  if (JORDAN_RE.test(title)) return 'Jordan';
  if (NIKE_RE.test(title)) return 'Nike';
  return null;
}

interface FLProduct {
  // API response shape (varies — capture what we can)
  name?: string;
  productName?: string;
  title?: string;
  sku?: string;
  code?: string;
  id?: string;
  url?: string;
  slug?: string;
  images?: { url?: string; src?: string }[];
  image?: string | string[];
  price?: { formattedValue?: string; value?: number; current?: number } | number;
  offers?: { price?: string | number };
}

interface JsonLdProduct {
  '@type'?: string;
  name?: string;
  offers?: { price?: string | number; priceCurrency?: string; availabilityStarts?: string };
  image?: string | string[];
  url?: string;
  description?: string;
  sku?: string;
  datePublished?: string;
  dateModified?: string;
}

function parsePrice(p: FLProduct): number | undefined {
  if (typeof p.price === 'number') return Math.round(p.price);
  if (typeof p.price === 'object' && p.price !== null) {
    const v = p.price.value ?? p.price.current;
    if (v) return Math.round(v);
    const f = p.price.formattedValue;
    if (f) {
      const n = parseFloat(f.replace(/[^\d.]/g, ''));
      if (!isNaN(n)) return Math.round(n);
    }
  }
  if (p.offers?.price) return Math.round(parseFloat(String(p.offers.price)));
  return undefined;
}

function buildSourceUrl(p: FLProduct): string {
  if (p.url) return p.url.startsWith('http') ? p.url : `${BASE}${p.url}`;
  const slug = p.slug ?? '';
  const id = p.code ?? p.id ?? p.sku ?? '';
  if (slug && id) return `${BASE}/${slug}/p/${id}`;
  return '';
}

function extractImages(p: FLProduct): string[] {
  if (Array.isArray(p.images)) return p.images.map((i) => i.url ?? i.src ?? '').filter(Boolean);
  if (typeof p.image === 'string') return [p.image];
  if (Array.isArray(p.image)) return p.image as string[];
  return [];
}

export async function scrapeFootlocker(browser: Browser): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  // ── Step 1: warm up a page on the homepage to collect cookies / fingerprint ──
  const warmPage = await browser.newPage();
  try {
    await warmPage.setUserAgent(randomUA());
    await warmPage.setExtraHTTPHeaders({
      'Accept-Language': 'en-IN,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
    });
    await warmPage.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await jitter(2000, 4000);
  } catch { /* silent — warm-up best effort */ } finally {
    await warmPage.close();
  }

  // ── Step 2: scrape each category ──
  const queries = [
    { url: `${BASE}/en/category/shoes/nike.html`, apiQuery: 'nike', label: 'nike' },
    { url: `${BASE}/en/category/shoes/jordan.html`, apiQuery: 'jordan', label: 'jordan' },
  ];

  for (const { url, label } of queries) {
    const page = await browser.newPage();
    let intercepted: FLProduct[] = [];

    try {
      await page.setUserAgent(randomUA());
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': BASE,
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
      });

      // Intercept FL internal product API calls
      page.on('response', async (response) => {
        const rUrl = response.url();
        if (
          rUrl.includes('footlocker.co.in') &&
          (rUrl.includes('/api/') || rUrl.includes('/products') || rUrl.includes('/search')) &&
          response.headers()['content-type']?.includes('json')
        ) {
          try {
            const json = await response.json() as Record<string, unknown>;
            // Try multiple response shapes
            const products: FLProduct[] = (
              (json.products as FLProduct[]) ??
              (json.results as FLProduct[]) ??
              ((json.data as Record<string, unknown>)?.products as FLProduct[]) ??
              (Array.isArray(json) ? json as FLProduct[] : [])
            );
            if (products.length > 0) {
              intercepted = intercepted.concat(products.slice(0, 30));
              console.log(`[footlocker] ${label}: intercepted ${products.length} products from ${rUrl}`);
            }
          } catch { /* non-JSON or parse fail */ }
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await jitter(3000, 5000);

      // Check for hard block
      const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 300) ?? '');
      const blocked = bodyText.toLowerCase().includes('access denied') ||
        bodyText.toLowerCase().includes('challenge') ||
        bodyText.toLowerCase().includes('robot') ||
        bodyText.trim().length < 100;
      if (blocked) {
        console.warn(`[footlocker] ${label}: blocked or empty page`);
        continue;
      }

      let pageResults = 0;

      // ── Process intercepted API data ──
      if (intercepted.length > 0) {
        for (const p of intercepted.slice(0, 24)) {
          const name = p.name ?? p.productName ?? p.title ?? '';
          const brand = detectBrand(name);
          if (!brand) continue;

          const sourceUrl = buildSourceUrl(p);
          if (!sourceUrl || seen.has(sourceUrl)) continue;
          seen.add(sourceUrl);

          const price = parsePrice(p);
          if (!price || price <= 0) continue;

          results.push({
            sourceUrl,
            sourceSite: 'footlocker',
            name,
            brand,
            price,
            images: extractImages(p),
            sizes: [],
            sku: p.sku ?? p.code ?? p.id,
            tags: ['footlocker', brand.toLowerCase()],
            gender: 'unisex',
          });
          pageResults++;
        }
        console.log(`[footlocker] ${label}: ${pageResults} items via intercepted API`);
      }

      // ── JSON-LD fallback ──
      if (pageResults === 0) {
        const jsonLdItems = await page.evaluate(() => {
          const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
          const products: unknown[] = [];
          for (const s of scripts) {
            try {
              const data = JSON.parse(s.textContent ?? '{}');
              if (data['@type'] === 'Product') products.push(data);
              if (data['@type'] === 'ItemList') {
                (data.itemListElement ?? []).forEach((el: unknown) => products.push(el));
              }
            } catch { /* skip */ }
          }
          return products;
        }) as JsonLdProduct[];

        for (const p of jsonLdItems.slice(0, 20)) {
          const name = p.name ?? '';
          const brand = detectBrand(name);
          if (!brand || !p.url) continue;
          const sourceUrl = p.url.startsWith('http') ? p.url : `${BASE}${p.url}`;
          if (seen.has(sourceUrl)) continue;
          seen.add(sourceUrl);

          const price = p.offers?.price ? Math.round(parseFloat(String(p.offers.price))) : undefined;
          const flDateRaw = p.datePublished ?? p.dateModified ?? p.offers?.availabilityStarts;
          results.push({
            sourceUrl,
            sourceSite: 'footlocker',
            name,
            brand,
            price,
            images: Array.isArray(p.image) ? p.image : p.image ? [p.image] : [],
            sizes: [],
            sku: p.sku,
            description: p.description?.slice(0, 500),
            tags: ['footlocker', brand.toLowerCase()],
            gender: 'unisex',
            sourceListedAt: flDateRaw ? new Date(flDateRaw) : undefined,
          });
          pageResults++;
        }
        if (pageResults > 0) console.log(`[footlocker] ${label}: ${pageResults} items via JSON-LD`);
      }

      // ── DOM fallback — per-URL, not cumulative ──
      if (pageResults === 0) {
        // Scroll to trigger lazy-load
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await jitter(1500, 2500);

        const domItems = await page.evaluate((base: string) => {
          const selectors = [
            '[data-product-id]',
            '.ProductCard',
            '.product-tile',
            '[class*="ProductCard"]',
            '[class*="product-card"]',
            'article[class*="product"]',
            '[class*="ProductResult"]',
            '.fl-productcard',
          ];
          const cards = Array.from(document.querySelectorAll(selectors.join(', ')));
          return cards.slice(0, 24).map((card) => ({
            title: (card.querySelector('[class*="name"], [class*="title"], [class*="Name"], h3, h2')?.textContent ?? '').trim(),
            href: (() => {
              const a = card.querySelector('a[href]') as HTMLAnchorElement | null;
              const href = a?.getAttribute('href') ?? '';
              return href.startsWith('http') ? href : href ? `${base}${href}` : '';
            })(),
            imgSrc:
              (card.querySelector('img') as HTMLImageElement | null)?.getAttribute('data-src') ??
              (card.querySelector('img') as HTMLImageElement | null)?.getAttribute('src') ?? '',
            price: (card.querySelector('[class*="price"], [class*="Price"]')?.textContent ?? '').replace(/[^\d]/g, ''),
          }));
        }, BASE);

        for (const item of domItems) {
          const brand = detectBrand(item.title);
          if (!brand || !item.href) continue;
          if (seen.has(item.href)) continue;
          seen.add(item.href);
          const price = item.price ? parseInt(item.price) : undefined;
          if (!price || price <= 0) continue;
          results.push({
            sourceUrl: item.href,
            sourceSite: 'footlocker',
            name: item.title,
            brand,
            price,
            images: item.imgSrc ? [item.imgSrc] : [],
            sizes: [],
            tags: ['footlocker', brand.toLowerCase()],
            gender: 'unisex',
          });
          pageResults++;
        }
        console.log(`[footlocker] ${label}: ${pageResults} items via DOM`);
      }

      await jitter(3000, 6000);
    } catch (err) {
      console.error(`[footlocker] ${label} failed:`, (err as Error).message);
    } finally {
      await page.close();
    }
  }

  return results;
}
