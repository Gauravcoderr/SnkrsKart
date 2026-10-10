import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getInstagramConfig, isInstagramEnabled } from '../services/instagram';
import { runDueInstagramPosts } from '../services/instagramPublisher';

// POST /api/v1/instagram/run-due with "Authorization: Bearer <IG_CRON_SECRET>".
// A backup trigger for the in-process cron (GitHub Actions calls it hourly).
// Safe to call any number of times: posts are claimed atomically.
const router = Router();

function authorized(req: Request): boolean {
  const secret = process.env.IG_CRON_SECRET || '';
  const provided = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return secret.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

router.post('/run-due', async (req: Request, res: Response): Promise<void> => {
  if (!authorized(req)) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (!isInstagramEnabled(getInstagramConfig())) { res.json({ published: 0, notPublished: 0, skipped: 'not configured' }); return; }
  try {
    res.json(await runDueInstagramPosts());
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
