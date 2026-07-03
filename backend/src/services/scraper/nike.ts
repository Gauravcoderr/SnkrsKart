import * as cheerio from 'cheerio';
import { jitter, filterDeadUrls, scrapingAntFetch, ScrapedItem } from './utils';

const BASE = 'https://www.nike.in';

// nike.in's own commerce API (api.nike.com/cic/browse/v2) was retired — now returns a hard 404
// (error code 310, "resource does not exist"). Its old PDP link format (/t/{slug}) is dead too;
// nike.in's real product pages now live at /{slug}/p/{numericId} — verified live 2026-07.
// Akamai blocks datacenter IPs outright on nike.in (403 on every direct fetch, browser or not),
// so we go through ScrapingAnt like footlocker/vegnonveg, then scrape the rendered category
// pages directly — the real PDP links are already embedded in the anchors, no API needed.
const CATEGORY_PAGES = [
  { url: `${BASE}/new-featured/c/94475`, label: 'new-featured' },
  { url: `${BASE}/jordan-footwear/c/94044`, label: 'jordan-footwear' },
];

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const NIKE_RE = /\bnike\b/i;
const PRICE_RE = /₹\s?([\d,]+)/;

function detectBrand(title: string): 'Nike' | 'Jordan' | null {
  if (JORDAN_RE.test(title)) return 'Jordan';
  if (NIKE_RE.test(title)) return 'Nike';
  return null;
}

function inferGender(title: string): ScrapedItem['gender'] {
  const s = title.toLowerCase();
  if (s.includes('women')) return 'women';
  if (s.includes('kids') || s.includes('child') || s.includes('infant') || s.includes('toddler')) return 'kids';
  if (s.includes('men')) return 'men';
  return 'unisex';
}

function parsePriceFromContext($card: cheerio.Cheerio<any>): number | undefined { // eslint-disable-line @typescript-eslint/no-explicit-any
  const text = $card.text();
  const m = text.match(PRICE_RE);
  if (!m) return undefined;
  const n = parseInt(m[1].replace(/,/g, ''), 10);
  return isNaN(n) || n <= 0 ? undefined : n;
}

async function scrapeCategoryPage(url: string, label: string, seen: Set<string>): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const html = await scrapingAntFetch(url, true);
  const $ = cheerio.load(html);

  // Real PDP links match /{slug}/p/{numericId} — matching by that pattern is markup-agnostic,
  // safer than guessing card class names we can't see from here (Akamai blocks direct inspection).
  $('a[href*="/p/"]').each((_i, el) => {
    const anchor = $(el);
    const href = anchor.attr('href') ?? '';
    if (!/\/p\/\d+/.test(href)) return;
    const sourceUrl = href.startsWith('http') ? href : `${BASE}${href}`;
    if (seen.has(sourceUrl)) return;

    const card = anchor.closest('li, article, div').length ? anchor.closest('li, article, div') : anchor;
    const name = (anchor.attr('aria-label') ?? anchor.attr('title') ?? anchor.text() ?? card.find('img').first().attr('alt') ?? '').trim();
    const brand = detectBrand(name);
    if (!name || !brand) return;

    const price = parsePriceFromContext(card);
    const img = card.find('img').first();
    const image = img.attr('data-src') ?? img.attr('src') ?? '';

    seen.add(sourceUrl);
    results.push({
      sourceUrl,
      sourceSite: 'nike',
      name,
      brand,
      price,
      images: image ? [image] : [],
      sizes: [],
      tags: ['nike', brand.toLowerCase(), 'new-arrival'],
      gender: inferGender(name),
    });
  });

  console.log(`[nike] ${label}: ${results.length} items`);
  return results;
}

export async function scrapeNikeIndia(): Promise<ScrapedItem[]> {
  const seen = new Set<string>();
  const results: ScrapedItem[] = [];

  for (const { url, label } of CATEGORY_PAGES) {
    try {
      const items = await scrapeCategoryPage(url, label, seen);
      results.push(...items);
    } catch (err) {
      console.error(`[nike] ${label} failed:`, (err as Error).message);
    }
    await jitter(2000, 4000);
  }

  console.log(`[nike] validating ${results.length} URLs (dropping 404s)...`);
  const live = await filterDeadUrls(results, BASE);
  console.log(`[nike] live after validation: ${live.length}`);
  return live;
}
