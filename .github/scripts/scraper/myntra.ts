import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser } from 'puppeteer';
import { jitter, randomUA, ScrapedItem } from './utils';

puppeteer.use(StealthPlugin());

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const NIKE_RE = /\bnike\b/i;

function detectBrand(title: string): 'Nike' | 'Jordan' | null {
  if (JORDAN_RE.test(title)) return 'Jordan';
  if (NIKE_RE.test(title)) return 'Nike';
  return null;
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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://www.myntra.com',
        'DNT': '1',
      });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await jitter(2000, 4000);

      // Try to extract embedded JSON state (window.__myx or similar)
      const raw = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const s of scripts) {
          const text = s.textContent ?? '';
          if (text.includes('"productId"') && text.includes('"brand"')) {
            const match = text.match(/window\.__myx\s*=\s*(\{.*?\});?\s*window/s);
            if (match) return match[1];
            // Fallback: look for JSON array of products
            const arrMatch = text.match(/\[{"productId".*?\}\]/s);
            if (arrMatch) return arrMatch[0];
          }
        }
        return null;
      });

      if (raw) {
        try {
          const data = JSON.parse(raw) as { searchData?: { results?: { searchResult?: { results?: MyntraProduct[] } } } };
          const products: MyntraProduct[] =
            data?.searchData?.results?.searchResult?.results ?? [];

          for (const p of products.slice(0, 15)) {
            const title = `${p.brand ?? ''} ${p.productName ?? ''}`.trim();
            const brand = detectBrand(title);
            if (!brand) continue;

            const pageUrl = p.landingPageUrl
              ? `https://www.myntra.com/${p.landingPageUrl}`
              : `https://www.myntra.com/${p.productId ?? ''}`;

            if (seen.has(pageUrl)) continue;
            seen.add(pageUrl);

            results.push({
              sourceUrl: pageUrl,
              sourceSite: 'myntra',
              name: title,
              brand,
              price: p.price?.discounted,
              originalPrice:
                p.price?.mrp && p.price.mrp > (p.price.discounted ?? 0)
                  ? p.price.mrp
                  : undefined,
              images: (p.images ?? []).map((i) => i.src ?? '').filter(Boolean),
              sizes: p.sizes ?? [],
              gender: inferGender(p.gender ?? ''),
              tags: ['myntra', brand.toLowerCase()],
            });
          }
          console.log(`[myntra] ${label}: ${results.length} items via embedded JSON`);
        } catch {
          // JSON parse failed, fall through to DOM parse
        }
      }

      // DOM fallback if JSON extraction failed
      if (results.length === 0) {
        const domItems = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('.product-base'));
          return cards.slice(0, 15).map((card) => ({
            title: card.querySelector('.product-brand')?.textContent?.trim() + ' ' + card.querySelector('.product-product')?.textContent?.trim(),
            href: (card.querySelector('a') as HTMLAnchorElement)?.href ?? '',
            imgSrc: (card.querySelector('img.img-responsive') as HTMLImageElement)?.src ?? '',
            price: card.querySelector('.product-discountedPrice')?.textContent?.replace(/[^\d]/g, '') ?? '',
            mrp: card.querySelector('.product-strike')?.textContent?.replace(/[^\d]/g, '') ?? '',
          }));
        });

        for (const item of domItems) {
          const brand = detectBrand(item.title ?? '');
          if (!brand || !item.href) continue;
          if (seen.has(item.href)) continue;
          seen.add(item.href);

          results.push({
            sourceUrl: item.href,
            sourceSite: 'myntra',
            name: item.title ?? '',
            brand,
            price: item.price ? parseInt(item.price) : undefined,
            originalPrice: item.mrp && parseInt(item.mrp) > (item.price ? parseInt(item.price) : 0) ? parseInt(item.mrp) : undefined,
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

function inferGender(g: string): ScrapedItem['gender'] {
  const s = g.toLowerCase();
  if (s.includes('women') || s.includes('female')) return 'women';
  if (s.includes('kid') || s.includes('child')) return 'kids';
  if (s.includes('men') || s.includes('male')) return 'men';
  return 'unisex';
}
