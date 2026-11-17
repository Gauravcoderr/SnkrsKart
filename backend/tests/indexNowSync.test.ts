import { test } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { Blog } from '../src/models/Blog';
import { Drop } from '../src/models/Drop';
import { SneakerProfile } from '../src/models/SneakerProfile';
import { Product } from '../src/models/Product';
import { IndexNowLog } from '../src/models/IndexNowLog';
import { syncIndexNow } from '../src/lib/indexNowSync';

type Stub = Record<string, unknown>;

function slugs(...values: string[]) {
  return { select: () => ({ lean: async () => values.map((slug) => ({ slug })) }) };
}

async function withStubs(opts: { logged: string[]; ping: () => Promise<unknown> }, run: (calls: { pinged: string[][]; inserted: string[][] }) => Promise<void>) {
  const calls = { pinged: [] as string[][], inserted: [] as string[][] };
  const saved: [Stub, string, unknown][] = [];
  const stub = (target: unknown, key: string, value: unknown) => {
    saved.push([target as Stub, key, (target as Stub)[key]]);
    (target as Stub)[key] = value;
  };
  stub(Blog, 'find', () => slugs('new-post', 'old-post'));
  stub(Drop, 'find', () => slugs('aj4-bred'));
  stub(SneakerProfile, 'find', () => slugs('kobe-6'));
  stub(Product, 'find', () => slugs('aj1-low'));
  stub(IndexNowLog, 'find', () => ({ select: () => ({ lean: async () => opts.logged.map((path) => ({ path })) }) }));
  stub(IndexNowLog, 'insertMany', async (docs: { path: string }[]) => { calls.inserted.push(docs.map((d) => d.path)); });
  stub(axios, 'post', async (_url: string, body: { urlList: string[] }) => {
    calls.pinged.push(body.urlList);
    return opts.ping();
  });
  try {
    await run(calls);
  } finally {
    for (const [target, key, value] of saved.reverse()) target[key] = value;
  }
}

test('syncIndexNow pings only published paths it has not pinged before, then records them', async () => {
  await withStubs({ logged: ['/blogs/old-post', '/products/aj1-low'], ping: async () => ({ status: 202 }) }, async (calls) => {
    assert.equal(await syncIndexNow(), 3);
    assert.deepEqual(calls.pinged, [[
      'https://www.snkrscart.com/blogs/new-post',
      'https://www.snkrscart.com/drops/aj4-bred',
      'https://www.snkrscart.com/sneakers/kobe-6',
    ]]);
    assert.deepEqual(calls.inserted, [['/blogs/new-post', '/drops/aj4-bred', '/sneakers/kobe-6']]);
  });
});

test('syncIndexNow records nothing when IndexNow refuses, so the next run retries', async () => {
  await withStubs({ logged: [], ping: async () => { throw new Error('403'); } }, async (calls) => {
    assert.equal(await syncIndexNow(), 0);
    assert.equal(calls.pinged.length, 1);
    assert.deepEqual(calls.inserted, []);
  });
});

test('syncIndexNow does not call IndexNow when every path was already pinged', async () => {
  const all = ['/blogs/new-post', '/blogs/old-post', '/drops/aj4-bred', '/sneakers/kobe-6', '/products/aj1-low'];
  await withStubs({ logged: all, ping: async () => ({ status: 200 }) }, async (calls) => {
    assert.equal(await syncIndexNow(), 0);
    assert.deepEqual(calls.pinged, []);
  });
});

test('syncIndexNow counts a duplicate-key insert from an overlapping run as sent', async () => {
  await withStubs({ logged: [], ping: async () => ({ status: 200 }) }, async () => {
    const original = IndexNowLog.insertMany;
    (IndexNowLog as unknown as Stub).insertMany = async () => { throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 }); };
    try {
      assert.equal(await syncIndexNow(), 5);
    } finally {
      (IndexNowLog as unknown as Stub).insertMany = original;
    }
  });
});

test('pingIndexNow splits batches at the 10,000 URL limit and reports refusal', async () => {
  const { pingIndexNow } = await import('../src/lib/indexNow');
  const batches: number[] = [];
  const original = axios.post;
  let refuse = false;
  (axios as unknown as Stub).post = async (_url: string, body: { urlList: string[] }) => {
    batches.push(body.urlList.length);
    if (refuse) throw new Error('422');
    return { status: 200 };
  };
  try {
    assert.equal(await pingIndexNow(Array.from({ length: 10_001 }, (_, i) => `/p/${i}`)), true);
    assert.deepEqual(batches, [10_000, 1]);
    assert.equal(await pingIndexNow([]), true);
    refuse = true;
    assert.equal(await pingIndexNow(['/a']), false);
  } finally {
    (axios as unknown as Stub).post = original;
  }
});
