import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'net';
import { SiteContent } from '../src/models/SiteContent';
import faqRoutes from '../src/routes/faqs';

test('GET /faqs serves the CMS FAQ items as plain question/answer pairs', async () => {
  const doc = { faqItems: [
    { q: ' Do you ship across India? ', a: '<p>Yes, <b>free</b> delivery&nbsp;on all orders.</p>' },
    { q: 'Empty answer', a: '' },
  ] };
  const original = SiteContent.findOne;
  (SiteContent as unknown as { findOne: unknown }).findOne = () => ({ select: () => ({ lean: async () => doc }) });
  const app = express();
  app.use('/faqs', faqRoutes);
  const server = app.listen(0);
  try {
    const res = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/faqs`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { faqs: [{ question: 'Do you ship across India?', answer: 'Yes, free delivery on all orders.' }] });
  } finally {
    server.close();
    (SiteContent as unknown as { findOne: unknown }).findOne = original;
  }
});
