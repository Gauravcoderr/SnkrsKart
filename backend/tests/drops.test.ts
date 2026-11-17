import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'net';
import { Drop } from '../src/models/Drop';
import dropRoutes from '../src/routes/drops';

async function sinceFor(query: string): Promise<Date> {
  let filter: { releaseDate: { $gte: Date } } | undefined;
  const original = Drop.find;
  (Drop as unknown as { find: unknown }).find = (f: typeof filter) => {
    filter = f;
    return { sort: () => ({ lean: async () => [] }) };
  };
  const app = express();
  app.use('/drops', dropRoutes);
  const server = app.listen(0);
  try {
    const res = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/drops${query}`);
    assert.equal(res.status, 200);
    assert.ok(filter);
    return filter.releaseDate.$gte;
  } finally {
    server.close();
    (Drop as unknown as { find: unknown }).find = original;
  }
}

test('GET /drops?from= lists published drops from that date on', async () => {
  assert.equal((await sinceFor('?from=2026-01-01')).toISOString(), '2026-01-01T00:00:00.000Z');
});

test('GET /drops keeps the days window when from is missing or not a real date', async () => {
  const day = 24 * 60 * 60 * 1000;
  for (const query of ['', '?from=2026-02-30', '?from=yesterday', '?days=30&from=2026-13-01']) {
    const expectedDays = query.includes('days=30') ? 30 : 7;
    const since = await sinceFor(query);
    assert.ok(Math.abs(Date.now() - expectedDays * day - since.getTime()) < 60_000, `${query} -> ${since.toISOString()}`);
  }
});
