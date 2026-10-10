import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  countHashtags,
  feedPreview,
  toInstagramJpeg,
  validatePost,
  IgPostShape,
} from '../src/lib/instagramRules';
import { decideAfterFailure, isEditable, nextStatus } from '../src/lib/instagramState';
import {
  createDryRunClient,
  createGraphClient,
  getInstagramConfig,
  GraphClient,
  GraphError,
  PublishError,
  publishToInstagram,
} from '../src/services/instagram';
import { decryptToken, encryptToken } from '../src/services/instagramToken';
import { dateBadge, dropStarter, ghostWord, renderSlideHtml } from '../src/lib/instagramSlides';
import { watermarkLines } from '../src/scripts/igDraft';

const CLD = 'https://res.cloudinary.com/dadulg5bs/image/upload';
const noSleep = async () => {};

// ─── rules ─────────────────────────────────────────────────────────────────

test('toInstagramJpeg forces JPEG on Cloudinary URLs and leaves others alone', () => {
  assert.equal(toInstagramJpeg(`${CLD}/v1/instagram/a.png`), `${CLD}/f_jpg,q_90/v1/instagram/a.jpg`);
  assert.equal(toInstagramJpeg(`${CLD}/c_fill,w_800/drops/b.webp`), `${CLD}/f_jpg,q_90/c_fill,w_800/drops/b.jpg`);
  assert.equal(toInstagramJpeg(`${CLD}/drops/noext`), `${CLD}/f_jpg,q_90/drops/noext.jpg`);
  const once = toInstagramJpeg(`${CLD}/v1/x.jpg`);
  assert.equal(toInstagramJpeg(once), once);
  assert.equal(toInstagramJpeg('https://example.com/a.png'), 'https://example.com/a.png');
});

test('hashtags and feed preview', () => {
  assert.equal(countHashtags('New pair #airjordan1 #sneakersindia and #dunk'), 3);
  assert.equal(countHashtags('price is ₹16,995 # not a tag'), 0);
  assert.equal(feedPreview('x'.repeat(200)).length, 125);
});

const goodCarousel: IgPostShape = {
  kind: 'CAROUSEL',
  caption: 'Three drops this week, all with India retail. #sneakersindia',
  media: [
    { url: `${CLD}/v1/instagram/s1.jpg`, type: 'IMAGE', altText: 'Cover slide' },
    { url: `${CLD}/v1/instagram/s2.jpg`, type: 'IMAGE' },
  ],
};

test('validatePost accepts a clean carousel', () => {
  assert.deepEqual(validatePost(goodCarousel), []);
});

test('validatePost catches the rules Instagram and our voice enforce', () => {
  const errs = validatePost({
    ...goodCarousel,
    caption: 'Too much #a #b #c #d #e #f \u2014 here',
    media: [{ url: 'http://example.com/a.png', type: 'IMAGE' }],
  });
  assert.ok(errs.some((e) => e.includes('6 hashtags')));
  assert.ok(errs.some((e) => e.includes('em dash')));
  assert.ok(errs.some((e) => e.includes('2 to 10 items')));
  assert.ok(errs.some((e) => e.includes('not a public https URL')));
  assert.ok(validatePost({ kind: 'REELS', caption: 'x', media: [{ url: `${CLD}/a.jpg`, type: 'IMAGE' }] }).some((e) => e.includes('one video')));
  assert.ok(validatePost({ kind: 'IMAGE', caption: 'x', media: [{ url: 'https://example.com/a.png', type: 'IMAGE' }] }).some((e) => e.includes('JPEG')));
  assert.deepEqual(validatePost({ kind: 'STORIES', caption: '', media: [{ url: `${CLD}/a.jpg`, type: 'IMAGE' }] }), []);
  assert.ok(validatePost({ ...goodCarousel, caption: 'Shipped {{orders shipped to date}} pairs' }).some((e) => e.includes('placeholder')));
});

