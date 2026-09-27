import { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import { stealthGetJson } from './http';
import { Brand, detectBrand, inferGender, jitter, ScrapedItem } from './utils';

const BASE = 'https://www.vegnonveg.com';

interface VNVListingResponse {
  html?: string;
  nextPage?: boolean;
}

async function fetchListingPage(brandPath: string, page: number): Promise<string> {
  const data = await stealthGetJson<VNVListingResponse>(`${BASE}/${brandPath}?page=${page}`, {
    referer: `${BASE}/${brandPath}`,
    headers: { 'x-requested-with': 'XMLHttpRequest' },
  });
  if (typeof data.html !== 'string') throw new Error('Response missing html field');
  return data.html;
}

function parseListingCards(html: string, fallbackBrand: Brand, seen: Set<string>): ScrapedItem[] {
  const $ = cheerio.load(html);
  const out: ScrapedItem[] = [];

  $('a.gt-product-click').each((_i, el) => {
    const card = $(el);
    const href = card.attr('href') ?? '';
    if (!href || seen.has(href)) return;

    let name = '';
    let price: number | undefined;
    try {
      const data = JSON.parse(card.attr('data-product') ?? '{}') as { name?: string; price?: string };
      name = data.name ?? '';
      price = data.price ? Math.round(parseFloat(data.price)) : undefined;
    } catch { /* fall through to DOM text */ }

    name = name || card.find('.p-name').first().text().trim();
    if (!name || !price || price <= 0) return;

    const brand = detectBrand(name) ?? fallbackBrand;
    seen.add(href);
    const imgNormal = card.find('img.img-normal').attr('data-src') ?? card.find('img.img-normal').attr('src') ?? '';
    const imgHover = card.find('img.img-hover').attr('data-src') ?? '';

    out.push({
      sourceUrl: href,
      sourceSite: 'vegnonveg',
      name,
      brand,
      price,
      images: [imgNormal, imgHover].filter(Boolean),
      sizes: [],
      tags: ['vegnonveg', brand.toLowerCase()],
      gender: inferGender(name),
    });
  });

  return out;
}

export async function scrapeVegNonVeg(_browser: Browser): Promise<ScrapedItem[]> {
  const seen = new Set<string>();
  const results: ScrapedItem[] = [];
  const brandPaths: { path: string; brand: Brand }[] = [
    { path: 'footwear/nike', brand: 'Nike' },
    { path: 'footwear/jordan', brand: 'Jordan' },
    { path: 'footwear/adidas-originals', brand: 'Adidas' },
    { path: 'footwear/adidas', brand: 'Adidas' },
    { path: 'footwear/new-balance', brand: 'New Balance' },
    { path: 'brand/crocs', brand: 'Crocs' },
  ];

  for (const { path, brand } of brandPaths) {
    try {
      const html = await fetchListingPage(path, 1);
      const items = parseListingCards(html, brand, seen);
      results.push(...items);
      console.log(`[vnv] ${path}: ${items.length} items`);
    } catch (err) {
      console.error(`[vnv] ${path} failed:`, (err as Error).message);
    }
    await jitter(1500, 3000);
  }

  return results;
}
