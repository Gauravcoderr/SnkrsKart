import rateLimit from 'express-rate-limit';
import type { IOrder, IOrderItem } from '../models/Order';

// Public order lookups: 30 per IP per 15 min, and at most 10 failed guesses per order per hour,
// so a known order number cannot be paired with guessed emails or phones.
export const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many lookups. Please try again in a few minutes.' },
});
export const lookupGuessLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `order:${String(req.query.orderNumber ?? req.params.id ?? '').toUpperCase().slice(0, 40)}`,
  message: { error: 'Too many attempts for this order. Please try again later.' },
});

type ItemsOf = { items: IOrderItem[] };

/** Customers never see seller identity or seller payouts (sellerPrice is what we pay the seller). */
export function customerOrderView<T extends ItemsOf>(order: T): T {
  return { ...order, items: order.items.map(({ sellerId, sellerName, sellerPrice, listingId, ...item }) => item) };
}

type TrackingSource = ItemsOf & { _id: unknown } & Pick<IOrder,
  'orderNumber' | 'status' | 'createdAt' | 'updatedAt' | 'deliveredAt' | 'cancelReason' | 'subtotal' | 'shipping'
  | 'total' | 'couponDiscount' | 'trackingNumber' | 'deliveryService' | 'shipment' | 'paymentStatus' | 'city' | 'state'>;

/** What anyone holding an order number plus email or phone may see: tracking, no address or contact. */
export function trackingOrderView(o: TrackingSource) {
  return {
    _id: o._id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    deliveredAt: o.deliveredAt,
    cancelReason: o.cancelReason,
    items: o.items.map((i) => ({
      name: i.name, brand: i.brand, size: i.size, colorway: i.colorway, price: i.price, qty: i.qty,
      image: i.image, slug: i.slug, availability: i.availability, trackingNumber: i.trackingNumber, deliveryService: i.deliveryService,
    })),
    subtotal: o.subtotal,
    shipping: o.shipping,
    couponDiscount: o.couponDiscount,
    total: o.total,
    trackingNumber: o.trackingNumber,
    deliveryService: o.deliveryService,
    shipment: o.shipment,
    city: o.city,
    state: o.state,
  };
}
