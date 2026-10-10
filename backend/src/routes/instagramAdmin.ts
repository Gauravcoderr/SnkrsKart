import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { adminAuth, AdminRequest } from '../middleware/adminAuth';
import { InstagramPost } from '../models/InstagramPost';
import { IG_KINDS, IG_SOURCE_KINDS, IgKind, IgMediaItem, IgSourceKind } from '../lib/instagramRules';
import { IG_STATUSES, IgAction, IgStatus, isEditable, nextStatus } from '../lib/instagramState';
import { getInstagramConfig, getPublishingQuota, isInstagramEnabled } from '../services/instagram';
import { claim, getClient, precheck, publishClaimed, runDueInstagramPosts } from '../services/instagramPublisher';
import { getTokenStatus } from '../services/instagramToken';

// Mounted at /api/v1/admin/instagram. Every route is admin only.
const router = Router();
router.use(adminAuth);

function isId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === '') return null;
  if (value === undefined) return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function cleanMedia(value: unknown): IgMediaItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((m) => m && typeof m.url === 'string' && m.url.trim())
    .map((m) => ({
      url: String(m.url).trim(),
      type: m.type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      altText: typeof m.altText === 'string' ? m.altText.trim() : '',
    }));
}

// Only these fields can be written from the admin panel.
function pickEditable(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof body.kind === 'string' && IG_KINDS.includes(body.kind as IgKind)) out.kind = body.kind;
  if (typeof body.caption === 'string') out.caption = body.caption;
  const media = cleanMedia(body.media);
  if (media) out.media = media;
  if (typeof body.coverUrl === 'string') out.coverUrl = body.coverUrl.trim();
  if (typeof body.notes === 'string') out.notes = body.notes;
  const scheduledAt = parseDate(body.scheduledAt);
  if (scheduledAt !== undefined) out.scheduledAt = scheduledAt;
  const src = body.source as { kind?: string; slug?: string } | undefined;
  if (src && typeof src === 'object') {
    out.source = {
      kind: IG_SOURCE_KINDS.includes(src.kind as IgSourceKind) ? src.kind : 'manual',
      slug: typeof src.slug === 'string' ? src.slug.trim() : '',
    };
  }
  return out;
}

const hasVideo = (media: IgMediaItem[]) => media.some((m) => m.type === 'VIDEO');

// ─── Status ────────────────────────────────────────────────────────────────

router.get('/status', async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    const cfg = getInstagramConfig();
    const enabled = isInstagramEnabled(cfg);
    const [counts, token] = await Promise.all([
      InstagramPost.aggregate<{ _id: IgStatus; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      getTokenStatus(cfg),
    ]);
    let quota: { used: number; total: number } | null = null;
    let quotaError = '';
    if (enabled && !cfg.dryRun) {
      try {
        const { client, userId } = await getClient(cfg);
        quota = await getPublishingQuota(client, userId);
      } catch (e) {
        quotaError = (e as Error).message;
      }
    }
    res.json({
      enabled,
      dryRun: cfg.dryRun,
      login: cfg.login,
      apiVersion: cfg.version,
      igUserId: cfg.userId,
      token,
      quota,
      quotaError,
      counts: Object.fromEntries(IG_STATUSES.map((s) => [s, counts.find((c) => c._id === s)?.n ?? 0])),
    });
  } catch {
    res.status(500).json({ error: 'Failed to read Instagram status' });
  }
});

router.post('/run-due', async (_req: AdminRequest, res: Response): Promise<void> => {
  if (!isInstagramEnabled(getInstagramConfig())) { res.status(400).json({ error: 'Instagram is not configured on the server' }); return; }
  try {
    res.json(await runDueInstagramPosts());
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── CRUD ──────────────────────────────────────────────────────────────────

router.get('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string | undefined;
    const filter = status && IG_STATUSES.includes(status as IgStatus) ? { status } : {};
    const sort: Record<string, 1 | -1> = status === 'published' ? { publishedAt: -1 } : status === 'approved' ? { scheduledAt: 1 } : { createdAt: -1 };
    const [posts, total] = await Promise.all([
      InstagramPost.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      InstagramPost.countDocuments(filter),
    ]);
    res.json({ posts, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch Instagram posts' });
  }
});

router.get('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  const post = await InstagramPost.findById(req.params.id).lean();
  if (!post) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(post);
});

router.post('/', async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const fields = pickEditable(req.body ?? {});
    if (!fields.kind) { res.status(400).json({ error: 'kind is required' }); return; }
    const post = await InstagramPost.create({ ...fields, status: 'draft', createdBy: req.admin?.username || 'admin' });
    res.status(201).json(post);
  } catch {
    res.status(500).json({ error: 'Failed to create Instagram post' });
  }
});

