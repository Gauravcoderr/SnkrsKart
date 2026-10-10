import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

// End-to-end against a throwaway local MongoDB (never production):
//   mongod --dbpath /tmp/igdb --port 27999 &
//   IG_TEST_MONGO_URI=mongodb://127.0.0.1:27999/igtest npm test
// Skipped when IG_TEST_MONGO_URI is not set.

const URI = process.env.IG_TEST_MONGO_URI;
const skip = !URI || /mongodb\.net|snkrs-cart/.test(URI) ? 'set IG_TEST_MONGO_URI to a local throwaway database' : false;

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.IG_DRY_RUN = 'true';
process.env.IG_CRON_SECRET = 'cron-secret';

const CLD = 'https://res.cloudinary.com/dadulg5bs/image/upload';
let server: Server;
let base = '';
let token = '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let m: any;

before(async () => {
  if (skip) return;
  const mongoose = (await import('mongoose')).default;
  const express = (await import('express')).default;
  const jwt = (await import('jsonwebtoken')).default;
  await mongoose.connect(URI as string);
  await mongoose.connection.dropDatabase();
  m = {
    mongoose,
    Drop: (await import('../src/models/Drop')).Drop,
    Blog: (await import('../src/models/Blog')).Blog,
    InstagramPost: (await import('../src/models/InstagramPost')).InstagramPost,
    publisher: await import('../src/services/instagramPublisher'),
  };
  const app = express();
  app.use(express.json());
  app.use('/api/v1/admin/instagram', (await import('../src/routes/instagramAdmin')).default);
  app.use('/api/v1/instagram', (await import('../src/routes/instagramCron')).default);
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
  token = jwt.sign({ username: 'tester' }, process.env.JWT_SECRET as string);
});

after(async () => {
  if (skip) return;
  server?.close();
  await m.mongoose.connection.dropDatabase();
  await m.mongoose.disconnect();
});

const api = (path: string, method = 'GET', body?: unknown) =>
  fetch(`${base}/admin/instagram${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => ({ status: r.status, body: await r.json() }));

const carousel = (slug: string, kind = 'drop') => ({
  kind: 'CAROUSEL',
  caption: 'Air Jordan 12 Fireside lands Sat 17 Oct. Save it. #airjordan12 #sneakersindia',
  media: [
    { url: `${CLD}/v1/instagram/a.jpg`, type: 'IMAGE', altText: 'cover' },
    { url: `${CLD}/v1/instagram/b.jpg`, type: 'IMAGE' },
  ],
  source: { kind, slug },
});

test('draft to approved to published through the routes and the job', { skip }, async () => {
  await m.Drop.create({ slug: 'aj12-fireside', name: 'Air Jordan 12 Fireside', brand: 'Jordan', releaseDate: new Date('2026-10-17'), published: true });
  const created = await api('', 'POST', carousel('aj12-fireside'));
  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'draft');

  const approved = await api(`/${created.body._id}/approve`, 'POST', { scheduledAt: new Date(Date.now() - 1000).toISOString() });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.status, 'approved');
  assert.equal(approved.body.approvedBy, 'tester');

  const run = await m.publisher.runDueInstagramPosts();
  assert.deepEqual(run, { published: 1, notPublished: 0 });
  const done = await m.InstagramPost.findById(created.body._id).lean();
  assert.equal(done.status, 'published');
  assert.equal(done.dryRun, true);
  assert.match(done.igMediaId, /^dry_/);

  const again = await api(`/${created.body._id}/approve`, 'POST');
  assert.equal(again.status, 409);
});

test('a post linking to an unpublished blog cannot be approved', { skip }, async () => {
  await m.Blog.create({ slug: 'draft-blog', title: 'Draft', published: false });
  const created = await api('', 'POST', carousel('draft-blog', 'blog'));
  const r = await api(`/${created.body._id}/approve`, 'POST');
  assert.equal(r.status, 400);
  assert.match(r.body.error, /not published yet/);
});

test('validation errors block approval', { skip }, async () => {
  const created = await api('', 'POST', { ...carousel('x', 'manual'), caption: 'too many #a #b #c #d #e #f' });
  const r = await api(`/${created.body._id}/approve`, 'POST');
  assert.equal(r.status, 400);
  assert.match(r.body.error, /hashtags/);
});

test('editing an approved post sends it back to draft', { skip }, async () => {
  const created = await api('', 'POST', carousel('edit-me', 'manual'));
  await api(`/${created.body._id}/approve`, 'POST', { scheduledAt: new Date(Date.now() + 86_400_000).toISOString() });
  const edited = await api(`/${created.body._id}`, 'PUT', { caption: 'New caption. #sneakersindia' });
  assert.equal(edited.body.status, 'draft');
  assert.equal(edited.body.approvedAt, null);
  const schedOnly = await api(`/${created.body._id}`, 'PUT', { scheduledAt: null });
  assert.equal(schedOnly.body.status, 'draft');
});

test('two runs at once never claim the same post', { skip }, async () => {
  const p = await m.InstagramPost.create({ ...carousel('race', 'manual'), status: 'approved', scheduledAt: null });
  const [a, b] = await Promise.all([m.publisher.claim({ _id: p._id }), m.publisher.claim({ _id: p._id })]);
  assert.equal([a, b].filter(Boolean).length, 1);
});

test('a post stuck in publishing is failed, never re-posted', { skip }, async () => {
  const p = await m.InstagramPost.create({ ...carousel('stuck', 'manual'), status: 'publishing', lastAttemptAt: new Date(Date.now() - 60 * 60_000) });
  await m.publisher.runDueInstagramPosts();
  const after = await m.InstagramPost.findById(p._id).lean();
  assert.equal(after.status, 'failed');
  assert.match(after.error, /may already be live/);
});

test('publish now works from draft and the cron endpoint needs the secret', { skip }, async () => {
  const created = await api('', 'POST', carousel('now', 'manual'));
  const r = await api(`/${created.body._id}/publish-now`, 'POST');
  assert.equal(r.status, 200);
  assert.equal(r.body.post.status, 'published');

  const denied = await fetch(`${base}/instagram/run-due`, { method: 'POST', headers: { Authorization: 'Bearer wrong' } });
  assert.equal(denied.status, 401);
  const ok = await fetch(`${base}/instagram/run-due`, { method: 'POST', headers: { Authorization: 'Bearer cron-secret' } });
  assert.equal(ok.status, 200);

  const status = await api('/status');
  assert.equal(status.body.dryRun, true);
  assert.ok(status.body.counts.published >= 2);
});
