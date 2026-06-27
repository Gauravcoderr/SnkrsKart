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

interface JsonLdProduct {
  '@type'?: string;
  name?: string;
  offers?: { price?: string | number; priceCurrency?: string };
  image?: string | string[];
  url?: string;
  description?: string;
  sku?: string;
}

export async function scrapeFootlocker(browser: Browser): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  const urls = [
    { url: `${BASE}/en/category/shoes/nike.html`, label: 'nike' },
    { url: `${BASE}/en/category/shoes/jordan.html`, label: 'jordan' },
  ];

  for (const { url, label } of urls) {
    const page = await browser.newPage();
    try {
      await page.setUserAgent(randomUA());
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': BASE,
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
      });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
      await jitter(2500, 5000);

      // Check if we got blocked (Akamai challenge)
      const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 200) ?? '');
      if (bodyText.toLowerCase().includes('access denied') || bodyText.toLowerCase().includes('challenge')) {
        console.warn(`[footlocker] ${label}: access denied / challenge page`);
        continue;
      }

      // JSON-LD extraction
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

        const imgs = Array.isArray(p.image) ? p.image : p.image ? [p.image] : [];
        const price = p.offers?.price ? Math.round(parseFloat(String(p.offers.price))) : undefined;

        results.push({
          sourceUrl,
          sourceSite: 'footlocker',
          name,
          brand,
          price,
          images: imgs,
          sizes: [],
          sku: p.sku,
          description: p.description?.slice(0, 500),
          tags: ['footlocker', brand.toLowerCase()],
          gender: 'unisex',
        });
      }

      // DOM fallback if JSON-LD gave nothing
      if (results.length === 0) {
        const domItems = await page.evaluate((base: string) => {
          const selectors = [
            '[data-product-id]',
            '.ProductCard',
            '.product-tile',
            '[class*="ProductCard"]',
            '[class*="product-card"]',
            'article[class*="product"]',
          ];
          const cards = Array.from(document.querySelectorAll(selectors.join(', ')));
          return cards.slice(0, 20).map((card) => ({
            title: (
              card.querySelector('[class*="name"], [class*="title"], h3, h2')?.textContent ?? ''
            ).trim(),
            href: (() => {
              const a = card.querySelector('a[href]') as HTMLAnchorElement | null;
              const href = a?.getAttribute('href') ?? '';
              return href.startsWith('http') ? href : `${base}${href}`;
            })(),
            imgSrc:
              (card.querySelector('img') as HTMLImageElement | null)?.getAttribute('data-src') ??
              (card.querySelector('img') as HTMLImageElement | null)?.src ?? '',
            price: (card.querySelector('[class*="price"]')?.textContent ?? '').replace(/[^\d]/g, ''),
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
        }
        console.log(`[footlocker] ${label}: ${results.length} items via DOM`);
      } else {
        console.log(`[footlocker] ${label}: ${results.length} items via JSON-LD`);
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
