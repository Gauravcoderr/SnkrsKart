import { jitter, scrapingAntFetch } from './utils';

interface GotResponse {
  statusCode: number;
  body: string;
  headers: Record<string, string | string[] | undefined>;
}

type GotScraping = (options: Record<string, unknown>) => Promise<GotResponse>;

const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<{ gotScraping: GotScraping }>;
let clientPromise: Promise<GotScraping> | undefined;

function client(): Promise<GotScraping> {
  clientPromise ??= dynamicImport('got-scraping').then((m) => m.gotScraping);
  return clientPromise;
}

const sessions = new Map<string, object>();
const cookieJars = new Map<string, Map<string, string>>();

function sessionFor(host: string): object {
  let token = sessions.get(host);
  if (!token) {
    token = {};
    sessions.set(host, token);
  }
  return token;
}

function cookieHeader(host: string): string | undefined {
  const jar = cookieJars.get(host);
  if (!jar || jar.size === 0) return undefined;
  return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
}

function storeCookies(host: string, setCookie: string | string[] | undefined): void {
  if (!setCookie) return;
  const jar = cookieJars.get(host) ?? new Map<string, string>();
  for (const raw of Array.isArray(setCookie) ? setCookie : [setCookie]) {
    const pair = raw.split(';')[0];
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
  cookieJars.set(host, jar);
}

const BLOCK_TITLE = /access denied|attention required|just a moment|request unsuccessful|pardon our interruption|are you a robot|security check/i;
const BLOCK_MARKERS = /errors\.edgesuite\.net|cf-chl-|challenge-platform|px-captcha|_Incapsula_Resource|captcha-delivery/i;

export function looksBlocked(status: number, body: string): boolean {
  if (status === 403 || status === 429) return true;
  const title = body.slice(0, 5000).match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '';
  if (BLOCK_TITLE.test(title)) return true;
  return body.length < 30_000 && BLOCK_MARKERS.test(body.slice(0, 10_000));
}

const BREAKER_THRESHOLD = 3;
const hostBlocks = new Map<string, number>();

function isTripped(host: string): boolean {
  return (hostBlocks.get(host) ?? 0) >= BREAKER_THRESHOLD;
}

function recordOutcome(host: string, blocked: boolean): void {
  if (!blocked) {
    hostBlocks.set(host, 0);
    return;
  }
  const n = (hostBlocks.get(host) ?? 0) + 1;
  hostBlocks.set(host, n);
  if (n === BREAKER_THRESHOLD) console.warn(`[http] ${host}: circuit open after ${n} consecutive blocks — skipping direct requests`);
}

export class HttpError extends Error {
  constructor(public url: string, public status: number, reason: string) {
    super(`${reason} (${status}) ${url}`);
  }
}

export interface StealthGetOptions {
  referer?: string;
  headers?: Record<string, string>;
  accept?: 'html' | 'json';
  retries?: number;
  antFallback?: boolean;
  antJs?: boolean;
  timeoutMs?: number;
}

export async function stealthGet(url: string, opts: StealthGetOptions = {}): Promise<string> {
  const { referer, headers = {}, accept = 'html', retries = 3, antFallback = true, antJs = false, timeoutMs = 30_000 } = opts;
  const host = new URL(url).host;
  const gotScraping = await client();
  let lastStatus = 0;
  const directAttempts = isTripped(host) ? 0 : retries;

  for (let attempt = 0; attempt < directAttempts; attempt++) {
    try {
      const cookie = cookieHeader(host);
      const res = await gotScraping({
        url,
        timeout: { request: timeoutMs },
        followRedirect: true,
        throwHttpErrors: false,
        sessionToken: sessionFor(host),
        proxyUrl: process.env.SCRAPER_PROXY_URL || undefined,
        headerGeneratorOptions: {
          browsers: [{ name: 'chrome', minVersion: 140 }],
          devices: ['desktop'],
          locales: ['en-IN', 'en-US'],
          operatingSystems: ['windows', 'macos'],
        },
        headers: {
          ...(accept === 'json' ? { accept: 'application/json, text/plain, */*' } : {}),
          ...(referer ? { referer } : {}),
          ...(cookie ? { cookie } : {}),
          ...headers,
        },
      });
      storeCookies(host, res.headers['set-cookie']);
      lastStatus = res.statusCode;

      if (res.statusCode === 404) throw new HttpError(url, 404, 'Not found');
      const blocked = looksBlocked(res.statusCode, res.body);
      if (res.statusCode < 400 && !blocked) {
        recordOutcome(host, false);
        return res.body;
      }

      if (blocked) recordOutcome(host, true);
      console.warn(`[http] ${host} attempt ${attempt + 1}: status=${res.statusCode}${blocked ? ' (blocked)' : ''}`);
      if (isTripped(host)) break;
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) throw err;
      console.warn(`[http] ${host} attempt ${attempt + 1}: ${(err as Error).message}`);
    }
    if (attempt < directAttempts - 1) await jitter(2000 * 2 ** attempt, 4000 * 2 ** attempt);
  }

  if (antFallback && process.env.SCRAPINGANT_API_KEY) {
    console.warn(`[http] ${host}: direct fetch exhausted, falling back to ScrapingAnt (js=${antJs})`);
    const body = await scrapingAntFetch(url, antJs);
    if (!looksBlocked(200, body)) return body;
    throw new HttpError(url, 403, 'Blocked via ScrapingAnt');
  }

  throw new HttpError(url, lastStatus, 'Blocked or failed');
}

export async function stealthGetJson<T>(url: string, opts: StealthGetOptions = {}): Promise<T> {
  const body = await stealthGet(url, { ...opts, accept: 'json' });
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new HttpError(url, 200, `Invalid JSON: ${body.slice(0, 120)}`);
  }
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}
