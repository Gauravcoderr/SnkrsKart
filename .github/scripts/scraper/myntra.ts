import { Browser } from 'puppeteer';
import { jitter, randomUA, ScrapedItem } from './utils';

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const NIKE_RE = /\bnike\b/i;

function detectBrand(title: string): 'Nike' | 'Jordan' | null {
  if (JORDAN_RE.test(title)) return 'Jordan';
  if (NIKE_RE.test(title)) return 'Nike';
  return null;
}

function inferGender(g: string): ScrapedItem['gender'] {
  const s = g.toLowerCase();
  if (s.includes('women') || s.includes('female')) return 'women';
  if (s.includes('kid') || s.includes('child')) return 'kids';
  if (s.includes('men') || s.includes('male')) return 'men';
  return 'unisex';
}

interface MyntraProduct {
  productId?: number;
  productName?: string;
  brand?: string;
  price?: { discounted?: number; mrp?: number };
  images?: { src?: string }[];
  sizes?: string[];
  gender?: string;
  landingPageUrl?: string;
}

export async function scrapeMyntra(browser: Browser): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  const queries = [
    { url: 'https://www.myntra.com/shoes?rawQuery=nike+limited+edition&sort=new', label: 'nike-limited' },
    { url: 'https://www.myntra.com/shoes?rawQuery=jordan+shoes&sort=new', label: 'jordan' },
  ];

  for (const { url, label } of queries) {
    const page = await browser.newPage();
    try {
      await page.setUserAgent(randomUA());
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': 'https://www.myntra.com',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for either products or DataDome challenge to resolve
      await jitter(3000, 6000);

      // Check for DataDome/bot detection
      const title = await page.title();
      if (title.toLowerCase().includes('access denied') || title.toLowerCase().includes('robot')) {
        console.warn(`[myntra] ${label}: bot detection triggered (title: ${title})`);
        continue;
      }

      // Try embedded JSON state — Myntra embeds product data in script tags
      const raw = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script:not([src])'));
        for (const s of scripts) {
          const text = s.textContent ?? '';
          // Pattern 1: window.__myx JSON blob
          if (text.includes('"productId"') && text.includes('"brand"')) {
            const m1 = text.match(/window\.__myx\s*=\s*(\{[\s\S]*?\});\s*window/);
            if (m1) return m1[1];
            // Pattern 2: raw array
            const m2 = text.match(/\[{"productId"[\s\S]*?\}]/);
            if (m2) return m2[0];
          }
        }
        // Pattern 3: __INITIAL_STATE__
        const initScript = Array.from(document.querySelectorAll('script')).find(
          (s) => s.textContent?.includes('__INITIAL_STATE__')
        );
        if (initScript) {
          const m = initScript.textContent?.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});\s*(?:window|\/\/)/);
          if (m) return m[1];
        }
        return null;
      });

      if (raw) {
        try {
          type AnyJson = Record<string, unknown>;
          const data = JSON.parse(raw) as AnyJson;
          // Try multiple paths where product list might be
          const products: MyntraProduct[] = (
            (data as AnyJson & { searchData?: { results?: { searchResult?: { results?: MyntraProduct[] } } } })?.searchData?.results?.searchResult?.results ??
            (Array.isArray(data) ? data as MyntraProduct[] : [])
          );

          for (const p of products.slice(0, 20)) {
            const title = `${p.brand ?? ''} ${p.productName ?? ''}`.trim();
            const brand = detectBrand(title);
            if (!brand) continue;

            const pageUrl = p.landingPageUrl
              ? `https://www.myntra.com/${p.landingPageUrl}`
              : `https://www.myntra.com/${p.productId ?? ''}`;

            if (seen.has(pageUrl)) continue;
            seen.add(pageUrl);

            const price = p.price?.discounted;
            if (!price || price <= 0) continue;

            results.push({
              sourceUrl: pageUrl,
              sourceSite: 'myntra',
              name: title,
              brand,
              price,
              originalPrice:
                p.price?.mrp && p.price.mrp > price ? p.price.mrp : undefined,
              images: (p.images ?? []).map((i) => i.src ?? '').filter(Boolean),
              sizes: p.sizes ?? [],
              gender: inferGender(p.gender ?? ''),
              tags: ['myntra', brand.toLowerCase()],
            });
          }
          console.log(`[myntra] ${label}: ${results.length} items via embedded JSON`);
        } catch (e) {
          console.warn(`[myntra] ${label}: JSON parse failed:`, (e as Error).message);
        }
      }

      // DOM fallback
      if (results.length === 0) {
        // Scroll to trigger lazy load
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await jitter(1500, 2500);

        const domItems = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('.product-base, [class*="product-base"]'));
          return cards.slice(0, 20).map((card) => ({
            brand: card.querySelector('.product-brand')?.textContent?.trim() ?? '',
            name: card.querySelector('.product-product')?.textContent?.trim() ?? '',
            href: (card.querySelector('a') as HTMLAnchorElement | null)?.href ?? '',
            imgSrc: (card.querySelector('img.img-responsive') as HTMLImageElement | null)?.src ?? '',
            price: card.querySelector('.product-discountedPrice')?.textContent?.replace(/[^\d]/g, '') ?? '',
            mrp: card.querySelector('.product-strike')?.textContent?.replace(/[^\d]/g, '') ?? '',
          }));
        });

        for (const item of domItems) {
          const fullTitle = `${item.brand} ${item.name}`.trim();
          const brand = detectBrand(fullTitle);
          if (!brand || !item.href) continue;
          if (seen.has(item.href)) continue;
          seen.add(item.href);

          const price = item.price ? parseInt(item.price) : undefined;
          if (!price || price <= 0) continue;

          results.push({
            sourceUrl: item.href,
            sourceSite: 'myntra',
            name: fullTitle,
            brand,
            price,
            originalPrice:
              item.mrp && parseInt(item.mrp) > price ? parseInt(item.mrp) : undefined,
            images: item.imgSrc ? [item.imgSrc] : [],
            sizes: [],
            gender: 'unisex',
            tags: ['myntra', brand.toLowerCase()],
          });
        }
        console.log(`[myntra] ${label}: ${results.length} items via DOM`);
      }

      await jitter(3000, 6000);
    } catch (err) {
      console.error(`[myntra] ${label} failed:`, (err as Error).message);
    } finally {
      await page.close();
    }
  }

  return results;
}
