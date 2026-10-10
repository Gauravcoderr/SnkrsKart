import { IgPostShape, toInstagramJpeg } from '../lib/instagramRules';
import { PublishFailure } from '../lib/instagramState';

// Official Instagram Content Publishing API only. Never browser automation:
// that breaks Instagram's terms and gets the account action-blocked.
//
// IG_LOGIN=instagram (default) talks to graph.instagram.com with an
// "Instagram API with Instagram Login" token; IG_LOGIN=facebook talks to
// graph.facebook.com with a Facebook Login (Page or System User) token.

export const DEFAULT_GRAPH_VERSION = 'v25.0';

export interface InstagramConfig {
  login: 'instagram' | 'facebook';
  host: string;
  version: string;
  userId: string;
  envToken: string;
  dryRun: boolean;
  tokenKey: string;
}

export function getInstagramConfig(env: NodeJS.ProcessEnv = process.env): InstagramConfig {
  const login = env.IG_LOGIN === 'facebook' ? 'facebook' : 'instagram';
  return {
    login,
    host: login === 'facebook' ? 'graph.facebook.com' : 'graph.instagram.com',
    version: env.IG_API_VERSION || DEFAULT_GRAPH_VERSION,
    userId: env.IG_USER_ID || '',
    envToken: env.IG_ACCESS_TOKEN || '',
    dryRun: env.IG_DRY_RUN === 'true',
    tokenKey: env.IG_TOKEN_KEY || '',
  };
}

export function isInstagramEnabled(cfg: InstagramConfig): boolean {
  return cfg.dryRun || (Boolean(cfg.userId) && Boolean(cfg.envToken));
}

// ─── Graph client ──────────────────────────────────────────────────────────

export class GraphError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly transient: boolean,
    readonly code?: number,
    readonly subcode?: number,
  ) {
    super(message);
    this.name = 'GraphError';
  }
}

export interface GraphClient {
  get<T = Record<string, unknown>>(path: string, params?: Record<string, string>): Promise<T>;
  post<T = Record<string, unknown>>(path: string, params?: Record<string, string>): Promise<T>;
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

// Codes Meta documents as temporary: unknown/service errors, app and user
// rate limits, and "media not ready yet".
const TRANSIENT_CODES = new Set([1, 2, 4, 17, 32, 341, 613, 9007]);

interface GraphErrorBody {
  error?: { message?: string; code?: number; error_subcode?: number; is_transient?: boolean; error_user_msg?: string };
}

function toGraphError(status: number, body: GraphErrorBody): GraphError {
  const e = body.error ?? {};
  const message = e.error_user_msg || e.message || `Instagram API returned HTTP ${status}`;
  const transient = status >= 500 || Boolean(e.is_transient) || (e.code !== undefined && TRANSIENT_CODES.has(e.code));
  return new GraphError(message, status, transient, e.code, e.error_subcode);
}

export function createGraphClient(
  cfg: Pick<InstagramConfig, 'host' | 'version'>,
  token: string,
  fetchImpl: FetchLike = fetch,
): GraphClient {
  const base = `https://${cfg.host}/${cfg.version}/`;

  async function call<T>(method: 'GET' | 'POST', path: string, params: Record<string, string> = {}): Promise<T> {
    const all = new URLSearchParams({ ...params, access_token: token });
    const url = method === 'GET' ? `${base}${path}?${all}` : `${base}${path}`;
    let res: Response;
    try {
      res = await fetchImpl(url, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
        body: method === 'POST' ? all.toString() : undefined,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      // Never surface the URL: for GET it carries the token.
      throw new GraphError(`Network error calling Instagram (${(err as Error).name})`, 0, true);
    }
    const body = (await res.json().catch(() => ({}))) as T & GraphErrorBody;
    if (!res.ok || body.error) throw toGraphError(res.status, body);
    return body;
  }

  return {
    get: (path, params) => call('GET', path, params),
    post: (path, params) => call('POST', path, params),
  };
}

// A client that never touches the network. IG_DRY_RUN=true uses it so the
// whole approve → schedule → publish loop can be exercised before Meta
// access is set up.
export function createDryRunClient(): GraphClient {
  let n = 0;
  return {
    async get<T>(path: string, params: Record<string, string> = {}) {
      if (path.endsWith('/content_publishing_limit')) return { data: [{ quota_usage: 0, config: { quota_total: 100 } }] } as T;
      if (params.fields?.includes('status_code')) return { status_code: 'FINISHED', status: 'Finished: dry run' } as T;
      if (params.fields?.includes('permalink')) return { permalink: '' } as T;
      return {} as T;
    },
    async post<T>() {
      n += 1;
      return { id: `dry_${Date.now()}_${n}` } as T;
    },
  };
}

// ─── Publishing ────────────────────────────────────────────────────────────

export class PublishError extends Error implements PublishFailure {
  constructor(message: string, readonly stage: PublishFailure['stage'], readonly transient: boolean) {
    super(message);
    this.name = 'PublishError';
  }
}

export interface PublishOptions {
  sleep?: (ms: number) => Promise<void>;
  imagePollMs?: number;
  imageMaxPolls?: number;
  videoPollMs?: number;
  videoMaxPolls?: number;
}

export interface PublishResult {
  mediaId: string;
  permalink: string;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function stage<T>(name: PublishFailure['stage'], fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof PublishError) throw err;
    const transient = err instanceof GraphError ? err.transient : false;
    throw new PublishError((err as Error).message, name, transient);
  }
}

async function waitForContainer(
  client: GraphClient,
  id: string,
  pollMs: number,
  maxPolls: number,
  sleep: (ms: number) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < maxPolls; i++) {
    const s = await stage('status', () => client.get<{ status_code?: string; status?: string }>(id, { fields: 'status_code,status' }));
    if (s.status_code === 'FINISHED' || s.status_code === 'PUBLISHED') return;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') {
      throw new PublishError(`Instagram could not process the media: ${s.status || s.status_code}`, 'status', false);
    }
    await sleep(pollMs);
  }
  throw new PublishError('Instagram is still processing the media, will try again', 'status', true);
}

