import { Browser } from 'puppeteer';
import { stealthGet } from './http';
import { detectBrand, extractJsonAfter, inferGender, jitter, ScrapedItem } from './utils';

interface MyntraProduct {
  productId?: number;
  productName?: string;
  product?: string;
  brand?: string;
  mrp?: number;
  price?: number;
  searchImage?: string;
  images?: { view?: string; src?: string }[];
  sizes?: string;
  inventoryInfo?: { label?: string; available?: boolean }[];
  gender?: string;
  landingPageUrl?: string;
  catalogDate?: number;
}

function buildProductUrl(p: MyntraProduct): string {
  if (p.landingPageUrl) return `https://www.myntra.com/${p.landingPageUrl}`;
  return `https://www.myntra.com/${p.productId ?? ''}`;
}

function extractSizes(p: MyntraProduct): string[] {
  if (typeof p.sizes === 'string' && p.sizes) {
    return p.sizes.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(p.inventoryInfo)) {
    return p.inventoryInfo
      .filter((i) => i.available !== false)
      .map((i) => i.label ?? '')
      .filter(Boolean);
  }
  return [];
}

function mapProducts(products: MyntraProduct[], seen: Set<string>): ScrapedItem[] {
  const out: ScrapedItem[] = [];
  for (const p of products) {
    const name = p.productName ?? p.product ?? '';
    if (!name) continue;
    const brand = detectBrand(name, p.brand);
    if (!brand) continue;
    const pageUrl = buildProductUrl(p);
    if (!pageUrl || seen.has(pageUrl)) continue;
    seen.add(pageUrl);
    const price = p.price ?? p.mrp;
    if (!price || price <= 0) continue;
    const imgs = (p.images ?? []).map((i) => i.src ?? '').filter(Boolean);
    if (imgs.length === 0 && p.searchImage) imgs.push(p.searchImage);
    for (let i = 0; i < imgs.length; i++) imgs[i] = imgs[i].replace(/^http:\/\//, 'https://');
    out.push({
      sourceUrl: pageUrl,
      sourceSite: 'myntra',
      name,
      brand,
      price,
      originalPrice: p.mrp && p.mrp > price ? p.mrp : undefined,
      images: imgs,
      sizes: extractSizes(p),
      gender: inferGender(p.gender, name),
      tags: ['myntra', brand.toLowerCase()],
      sourceListedAt: p.catalogDate ? new Date(p.catalogDate) : undefined,
    });
  }
  return out;
}

async function fetchSearchHtml(url: string): Promise<string> {
  return stealthGet(url, { referer: 'https://www.myntra.com/', retries: 3 });
}

function extractMyxProducts(html: string): MyntraProduct[] {
  const myx = extractJsonAfter(html, 'window.__myx =') as { searchData?: { results?: { products?: MyntraProduct[] } } } | null;
  return myx?.searchData?.results?.products ?? [];
}

export async function scrapeMyntra(_browser: Browser): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  const queries = [
    { url: 'https://www.myntra.com/shoes?rawQuery=nike+shoes&sort=new', label: 'nike' },
    { url: 'https://www.myntra.com/shoes?rawQuery=jordan+shoes&sort=new', label: 'jordan' },
    { url: 'https://www.myntra.com/shoes?rawQuery=adidas+shoes&sort=new', label: 'adidas' },
    { url: 'https://www.myntra.com/shoes?rawQuery=new+balance+shoes&sort=new', label: 'new-balance' },
    { url: 'https://www.myntra.com/crocs?rawQuery=crocs&sort=new', label: 'crocs' },
  ];

  for (const { url, label } of queries) {
    try {
      const html = await fetchSearchHtml(url);
      const products = extractMyxProducts(html);
      if (products.length > 0) {
        const items = mapProducts(products, seen);
        results.push(...items);
        console.log(`[myntra] ${label}: ${items.length} items via window.__myx`);
      } else {
        console.warn(`[myntra] ${label}: 0 items — window.__myx empty or unparseable`);
      }
    } catch (err) {
      console.error(`[myntra] ${label} failed:`, (err as Error).message);
    }
    await jitter(2000, 4000);
  }

  return results;
}
