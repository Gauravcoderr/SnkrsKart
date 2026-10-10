import { Blog } from '../models/Blog';
import { Drop } from '../models/Drop';
import { SneakerProfile } from '../models/SneakerProfile';
import { Product } from '../models/Product';
import { attachSellerOffers } from '../lib/sellerOffers';
import { IInstagramPost, InstagramPost } from '../models/InstagramPost';
import { IgSourceKind, validatePost } from '../lib/instagramRules';
import { decideAfterFailure, nextStatus, PublishFailure } from '../lib/instagramState';
import {
  createDryRunClient,
  createGraphClient,
  getInstagramConfig,
  getPublishingQuota,
  GraphClient,
  InstagramConfig,
  isInstagramEnabled,
  PublishError,
  publishToInstagram,
} from './instagram';
import { getAccessToken } from './instagramToken';

const STALE_PUBLISHING_MINUTES = 15;

export async function getClient(cfg: InstagramConfig = getInstagramConfig()): Promise<{ client: GraphClient; userId: string }> {
  if (cfg.dryRun) return { client: createDryRunClient(), userId: cfg.userId || 'dry-run-user' };
  const token = await getAccessToken(cfg);
  return { client: createGraphClient(cfg, token), userId: cfg.userId };
}

// A post that links to a blog, drop or sneaker page must not go out while
// that page is unpublished (unattended content runs seed blogs as drafts).
export async function checkSourceLive(source: { kind: IgSourceKind; slug: string }): Promise<string | null> {
  if (source.kind === 'manual' || !source.slug) return null;
  if (source.kind === 'product') return checkProductsInStock(source.slug.split(',').map((s) => s.trim()).filter(Boolean));
  const model = source.kind === 'blog' ? Blog : source.kind === 'drop' ? Drop : SneakerProfile;
  const doc = await (model as typeof Blog).findOne({ slug: source.slug }).select('published').lean();
  if (!doc) return `The ${source.kind} "${source.slug}" does not exist`;
  if (!doc.published) return `The ${source.kind} "${source.slug}" is not published yet`;
  return null;
}

// Product posts (one slug, or a comma list for a roundup) must not go out
// once a pair is sold out or back to "coming soon": the post would sell
// something we cannot ship.
async function checkProductsInStock(slugs: string[]): Promise<string | null> {
  const products = await Product.find({ slug: { $in: slugs } }).lean();
  const missing = slugs.filter((s) => !products.some((p) => p.slug === s));
  if (missing.length) return `Product not found: ${missing.join(', ')}`;
  const withOffers = await attachSellerOffers(products);
  const gone = withOffers.filter((p) => p.comingSoon || p.offers.length === 0).map((p) => p.slug);
  return gone.length ? `Sold out or coming soon now: ${gone.join(', ')}` : null;
}

export async function precheck(post: Pick<IInstagramPost, 'kind' | 'caption' | 'media' | 'coverUrl' | 'source'>): Promise<string[]> {
  const errors = validatePost({ kind: post.kind, caption: post.caption, media: post.media, coverUrl: post.coverUrl || undefined });
  const sourceProblem = await checkSourceLive(post.source);
  if (sourceProblem) errors.push(sourceProblem);
  return errors;
}

async function applyFailure(post: IInstagramPost, failure: PublishFailure, now: Date): Promise<void> {
  const decision = decideAfterFailure(failure, post.attempts, now);
  const status = nextStatus('publishing', decision.action);
  await InstagramPost.updateOne(
    { _id: post._id, status: 'publishing' },
    {
      $set: {
        status,
        error: failure.message,
        ...(decision.scheduledAt ? { scheduledAt: decision.scheduledAt } : {}),
      },
    },
  );
}

// Publishes a post that is already claimed (status "publishing").
export async function publishClaimed(post: IInstagramPost, now = new Date()): Promise<IInstagramPost | null> {
  const cfg = getInstagramConfig();
  if (!isInstagramEnabled(cfg)) {
    await applyFailure(post, { message: 'Instagram is not configured on the server', transient: false, stage: 'precheck' }, now);
    return InstagramPost.findById(post._id);
  }

  const problems = await precheck(post);
  if (problems.length) {
    await applyFailure(post, { message: problems.join('; '), transient: false, stage: 'precheck' }, now);
    return InstagramPost.findById(post._id);
  }

  try {
    const { client, userId } = await getClient(cfg);
    if (!cfg.dryRun) {
      const quota = await getPublishingQuota(client, userId).catch(() => null);
      if (quota && quota.used >= quota.total) {
        await applyFailure(post, { message: `Daily publishing limit reached (${quota.used}/${quota.total})`, transient: true, stage: 'precheck' }, now);
        return InstagramPost.findById(post._id);
      }
    }
    const result = await publishToInstagram(
      { kind: post.kind, caption: post.caption, media: post.media, coverUrl: post.coverUrl || undefined },
      client,
      userId,
    );
    return InstagramPost.findOneAndUpdate(
      { _id: post._id, status: 'publishing' },
      {
        $set: {
          status: nextStatus('publishing', 'succeed'),
          igMediaId: result.mediaId,
          permalink: result.permalink,
          publishedAt: new Date(),
          dryRun: cfg.dryRun,
          error: '',
        },
      },
      { returnDocument: 'after' },
    );
  } catch (err) {
    const failure: PublishFailure =
      err instanceof PublishError ? err : { message: (err as Error).message, transient: false, stage: 'publish' };
    await applyFailure(post, failure, now);
    return InstagramPost.findById(post._id);
  }
}

// Atomically moves one post from approved to publishing. Two ticks (or a tick
// and a "publish now" click) can never claim the same post.
export async function claim(filter: Record<string, unknown>, now = new Date()): Promise<IInstagramPost | null> {
  return InstagramPost.findOneAndUpdate(
    { ...filter, status: 'approved' },
    { $set: { status: 'publishing', lastAttemptAt: now }, $inc: { attempts: 1 } },
    { sort: { scheduledAt: 1, approvedAt: 1 }, returnDocument: 'after' },
  );
}

let running = false;

export async function runDueInstagramPosts(now = new Date(), max = 3): Promise<{ published: number; notPublished: number; skipped?: string }> {
  if (running) return { published: 0, notPublished: 0, skipped: 'previous run still going' };
  running = true;
  try {
    // A post stuck in "publishing" means the process died mid-call. It may
    // already be on Instagram, so a human decides; never auto-retry it.
    await InstagramPost.updateMany(
      { status: 'publishing', lastAttemptAt: { $lt: new Date(now.getTime() - STALE_PUBLISHING_MINUTES * 60_000) } },
      { $set: { status: 'failed', error: 'Publishing was interrupted. Check the Instagram profile before retrying, it may already be live.' } },
    );

    let published = 0;
    let notPublished = 0;
    for (let i = 0; i < max; i++) {
      const post = await claim({ $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }] }, now);
      if (!post) break;
      const after = await publishClaimed(post, now);
      if (after?.status === 'published') published += 1;
      else notPublished += 1;
    }
    return { published, notPublished };
  } finally {
    running = false;
  }
}
