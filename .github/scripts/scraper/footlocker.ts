import { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import { jitter, sessionUA, scrapingAntFetch, ScrapedItem } from './utils';

const BASE = 'https://www.footlocker.co.in';

// /en/category/shoes/{brand}.html is dead (real 404 from origin, confirmed via ScrapingAnt log).
// Site now routes through category IDs with brand filters — verified live 2026-07.
// category_filter=6864_ = Shoes (facet id confirmed sitewide, works on both the
// nike designer page and the jordan-picks page). Without it these queries pulled
// ANY Nike/Jordan-branded item — T-shirts, joggers, caps — since brand-name regex
// alone doesn't distinguish footwear from apparel. Kept alongside the original
// unfiltered queries (not replaced) so a bad facet id degrades to old behavior
// instead of losing coverage — sourceUrl dedup (`seen`) collapses any overlap.
const CATEGORY_QUERIES = [
  { url: `${BASE}/men/c/6823?root=topnav_1&f=brand_filter%3D11784_`, label: 'nike' },
  { url: `${BASE}/jordan-picks/c/68782?root=nav_3&ptype=listing%2Call-brands%2Cjordan%2C1%2Cjordan`, label: 'jordan' },
  { url: `${BASE}/designers/nike/c/11784?root=nav_3&ptype=listing%2Call-brands%2Cnike%2C1%2Cnike&f=category_filter%3D6864_`, label: 'nike-shoes' },
  { url: `${BASE}/jordan-picks/c/68782?root=nav_3&ptype=listing%2Call-brands%2Cjordan%2C1%2Cjordan&f=gender_filter%3D5197_%3Bcategory_filter%3D6864_`, label: 'jordan-shoes' },
];

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const NIKE_RE = /\bnike\b/i;

function detectBrand(title: string): 'Nike' | 'Jordan' | null {
  if (JORDAN_RE.test(title)) return 'Jordan';
  if (NIKE_RE.test(title)) return 'Nike';
  return null;
}

interface FLProduct {
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

// ── Primary: ScrapingAnt JS rendering (10 credits each, handles Akamai) ────────
async function scrapeViaApi(seen: Set<string>): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];

  for (const { url, label } of CATEGORY_QUERIES) {
    try {
      const html = await scrapingAntFetch(url, true); // browser=true → JS rendered, 10 credits
      const $ = cheerio.load(html);
      let pageResults = 0;

      // Try JSON-LD first (most reliable structured data)
      const jsonLdProducts: JsonLdProduct[] = [];
      $('script[type="application/ld+json"]').each((_i, el) => {
        try {
          const data = JSON.parse($(el).html() ?? '{}') as JsonLdProduct;
          if (data['@type'] === 'ItemList') {
            const list = (data as unknown as { itemListElement?: JsonLdProduct[] }).itemListElement ?? [];
            jsonLdProducts.push(...list);
          } else if (data['@type'] === 'Product') {
            jsonLdProducts.push(data);
          }
        } catch { /* skip bad JSON-LD */ }
      });

      // Listing-page JSON-LD on footlocker.co.in omits `image` entirely (only PDP JSON-LD
      // carries it) — build a href → img lookup from the rendered DOM to backfill it.
      const domImageByUrl = new Map<string, string>();
      $('a[href]').each((_i, a) => {
        const href = $(a).attr('href') ?? '';
        if (!href) return;
        const fullUrl = href.startsWith('http') ? href : `${BASE}${href}`;
        if (domImageByUrl.has(fullUrl)) return;
        const img = $(a).find('img').first();
        const src = img.attr('data-src') || img.attr('src') || img.attr('data-lazy') || img.attr('srcset')?.split(' ')[0] || '';
        if (src) domImageByUrl.set(fullUrl, src);
      });

      for (const p of jsonLdProducts) {
        const name = p.name ?? '';
        const brand = detectBrand(name);
        if (!brand || !p.url) continue;
        const sourceUrl = p.url.startsWith('http') ? p.url : `${BASE}${p.url}`;
        if (seen.has(sourceUrl)) continue;
        seen.add(sourceUrl);
        const price = p.offers?.price ? Math.round(parseFloat(String(p.offers.price))) : undefined;
        const flDateRaw = p.datePublished ?? p.dateModified ?? p.offers?.availabilityStarts;
        const jsonLdImages = Array.isArray(p.image) ? p.image : p.image ? [p.image] : [];
        const domImage = domImageByUrl.get(sourceUrl);
        results.push({
          sourceUrl,
          sourceSite: 'footlocker',
          name,
          brand,
          price,
          images: jsonLdImages.length > 0 ? jsonLdImages : domImage ? [domImage] : [],
          sizes: [],
          sku: p.sku,
          description: p.description?.slice(0, 500),
          tags: ['footlocker', brand.toLowerCase()],
          gender: 'unisex',
          sourceListedAt: flDateRaw ? new Date(flDateRaw) : undefined,
        });
        pageResults++;
      }

      // DOM fallback via cheerio if JSON-LD empty
      if (pageResults === 0) {
        const selectors = [
          '[data-product-id]', '.ProductCard', '.product-tile',
          '[class*="ProductCard"]', '[class*="product-card"]',
          'article[class*="product"]', '[class*="ProductResult"]', '.fl-productcard',
        ];
        $(selectors.join(', ')).slice(0, 24).each((_i, el) => {
          const card = $(el);
          const title = card.find('[class*="name"], [class*="title"], [class*="Name"], h3, h2').first().text().trim();
          const brand = detectBrand(title);
          if (!brand) return;
          const href = card.find('a[href]').first().attr('href') ?? '';
          const sourceUrl = href.startsWith('http') ? href : href ? `${BASE}${href}` : '';
          if (!sourceUrl || seen.has(sourceUrl)) return;
          seen.add(sourceUrl);
          const priceText = card.find('[class*="price"], [class*="Price"]').first().text().replace(/[^\d]/g, '');
          const price = priceText ? parseInt(priceText) : undefined;
          if (!price || price <= 0) return;
          const imgSrc = card.find('img').first().attr('data-src') ?? card.find('img').first().attr('src') ?? '';
          results.push({
            sourceUrl,
            sourceSite: 'footlocker',
            name: title,
            brand,
            price,
            images: imgSrc ? [imgSrc] : [],
            sizes: [],
            tags: ['footlocker', brand.toLowerCase()],
            gender: 'unisex',
          });
          pageResults++;
        });
      }

      console.log(`[footlocker] ${label} via ScrapingAnt: ${pageResults} items`);
    } catch (err) {
      console.error(`[footlocker] ${label} ScrapingAnt failed:`, (err as Error).message);
    }
    await jitter(2000, 4000);
  }
  return results;
}

