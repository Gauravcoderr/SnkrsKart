import { Browser } from 'puppeteer';
import { jitter, randomUA, ScrapedItem } from './utils';

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const NIKE_RE = /\bnike\b/i;

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
  body_html?: string;
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

export async function scrapeVegNonVeg(browser: Browser): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();
  const BASE = 'https://www.vegnonveg.com';

  const collections = ['nike', 'jordan', 'air-jordan'];

  for (const col of collections) {
    const page = await browser.newPage();
    try {
      await page.setUserAgent(randomUA());
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': BASE,
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
      });

      // Try Shopify JSON endpoint via browser (bypasses Cloudflare since we have real browser fingerprint)
      const jsonUrl = `${BASE}/collections/${col}/products.json?limit=24&sort_by=created-descending`;
      const response = await page.goto(jsonUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await jitter(1500, 3000);

      const contentType = response?.headers()['content-type'] ?? '';
      if (contentType.includes('json')) {
        // JSON endpoint accessible
        const body = await page.evaluate(() => document.body.innerText);
        try {
          const data = JSON.parse(body) as { products?: VNVShopifyProduct[] };
          for (const p of data.products ?? []) {
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
            results.push({
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
          console.log(`[vnv] ${col} via JSON: ${results.length} items`);
          continue;
        } catch { /* fall through to HTML */ }
      }

      // HTML fallback — navigate to collection page and extract product cards
      await page.goto(`${BASE}/collections/${col}`, { waitUntil: 'networkidle2', timeout: 35000 });
      await jitter(2000, 4000);

      const domItems = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.product-item, .grid-product, [class*="ProductCard"], [class*="product-card"], .product'));
        return cards.slice(0, 20).map((card) => ({
          title: (
            card.querySelector('[class*="title"], [class*="name"], h3, h2')?.textContent ?? ''
          ).trim(),
          href: (card.querySelector('a[href*="/products/"]') as HTMLAnchorElement)?.href ?? '',
          imgSrc:
            (card.querySelector('img') as HTMLImageElement)?.getAttribute('data-src') ??
            (card.querySelector('img') as HTMLImageElement)?.src ?? '',
          price: (card.querySelector('[class*="price"]')?.textContent ?? '').replace(/[^\d]/g, ''),
        }));
      });

      for (const item of domItems) {
        if (!item.title || !item.href) continue;
        const brand = detectBrand(item.title);
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
      }
      console.log(`[vnv] ${col} via DOM: added ${results.length} total`);
    } catch (err) {
      console.error(`[vnv] ${col} failed:`, (err as Error).message);
    } finally {
      await page.close();
      await jitter(3000, 6000);
    }
  }

  return results;
}
