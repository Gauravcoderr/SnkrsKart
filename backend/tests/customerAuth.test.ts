import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const { anonymousAsNull, hasAnyCredential } = require('../src/middleware/customerAuth');

function fakeRes() {
  const res: any = { statusCode: 200, headers: {}, body: undefined, sent: false };
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.set = (k: string, v: string) => { res.headers[k.toLowerCase()] = v; return res; };
  res.json = (b: unknown) => { res.body = b; res.sent = true; return res; };
  return res;
}

test('anonymous request gets 200 null without reaching customerAuth', () => {
  const res = fakeRes();
  let nextCalled = false;
  anonymousAsNull({ headers: {}, cookies: {} }, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, null);
  assert.equal(res.sent, true);
  assert.equal(res.headers['cache-control'], 'private, no-cache');
});

test('refresh cookie alone still goes through auth so the client can refresh', () => {
  const res = fakeRes();
  let nextCalled = false;
  anonymousAsNull({ headers: {}, cookies: { refresh_token: 'x' } }, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(res.sent, false);
});

test('bearer header or access cookie counts as a credential', () => {
  assert.equal(hasAnyCredential({ headers: { authorization: 'Bearer abc' }, cookies: {} }), true);
  assert.equal(hasAnyCredential({ headers: {}, cookies: { access_token: 'abc' } }), true);
  assert.equal(hasAnyCredential({ headers: { authorization: 'Basic abc' }, cookies: {} }), false);
  assert.equal(hasAnyCredential({ headers: {} }), false);
});
