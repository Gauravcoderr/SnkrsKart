import { Order, IOrder } from '../models/Order';
import { SellerOrder, ISellerOrder, PAYOUT_DELAY_DAYS } from '../models/SellerOrder';
import { IShipment, IShipmentCheckpoint } from '../models/Shipment';
import { sendReviewRequestEmail } from '../lib/orderEmails';

const API_KEY = process.env.AFTERSHIP_API_KEY || '';
const VERSION = process.env.AFTERSHIP_API_VERSION || '2025-07';
const BASE = `https://api.aftership.com/tracking/${VERSION}`;

export const AFTERSHIP_SLUGS: Record<string, string> = {
  'Delhivery': 'delhivery',
  'DTDC': 'dtdc',
  'Blue Dart': 'bluedart',
  'Ekart Logistics': 'ekart',
  'XpressBees': 'xpressbees',
  'Shadowfax': 'shadowfax',
  'Ecom Express': 'ecom-express',
  'India Post': 'india-post',
  'FedEx': 'fedex',
  'DHL': 'dhl',
};

export interface RawCheckpoint {
  checkpoint_time?: string | null;
  message?: string | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  tag?: string | null;
  subtag_message?: string | null;
}

export interface RawTracking {
  id: string;
  tracking_number: string;
  slug: string;
  tag?: string | null;
  subtag?: string | null;
  subtag_message?: string | null;
  expected_delivery?: string | null;
  checkpoints?: RawCheckpoint[];
  order_id?: string | null;
}

export function isAfterShipEnabled(): boolean {
  return API_KEY.length > 0;
}

export function courierSlug(service: string): string | null {
  return AFTERSHIP_SLUGS[service] ?? null;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; code: number; data: T | null; message: string }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'as-api-key': API_KEY, ...(init.headers || {}) },
  });
  const json: any = await res.json().catch(() => ({}));
  const data = json?.data?.tracking ?? json?.data ?? null;
  return { ok: res.ok, status: res.status, code: json?.meta?.code ?? res.status, data, message: json?.meta?.message ?? '' };
}

export async function createTracking(opts: { trackingNumber: string; slug: string; orderNumber: string; title: string }): Promise<RawTracking | null> {
  if (!isAfterShipEnabled()) return null;
  const created = await api<RawTracking>('/trackings', {
    method: 'POST',
    body: JSON.stringify({ tracking_number: opts.trackingNumber, slug: opts.slug, order_id: opts.orderNumber, title: opts.title }),
  });
  if (created.ok && created.data?.id) return created.data;
  const existing = await api<{ trackings?: RawTracking[] }>(`/trackings?tracking_numbers=${encodeURIComponent(opts.trackingNumber)}&slug=${opts.slug}&limit=1`);
  const list = (existing.data as any)?.trackings as RawTracking[] | undefined;
  if (list?.[0]?.id) return list[0];
  console.error('[aftership] create failed', created.status, created.code, created.message);
  return null;
}

export async function getTracking(id: string): Promise<RawTracking | null> {
  if (!isAfterShipEnabled() || !id) return null;
  const res = await api<RawTracking>(`/trackings/${encodeURIComponent(id)}`);
  return res.ok && res.data?.id ? res.data : null;
}

function toCheckpoint(c: RawCheckpoint): IShipmentCheckpoint {
  const location = c.location || [c.city, c.state].filter(Boolean).join(', ');
  return {
    message: c.message || c.subtag_message || '',
    location,
    at: c.checkpoint_time ? new Date(c.checkpoint_time) : null,
    tag: c.tag || '',
    subtagMessage: c.subtag_message || '',
  };
}

export function toShipment(t: RawTracking): IShipment {
  const checkpoints = (t.checkpoints || [])
    .map(toCheckpoint)
    .sort((a, b) => (a.at?.getTime() ?? 0) - (b.at?.getTime() ?? 0))
    .slice(-15);
  return {
    aftershipId: t.id,
    slug: t.slug,
    tag: t.tag || '',
    subtag: t.subtag || '',
    subtagMessage: t.subtag_message || '',
    expectedDelivery: t.expected_delivery || '',
    lastCheckpoint: checkpoints[checkpoints.length - 1] ?? null,
    checkpoints,
    syncedAt: new Date(),
  };
}

function shipmentTitle(items: Array<{ brand: string; name: string; size: string }>): string {
  const first = items[0];
  if (!first) return 'SNKRS CART order';
  const extra = items.length - 1;
  return `${first.brand} ${first.name} UK ${first.size}${extra > 0 ? ` +${extra}` : ''}`.trim().slice(0, 120);
}

export async function registerSellerShipment(sellerOrder: ISellerOrder, mirrorTo: IOrder | null): Promise<void> {
  const slug = courierSlug(sellerOrder.deliveryService);
  if (!isAfterShipEnabled() || !slug || !sellerOrder.trackingNumber) return;
  const raw = await createTracking({ trackingNumber: sellerOrder.trackingNumber, slug, orderNumber: sellerOrder.orderNumber, title: shipmentTitle(sellerOrder.items) });
  if (!raw) return;
  const shipment = toShipment(raw);
  await SellerOrder.updateOne({ _id: sellerOrder._id }, { $set: { shipment } });
  if (mirrorTo) await Order.updateOne({ _id: mirrorTo._id }, { $set: { shipment } });
  if ((raw.tag || '') === 'Delivered') await applyRawTracking(raw);
}

