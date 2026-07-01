import { Browser } from 'puppeteer';
import { jitter, sessionUA, ScrapedItem } from './utils';

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const NIKE_RE = /\bnike\b/i;

function detectBrand(title: string): 'Nike' | 'Jordan' | null {
  if (JORDAN_RE.test(title)) return 'Jordan';
  if (NIKE_RE.test(title)) return 'Nike';
  return null;
}

function inferGender(g: string): ScrapedItem['gender'] {
  const s = g.toLowerCase();
  if (s.includes('women') || s.includes('female') || s.includes('girl')) return 'women';
  if (s.includes('kid') || s.includes('child') || s.includes('boy')) return 'kids';
  if (s.includes('men') || s.includes('male')) return 'men';
  return 'unisex';
}

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
    const brand = detectBrand(name);
    if (!brand) continue;
    const pageUrl = buildProductUrl(p);
    if (!pageUrl || seen.has(pageUrl)) continue;
    seen.add(pageUrl);
    const price = p.price ?? p.mrp;
    if (!price || price <= 0) continue;
    const imgs = (p.images ?? []).map((i) => i.src ?? '').filter(Boolean);
    if (imgs.length === 0 && p.searchImage) imgs.push(p.searchImage);
    out.push({
      sourceUrl: pageUrl,
      sourceSite: 'myntra',
      name,
      brand,
      price,
      originalPrice: p.mrp && p.mrp > price ? p.mrp : undefined,
      images: imgs,
      sizes: extractSizes(p),
      gender: inferGender(p.gender ?? ''),
      tags: ['myntra', brand.toLowerCase()],
      sourceListedAt: p.catalogDate ? new Date(p.catalogDate) : undefined,
    });
  }
  return out;
}

// Puppeteer got 0 items live — Myntra's WAF serves an empty window.__myx to headless/CDP
// sessions specifically (title stayed normal, no "access denied", just empty SSR state).
// A plain HTTPS GET (no JS engine, no CDP fingerprint) gets the real SSR payload straight
// through — verified live: window.__myx.searchData.results.products populated (50 items).
async function fetchSearchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': sessionUA(),
      'Accept-Language': 'en-IN,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Referer': 'https://www.myntra.com',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function extractMyxProducts(html: string): MyntraProduct[] {
  const marker = 'window.__myx = ';
  const start = html.indexOf(marker);
  if (start === -1) return [];
  const jsonStart = start + marker.length;
  const end = html.indexOf('</script>', jsonStart);
  if (end === -1) return [];
  const blob = html.slice(jsonStart, end).replace(/;\s*$/, '');
  try {
    const myx = JSON.parse(blob) as Record<string, unknown>;
    const results = (myx.searchData as Record<string, unknown>)?.results as Record<string, unknown>;
    return (results?.products as MyntraProduct[]) ?? [];
  } catch {
    return [];
  }
}

export async function scrapeMyntra(_browser: Browser): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  const queries = [
    { url: 'https://www.myntra.com/shoes?rawQuery=nike+shoes&sort=new', label: 'nike' },
    { url: 'https://www.myntra.com/shoes?rawQuery=jordan+shoes&sort=new', label: 'jordan' },
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
