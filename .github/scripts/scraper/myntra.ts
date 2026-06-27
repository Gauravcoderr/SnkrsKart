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

// Myntra sizes field can be string[] or {label, available}[] or {sizeValue}[] etc.
function normalizeSizes(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  if (typeof raw[0] === 'string') return raw as string[];
  if (typeof raw[0] === 'number') return (raw as number[]).map(String);
  // Object shapes: {label}, {sizeValue}, {skuSize}
  return (raw as Record<string, unknown>[])
    .map((s) => String(s.label ?? s.sizeValue ?? s.skuSize ?? s.size ?? '').trim())
    .filter(Boolean);
}

interface MyntraProduct {
  productId?: number;
  productName?: string;
  brand?: string;
  price?: { discounted?: number; mrp?: number };
  images?: { src?: string }[];
  sizes?: unknown;
  sizesWithLabel?: unknown;
  productSize?: unknown;
  gender?: string;
  landingPageUrl?: string;
  listDate?: number;
  listingDate?: string | number;
}

function buildProductUrl(p: MyntraProduct): string {
  if (p.landingPageUrl) return `https://www.myntra.com/${p.landingPageUrl}`;
  return `https://www.myntra.com/${p.productId ?? ''}`;
}

function extractProducts(data: unknown): MyntraProduct[] {
  if (Array.isArray(data)) return data as MyntraProduct[];
  const d = data as Record<string, unknown>;
  // Paths observed in Myntra's embedded state and API responses
  return (
    (d?.searchData as Record<string, unknown>)?.results as MyntraProduct[] ??
    ((d?.searchData as Record<string, unknown>)?.results as Record<string, unknown>)?.searchResult as MyntraProduct[] ??
    (((d?.searchData as Record<string, unknown>)?.results as Record<string, unknown>)?.searchResult as Record<string, unknown>)?.results as MyntraProduct[] ??
    (d?.results as MyntraProduct[]) ??
    ((d?.data as Record<string, unknown>)?.results as MyntraProduct[]) ??
    []
  );
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
    let intercepted: MyntraProduct[] = [];

    try {
      await page.setUserAgent(randomUA());
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-IN,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': 'https://www.myntra.com',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
      });

      // Intercept Myntra's internal catalog/search API calls — these include sizes
      page.on('response', async (response) => {
        const respUrl = response.url();
        if (
          respUrl.includes('myntra.com') &&
          (respUrl.includes('/api/v2/catalog') ||
            respUrl.includes('/gateway/v2/product') ||
            respUrl.includes('search?') ||
            respUrl.includes('list?')) &&
          response.headers()['content-type']?.includes('json')
        ) {
          try {
            const json = await response.json() as unknown;
            const products = extractProducts(json);
            if (products.length > 0) {
              intercepted = intercepted.concat(products.slice(0, 30));
              console.log(`[myntra] ${label}: intercepted ${products.length} products from ${respUrl}`);
            }
          } catch {
            // non-JSON or parse fail, skip
          }
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await jitter(4000, 7000);

      const title = await page.title();
      if (title.toLowerCase().includes('access denied') || title.toLowerCase().includes('robot')) {
        console.warn(`[myntra] ${label}: bot detection triggered (title: ${title})`);
        continue;
      }

      // Process intercepted API responses first (best data quality, includes sizes)
      if (intercepted.length > 0) {
        for (const p of intercepted.slice(0, 24)) {
          const fullTitle = `${p.brand ?? ''} ${p.productName ?? ''}`.trim();
          const brand = detectBrand(fullTitle);
          if (!brand) continue;

          const pageUrl = buildProductUrl(p);
          if (seen.has(pageUrl)) continue;
          seen.add(pageUrl);

          const price = p.price?.discounted;
          if (!price || price <= 0) continue;

          const sizes = normalizeSizes(p.sizes ?? p.sizesWithLabel ?? p.productSize);

          const myntraDateRaw = p.listDate ?? p.listingDate;
          const myntraListedAt = myntraDateRaw
            ? new Date(typeof myntraDateRaw === 'number' && myntraDateRaw > 1e10 ? myntraDateRaw : myntraDateRaw)
            : undefined;
          results.push({
            sourceUrl: pageUrl,
            sourceSite: 'myntra',
            name: fullTitle,
            brand,
            price,
            originalPrice: p.price?.mrp && p.price.mrp > price ? p.price.mrp : undefined,
            images: (p.images ?? []).map((i) => i.src ?? '').filter(Boolean),
            sizes,
            gender: inferGender(p.gender ?? ''),
            tags: ['myntra', brand.toLowerCase()],
            sourceListedAt: myntraListedAt,
          });
        }
        console.log(`[myntra] ${label}: ${results.length} items via intercepted API`);
      }

      // Try embedded JSON state if interception got nothing
      if (results.length === 0) {
        const raw = await page.evaluate(() => {
          const scripts = Array.from(document.querySelectorAll('script:not([src])'));
          for (const s of scripts) {
            const text = s.textContent ?? '';
            if (text.includes('"productId"') && text.includes('"brand"')) {
              // Pattern 1: window.__myx
              const m1 = text.match(/window\.__myx\s*=\s*(\{[\s\S]*?\});\s*window/);
              if (m1) return m1[1];
              // Pattern 2: raw array
              const m2 = text.match(/\[{"productId"[\s\S]*?\}]/);
              if (m2) return m2[0];
              // Pattern 3: any large JSON containing productId
              const m3 = text.match(/(\{[\s\S]{500,}\})/);
              if (m3) return m3[1];
            }
          }
          // Pattern 4: __INITIAL_STATE__
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
            const data = JSON.parse(raw) as unknown;
            const products = extractProducts(data);

            for (const p of products.slice(0, 20)) {
              const fullTitle = `${p.brand ?? ''} ${p.productName ?? ''}`.trim();
              const brand = detectBrand(fullTitle);
              if (!brand) continue;

              const pageUrl = buildProductUrl(p);
              if (seen.has(pageUrl)) continue;
              seen.add(pageUrl);

              const price = p.price?.discounted;
              if (!price || price <= 0) continue;

              const sizes = normalizeSizes(p.sizes ?? p.sizesWithLabel ?? p.productSize);

              const mnDateRaw2 = p.listDate ?? p.listingDate;
              results.push({
                sourceUrl: pageUrl,
                sourceSite: 'myntra',
                name: fullTitle,
                brand,
                price,
                originalPrice: p.price?.mrp && p.price.mrp > price ? p.price.mrp : undefined,
                images: (p.images ?? []).map((i) => i.src ?? '').filter(Boolean),
                sizes,
                gender: inferGender(p.gender ?? ''),
                tags: ['myntra', brand.toLowerCase()],
                sourceListedAt: mnDateRaw2 ? new Date(mnDateRaw2) : undefined,
              });
            }
            console.log(`[myntra] ${label}: ${results.length} items via embedded JSON`);
          } catch (e) {
            console.warn(`[myntra] ${label}: JSON parse failed:`, (e as Error).message);
          }
        }
      }

      // DOM fallback — listing pages don't expose per-product sizes, but capture what we can
      if (results.length === 0) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await jitter(1500, 2500);

        const domItems = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('.product-base, [class*="product-base"]'));
          return cards.slice(0, 20).map((card) => {
            // Some cards expose sizes as data attributes or child chips
            const sizeEls = Array.from(card.querySelectorAll('[class*="size"] span, [class*="sizeChip"], [data-size]'));
            const sizes = sizeEls
              .map((el) => el.textContent?.trim() ?? (el as HTMLElement).dataset?.size ?? '')
              .filter((s) => s && /^\d/.test(s));
            return {
              brand: card.querySelector('.product-brand')?.textContent?.trim() ?? '',
              name: card.querySelector('.product-product')?.textContent?.trim() ?? '',
              href: (card.querySelector('a') as HTMLAnchorElement | null)?.href ?? '',
              imgSrc: (card.querySelector('img.img-responsive') as HTMLImageElement | null)?.src ?? '',
              price: card.querySelector('.product-discountedPrice')?.textContent?.replace(/[^\d]/g, '') ?? '',
              mrp: card.querySelector('.product-strike')?.textContent?.replace(/[^\d]/g, '') ?? '',
              sizes,
            };
          });
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
            originalPrice: item.mrp && parseInt(item.mrp) > price ? parseInt(item.mrp) : undefined,
            images: item.imgSrc ? [item.imgSrc] : [],
            sizes: item.sizes,
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