// ─── state machine ─────────────────────────────────────────────────────────

test('status transitions only allow the documented lifecycle', () => {
  assert.equal(nextStatus('draft', 'approve'), 'approved');
  assert.equal(nextStatus('approved', 'claim'), 'publishing');
  assert.equal(nextStatus('publishing', 'succeed'), 'published');
  assert.equal(nextStatus('approved', 'edit'), 'draft');
  assert.equal(nextStatus('draft', 'claim'), null);
  assert.equal(nextStatus('published', 'retry'), null);
  assert.equal(nextStatus('published', 'edit'), null);
  assert.equal(isEditable('publishing'), false);
  assert.equal(isEditable('failed'), true);
});

test('failures retry with backoff, but never after media_publish was called', () => {
  const now = new Date('2026-10-10T10:00:00Z');
  const later = decideAfterFailure({ message: 'rate limit', transient: true, stage: 'container' }, 1, now);
  assert.equal(later.action, 'retryLater');
  assert.equal(later.scheduledAt?.toISOString(), '2026-10-10T10:15:00.000Z');
  assert.equal(decideAfterFailure({ message: 'timeout', transient: true, stage: 'publish' }, 1, now).action, 'fail');
  assert.equal(decideAfterFailure({ message: 'rate limit', transient: true, stage: 'container' }, 3, now).action, 'fail');
  assert.equal(decideAfterFailure({ message: 'bad ratio', transient: false, stage: 'status' }, 1, now).action, 'fail');
});

// ─── publish flow against a fake Graph API ─────────────────────────────────

interface Call { method: 'GET' | 'POST'; path: string; params: Record<string, string> }

function fakeGraph(opts: { statuses?: string[]; failPublish?: Error } = {}): { client: GraphClient; calls: Call[] } {
  const calls: Call[] = [];
  const statuses = [...(opts.statuses ?? [])];
  let n = 0;
  const client: GraphClient = {
    async get<T>(path: string, params: Record<string, string> = {}) {
      calls.push({ method: 'GET', path, params });
      if (params.fields === 'status_code,status') return { status_code: statuses.shift() ?? 'FINISHED', status: 'ok' } as T;
      if (params.fields === 'permalink') return { permalink: `https://www.instagram.com/p/${path}/` } as T;
      return {} as T;
    },
    async post<T>(path: string, params: Record<string, string> = {}) {
      calls.push({ method: 'POST', path, params });
      if (path.endsWith('/media_publish')) {
        if (opts.failPublish) throw opts.failPublish;
        return { id: 'MEDIA_1' } as T;
      }
      n += 1;
      return { id: `C${n}` } as T;
    },
  };
  return { client, calls };
}

test('IMAGE: container, status, publish, permalink', async () => {
  const { client, calls } = fakeGraph();
  const r = await publishToInstagram(
    { kind: 'IMAGE', caption: 'Hello', media: [{ url: `${CLD}/v1/a.png`, type: 'IMAGE', altText: 'A pair' }] },
    client,
    'IGU',
    { sleep: noSleep },
  );
  assert.deepEqual(r, { mediaId: 'MEDIA_1', permalink: 'https://www.instagram.com/p/MEDIA_1/' });
  assert.equal(calls[0].path, 'IGU/media');
  assert.equal(calls[0].params.image_url, `${CLD}/f_jpg,q_90/v1/a.jpg`);
  assert.equal(calls[0].params.caption, 'Hello');
  assert.equal(calls[0].params.alt_text, 'A pair');
  assert.deepEqual(calls.map((c) => `${c.method} ${c.path}`), ['POST IGU/media', 'GET C1', 'POST IGU/media_publish', 'GET MEDIA_1']);
  assert.equal(calls[2].params.creation_id, 'C1');
});

