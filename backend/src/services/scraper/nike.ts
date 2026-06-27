import axios from 'axios';
import { buildHeaders, jitter, withRetry, ScrapedItem } from './utils';

interface NikeThread {
  publishedContent?: {
    properties?: {
      title?: string;
      subtitle?: string;
      seo?: { slug?: string };
      productCard?: {
        properties?: {
          squarishURL?: string;
          portraitURL?: string;
        };
      };
    };
  };
}

interface NikeApiResponse {
  objects?: NikeThread[];
}

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;
const SHOE_RE = /shoe|sneaker|trainer|footwear/i;
const PAGE_SIZE = 48;
const TOTAL_PAGES = 3; // fetches 144 threads total

function inferGender(subtitle: string): ScrapedItem['gender'] {
  const s = subtitle.toLowerCase();
  if (s.includes('women')) return 'women';
  if (s.includes('kids') || s.includes('child') || s.includes('infant') || s.includes('toddler')) return 'kids';
  if (s.includes('men')) return 'men';
  return 'unisex';
}

function buildUrl(anchor: number): string {
  return (
    'https://api.nike.com/product_feed/threads/v2' +
    '?filter=marketplace(IN)' +
    '&filter=language(en-GB)' +
    '&filter=channelId(d9a5bc42-4b9c-4976-858a-f159cf99c647)' +
    '&filter=exclusiveAccess(true,false)' +
    `&count=${PAGE_SIZE}` +
    `&anchor=${anchor}` +
    '&sort=effectiveStartSellDateDesc'
  );
}

export async function scrapeNikeIndia(): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  for (let page = 0; page < TOTAL_PAGES; page++) {
    const anchor = page * PAGE_SIZE;
    try {
      const res = await withRetry(() =>
        axios.get<NikeApiResponse>(buildUrl(anchor), {
          headers: {
            ...buildHeaders('https://www.nike.com/in'),
            'Accept': 'application/json',
            'Origin': 'https://www.nike.com',
          },
          timeout: 20000,
        })
      );

      const threads = res.data?.objects ?? [];
      console.log(`[nike] Page ${page + 1} (anchor=${anchor}): ${threads.length} threads`);

      if (threads.length === 0) {
        console.log('[nike] Empty page, stopping pagination');
        break;
      }

      for (const thread of threads) {
        const props = thread.publishedContent?.properties;
        if (!props) continue;

        const title = props.title ?? '';
        const subtitle = props.subtitle ?? '';
        if (!title) continue;

        // Only shoes (skip clothing, accessories)
        if (subtitle && !SHOE_RE.test(subtitle)) continue;

        const brand: 'Nike' | 'Jordan' = JORDAN_RE.test(title) ? 'Jordan' : 'Nike';
        const slug = props.seo?.slug ?? '';
        const productUrl = slug
          ? `https://www.nike.com/in/t/${slug}`
          : '';

        if (!slug || seen.has(productUrl)) continue;
        seen.add(productUrl);

        const imgSquare = props.productCard?.properties?.squarishURL ?? '';
        const imgPortrait = props.productCard?.properties?.portraitURL ?? '';
        const images = [imgPortrait, imgSquare].filter(Boolean);
        if (images.length === 0) continue;

        results.push({
          sourceUrl: productUrl,
          sourceSite: 'nike',
          name: title,
          brand,
          images,
          sizes: [],
          tags: ['nike', brand.toLowerCase(), 'new-arrival'],
          gender: inferGender(subtitle),
        });
      }

      await jitter(3000, 7000);
    } catch (err) {
      console.error(`[nike] Page ${page + 1} failed:`, (err as Error).message);
    }
  }

  console.log(`[nike] Total shoes scraped: ${results.length}`);
  return results;
}