export async function registerOrderShipment(order: IOrder): Promise<void> {
  const slug = courierSlug(order.deliveryService || '');
  if (!isAfterShipEnabled() || !slug || !order.trackingNumber) return;
  const raw = await createTracking({
    trackingNumber: order.trackingNumber,
    slug,
    orderNumber: order.orderNumber,
    title: shipmentTitle(order.items.map((it) => ({ brand: it.brand, name: it.name, size: String(it.size) }))),
  });
  if (!raw) return;
  await Order.updateOne({ _id: order._id }, { $set: { shipment: toShipment(raw) } });
  if ((raw.tag || '') === 'Delivered') await applyRawTracking(raw);
}

async function markSellerOrderDelivered(so: ISellerOrder): Promise<void> {
  const now = new Date();
  so.status = 'delivered';
  so.deliveredAt = so.deliveredAt ?? now;
  if (so.payout.status === 'pending') {
    so.payout.status = 'due';
    so.payout.amount = so.sellerTotal;
    so.payout.dueAt = new Date(now.getTime() + PAYOUT_DELAY_DAYS * 24 * 60 * 60 * 1000);
  }
  await so.save();

  const order = await Order.findById(so.order);
  if (!order || order.status === 'delivered' || order.status === 'cancelled') return;
  const storeItems = order.items.filter((it) => !it.listingId);
  const siblings = await SellerOrder.find({ order: order._id, status: { $ne: 'cancelled' } }).select('status').lean();
  const allDelivered = siblings.every((s) => s.status === 'delivered');
  if (storeItems.length === 0 && allDelivered) await markOrderDelivered(order);
}

async function markOrderDelivered(order: IOrder): Promise<void> {
  if (order.status === 'delivered' || order.status === 'cancelled') return;
  const now = new Date();
  order.status = 'delivered';
  order.deliveredAt = order.deliveredAt ?? now;
  await order.save();
  sendReviewRequestEmail(order, process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com');

  const sellerOrders = await SellerOrder.find({ order: order._id, status: { $in: ['confirmed', 'shipped'] } });
  for (const so of sellerOrders) {
    so.status = 'delivered';
    so.deliveredAt = so.deliveredAt ?? now;
    if (so.payout.status === 'pending') {
      so.payout.status = 'due';
      so.payout.amount = so.sellerTotal;
      so.payout.dueAt = new Date(now.getTime() + PAYOUT_DELAY_DAYS * 24 * 60 * 60 * 1000);
    }
    await so.save();
  }
}

export async function applyRawTracking(t: RawTracking): Promise<{ sellerOrders: number; orders: number }> {
  if (!t?.id) return { sellerOrders: 0, orders: 0 };
  const shipment = toShipment(t);
  const delivered = shipment.tag === 'Delivered';

  const sellerOrders = await SellerOrder.find({
    $or: [
      { 'shipment.aftershipId': t.id },
      { trackingNumber: t.tracking_number, status: { $in: ['shipped', 'delivered'] } },
    ],
  });
  for (const so of sellerOrders) {
    so.shipment = shipment;
    if (delivered && so.status === 'shipped') await markSellerOrderDelivered(so);
    else await so.save();
  }

  const orders = await Order.find({
    $or: [
      { 'shipment.aftershipId': t.id },
      { trackingNumber: t.tracking_number, status: { $in: ['confirmed', 'shipped', 'delivered'] } },
    ],
  });
  for (const order of orders) {
    order.shipment = shipment;
    if (delivered && (order.status === 'confirmed' || order.status === 'shipped')) {
      const storeItems = order.items.filter((it) => !it.listingId);
      const otherSellerOrders = await SellerOrder.find({ order: order._id, status: { $nin: ['cancelled', 'delivered'] }, trackingNumber: { $ne: t.tracking_number } }).select('_id').lean();
      await order.save();
      if (storeItems.length > 0 || otherSellerOrders.length === 0) await markOrderDelivered(order);
    } else {
      await order.save();
    }
  }
  return { sellerOrders: sellerOrders.length, orders: orders.length };
}

export async function syncOpenShipments(limit = 100): Promise<{ checked: number; registered: number }> {
  if (!isAfterShipEnabled()) return { checked: 0, registered: 0 };
  let checked = 0;
  let registered = 0;
  const ids = new Set<string>();

  const openSellerOrders = await SellerOrder.find({ status: 'shipped', trackingNumber: { $ne: '' } }).limit(limit);
  for (const so of openSellerOrders) {
    if (!so.shipment?.aftershipId) {
      const parent = await Order.findById(so.order);
      const siblings = parent ? await SellerOrder.countDocuments({ order: parent._id, _id: { $ne: so._id }, status: { $ne: 'cancelled' } }) : 1;
      const storeItems = parent ? parent.items.filter((it) => !it.listingId).length : 1;
      await registerSellerShipment(so, parent && siblings === 0 && storeItems === 0 ? parent : null);
      registered += 1;
      continue;
    }
    ids.add(so.shipment.aftershipId);
  }

  const openOrders = await Order.find({ status: 'shipped', trackingNumber: { $ne: '' }, 'items.listingId': { $nin: [/./] } }).limit(limit);
  for (const order of openOrders) {
    if (!order.shipment?.aftershipId) {
      await registerOrderShipment(order);
      registered += 1;
      continue;
    }
    ids.add(order.shipment.aftershipId);
  }

  for (const id of ids) {
    const raw = await getTracking(id);
    if (raw) await applyRawTracking(raw);
    checked += 1;
  }
  return { checked, registered };
}
