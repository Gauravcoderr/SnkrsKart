import axios from 'axios';
import * as cheerio from 'cheerio';
import { buildHeaders, jitter, withRetry, filterDeadUrls, ScrapedItem } from './utils';
import type { ScrapedBrand } from '../../models/ScrapedProduct';

interface ShopifyVariant {
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
}

interface ShopifyProduct {
  handle: string;
  title: string;
  body_html: string;
  vendor: string;
  variants: ShopifyVariant[];
  images: { src: string }[];
  tags: string[];
  product_type?: string;
  created_at?: string;
  updated_at?: string;
}

interface ShopifyResponse {
  products: ShopifyProduct[];
}

const BRAND_PATTERNS: { brand: ScrapedBrand; re: RegExp }[] = [
  { brand: 'Jordan', re: /\bjordan\b|\bjumpman\b/i },
  { brand: 'Nike', re: /\bnike\b/i },
  { brand: 'Adidas', re: /\badidas\b/i },
  { brand: 'New Balance', re: /\bnew[\s-]?balance\b/i },
  { brand: 'Crocs', re: /\bcrocs\b/i },
];

const FOOTWEAR_TYPE_RE = /sneaker|shoe|slide|clog|boot|mule|footwear/i;
const EXCLUDED_STYLE_RE = /\bsandals?\b|\bflip[\s-]?flops?\b|\bchappals?\b|\bfloaters?\b|\bthong\b/i;
const CLOG_RE = /\bclogs?\b/i;

function isExcludedStyle(name: string): boolean {
  return EXCLUDED_STYLE_RE.test(name) && !CLOG_RE.test(name);
}

function detectBrand(title: string, vendor: string): ScrapedBrand | null {
  const haystack = `${title} ${vendor}`;
  return BRAND_PATTERNS.find((p) => p.re.test(haystack))?.brand ?? null;
}

function parseSizes(variants: ShopifyVariant[]): string[] {
  return variants
    .filter((v) => v.available !== false)
    .map((v) => v.title)
    .filter((t) => t !== 'Default Title');
}

function inferGender(tags: string[]): ScrapedItem['gender'] {
  const s = tags.join(' ').toLowerCase();
  if (/\bwomen\b|\bwomens\b/.test(s)) return 'women';
  if (/\bkids\b|\bjunior\b|\bchildren\b/.test(s)) return 'kids';
  if (/\bmen\b|\bmens\b/.test(s)) return 'men';
  return 'unisex';
}

const FLAG_PATTERNS: { flag: string; re: RegExp }[] = [
  { flag: 'bestseller', re: /best.?sell|top.?sell|most.?sold/i },
  { flag: 'trending',   re: /trend/i },
  { flag: 'limited',    re: /limited|ltd.?ed|exclusive|collab/i },
  { flag: 'hyped',      re: /hype|heat|grail|must.?have/i },
  { flag: 'popular',    re: /popular|fan.?fav|top.?pick|staff.?pick/i },
];

function extractFlags(tags: string[], title: string): string[] {
  const haystack = [...tags, title].join(' ').toLowerCase();
  return FLAG_PATTERNS.filter((p) => p.re.test(haystack)).map((p) => p.flag);
}

async function fetchJson(
  baseUrl: string,
  collection: string,
  site: ScrapedItem['sourceSite']
): Promise<ScrapedItem[]> {
  const url = `${baseUrl}/collections/${collection}/products.json?limit=24&sort_by=created-descending`;
  const res = await withRetry(() =>
    axios.get<ShopifyResponse>(url, {
      headers: buildHeaders(baseUrl),
      timeout: 15000,
    })
  );
  const products = res.data?.products ?? [];
  const results: ScrapedItem[] = [];

  for (const p of products) {
    if (p.product_type && !FOOTWEAR_TYPE_RE.test(p.product_type)) continue;
    if (isExcludedStyle(p.title)) continue;
    const brand = detectBrand(p.title, p.vendor);
    if (!brand) continue;
    if (!p.images || p.images.length === 0) continue; // skip if no images

    const price = p.variants[0] ? Math.round(parseFloat(p.variants[0].price)) : undefined;
    if (!price || price <= 0) continue; // skip zero-price

    const origRaw = p.variants[0]?.compare_at_price;
    const originalPrice = origRaw ? Math.round(parseFloat(origRaw)) : undefined;

    results.push({
      sourceUrl: `${baseUrl}/products/${p.handle}`,
      sourceSite: site,
      name: p.title,
      brand,
      price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      images: p.images.map((i) => i.src),
      sizes: parseSizes(p.variants),
      description: cheerio.load(p.body_html).text().trim().slice(0, 500),
      tags: p.tags ?? [],
      flags: extractFlags(p.tags ?? [], p.title),
      gender: inferGender(p.tags ?? []),
      sourceListedAt: p.created_at ? new Date(p.created_at) : undefined,
      sourceUpdatedAt: p.updated_at ? new Date(p.updated_at) : undefined,
    });
  }
  return results;
}