function captionParams(caption: string): Record<string, string> {
  return caption ? { caption } : {};
}

export async function publishToInstagram(
  post: IgPostShape,
  client: GraphClient,
  userId: string,
  opts: PublishOptions = {},
): Promise<PublishResult> {
  const sleep = opts.sleep ?? defaultSleep;
  const img = { poll: opts.imagePollMs ?? 2_000, max: opts.imageMaxPolls ?? 15 };
  const vid = { poll: opts.videoPollMs ?? 5_000, max: opts.videoMaxPolls ?? 60 };
  const create = (params: Record<string, string>) =>
    stage('container', () => client.post<{ id: string }>(`${userId}/media`, params)).then((r) => r.id);

  const itemParams = (m: IgPostShape['media'][number]): Record<string, string> => {
    const p: Record<string, string> = m.type === 'VIDEO' ? { media_type: 'VIDEO', video_url: m.url } : { image_url: toInstagramJpeg(m.url) };
    if (m.altText && m.type === 'IMAGE') p.alt_text = m.altText;
    return p;
  };

  let containerId: string;
  switch (post.kind) {
    case 'IMAGE': {
      containerId = await create({ ...itemParams(post.media[0]), ...captionParams(post.caption) });
      await waitForContainer(client, containerId, img.poll, img.max, sleep);
      break;
    }
    case 'CAROUSEL': {
      const children: string[] = [];
      for (const m of post.media) {
        const childId = await create({ ...itemParams(m), is_carousel_item: 'true' });
        const t = m.type === 'VIDEO' ? vid : img;
        await waitForContainer(client, childId, t.poll, t.max, sleep);
        children.push(childId);
      }
      containerId = await create({ media_type: 'CAROUSEL', children: children.join(','), ...captionParams(post.caption) });
      await waitForContainer(client, containerId, img.poll, img.max, sleep);
      break;
    }
    case 'REELS': {
      const p: Record<string, string> = { media_type: 'REELS', video_url: post.media[0].url, share_to_feed: 'true', ...captionParams(post.caption) };
      if (post.coverUrl) p.cover_url = toInstagramJpeg(post.coverUrl);
      containerId = await create(p);
      await waitForContainer(client, containerId, vid.poll, vid.max, sleep);
      break;
    }
    case 'STORIES': {
      const m = post.media[0];
      containerId = await create(m.type === 'VIDEO' ? { media_type: 'STORIES', video_url: m.url } : { media_type: 'STORIES', image_url: toInstagramJpeg(m.url) });
      await waitForContainer(client, containerId, m.type === 'VIDEO' ? vid.poll : img.poll, m.type === 'VIDEO' ? vid.max : img.max, sleep);
      break;
    }
    default:
      throw new PublishError(`Unknown post kind ${(post as IgPostShape).kind}`, 'precheck', false);
  }

  const published = await stage('publish', () => client.post<{ id: string }>(`${userId}/media_publish`, { creation_id: containerId }));

  let permalink = '';
  try {
    const p = await client.get<{ permalink?: string }>(published.id, { fields: 'permalink' });
    permalink = p.permalink ?? '';
  } catch {
    // The post is live; a missing permalink is cosmetic.
  }
  return { mediaId: published.id, permalink };
}

export interface PublishingQuota {
  used: number;
  total: number;
}

export async function getPublishingQuota(client: GraphClient, userId: string): Promise<PublishingQuota> {
  const r = await client.get<{ data?: { quota_usage?: number; config?: { quota_total?: number } }[] }>(
    `${userId}/content_publishing_limit`,
    { fields: 'quota_usage,config' },
  );
  const row = r.data?.[0] ?? {};
  return { used: row.quota_usage ?? 0, total: row.config?.quota_total ?? 50 };
}

// Instagram Login long-lived tokens last 60 days and can be refreshed once
// they are at least 24 hours old. Facebook Login Page / System User tokens
// are managed in Meta Business Suite instead.
export async function refreshInstagramLoginToken(
  token: string,
  fetchImpl: FetchLike = fetch,
): Promise<{ token: string; expiresInSeconds: number }> {
  const qs = new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: token });
  let res: Response;
  try {
    res = await fetchImpl(`https://graph.instagram.com/refresh_access_token?${qs}`, { signal: AbortSignal.timeout(30_000) });
  } catch (err) {
    throw new GraphError(`Network error refreshing the Instagram token (${(err as Error).name})`, 0, true);
  }
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number } & GraphErrorBody;
  if (!res.ok || body.error || !body.access_token) throw toGraphError(res.status, body);
  return { token: body.access_token, expiresInSeconds: body.expires_in ?? 0 };
}
