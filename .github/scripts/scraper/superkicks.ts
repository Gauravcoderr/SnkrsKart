import { stealthGetJson } from './http';
import { detectBrand, filterDeadUrls, inferGender, jitter, ScrapedItem } from './utils';

const BASE = 'https://www.superkicks.in';

interface SKProduct {
  handle?: string;
  title?: string;
  vendor?: string;
  variants?: { price?: string; compare_at_price?: string | null; available?: boolean; title?: string }[];
  images?: { src?: string }[];
  tags?: string[];
  product_type?: string;
  created_at?: string;
}

const FOOTWEAR_TYPE_RE = /sneaker|shoe|slide|clog|boot|mule|footwear/i;

function parseProducts(json: { products?: SKProduct[] }, seen: Set<string>): ScrapedItem[] {
  const out: ScrapedItem[] = [];
  for (const p of json.products ?? []) {
    if (!p.handle || !p.title) continue;
    if (p.product_type && !FOOTWEAR_TYPE_RE.test(p.product_type)) continue;
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
      gender: inferGender(p.title, ...(p.tags ?? [])),
      sourceListedAt: p.created_at ? new Date(p.created_at) : undefined,
    });
  }
  return out;
}

export async function scrapeSuperkicks(): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  const collections = ['nike', 'jordan', 'adidas-originals', 'adidas', 'new-balance', 'crocs', 'new-arrivals'];

  for (const col of collections) {
    try {
      const url = `${BASE}/collections/${col}/products.json?limit=24&sort_by=created-descending`;
      const data = await stealthGetJson<{ products?: SKProduct[] }>(url, { referer: `${BASE}/collections/${col}`, antFallback: false });
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