// Editing an approved post sends it back to draft, so what gets approved is
// exactly what gets posted.
router.put('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  try {
    const post = await InstagramPost.findById(req.params.id);
    if (!post) { res.status(404).json({ error: 'Not found' }); return; }
    if (!isEditable(post.status)) { res.status(409).json({ error: `A ${post.status} post cannot be edited` }); return; }
    const fields = pickEditable(req.body ?? {});
    const contentChanged = ['kind', 'caption', 'media', 'coverUrl', 'source'].some((k) => k in fields);
    const status = contentChanged ? nextStatus(post.status, 'edit') : post.status;
    const updated = await InstagramPost.findOneAndUpdate(
      { _id: post._id, status: post.status },
      { $set: { ...fields, status, ...(contentChanged ? { approvedAt: null, approvedBy: '' } : {}) } },
      { returnDocument: 'after' },
    );
    if (!updated) { res.status(409).json({ error: 'The post changed while you were editing, reload it' }); return; }
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update Instagram post' });
  }
});

router.delete('/:id', async (req: AdminRequest, res: Response): Promise<void> => {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  const r = await InstagramPost.deleteOne({ _id: req.params.id, status: { $ne: 'publishing' } });
  if (!r.deletedCount) { res.status(409).json({ error: 'Not found or currently publishing' }); return; }
  res.json({ message: 'Deleted. This removes the record only, never the Instagram post.' });
});

// ─── Transitions ───────────────────────────────────────────────────────────

async function transition(req: AdminRequest, res: Response, action: IgAction, extra: Record<string, unknown> = {}): Promise<void> {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  const post = await InstagramPost.findById(req.params.id);
  if (!post) { res.status(404).json({ error: 'Not found' }); return; }
  const to = nextStatus(post.status, action);
  if (!to) { res.status(409).json({ error: `Cannot ${action} a ${post.status} post` }); return; }
  const updated = await InstagramPost.findOneAndUpdate(
    { _id: post._id, status: post.status },
    { $set: { status: to, ...extra } },
    { returnDocument: 'after' },
  );
  if (!updated) { res.status(409).json({ error: 'The post changed meanwhile, reload it' }); return; }
  res.json(updated);
}

router.post('/:id/approve', async (req: AdminRequest, res: Response): Promise<void> => {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  const post = await InstagramPost.findById(req.params.id);
  if (!post) { res.status(404).json({ error: 'Not found' }); return; }
  const problems = await precheck(post);
  if (problems.length) { res.status(400).json({ error: problems.join('; '), problems }); return; }
  const scheduledAt = parseDate(req.body?.scheduledAt);
  await transition(req, res, 'approve', {
    approvedAt: new Date(),
    approvedBy: req.admin?.username || 'admin',
    error: '',
    ...(scheduledAt !== undefined ? { scheduledAt } : {}),
  });
});

router.post('/:id/unapprove', (req: AdminRequest, res: Response) => transition(req, res, 'unapprove', { approvedAt: null, approvedBy: '' }));
router.post('/:id/reject', (req: AdminRequest, res: Response) => transition(req, res, 'reject'));
router.post('/:id/reopen', (req: AdminRequest, res: Response) => transition(req, res, 'reopen'));
router.post('/:id/retry', (req: AdminRequest, res: Response) => transition(req, res, 'retry', { attempts: 0, error: '', scheduledAt: null }));

// Images publish inside the request (a few seconds). Anything with video is
// queued for the next 5-minute tick instead, because Instagram can take
// minutes to process video and the request would time out.
router.post('/:id/publish-now', async (req: AdminRequest, res: Response): Promise<void> => {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  if (!isInstagramEnabled(getInstagramConfig())) { res.status(400).json({ error: 'Instagram is not configured on the server' }); return; }
  try {
    const post = await InstagramPost.findById(req.params.id);
    if (!post) { res.status(404).json({ error: 'Not found' }); return; }
    if (post.status !== 'draft' && post.status !== 'approved') { res.status(409).json({ error: `Cannot publish a ${post.status} post` }); return; }
    const problems = await precheck(post);
    if (problems.length) { res.status(400).json({ error: problems.join('; '), problems }); return; }

    const now = new Date();
    const approved = await InstagramPost.findOneAndUpdate(
      { _id: post._id, status: post.status },
      { $set: { status: 'approved', scheduledAt: now, approvedAt: post.approvedAt ?? now, approvedBy: post.approvedBy || req.admin?.username || 'admin', error: '' } },
      { returnDocument: 'after' },
    );
    if (!approved) { res.status(409).json({ error: 'The post changed meanwhile, reload it' }); return; }

    if (approved.kind === 'REELS' || hasVideo(approved.media)) {
      res.status(202).json({ queued: true, post: approved });
      return;
    }
    const claimed = await claim({ _id: approved._id }, now);
    if (!claimed) { res.status(409).json({ error: 'Already being published' }); return; }
    const after = await publishClaimed(claimed, now);
    res.json({ queued: false, post: after });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
