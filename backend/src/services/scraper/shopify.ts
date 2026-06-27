import axios from 'axios';
import * as cheerio from 'cheerio';
import { buildHeaders, jitter, ScrapedItem } from './utils';

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
}

interface ShopifyResponse {
  products: ShopifyProduct[];
}

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const NIKE_RE = /\bnike\b/i;

function detectBrand(title: string, vendor: string): 'Nike' | 'Jordan' | null {
  const haystack = `${title} ${vendor}`;
  if (JORDAN_RE.test(haystack)) return 'Jordan';
  if (NIKE_RE.test(haystack)) return 'Nike';
  return null;
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

async function fetchJson(
  baseUrl: string,
  collection: string,
  site: ScrapedItem['sourceSite']
): Promise<ScrapedItem[]> {
  const url = `${baseUrl}/collections/${collection}/products.json?limit=20`;
  const res = await axios.get<ShopifyResponse>(url, {
    headers: buildHeaders(baseUrl),
    timeout: 15000,
  });
  const products = res.data?.products ?? [];
  const results: ScrapedItem[] = [];

  for (const p of products) {
    const brand = detectBrand(p.title, p.vendor);
    if (!brand) continue;

    const price = p.variants[0] ? Math.round(parseFloat(p.variants[0].price)) : undefined;
    const origRaw = p.variants[0]?.compare_at_price;
    const originalPrice = origRaw ? Math.round(parseFloat(origRaw)) : undefined;

    results.push({
      sourceUrl: `${baseUrl}/products/${p.handle}`,
      sourceSite: site,
      name: p.title,
      brand,
      price,
      originalPrice: originalPrice && originalPrice > (price ?? 0) ? originalPrice : undefined,
      images: p.images.map((i) => i.src),
      sizes: parseSizes(p.variants),
      description: cheerio.load(p.body_html).text().trim().slice(0, 500),
      tags: p.tags ?? [],
      gender: inferGender(p.tags ?? []),
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
    const brand = detectBrand(title, '');
    if (!brand) return;

    const href = $(el).find('a[href*="/products/"]').first().attr('href') ?? '';
    const sourceUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
    const priceText = $(el).find('[class*="price"]').first().text().replace(/[^\d.]/g, '');
    const imgSrc =
      $(el).find('img').first().attr('data-src') ??
      $(el).find('img').first().attr('src') ??
      '';

    results.push({
      sourceUrl,
      sourceSite: site,
      name: title,
      brand,
      price: priceText ? Math.round(parseFloat(priceText)) : undefined,
      images: imgSrc ? [imgSrc] : [],
      sizes: [],
      tags: [],
      gender: 'unisex',
    });
  });
  return results;
}

const SITES: { baseUrl: string; collections: string[]; site: ScrapedItem['sourceSite'] }[] = [
  // VegNonVeg removed — Cloudflare blocks server requests; handled by GitHub Actions Puppeteer scraper
  { baseUrl: 'https://limitededt.in', collections: ['nike', 'jordan'], site: 'limitededt' },
  { baseUrl: 'https://www.superkicks.in', collections: ['nike', 'jordan', 'air-jordan'], site: 'superkicks' },
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
  return all.filter((item) => {
    if (seen.has(item.sourceUrl)) return false;
    seen.add(item.sourceUrl);
    return true;
  });
}