async function fetchHtml(
  baseUrl: string,
  collection: string,
  site: ScrapedItem['sourceSite']
): Promise<ScrapedItem[]> {
  const url = `${baseUrl}/collections/${collection}`;
  const res = await axios.get<string>(url, {
    headers: buildHeaders(baseUrl),
    timeout: 15000,
  });
  const $ = cheerio.load(res.data);
  const results: ScrapedItem[] = [];

  $('[data-product-id], .product-item, .grid-product, .product-card, .product').each((_, el) => {
    const title = $(el)
      .find('.product-item__title, .grid-product__title, .product-card__title, h2, h3')
      .first()
      .text()
      .trim();
    if (!title) return;
    if (isExcludedStyle(title)) return;
    const brand = detectBrand(title, '');
    if (!brand) return;

    const href = $(el).find('a[href*="/products/"]').first().attr('href') ?? '';
    const sourceUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
    const priceText = $(el).find('[class*="price"]').first().text().replace(/[^\d.]/g, '');
    const price = priceText ? Math.round(parseFloat(priceText)) : undefined;
    if (!price || price <= 0) return;

    const imgSrc =
      $(el).find('img').first().attr('data-src') ??
      $(el).find('img').first().attr('src') ??
      '';
    if (!imgSrc) return;

    results.push({
      sourceUrl,
      sourceSite: site,
      name: title,
      brand,
      price,
      images: [imgSrc],
      sizes: [],
      tags: [],
      gender: 'unisex',
    });
  });
  return results;
}

const SITES: { baseUrl: string; collections: string[]; site: ScrapedItem['sourceSite'] }[] = [
  // VegNonVeg — Cloudflare-protected, handled by GitHub Actions Puppeteer
  { baseUrl: 'https://limitededt.in',     collections: ['nike', 'adidas-originals', 'adidas', 'new-balance'],                          site: 'limitededt' },
  { baseUrl: 'https://www.superkicks.in', collections: ['nike', 'jordan', 'air-jordan', 'adidas-originals', 'adidas', 'new-balance', 'crocs'], site: 'superkicks' },
];

export async function scrapeAllShopify(): Promise<ScrapedItem[]> {
  const all: ScrapedItem[] = [];

  for (const { baseUrl, collections, site } of SITES) {
    for (const collection of collections) {
      try {
        const items = await fetchJson(baseUrl, collection, site);
        all.push(...items);
        console.log(`[shopify] ${site}/${collection}: ${items.length} items`);
      } catch (err) {
        console.warn(`[shopify] JSON failed for ${site}/${collection}, trying HTML:`, (err as Error).message);
        try {
          const items = await fetchHtml(baseUrl, collection, site);
          all.push(...items);
          console.log(`[shopify] ${site}/${collection} HTML fallback: ${items.length} items`);
        } catch (err2) {
          console.error(`[shopify] HTML fallback also failed for ${site}/${collection}:`, (err2 as Error).message);
        }
      }
      await jitter(2000, 5000);
    }
    await jitter(3000, 7000);
  }

  // Deduplicate within this run by sourceUrl
  const seen = new Set<string>();
  const deduped = all.filter((item) => {
    if (seen.has(item.sourceUrl)) return false;
    seen.add(item.sourceUrl);
    return true;
  });

  console.log(`[shopify] validating ${deduped.length} URLs (dropping 404s)...`);
  const live = await filterDeadUrls(deduped, 'https://www.google.com');
  console.log(`[shopify] live after validation: ${live.length}`);
  return live;
}