test('CAROUSEL: one child container per slide, then the parent with children', async () => {
  const { client, calls } = fakeGraph();
  await publishToInstagram(goodCarousel, client, 'IGU', { sleep: noSleep });
  const posts = calls.filter((c) => c.method === 'POST');
  assert.equal(posts[0].params.is_carousel_item, 'true');
  assert.equal(posts[0].params.caption, undefined);
  assert.equal(posts[1].params.is_carousel_item, 'true');
  assert.equal(posts[2].params.media_type, 'CAROUSEL');
  assert.equal(posts[2].params.children, 'C1,C2');
  assert.equal(posts[2].params.caption, goodCarousel.caption);
  assert.equal(posts[3].path, 'IGU/media_publish');
  assert.equal(posts[3].params.creation_id, 'C3');
});

test('waits while Instagram processes, fails cleanly on ERROR', async () => {
  const slow = fakeGraph({ statuses: ['IN_PROGRESS', 'IN_PROGRESS', 'FINISHED'] });
  await publishToInstagram({ kind: 'REELS', caption: 'r', media: [{ url: 'https://cdn.example.com/r.mp4', type: 'VIDEO' }] }, slow.client, 'IGU', { sleep: noSleep });
  assert.equal(slow.calls.filter((c) => c.method === 'GET' && c.path === 'C1').length, 3);
  assert.equal(slow.calls[0].params.media_type, 'REELS');
  assert.equal(slow.calls[0].params.share_to_feed, 'true');

  const broken = fakeGraph({ statuses: ['ERROR'] });
  await assert.rejects(
    publishToInstagram({ kind: 'IMAGE', caption: 'x', media: [{ url: `${CLD}/a.jpg`, type: 'IMAGE' }] }, broken.client, 'IGU', { sleep: noSleep }),
    (e: unknown) => e instanceof PublishError && e.stage === 'status' && !e.transient,
  );
  assert.ok(!broken.calls.some((c) => c.path.endsWith('/media_publish')));
});

test('a timeout on media_publish is reported as the publish stage, so it is never retried', async () => {
  const { client } = fakeGraph({ failPublish: new GraphError('Network error calling Instagram (TimeoutError)', 0, true) });
  try {
    await publishToInstagram({ kind: 'IMAGE', caption: 'x', media: [{ url: `${CLD}/a.jpg`, type: 'IMAGE' }] }, client, 'IGU', { sleep: noSleep });
    assert.fail('should throw');
  } catch (e) {
    assert.ok(e instanceof PublishError);
    assert.equal(e.stage, 'publish');
    assert.equal(decideAfterFailure(e, 1, new Date()).action, 'fail');
  }
});

test('lifecycle: draft to approved to published with the dry-run client', async () => {
  let status = 'draft' as Parameters<typeof nextStatus>[0];
  assert.deepEqual(validatePost(goodCarousel), []);
  status = nextStatus(status, 'approve')!;
  status = nextStatus(status, 'claim')!;
  assert.equal(status, 'publishing');
  const r = await publishToInstagram(goodCarousel, createDryRunClient(), 'dry-run-user', { sleep: noSleep });
  assert.match(r.mediaId, /^dry_/);
  status = nextStatus(status, 'succeed')!;
  assert.equal(status, 'published');
});

// ─── HTTP client ───────────────────────────────────────────────────────────

test('graph client sends the token in the POST body, maps errors, never leaks the token', async () => {
  const seen: { url: string; init?: RequestInit }[] = [];
  const ok = createGraphClient({ host: 'graph.instagram.com', version: 'v24.0' }, 'SECRET_TOKEN', async (url, init) => {
    seen.push({ url, init });
    return new Response(JSON.stringify({ id: '1' }), { status: 200 });
  });
  await ok.post('IGU/media', { image_url: 'https://x/a.jpg' });
  assert.equal(seen[0].url, 'https://graph.instagram.com/v24.0/IGU/media');
  assert.ok(String(seen[0].init?.body).includes('access_token=SECRET_TOKEN'));

  const limited = createGraphClient({ host: 'graph.instagram.com', version: 'v24.0' }, 'SECRET_TOKEN', async () =>
    new Response(JSON.stringify({ error: { message: 'Application request limit reached', code: 4 } }), { status: 400 }),
  );
  await assert.rejects(limited.get('IGU'), (e: unknown) => e instanceof GraphError && e.transient && e.code === 4);

  const offline = createGraphClient({ host: 'graph.instagram.com', version: 'v24.0' }, 'SECRET_TOKEN', async () => {
    throw new TypeError('fetch failed https://graph.instagram.com/?access_token=SECRET_TOKEN');
  });
  await assert.rejects(offline.get('IGU'), (e: unknown) => e instanceof GraphError && !e.message.includes('SECRET_TOKEN') && e.transient);
});

