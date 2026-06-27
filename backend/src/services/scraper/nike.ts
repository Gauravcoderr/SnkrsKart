import axios from 'axios';
import crypto from 'crypto';
import { buildHeaders, jitter, withRetry, ScrapedItem } from './utils';

// ── Browse API (primary) — returns products with price + available sizes ─────

const BROWSE_URL = 'https://api.nike.com/cic/browse/v2';

// Collections to scrape on Nike India
const BROWSE_PATHS = [
  '/in/w/new-shoes-3n82yr',
  '/in/w/jordan-shoes-37eefznik1',
  '/in/w/best-shoes-1n3f1',
];

interface NikeBrowseSku {
  nikeSize?: string;
  countInStock?: number;
  available?: boolean;
}

interface NikeBrowseProduct {
  id?: string;
  title?: string;
  subtitle?: string;
  colorDescription?: string;
  price?: {
    currentPrice?: number;
    msrp?: number;
    currency?: string;
    discounted?: boolean;
  };
  productCard?: {
    squarishURL?: string;
    portraitURL?: string;
  };
  url?: string;
  availableSkus?: NikeBrowseSku[];
  skus?: NikeBrowseSku[];
  inStock?: boolean;
}

interface NikeBrowseResponse {
  data?: {
    products?: {
      products?: NikeBrowseProduct[];
      pages?: { totalResources?: number };
    };
  };
}

// ── Thread feed (fallback) — no price/sizes but reliable ────────────────────

const THREAD_URL =
  'https://api.nike.com/product_feed/threads/v2' +
  '?filter=marketplace(IN)' +
  '&filter=language(en-GB)' +
  '&filter=channelId(d9a5bc42-4b9c-4976-858a-f159cf99c647)' +
  '&filter=exclusiveAccess(true,false)' +
  '&sort=effectiveStartSellDateDesc';

interface NikeThread {
  publishedContent?: {
    properties?: {
      title?: string;
      subtitle?: string;
      seo?: { slug?: string };
      productCard?: {
        properties?: { squarishURL?: string; portraitURL?: string };
      };
    };
  };
}

interface NikeThreadResponse {
  objects?: NikeThread[];
}

// ─────────────────────────────────────────────────────────────────────────────

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const SHOE_RE = /shoe|sneaker|trainer|footwear|low|mid|high/i;
const PAGE_SIZE = 48;

function inferGender(subtitle: string): ScrapedItem['gender'] {
  const s = subtitle.toLowerCase();
  if (s.includes('women')) return 'women';
  if (s.includes('kids') || s.includes('child') || s.includes('infant') || s.includes('toddler')) return 'kids';
  if (s.includes('men')) return 'men';
  return 'unisex';
}

function parseSizes(skus?: NikeBrowseSku[]): string[] {
  if (!skus?.length) return [];
  return skus
    .filter((s) => s.nikeSize && (s.countInStock === undefined || s.countInStock > 0) && s.available !== false)
    .map((s) => s.nikeSize as string)
    .filter(Boolean);
}

