import { Browser, Page } from 'puppeteer';
import { stealthGetJson } from './http';
import { Brand, ScrapedItem, absoluteUrl, detectBrand, inferGender, jitter, roundPrice } from './utils';

const BASE = 'https://www.ajio.com';

const QUERIES: { text: string; sort: 'relevance' | 'newn'; brand: Brand }[] = [
  { text: 'nike shoes', sort: 'relevance', brand: 'Nike' },
  { text: 'jordan shoes', sort: 'relevance', brand: 'Jordan' },
  { text: 'adidas shoes', sort: 'relevance', brand: 'Adidas' },
  { text: 'new balance', sort: 'newn', brand: 'New Balance' },
  { text: 'crocs', sort: 'newn', brand: 'Crocs' },
];

const FOOTWEAR_RE = /shoe|sneaker|clog|sandal|slide|flip flop|slipper|boot|mule/i;

interface AjioImage {
  format?: string;
  url?: string;
}

interface AjioProduct {
  code?: string;
  name?: string;
  url?: string;
  images?: AjioImage[];
  extraImages?: { images?: AjioImage[] }[];
  price?: { value?: number };
  offerPrice?: { value?: number };
  wasPriceData?: { value?: number };
  fnlColorVariantData?: { brandName?: string; colorGroup?: string };
  fnlProductData?: { planningCategory?: string };
  segmentNameText?: string;
  brickNameText?: string;
}

interface AjioSearchResponse {
  products?: AjioProduct[];
  pagination?: { totalResults?: number };
}

function apiPath(text: string, sort: string, page: number): string {
  const params = new URLSearchParams({
    fields: 'SITE',
    currentPage: String(page),
    pageSize: '45',
    format: 'json',
    query: `${text}:${sort}`,
    sortBy: sort,
    text,
    gridColumns: '3',
    advfilter: 'true',
    platform: 'Desktop',
  });
  return `/api/search?${params.toString()}`;
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapProduct(p: AjioProduct, expected: Brand): ScrapedItem | null {
  if (!p.name || !p.url) return null;
  const isFootwear = p.fnlProductData?.planningCategory === 'Footwear' || FOOTWEAR_RE.test(p.brickNameText ?? '');
  if (!isFootwear) return null;

  const rawBrand = p.fnlColorVariantData?.brandName ?? '';
  const brand = detectBrand(rawBrand, p.name);
  if (!brand) return null;
  if (brand !== expected && !(expected === 'Jordan' && brand === 'Nike')) return null;

  const price = roundPrice(p.price?.value);
  if (!price) return null;
  const was = roundPrice(p.wasPriceData?.value);

  const primary = (p.images ?? []).find((i) => i.format === 'product')?.url ?? p.images?.[0]?.url;
  const extras = (p.extraImages ?? []).map((e) => e.images?.find((i) => i.format === 'product')?.url ?? e.images?.[0]?.url);
  const images = [primary, ...extras].filter((u): u is string => !!u);
  if (images.length === 0) return null;

  const brandLabel = rawBrand ? titleCase(rawBrand) : brand;
  const name = p.name.toLowerCase().startsWith(brandLabel.toLowerCase()) ? p.name : `${brandLabel} ${p.name}`;

  return {
    sourceUrl: absoluteUrl(p.url, BASE),
    sourceSite: 'ajio',
    name,
    brand,
    price,
    originalPrice: was && was > price ? was : undefined,
    images,
    sizes: [],
    sku: p.code,
    gender: inferGender(p.segmentNameText, p.name),
    tags: ['ajio', brand.toLowerCase()],
  };
}

async function openBrowserSession(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'media', 'font'].includes(req.resourceType())) req.abort().catch(() => {});
    else req.continue().catch(() => {});
  });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await jitter(2500, 4500);
  return page;
}

async function fetchInPage(page: Page, path: string): Promise<AjioSearchResponse> {
  const res = await page.evaluate(async (p: string) => {
    const r = await fetch(p, { headers: { accept: 'application/json' }, credentials: 'include' });
    return { status: r.status, body: await r.text() };
  }, path);
  if (res.status !== 200) throw new Error(`in-page fetch HTTP ${res.status}`);
  return JSON.parse(res.body) as AjioSearchResponse;
}

export async function scrapeAjio(browser: Browser): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();
  let page: Page | null = null;
  let directBlocked = false;

  try {
    for (const { text, sort, brand } of QUERIES) {
      const path = apiPath(text, sort, 0);
      let data: AjioSearchResponse | null = null;

      if (!directBlocked) {
        try {
          data = await stealthGetJson<AjioSearchResponse>(`${BASE}${path}`, {
            referer: `${BASE}/search/?text=${encodeURIComponent(text)}`,
            retries: 2,
            antFallback: false,
          });
        } catch (err) {
          directBlocked = true;
          console.warn(`[ajio] direct fetch blocked (${(err as Error).message}) — switching to stealth browser`);
        }
      }

      if (!data) {
        try {
          page ??= await openBrowserSession(browser);
          data = await fetchInPage(page, path);
        } catch (err) {
          console.warn(`[ajio] ${text}: browser session failed (${(err as Error).message})`);
          if (process.env.SCRAPINGANT_API_KEY) {
            try {
              data = await stealthGetJson<AjioSearchResponse>(`${BASE}${path}`, { retries: 1, antFallback: true });
            } catch (antErr) {
              console.error(`[ajio] ${text}: ScrapingAnt failed:`, (antErr as Error).message);
            }
          }
        }
      }

      let count = 0;
      for (const p of data?.products ?? []) {
        const item = mapProduct(p, brand);
        if (!item || seen.has(item.sourceUrl)) continue;
        seen.add(item.sourceUrl);
        results.push(item);
        count++;
      }
      console.log(`[ajio] ${text}: ${count} items`);
      await jitter(2000, 4000);
    }
  } finally {
    if (page) await page.close().catch(() => {});
  }

  return results;
}
