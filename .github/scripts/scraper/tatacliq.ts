import { stealthGet, stealthGetJson } from './http';
import { Brand, ScrapedItem, absoluteUrl, detectBrand, extractJsonAfter, inferGender, jitter, roundPrice } from './utils';

const BASE = 'https://www.tatacliq.com';
const LUXURY_BASE = 'https://luxury.tatacliq.com';
const SEARCH_API = 'https://searchbff.tatacliq.com/products/mpl/search';

const QUERIES: { text: string; brand: Brand }[] = [
  { text: 'nike shoes', brand: 'Nike' },
  { text: 'air jordan', brand: 'Jordan' },
  { text: 'adidas sneakers', brand: 'Adidas' },
  { text: 'new balance shoes', brand: 'New Balance' },
  { text: 'crocs', brand: 'Crocs' },
];

interface TCPrice {
  doubleValue?: number;
}

interface TCProduct {
  productId?: string;
  productname?: string;
  brandname?: string;
  productCategoryType?: string;
  productColor?: string;
  webURL?: string;
  imageURL?: string;
  productImages?: string[];
  inStockFlag?: boolean;
  price?: { sellingPrice?: TCPrice; mrpPrice?: TCPrice };
}

interface TCSearchResponse {
  searchresult?: TCProduct[];
  pagination?: { totalResults?: number };
}

function searchUrl(text: string, page: number): string {
  const params = new URLSearchParams({
    searchText: `${text}:isProductNew:inStockFlag:true`,
    isKeywordRedirect: 'false',
    isKeywordRedirectEnabled: 'false',
    channel: 'WEB',
    isMDE: 'true',
    isTextSearch: 'false',
    isFilter: 'false',
    qc: 'false',
    test: 'invizbff.qpsv3-inviz.ab',
    page: String(page),
    customerId: '',
    isSuggested: 'false',
    isPwa: 'true',
    pageSize: '40',
    typeID: 'all',
  });
  return `${SEARCH_API}?${params.toString()}`;
}

const LUXURY_CATEGORIES: { path: string; brands: Brand[]; pages: number }[] = [
  { path: '/footwear-nike/c-mbh13a00092', brands: ['Nike', 'Jordan'], pages: 4 },
  { path: '/footwear-adidas-originals/c-mbh13b11337', brands: ['Adidas'], pages: 2 },
  { path: '/new-balance/c-mbh13f00063', brands: ['New Balance'], pages: 2 },
];

function hiRes(url: string): string {
  return absoluteUrl(url, BASE).replace(/\/(437Wx649H|658Wx734H)\//g, '/1348Wx2000H/').replace(/_(437Wx649H|658Wx734H)_/g, '_1348Wx2000H_');
}

function mapProduct(p: TCProduct, expected: Brand | Brand[], site: ScrapedItem['sourceSite'] = 'tatacliq', base = BASE): ScrapedItem | null {
  if (!p.productname || !p.webURL) return null;
  if (p.productCategoryType && p.productCategoryType !== 'Footwear') return null;
  const brand = detectBrand(p.productname, p.brandname);
  if (!brand) return null;
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(brand) && !(allowed.includes('Jordan') && brand === 'Nike')) return null;

  const price = roundPrice(p.price?.sellingPrice?.doubleValue);
  if (!price) return null;
  const mrp = roundPrice(p.price?.mrpPrice?.doubleValue);
  const images = (p.productImages?.length ? p.productImages : [p.imageURL ?? '']).filter(Boolean).map(hiRes);
  if (images.length === 0) return null;

  return {
    sourceUrl: absoluteUrl(p.webURL, base),
    sourceSite: site,
    name: p.productname,
    brand,
    price,
    originalPrice: mrp && mrp > price ? mrp : undefined,
    images,
    sizes: [],
    colorway: p.productColor || undefined,
    sku: p.productId,
    gender: inferGender(p.productname),
    tags: [site, brand.toLowerCase()],
  };
}

export async function scrapeTataCliq(pages = 1): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  for (const { text, brand } of QUERIES) {
    let count = 0;
    for (let page = 0; page < pages; page++) {
      try {
        const data = await stealthGetJson<TCSearchResponse>(searchUrl(text, page), {
          referer: `${BASE}/`,
          headers: { origin: BASE },
        });
        const products = data.searchresult ?? [];
        for (const p of products) {
          const item = mapProduct(p, brand);
          if (!item || seen.has(item.sourceUrl)) continue;
          seen.add(item.sourceUrl);
          results.push(item);
          count++;
        }
        if (products.length < 40) break;
      } catch (err) {
        console.error(`[tatacliq] ${text} p${page} failed:`, (err as Error).message);
        break;
      }
      await jitter(1200, 2500);
    }
    console.log(`[tatacliq] ${text}: ${count} items`);
    await jitter(1500, 3000);
  }

  return results;
}

function extractInitialData(html: string): TCSearchResponse | null {
  const data = extractJsonAfter(html, 'window.initialData =') as { productListingData?: TCSearchResponse } | null;
  return data?.productListingData ?? null;
}

export async function scrapeTataCliqLuxury(): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  for (const { path, brands, pages } of LUXURY_CATEGORIES) {
    let count = 0;
    for (let page = 0; page < pages; page++) {
      const url = `${LUXURY_BASE}${path}${page > 0 ? `?page=${page}` : ''}`;
      try {
        const html = await stealthGet(url, { referer: page > 0 ? `${LUXURY_BASE}${path}` : `${LUXURY_BASE}/` });
        const products = extractInitialData(html)?.searchresult ?? [];
        for (const p of products) {
          const item = mapProduct(p, brands, 'tatacliqluxury', LUXURY_BASE);
          if (!item || seen.has(item.sourceUrl)) continue;
          seen.add(item.sourceUrl);
          results.push(item);
          count++;
        }
        if (products.length === 0) break;
      } catch (err) {
        console.error(`[tatacliq-luxury] ${path} p${page} failed:`, (err as Error).message);
        break;
      }
      await jitter(1500, 3000);
    }
    console.log(`[tatacliq-luxury] ${path}: ${count} items`);
  }

  return results;
}
