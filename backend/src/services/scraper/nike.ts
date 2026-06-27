import axios from 'axios';
import { buildHeaders, jitter, ScrapedItem } from './utils';

interface NikeProduct {
  id: string;
  title: string;
  subtitle: string;
  colorDescription?: string;
  price?: { currentPrice: number; fullPrice: number };
  images?: { portraitURL?: string; squarishURL?: string }[];
  url?: string;
  genders?: string[];
}

interface NikeWallProduct {
  productCard?: NikeProduct;
}

const JORDAN_RE = /\bjordan\b|\bair jordan\b/i;

function inferGender(genders?: string[]): ScrapedItem['gender'] {
  if (!genders?.length) return 'unisex';
  const s = genders.join(' ').toLowerCase();
  if (s.includes('women')) return 'women';
  if (s.includes('kids') || s.includes('child') || s.includes('infant')) return 'kids';
  if (s.includes('men')) return 'men';
  return 'unisex';
}

export async function scrapeNikeIndia(): Promise<ScrapedItem[]> {
  const results: ScrapedItem[] = [];
  const seen = new Set<string>();

  // Nike India API — browse limited edition + Jordan sneakers
  const endpoints = [
    // Limited edition + special releases
    'https://api.nike.com/cic/browse/v2?queryid=products&anonymousId=SNKRSCART&country=IN&endpoint=%2Fproduct_feed%2Frollup_threads%2Fv2%3Ffilter%3Dmarketplace(IN)%26filter%3Dlanguage(en-GB)%26filter%3DemployeePrice(true)%26filter%3DattributeIds(0f64ecc7-d624-4e91-b171-b83a03dd8550)%26anchor%3D0%26count%3D24&language=en-GB',
    // Jordan brand
    'https://api.nike.com/cic/browse/v2?queryid=products&anonymousId=SNKRSCART&country=IN&endpoint=%2Fproduct_feed%2Frollup_threads%2Fv2%3Ffilter%3Dmarketplace(IN)%26filter%3Dlanguage(en-GB)%26filter%3DemployeePrice(true)%26filter%3Dbrand(Jordan)%26anchor%3D0%26count%3D24&language=en-GB',
  ];

  for (const url of endpoints) {
    try {
      const res = await axios.get(url, {
        headers: {
          ...buildHeaders('https://www.nike.com/in'),
          'Accept': 'application/json',
          'Origin': 'https://www.nike.com',
        },
        timeout: 20000,
      });

      const walls: NikeWallProduct[] =
        res.data?.data?.productWall?.products ??
        res.data?.productWall?.products ??
        [];

      for (const w of walls) {
        const card = w.productCard;
        if (!card) continue;

        const title = `${card.title ?? ''} ${card.subtitle ?? ''}`.trim();
        if (!title) continue;

        const brand: 'Nike' | 'Jordan' = JORDAN_RE.test(title) ? 'Jordan' : 'Nike';
        const productUrl = card.url
          ? `https://www.nike.com${card.url}`
          : `https://www.nike.com/in/t/${card.id}`;

        if (seen.has(productUrl)) continue;
        seen.add(productUrl);

        const img =
          card.images?.[0]?.portraitURL ?? card.images?.[0]?.squarishURL ?? '';

        results.push({
          sourceUrl: productUrl,
          sourceSite: 'nike',
          name: title,
          brand,
          price: card.price?.currentPrice,
          originalPrice:
            card.price && card.price.fullPrice > card.price.currentPrice
              ? card.price.fullPrice
              : undefined,
          colorway: card.colorDescription,
          images: img ? [img] : [],
          sizes: [],
          tags: ['nike', brand.toLowerCase(), 'new-arrival'],
          gender: inferGender(card.genders),
        });
      }

      console.log(`[nike] endpoint fetched: ${results.length} items so far`);
      await jitter(4000, 9000);
    } catch (err) {
      console.error(`[nike] API failed:`, (err as Error).message);
    }
  }

  return results;
}
