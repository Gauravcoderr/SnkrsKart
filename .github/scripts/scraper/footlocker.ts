import { Browser } from 'puppeteer';
import { jitter, randomUA, ScrapedItem } from './utils';

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
    { url: 'https://www.footlocker.in/en/category/shoes/nike.html', label: 'nike' },
    { url: 'https://www.footlocker.in/en/category/shoes/jordan.html', label: 'jordan' },
  ];

  for (const { url, label } of urls) {
    const page = await browser.newPage();
    try {
      await page.setUserAgent(randomUA());
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://www.footlocker.in',
        'DNT': '1',
      });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await jitter(2000, 4000);

      // Try JSON-LD first (most structured)
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

      for (const p of jsonLdItems.slice(0, 15)) {
        const name = p.name ?? '';
        const brand = detectBrand(name);
        if (!brand || !p.url) continue;
        const sourceUrl = p.url.startsWith('http') ? p.url : `https://www.footlocker.in${p.url}`;
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

      // DOM fallback
      if (results.length === 0) {
        const domItems = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('[data-product-id], .ProductCard, .product-tile'));
          return cards.slice(0, 15).map((card) => ({
            title: card.querySelector('[class*="name"], [class*="title"], h3')?.textContent?.trim() ?? '',
            href: (card.querySelector('a') as HTMLAnchorElement)?.href ?? '',
            imgSrc: (card.querySelector('img') as HTMLImageElement)?.src ?? '',
            price: card.querySelector('[class*="price"]')?.textContent?.replace(/[^\d]/g, '') ?? '',
          }));
        });

        for (const item of domItems) {
          const brand = detectBrand(item.title);
          if (!brand || !item.href) continue;
          if (seen.has(item.href)) continue;
          seen.add(item.href);

          results.push({
            sourceUrl: item.href,
            sourceSite: 'footlocker',
            name: item.title,
            brand,
            price: item.price ? parseInt(item.price) : undefined,
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