test('config picks the host from IG_LOGIN', () => {
  assert.equal(getInstagramConfig({}).host, 'graph.instagram.com');
  assert.equal(getInstagramConfig({ IG_LOGIN: 'facebook' }).host, 'graph.facebook.com');
  assert.equal(getInstagramConfig({ IG_DRY_RUN: 'true' }).dryRun, true);
});

test('token encryption round trips and rejects the wrong key', () => {
  const enc = encryptToken('IGAAtoken123', 'key-one');
  assert.notEqual(enc.cipher, 'IGAAtoken123');
  assert.equal(decryptToken(enc, 'key-one'), 'IGAAtoken123');
  assert.throws(() => decryptToken(enc, 'key-two'));
});

// ─── slides ────────────────────────────────────────────────────────────────


test('ghost word is the nickname sneaker people use', () => {
  assert.equal(ghostWord('Air Jordan 12 "Fireside"'), 'FIRESIDE');
  assert.equal(ghostWord('Air Jordan 5 Halloween'), 'HALLOWEEN');
  assert.equal(ghostWord('Nike Dunk Low Retro'), 'DUNK');
});

test('date badge reads the stored UTC date', () => {
  assert.deepEqual(dateBadge(new Date('2026-10-17T00:00:00Z')), { big: '17', small: ['OCT', 'SAT'] });
});

test('watermarks are caught, shoe branding is not', () => {
  assert.deepEqual(watermarkLines(['23', 'JUMPMAN', 'SNEAKERFILES.COM', '@zsneakerheadz', 'AIR']), ['SNEAKERFILES.COM', '@zsneakerheadz']);
  assert.deepEqual(watermarkLines(['NIKE', 'Air Max', '90']), []);
});

test('drop starter takes every fact from the record and never fills the caption', () => {
  const spec = dropStarter([
    { slug: 'aj12-fireside', name: 'Air Jordan 12 "Fireside"', brand: 'Jordan', colorway: 'Light Orewood Brown', releaseDate: new Date('2026-10-17T00:00:00Z'), retailPrice: 16995, currency: 'INR', image: `${CLD}/v1/a.webp`, where: 'Nike SNKRS App / Jordan Retailers', styleCode: 'CT8013-170', launchTimeIST: '09:30' },
  ]);
  assert.equal(spec.source.kind, 'drop');
  assert.match(spec.caption, /\{\{/);
  const info = spec.slides!.find((s) => s.layout === 'info')!;
  assert.deepEqual(info.rows, [['Release', 'Sat 17 Oct, 9:30 AM IST'], ['Price', '₹16,995'], ['Where', 'Nike SNKRS App'], ['Style', 'CT8013-170']]);
  assert.equal(spec.slides![0].ghost, 'FIRESIDE');
  assert.equal(spec.slides![spec.slides!.length - 1].layout, 'cta');
});

test('slide HTML escapes text and falls back to a full-bleed photo without a cut-out', () => {
  const html = renderSlideHtml(
    { layout: 'hero', title: '<script>x</script>', image: `${CLD}/v1/a.jpg` },
    { width: 1080, height: 1350, index: 0, total: 1, logoDataUri: '' },
  );
  assert.ok(!html.includes('<script>x'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('data-layout="photo"'));
});
