import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'net';
import { customerOrderView, lookupGuessLimiter, lookupLimiter, trackingOrderView } from '../src/lib/orderAccess';

const order = {
  _id: 'o1',
  orderNumber: 'SC-ABC-123',
  userId: 'u1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '9876543210',
  addressLine: '12 MG Road',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
  items: [{
    productId: 'p1', name: 'Air Jordan 1 Low', brand: 'Jordan', size: '9', colorway: 'Black', price: 10000, qty: 1,
    image: 'x.jpg', slug: 'aj1', listingId: 'l1', sellerId: 's1', sellerName: 'Kicks Co', sellerPrice: 8200,
    availability: 'inhand' as const, trackingNumber: 'AWB1', deliveryService: 'delhivery',
  }],
  subtotal: 10000,
  shipping: 0,
  total: 10000,
  couponDiscount: 0,
  status: 'shipped' as const,
  paymentStatus: 'paid' as const,
  trackingNumber: 'AWB1',
  deliveryService: 'delhivery',
  notes: 'leave at door',
  razorpayOrderId: 'rp_1',
  cfOrderId: 'cf_1',
  paymentSessionId: 'sess_1',
  shipment: null,
  createdAt: new Date('2026-10-01'),
  updatedAt: new Date('2026-10-02'),
};

test('customer view hides seller identity and payout, keeps the delivery address', () => {
  const view = customerOrderView(order);
  const item = view.items[0] as Record<string, unknown>;
  for (const k of ['sellerId', 'sellerName', 'sellerPrice', 'listingId']) assert.equal(k in item, false, k);
  assert.equal(view.addressLine, '12 MG Road');
  assert.equal(item.price, 10000);
});

test('tracking view carries no contact, address, payment ids or seller data', () => {
  const view = trackingOrderView(order as unknown as Parameters<typeof trackingOrderView>[0]);
  const text = JSON.stringify(view);
  for (const secret of ['asha@example.com', '9876543210', '12 MG Road', '411001', 'Asha Rao', 'u1', 'rp_1', 'cf_1', 'sess_1', 'Kicks Co', '8200', 'leave at door']) {
    assert.equal(text.includes(secret), false, secret);
  }
  assert.equal(view.orderNumber, 'SC-ABC-123');
  assert.equal(view.status, 'shipped');
  assert.equal(view.items[0].name, 'Air Jordan 1 Low');
  assert.equal(view.trackingNumber, 'AWB1');
  assert.equal(view.total, 10000);
  assert.equal(view.city, 'Pune');
});

test('an order number locks after 10 failed guesses; other orders and correct guesses still work', async () => {
  const app = express();
  app.get('/lookup', lookupLimiter, lookupGuessLimiter, (req, res) => {
    res.status(req.query.email === 'right@example.com' ? 200 : 404).json({});
  });
  const server = app.listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/lookup`;
  try {
    const codes: number[] = [];
    for (let i = 0; i < 11; i++) {
      codes.push((await fetch(`${base}?orderNumber=SC-LOCK-1&email=guess${i}@example.com`)).status);
    }
    assert.deepEqual(codes.slice(0, 10), Array(10).fill(404));
    assert.equal(codes[10], 429);
    assert.equal((await fetch(`${base}?orderNumber=sc-lock-1&email=right@example.com`)).status, 429);
    assert.equal((await fetch(`${base}?orderNumber=SC-OTHER-2&email=guess@example.com`)).status, 404);
    assert.equal((await fetch(`${base}?orderNumber=SC-OTHER-3&email=right@example.com`)).status, 200);
  } finally {
    server.close();
  }
});
