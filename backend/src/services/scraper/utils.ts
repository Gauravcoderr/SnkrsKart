import crypto from 'crypto';
import axios from 'axios';

// Larger UA pool: Chrome (Win/Mac/Linux), Edge, Firefox, Chrome Mobile
export const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.70 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  // Edge
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  // Firefox
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:133.0) Gecko/20100101 Firefox/133.0',
  // Chrome Mobile (Android)
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.105 Mobile Safari/537.36',
];

// Rotate Accept-Language to look like different users
const ACCEPT_LANGUAGE_POOL = [
  'en-IN,en;q=0.9,hi;q=0.8',
  'en-GB,en;q=0.9,en-IN;q=0.8',
  'en-US,en;q=0.9,en-IN;q=0.7,hi;q=0.5',
];

export function jitter(min = 3000, max = 8000): Promise<void> {
  return new Promise((r) => setTimeout(r, crypto.randomInt(min, max)));
}

export function buildHeaders(referer: string): Record<string, string> {
  const ua = UA_POOL[crypto.randomInt(0, UA_POOL.length)];
  const lang = ACCEPT_LANGUAGE_POOL[crypto.randomInt(0, ACCEPT_LANGUAGE_POOL.length)];
  const isFirefox = ua.includes('Firefox');

  return {
    'User-Agent': ua,
    'Accept': isFirefox
      ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': lang,
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': referer,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };
}

// Exponential backoff retry for HTTP requests — retries on 429/503/network errors
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 5000
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isLast = attempt === retries - 1;
      if (isLast) throw err;

      // Check for rate-limit / server error status
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status && ![429, 503, 502, 504].includes(status)) throw err; // non-retriable

      const delay = baseDelayMs * Math.pow(2, attempt) + crypto.randomInt(0, 2000);
      console.warn(`[retry] Attempt ${attempt + 1} failed (status=${status ?? 'network'}), waiting ${Math.round(delay / 1000)}s`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('withRetry: unreachable');
}

export interface ScrapedItem {
  sourceUrl: string;
  sourceSite: 'myntra' | 'footlocker' | 'vegnonveg' | 'limitededt' | 'superkicks' | 'nike' | 'crepdogcrew';
  name: string;
  brand: 'Nike' | 'Jordan';
  price?: number;
  originalPrice?: number;
  images: string[];
  sizes: string[];
  colorway?: string;
  sku?: string;
  description?: string;
  gender?: 'men' | 'women' | 'unisex' | 'kids';
  tags?: string[];
  flags?: string[];
  sourceListedAt?: Date;
  sourceUpdatedAt?: Date;
}

// Validates a batch of scraped items by checking their URLs concurrently.
// Drops only hard 404s — 403/429/timeouts are treated as live (bot-blocked, not dead).
export async function filterDeadUrls<T extends { sourceUrl: string }>(
  items: T[],
  referer: string,
  concurrency = 8
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const checks = await Promise.allSettled(
      batch.map(async (item) => {
        try {
          const res = await fetch(item.sourceUrl, {
            method: 'HEAD',
            headers: buildHeaders(referer),
            signal: AbortSignal.timeout(6000),
            redirect: 'follow',
          });
          if (res.status === 404) {
            console.log(`[url-check] dead (404): ${item.sourceUrl}`);
            return null;
          }
          return item;
        } catch {
          // timeout / network error — assume live
          return item;
        }
      })
    );
    for (const r of checks) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
    if (i + concurrency < items.length) await jitter(500, 1500);
  }

  return results;
}

// Fetch a URL through ScrapingAnt's residential proxy — needed for sites that
// block datacenter IPs outright (Akamai etc). js=true renders JS before returning HTML.
// Requires SCRAPINGANT_API_KEY in the Render env (same key used by the GitHub Actions scraper).
export async function scrapingAntFetch(url: string, js = true): Promise<string> {
  const apiKey = process.env.SCRAPINGANT_API_KEY;
  if (!apiKey) throw new Error('SCRAPINGANT_API_KEY not set');
  const res = await axios.post(
    'https://api.scrapingant.com/v1/general',
    { url, browser: js },
    { headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }, timeout: 120000 }
  );
  const data = res.data as string | { content?: string };
  if (typeof data === 'string') return data;
  if (typeof data?.content === 'string') return data.content;
  throw new Error('Unexpected ScrapingAnt response shape');
}

export async function uploadToCloudinary(sourceImageUrl: string): Promise<string> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? 'dadulg5bs';
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET ?? 'Snkrs cart';

  const form = new FormData();
  form.append('file', sourceImageUrl);
  form.append('upload_preset', preset);
  form.append('folder', 'scraped-products');

  const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = (await r.json()) as { secure_url?: string; error?: { message: string } };
  if (!data.secure_url) throw new Error(`Cloudinary: ${data.error?.message ?? 'upload failed'}`);
  return data.secure_url;
}