async function scrapeBrowse(seen: Set<string>): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];

  for (const path of BROWSE_PATHS) {
    try {
      const res = await withRetry(() =>
        axios.get<NikeBrowseResponse>(BROWSE_URL, {
          headers: {
            ...buildHeaders('https://www.nike.com/in'),
            'Accept': 'application/json',
            'Origin': 'https://www.nike.com',
            'nike-api-caller-id': 'com.nike.commerce.nikedotcom.web',
            'Referer': `https://www.nike.com${path}`,
          },
          params: {
            queryid: 'products',
            anonymousId: crypto.randomUUID(),
            country: 'IN',
            language: 'en-GB',
            localizedRangeStr: '{priceLow} - {priceHigh}',
            count: PAGE_SIZE,
            offset: 0,
            pageType: '',
            path,
          },
          timeout: 25000,
        })
      );

      const products = res.data?.data?.products?.products ?? [];
      console.log(`[nike] browse ${path}: ${products.length} products`);

      for (const p of products) {
        const title = p.title ?? '';
        const subtitle = p.subtitle ?? '';
        if (!title) continue;
        if (subtitle && !SHOE_RE.test(subtitle)) continue;

        const brand: 'Nike' | 'Jordan' = JORDAN_RE.test(title) ? 'Jordan' : 'Nike';

        // url can be "/in/t/slug" or full URL
        const rawUrl = p.url ?? '';
        const productUrl = rawUrl.startsWith('http')
          ? rawUrl
          : rawUrl
          ? `https://www.nike.com${rawUrl}`
          : '';
        if (!productUrl || seen.has(productUrl)) continue;
        seen.add(productUrl);

        const imgPortrait = p.productCard?.portraitURL ?? '';
        const imgSquare = p.productCard?.squarishURL ?? '';
        const images = [imgPortrait, imgSquare].filter(Boolean);
        if (images.length === 0) continue;

        const price = p.price?.currentPrice;
        const msrp = p.price?.msrp;
        // Try availableSkus first, then all skus
        const sizes = parseSizes(p.availableSkus?.length ? p.availableSkus : p.skus);

        results.push({
          sourceUrl: productUrl,
          sourceSite: 'nike',
          name: title,
          brand,
          price: price && price > 0 ? price : undefined,
          originalPrice: msrp && price && msrp > price ? msrp : undefined,
          images,
          sizes,
          colorway: p.colorDescription,
          tags: ['nike', brand.toLowerCase(), 'new-arrival'],
          gender: inferGender(subtitle),
        });
      }
    } catch (err) {
      console.error(`[nike] browse ${path} failed:`, (err as Error).message);
    }

    await jitter(3000, 6000);
  }

  return results;
}

async function scrapeThreadFeed(seen: Set<string>): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];

  for (let page = 0; page < 3; page++) {
    const anchor = page * PAGE_SIZE;
    try {
      const res = await withRetry(() =>
        axios.get<NikeThreadResponse>(`${THREAD_URL}&count=${PAGE_SIZE}&anchor=${anchor}`, {
          headers: {
            ...buildHeaders('https://www.nike.com/in'),
            'Accept': 'application/json',
            'Origin': 'https://www.nike.com',
          },
          timeout: 20000,
        })
      );

      const threads = res.data?.objects ?? [];
      console.log(`[nike] thread feed page ${page + 1}: ${threads.length} threads`);
      if (threads.length === 0) break;

      for (const thread of threads) {
        const props = thread.publishedContent?.properties;
        if (!props?.title) continue;

        const subtitle = props.subtitle ?? '';
        if (subtitle && !SHOE_RE.test(subtitle)) continue;

        const brand: 'Nike' | 'Jordan' = JORDAN_RE.test(props.title) ? 'Jordan' : 'Nike';
        const slug = props.seo?.slug ?? '';
        if (!slug) continue;

        const productUrl = `https://www.nike.com/in/t/${slug}`;
        if (seen.has(productUrl)) continue;
        seen.add(productUrl);

        const imgSquare = props.productCard?.properties?.squarishURL ?? '';
        const imgPortrait = props.productCard?.properties?.portraitURL ?? '';
        const images = [imgPortrait, imgSquare].filter(Boolean);
        if (images.length === 0) continue;

        results.push({
          sourceUrl: productUrl,
          sourceSite: 'nike',
          name: props.title,
          brand,
          images,
          sizes: [],
          tags: ['nike', brand.toLowerCase(), 'new-arrival'],
          gender: inferGender(subtitle),
        });
      }
    } catch (err) {
      console.error(`[nike] thread feed page ${page + 1} failed:`, (err as Error).message);
    }

    await jitter(3000, 7000);
  }

  return results;
}

export async function scrapeNikeIndia(): Promise<ScrapedItem[]> {
  const seen = new Set<string>();

  // Primary: browse API (has price + sizes)
  const browseResults = await scrapeBrowse(seen);
  console.log(`[nike] browse total: ${browseResults.length}`);

  // Fallback: thread feed if browse got nothing
  if (browseResults.length === 0) {
    console.log('[nike] browse returned 0, falling back to thread feed');
    const threadResults = await scrapeThreadFeed(seen);
    console.log(`[nike] thread feed total: ${threadResults.length}`);
    return threadResults;
  }

  return browseResults;
}
