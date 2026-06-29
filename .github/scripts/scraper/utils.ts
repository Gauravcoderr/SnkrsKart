import crypto from 'crypto';
import https from 'https';

// Only Chrome/Edge UAs -- Firefox UAs cause TLS/JS fingerprint mismatch with Chromium
export const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.70 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
];

export function randomUA(): string {
  return UA_POOL[crypto.randomInt(0, UA_POOL.length)];
}

// One UA per process run -- all pages in a session use same UA so CF/Akamai
// clearance cookies from warmup are accepted on subsequent pages (same fingerprint)
let _sessionUA: string | undefined;
export function sessionUA(): string {
  if (!_sessionUA) _sessionUA = UA_POOL[crypto.randomInt(0, UA_POOL.length)];
  return _sessionUA;
}

/**
 * Fetch a URL through ScrapingAnt's residential proxy network.
 * js=false: raw fetch (1 credit) — use for JSON/API endpoints
 * js=true:  JS-rendered page (10 credits) — use for SPA product listing pages
 * Returns the response body as a string. Throws if SCRAPINGANT_API_KEY is unset.
 */
export function scrapingAntFetch(url: string, js = true): Promise<string> {
  const apiKey = process.env.SCRAPINGANT_API_KEY;
  if (!apiKey) throw new Error('SCRAPINGANT_API_KEY not set');
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ url, browser: js });
    const req = https.request(
      {
        hostname: 'api.scrapingant.com',
        path: '/v1/general',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'identity',
          'x-api-key': apiKey,
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 120_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          if (process.env.ANT_DEBUG) console.log(`[ant] status=${res.statusCode} body[0:200]=${raw.slice(0, 200)}`);
          if (res.statusCode !== 200) {
            reject(new Error(`ScrapingAnt ${res.statusCode}: ${raw.slice(0, 200)}`));
            return;
          }
          // ScrapingAnt wraps the target response in {"content":"..."} — unwrap it
          try {
            const parsed = JSON.parse(raw) as { content?: string };
            if (typeof parsed.content === 'string') {
              resolve(parsed.content);
              return;
            }
          } catch { /* not a wrapper object, return raw */ }
          resolve(raw);
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('ScrapingAnt timeout')); });
    req.write(body);
    req.end();
  });
}

export function jitter(min = 3000, max = 8000): Promise<void> {
  return new Promise((r) => setTimeout(r, crypto.randomInt(min, max)));
}

// Validates a batch of scraped items by checking their URLs concurrently.
// Drops only hard 404s — 403/429/timeouts are treated as live (bot-blocked, not dead).
export async function filterDeadUrls<T extends { sourceUrl: string }>(
  items: T[],
  referer: string,
  concurrency = 8
): Promise<T[]> {
  const ua = sessionUA();
  const results: T[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const checks = await Promise.allSettled(
      batch.map(async (item) => {
        try {
          const res = await fetch(item.sourceUrl, {
            method: 'HEAD',
            headers: {
              'User-Agent': ua,
              'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
              'Accept-Language': 'en-IN,en;q=0.9',
              'Referer': referer,
            },
            signal: AbortSignal.timeout(6000),
            redirect: 'follow',
          });
          if (res.status === 404) {
            console.log(`[url-check] dead (404): ${item.sourceUrl}`);
            return null;
          }
          return item;
        } catch {
          return item; // timeout / network error — assume live
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
  sourceListedAt?: Date;
}
