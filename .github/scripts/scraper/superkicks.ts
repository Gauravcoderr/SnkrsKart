import crypto from 'crypto';
import { jitter, filterDeadUrls, ScrapedItem } from './utils';

const BASE = 'https://www.superkicks.in';

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const NIKE_RE = /\bnike\b/i;

function detectBrand(title: string, vendor = ''): 'Nike' | 'Jordan' | null {
  const h = `${title} ${vendor}`;
  if (JORDAN_RE.test(h)) return 'Jordan';
  if (NIKE_RE.test(h)) return 'Nike';
  return null;
}

function inferGender(tags: string[]): ScrapedItem['gender'] {
  const s = tags.join(' ').toLowerCase();
  if (/\bwomen\b|\bwomens\b|\bfemale\b/.test(s)) return 'women';
  if (/\bkids\b|\bjunior\b|\bchild\b/.test(s)) return 'kids';
  if (/\bmen\b|\bmens\b|\bmale\b/.test(s)) return 'men';
  return 'unisex';
}

interface SKProduct {
  handle?: string;
  title?: string;
  vendor?: string;
  variants?: { price?: string; compare_at_price?: string | null; available?: boolean; title?: string }[];
  images?: { src?: string }[];
  tags?: string[];
  created_at?: string;
}

function parseProducts(json: { products?: SKProduct[] }, seen: Set<string>): ScrapedItem[] {
  const out: ScrapedItem[] = [];
  for (const p of json.products ?? []) {
    if (!p.handle || !p.title) continue;
    const brand = detectBrand(p.title, p.vendor);
    if (!brand) continue;
    if (!p.images || p.images.length === 0) continue;

    const price = p.variants?.[0]?.price ? Math.round(parseFloat(p.variants[0].price)) : undefined;
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

    out.push({
      sourceUrl,
      sourceSite: 'superkicks',
      name: p.title,
      brand,
      price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      images: (p.images ?? []).map((i) => i.src ?? '').filter(Boolean),
      sizes,
      tags: p.tags ?? [],
      gender: inferGender(p.tags ?? []),
      sourceListedAt: p.created_at ? new Date(p.created_at) : undefined,
    });
  }
  return out;
}

// Superkicks Shopify JSON is unprotected — no ScrapingAnt or Puppeteer needed
export async function scrapeSuperkicks(): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  const collections = ['nike', 'jordan', 'new-arrivals'];

  for (const col of collections) {
    try {
      const url = `${BASE}/collections/${col}/products.json?limit=24&sort_by=created-descending`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-IN,en;q=0.9',
          'Referer': BASE,
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        console.warn(`[superkicks] ${col}: HTTP ${res.status}`);
        continue;
      }
      const data = (await res.json()) as { products?: SKProduct[] };
      const items = parseProducts(data, seen);
      results.push(...items);
      console.log(`[superkicks] ${col}: ${items.length} items`);
    } catch (err) {
      console.error(`[superkicks] ${col} failed:`, (err as Error).message);
    }
    await jitter(800, 1500);
  }

  console.log(`[superkicks] validating ${results.length} URLs (dropping 404s)...`);
  const live = await filterDeadUrls(results, BASE);
  console.log(`[superkicks] live after validation: ${live.length}`);
  return live;
}
