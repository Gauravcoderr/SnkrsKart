import { IOrder } from '../models/Order';
import { SellerOrder, ISellerOrder, ISellerOrderItem, PAYOUT_DELAY_DAYS } from '../models/SellerOrder';
import { SellerListing, ListingAvailability, AVAILABILITY_SHIP_DAYS } from '../models/SellerListing';
import { Seller } from '../models/Seller';
import { Order } from '../models/Order';
import { sendSellerNewOrderEmail, sendCustomerShippedEmail } from './sellerEmails';
import mongoose from 'mongoose';
import { registerSellerShipment } from '../services/aftership';

export function computeShipBy(items: Array<{ availability: ListingAvailability }>, from: Date): Date {
  const days = Math.max(1, ...items.map((it) => AVAILABILITY_SHIP_DAYS[it.availability] ?? 3));
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function createSellerOrders(order: IOrder): Promise<void> {
  const grouped = new Map<string, ISellerOrderItem[]>();
  for (const item of order.items) {
    if (!item.listingId || !item.sellerId) continue;
    const list = grouped.get(item.sellerId) ?? [];
    list.push({
      productId: String(item.productId),
      listingId: item.listingId as any,
      name: item.name,
      brand: item.brand,
      size: String(item.size),
      colorway: item.colorway,
      image: item.image,
      slug: item.slug ?? '',
      qty: item.qty,
      sellerPrice: item.sellerPrice ?? 0,
      listPrice: item.price,
      availability: (item.availability ?? 'inhand') as ListingAvailability,
    });
    grouped.set(item.sellerId, list);
  }
  if (grouped.size === 0) return;

  const status = order.status === 'confirmed' ? 'confirmed' : 'pending_payment';
  const now = new Date();
  const docs = [...grouped.entries()].map(([sellerId, items]) => ({
    order: order._id,
    orderNumber: order.orderNumber,
    seller: sellerId,
    items,
    sellerTotal: items.reduce((a, it) => a + it.sellerPrice * it.qty, 0),
    status,
    deliveryCity: order.city,
    deliveryState: order.state,
    confirmedAt: status === 'confirmed' ? now : null,
    shipBy: status === 'confirmed' ? computeShipBy(items, now) : null,
  }));
  const created = (await SellerOrder.insertMany(docs)) as unknown as ISellerOrder[];
  if (status === 'confirmed') await notifySellers(created);
}

async function notifySellers(sellerOrders: ISellerOrder[]): Promise<void> {
  const sellerIds = [...new Set(sellerOrders.map((so) => String(so.seller)))];
  const sellers = await Seller.find({ _id: { $in: sellerIds } }).select('name email').lean();
  const byId = new Map(sellers.map((s) => [String(s._id), s]));
  for (const so of sellerOrders) {
    const seller = byId.get(String(so.seller));
    if (seller) sendSellerNewOrderEmail(seller.email, seller.name, so);
  }
}

export async function restoreListingStock(sellerOrder: ISellerOrder): Promise<void> {
  if (sellerOrder.stockRestored) return;
  for (const item of sellerOrder.items) {
    await SellerListing.updateOne(
      { _id: item.listingId },
      { $inc: { qty: item.qty, soldCount: -item.qty }, $set: { status: 'active' } },
    );
  }
  sellerOrder.stockRestored = true;
  await sellerOrder.save();
}

export async function syncSellerOrdersWithOrder(orderId: mongoose.Types.ObjectId | string, newStatus: IOrder['status'], cancelReason?: string): Promise<void> {
  const sellerOrders = await SellerOrder.find({ order: orderId });
  if (sellerOrders.length === 0) return;

  if (newStatus === 'confirmed') {
    const toNotify: ISellerOrder[] = [];
    for (const so of sellerOrders) {
      if (so.status === 'pending_payment') {
        const now = new Date();
        so.status = 'confirmed';
        so.confirmedAt = now;
        so.shipBy = computeShipBy(so.items, now);
        await so.save();
        toNotify.push(so);
      }
    }
    await notifySellers(toNotify);
    return;
  }

  if (newStatus === 'cancelled') {
    for (const so of sellerOrders) {
      if (so.status === 'cancelled') continue;
      const wasShipped = so.status === 'shipped' || so.status === 'delivered';
      so.status = 'cancelled';
      so.cancelReason = cancelReason ?? so.cancelReason;
      await so.save();
      if (!wasShipped) await restoreListingStock(so);
    }
    return;
  }

  if (newStatus === 'delivered') {
    const now = new Date();
    for (const so of sellerOrders) {
      if (so.status !== 'confirmed' && so.status !== 'shipped') continue;
      so.status = 'delivered';
      so.deliveredAt = now;
      if (so.payout.status === 'pending') {
        so.payout.status = 'due';
        so.payout.amount = so.sellerTotal;
        so.payout.dueAt = new Date(now.getTime() + PAYOUT_DELAY_DAYS * 24 * 60 * 60 * 1000);
      }
      await so.save();
    }
    return;
  }

  if (newStatus === 'shipped') {
    await SellerOrder.updateMany({ order: orderId, status: 'confirmed', trackingNumber: { $ne: '' } }, { $set: { status: 'shipped' } });
  }
}

export async function applySellerTrackingToOrder(sellerOrder: ISellerOrder, notifyCustomer: boolean): Promise<void> {
  const order = await Order.findById(sellerOrder.order);
  if (!order) return;

  const listingIds = new Set(sellerOrder.items.map((it) => String(it.listingId)));
  for (const item of order.items) {
    if (item.listingId && listingIds.has(String(item.listingId))) {
      item.trackingNumber = sellerOrder.trackingNumber;
      item.deliveryService = sellerOrder.deliveryService;
    }
  }

  const otherSellerOrders = await SellerOrder.find({ order: order._id, _id: { $ne: sellerOrder._id }, status: { $ne: 'cancelled' } }).select('status').lean();
  const storeItems = order.items.filter((it) => !it.listingId);
  const allSellerShipped = otherSellerOrders.every((so) => so.status === 'shipped' || so.status === 'delivered');
  const singleShipment = storeItems.length === 0 && otherSellerOrders.length === 0;

  if (singleShipment) {
    order.trackingNumber = sellerOrder.trackingNumber;
    order.deliveryService = sellerOrder.deliveryService;
  }
  if (storeItems.length === 0 && allSellerShipped && order.status === 'confirmed') {
    order.status = 'shipped';
  }
  order.markModified('items');
  await order.save();

  registerSellerShipment(sellerOrder, singleShipment ? order : null)
    .catch((e) => console.error('[aftership] register seller shipment failed', e));

  if (notifyCustomer) {
    sendCustomerShippedEmail({
      to: order.email,
      name: order.name,
      orderNumber: order.orderNumber,
      orderId: String(order._id),
      deliveryService: sellerOrder.deliveryService,
      trackingNumber: sellerOrder.trackingNumber,
      items: sellerOrder.items.map((it) => ({ name: it.name, brand: it.brand, size: it.size, qty: it.qty, image: it.image })),
    });
  }
}
