import crypto from 'crypto';
import { InstagramAuth } from '../models/InstagramAuth';
import { InstagramConfig, refreshInstagramLoginToken } from './instagram';

const REFRESH_WHEN_DAYS_LEFT = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

function keyBytes(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function encryptToken(token: string, secret: string): { cipher: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', keyBytes(secret), iv);
  const cipher = Buffer.concat([c.update(token, 'utf8'), c.final()]);
  return { cipher: cipher.toString('base64'), iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64') };
}

export function decryptToken(enc: { cipher: string; iv: string; tag: string }, secret: string): string {
  const d = crypto.createDecipheriv('aes-256-gcm', keyBytes(secret), Buffer.from(enc.iv, 'base64'));
  d.setAuthTag(Buffer.from(enc.tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(enc.cipher, 'base64')), d.final()]).toString('utf8');
}

// The token to call the API with: the refreshed one from Mongo when it was
// derived from the current IG_ACCESS_TOKEN, else the env token itself.
export async function getAccessToken(cfg: InstagramConfig): Promise<string> {
  if (!cfg.tokenKey || !cfg.envToken) return cfg.envToken;
  const doc = await InstagramAuth.findOne({ key: 'default' }).lean();
  if (!doc || doc.envTokenHash !== sha256(cfg.envToken) || !doc.tokenCipher) return cfg.envToken;
  try {
    return decryptToken({ cipher: doc.tokenCipher, iv: doc.tokenIv, tag: doc.tokenTag }, cfg.tokenKey);
  } catch {
    return cfg.envToken;
  }
}

export interface TokenStatus {
  login: InstagramConfig['login'];
  refreshable: boolean;
  expiresAt: Date | null;
  refreshedAt: Date | null;
  lastError: string;
}

export async function getTokenStatus(cfg: InstagramConfig): Promise<TokenStatus> {
  const refreshable = cfg.login === 'instagram' && Boolean(cfg.tokenKey) && Boolean(cfg.envToken) && !cfg.dryRun;
  const doc = cfg.envToken ? await InstagramAuth.findOne({ key: 'default' }).lean() : null;
  const current = doc && doc.envTokenHash === sha256(cfg.envToken);
  return {
    login: cfg.login,
    refreshable,
    expiresAt: current ? doc.expiresAt : null,
    refreshedAt: current ? doc.refreshedAt : null,
    lastError: current ? doc.lastError : '',
  };
}

export type RefreshOutcome = 'refreshed' | 'not-due' | 'not-refreshable' | 'failed';

// Runs daily. Refreshes when the expiry is unknown (first run after a new
// token) or under 15 days away. A refresh of a token younger than 24 hours
// fails harmlessly and is retried the next day.
export async function refreshTokenIfDue(cfg: InstagramConfig, now = new Date()): Promise<RefreshOutcome> {
  if (cfg.login !== 'instagram' || !cfg.tokenKey || !cfg.envToken || cfg.dryRun) return 'not-refreshable';
  const envHash = sha256(cfg.envToken);
  const doc = await InstagramAuth.findOne({ key: 'default' });
  const current = doc && doc.envTokenHash === envHash;
  if (current && doc.expiresAt && doc.expiresAt.getTime() - now.getTime() > REFRESH_WHEN_DAYS_LEFT * DAY_MS) return 'not-due';

  const token = await getAccessToken(cfg);
  try {
    const r = await refreshInstagramLoginToken(token);
    const enc = encryptToken(r.token, cfg.tokenKey);
    await InstagramAuth.findOneAndUpdate(
      { key: 'default' },
      {
        $set: {
          envTokenHash: envHash,
          tokenCipher: enc.cipher,
          tokenIv: enc.iv,
          tokenTag: enc.tag,
          expiresAt: r.expiresInSeconds ? new Date(now.getTime() + r.expiresInSeconds * 1000) : null,
          refreshedAt: now,
          lastError: '',
        },
      },
      { upsert: true },
    );
    return 'refreshed';
  } catch (err) {
    await InstagramAuth.findOneAndUpdate(
      { key: 'default' },
      current ? { $set: { lastError: (err as Error).message } } : { $set: { envTokenHash: envHash, tokenCipher: '', tokenIv: '', tokenTag: '', expiresAt: null, lastError: (err as Error).message } },
      { upsert: true },
    );
    return 'failed';
  }
}