// ── Fallback: Puppeteer with Akamai warmup ─────────────────────────────────────
async function scrapeViaPuppeteer(browser: Browser, seen: Set<string>): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];

  const warmPage = await browser.newPage();
  try {
    await warmPage.setUserAgent(sessionUA());
    await warmPage.setExtraHTTPHeaders({
      'Accept-Language': 'en-IN,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
    });
    await warmPage.goto(BASE, { waitUntil: 'networkidle2', timeout: 45000 });
    const warmBody = await warmPage.evaluate(() => document.body?.innerText?.slice(0, 300) ?? '');
    const blocked = /access denied|forbidden|robot|challenge/i.test(warmBody);
    if (blocked) console.warn('[footlocker] warmup: possible block detected');
    await jitter(3000, 5000);
  } catch { /* silent — warm-up best effort */ } finally {
    await warmPage.close();
  }

  for (const { url, label } of CATEGORY_QUERIES) {
    const page = await browser.newPage();
    let intercepted: FLProduct[] = [];

    try {
      await page.setUserAgent(sessionUA());
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': BASE,
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
      });

      page.on('response', async (response) => {
        const rUrl = response.url();
        if (
          rUrl.includes('footlocker.co.in') &&
          (rUrl.includes('/api/') || rUrl.includes('/products') || rUrl.includes('/search')) &&
          response.headers()['content-type']?.includes('json')
        ) {
          try {
            const json = await response.json() as Record<string, unknown>;
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

        // Listing-page JSON-LD omits `image` (catalog is white-labeled through Nykaa's
        // storefront and only carries name/url/offers here) — backfill from the DOM.
        const domImageEntries = await page.evaluate((base: string) => {
          return Array.from(document.querySelectorAll('a[href]')).map((a) => {
            const href = a.getAttribute('href') ?? '';
            const fullUrl = href.startsWith('http') ? href : href ? `${base}${href}` : '';
            const img = a.querySelector('img') as HTMLImageElement | null;
            const src = img?.getAttribute('data-src') || img?.getAttribute('src') || img?.getAttribute('data-lazy') || '';
            return [fullUrl, src] as [string, string];
          }).filter(([url, src]) => url && src);
        }, BASE);
        const domImageByUrl = new Map(domImageEntries);

        for (const p of jsonLdItems.slice(0, 20)) {
          const name = p.name ?? '';
          const brand = detectBrand(name);
          if (!brand || !p.url) continue;
          const sourceUrl = p.url.startsWith('http') ? p.url : `${BASE}${p.url}`;
          if (seen.has(sourceUrl)) continue;
          seen.add(sourceUrl);
          const price = p.offers?.price ? Math.round(parseFloat(String(p.offers.price))) : undefined;
          const flDateRaw = p.datePublished ?? p.dateModified ?? p.offers?.availabilityStarts;
          const jsonLdImages = Array.isArray(p.image) ? p.image : p.image ? [p.image] : [];
          const domImage = domImageByUrl.get(sourceUrl);
          results.push({
            sourceUrl,
            sourceSite: 'footlocker',
            name,
            brand,
            price,
            images: jsonLdImages.length > 0 ? jsonLdImages : domImage ? [domImage] : [],
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

      if (pageResults === 0) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await jitter(1500, 2500);

        const domItems = await page.evaluate((base: string) => {
          const selectors = [
            '[data-product-id]', '.ProductCard', '.product-tile',
            '[class*="ProductCard"]', '[class*="product-card"]',
            'article[class*="product"]', '[class*="ProductResult"]', '.fl-productcard',
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

export async function scrapeFootlocker(browser: Browser): Promise<ScrapedItem[]> {
  const seen = new Set<string>();
  if (process.env.SCRAPINGANT_API_KEY) {
    console.log('[footlocker] using ScrapingAnt residential proxy');
    const items = await scrapeViaApi(seen);
    if (items.length > 0) return items;
    console.warn('[footlocker] ScrapingAnt returned 0 items -- falling back to Puppeteer');
    seen.clear();
  }
  return scrapeViaPuppeteer(browser, seen);
}
