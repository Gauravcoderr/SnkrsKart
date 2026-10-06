import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Seller, ISeller } from '../models/Seller';
import {
  SellerListing,
  computeListPrice,
  isAvailability,
  maxSellerPriceToBeat,
  SELLER_COMMISSION_PCT,
  AVAILABILITY_SHIP_DAYS,
} from '../models/SellerListing';
import { SellerOrder, VERIFICATION_ANGLES, PAYOUT_DELAY_DAYS, LATE_PENALTY_TEXT } from '../models/SellerOrder';
import { ProductRequest } from '../models/ProductRequest';
import { Product } from '../models/Product';
import { sellerAuth, SellerRequest, signSellerToken } from '../middleware/sellerAuth';
import { attachSellerOffers } from '../lib/sellerOffers';
import { applySellerTrackingToOrder } from '../lib/sellerOrders';
import { sendAdminVerificationSubmittedEmail, sendAdminProductRequestEmail } from '../lib/sellerEmails';

const router = Router();

const CATALOG_FIELDS = 'slug name brand colorway images hoverImage price originalPrice sizes availableSizes stringSizes availableStringSizes productType variants soldOut comingSoon';

function publicSeller(s: ISeller) {
  return {
    id: String(s._id),
    name: s.name,
    email: s.email,
    phone: s.phone,
    status: s.status,
    businessName: s.businessName,
    addressLine: s.addressLine,
    city: s.city,
    state: s.state,
    pincode: s.pincode,
    whatsapp: s.whatsapp,
    upiId: s.upiId,
    mustChangePassword: s.mustChangePassword,
    lastLoginAt: s.lastLoginAt,
    createdAt: s.createdAt,
  };
}

function isObjectId(v: unknown): v is string {
  return typeof v === 'string' && mongoose.isValidObjectId(v);
}

type LeanProduct = {
  _id: unknown; slug: string; name: string; brand: string; colorway: string; images: string[]; hoverImage: string;
  price: number; originalPrice: number | null; sizes: number[]; availableSizes: number[]; stringSizes: string[];
  availableStringSizes: string[]; productType: string; variants?: Array<{ size: number | string; price: number; originalPrice: number | null; maxQty: number }>;
  soldOut: boolean; comingSoon: boolean;
};

const UK_SHOE_SIZES: number[] = Array.from({ length: 31 }, (_, i) => 1 + i * 0.5);

function isStringSized(product: LeanProduct): boolean {
  return product.productType !== 'shoes' && (product.stringSizes?.length ?? 0) > 0;
}

function normaliseSize(product: LeanProduct, raw: unknown): number | string | null {
  if (isStringSized(product)) {
    const s = String(raw ?? '').trim();
    return product.stringSizes.includes(s) ? s : null;
  }
  const n = Number(raw);
  if (!isFinite(n) || n <= 0) return null;
  return UK_SHOE_SIZES.includes(n) ? n : null;
}

function catalogSummary(p: LeanProduct) {
  return {
    id: String(p._id),
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    colorway: p.colorway,
    image: p.images?.[0] || p.hoverImage || '',
    price: p.price,
    productType: p.productType,
    sizes: isStringSized(p) ? p.stringSizes : p.sizes,
    allowedSizes: isStringSized(p) ? p.stringSizes : UK_SHOE_SIZES,
    stringSized: isStringSized(p),
  };
}

// ─── Auth ──────────────────────────────────────────────────────────────────

router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const seller = await Seller.findOne({ email, passwordHash: { $ne: null } });
    if (!seller || !seller.passwordHash || !(await bcrypt.compare(password, seller.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    if (seller.status !== 'active') {
      res.status(403).json({ error: 'Your seller account is not active. Contact SNKRS CART on WhatsApp.' });
      return;
    }
    seller.lastLoginAt = new Date();
    await seller.save();
    res.json({ token: signSellerToken(String(seller._id), seller.email), seller: publicSeller(seller) });
  } catch (err) {
    console.error('[seller-portal/login]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  const seller = await Seller.findById(req.seller!.id);
  if (!seller) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(publicSeller(seller));
});

router.put('/me', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, businessName, addressLine, city, state, pincode, whatsapp, upiId } = req.body;
    const update: Record<string, string> = {};
    if (typeof addressLine === 'string') update.addressLine = addressLine.trim().slice(0, 300);
    if (typeof state === 'string') update.state = state.trim().slice(0, 80);
    if (typeof pincode === 'string') {
      const clean = pincode.replace(/\D/g, '');
      if (clean && !/^[1-9]\d{5}$/.test(clean)) { res.status(400).json({ error: 'Pincode must be 6 digits' }); return; }
      update.pincode = clean;
    }
    if (typeof name === 'string' && name.trim()) update.name = name.trim().slice(0, 100);
    if (typeof phone === 'string' && phone.trim()) update.phone = phone.trim().slice(0, 20);
    if (typeof businessName === 'string') update.businessName = businessName.trim().slice(0, 120);
    if (typeof city === 'string') update.city = city.trim().slice(0, 80);
    if (typeof whatsapp === 'string') update.whatsapp = whatsapp.replace(/[^\d+]/g, '').slice(0, 16);
    if (typeof upiId === 'string') update.upiId = upiId.trim().slice(0, 80);
    const seller = await Seller.findByIdAndUpdate(req.seller!.id, { $set: update }, { returnDocument: 'after' });
    if (!seller) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(publicSeller(seller));
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/auth/change-password', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }
    const seller = await Seller.findById(req.seller!.id);
    if (!seller || !seller.passwordHash) { res.status(404).json({ error: 'Not found' }); return; }
    if (!(await bcrypt.compare(currentPassword, seller.passwordHash))) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }
    seller.passwordHash = await bcrypt.hash(newPassword, 10);
    seller.mustChangePassword = false;
    await seller.save();
    res.json({ success: true, seller: publicSeller(seller) });
  } catch {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.get('/config', (_req: Request, res: Response) => {
  res.json({ commissionPct: SELLER_COMMISSION_PCT, angles: VERIFICATION_ANGLES, shipDays: AVAILABILITY_SHIP_DAYS, latePenaltyText: LATE_PENALTY_TEXT, payoutDelayDays: PAYOUT_DELAY_DAYS });
});

// ─── Dashboard ─────────────────────────────────────────────────────────────

router.get('/dashboard', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.seller!.id);
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const [listingStats, orders, requestsPending] = await Promise.all([
      SellerListing.aggregate([
        { $match: { seller: sellerId } },
        { $group: { _id: '$status', count: { $sum: 1 }, units: { $sum: '$qty' } } },
      ]),
      SellerOrder.find({ seller: sellerId }).sort({ createdAt: -1 }).lean(),
      ProductRequest.countDocuments({ seller: sellerId, status: 'pending' }),
    ]);

    const listings = { active: 0, paused: 0, sold_out: 0, units: 0 };
    for (const row of listingStats) {
      (listings as any)[row._id] = row.count;
      if (row._id === 'active') listings.units = row.units;
    }

    const needsVerification = orders.filter((o) => o.status === 'confirmed' && (o.verification.status === 'none' || o.verification.status === 'rejected'));
    const awaitingReview = orders.filter((o) => o.status === 'confirmed' && o.verification.status === 'pending');
    const needsTracking = orders.filter((o) => o.status === 'confirmed' && o.verification.status === 'approved' && !o.trackingNumber);
    const overdue = orders.filter((o) => o.status === 'confirmed' && !o.trackingNumber && o.shipBy && new Date(o.shipBy).getTime() < Date.now());
    const shipped = orders.filter((o) => o.status === 'shipped');
    const delivered = orders.filter((o) => o.status === 'delivered');
    const payoutDue = delivered.filter((o) => o.payout?.status !== 'paid');
    const payoutPaid = delivered.filter((o) => o.payout?.status === 'paid');

    const sum = (list: typeof orders) => list.reduce((a, o) => a + o.sellerTotal, 0);
    const sumPaid = (list: typeof orders) => list.reduce((a, o) => a + (o.payout?.amount || o.sellerTotal), 0);

    res.json({
      listings,
      orders: {
        total: orders.length,
        needsVerification: needsVerification.length,
        awaitingReview: awaitingReview.length,
        needsTracking: needsTracking.length,
        shipped: shipped.length,
        delivered: delivered.length,
        pendingPayment: orders.filter((o) => o.status === 'pending_payment').length,
        overdue: overdue.length,
      },
      latePenaltyText: LATE_PENALTY_TEXT,
      earnings: {
        inProgress: sum([...needsVerification, ...awaitingReview, ...needsTracking, ...shipped]),
        due: sum(payoutDue),
        paid: sumPaid(payoutPaid),
        thisMonth: sumPaid(payoutPaid.filter((o) => o.payout?.paidAt && new Date(o.payout.paidAt) >= monthStart)),
        nextPayoutAt: payoutDue.map((o) => o.payout?.dueAt).filter(Boolean).sort((a, b) => new Date(a as Date).getTime() - new Date(b as Date).getTime())[0] ?? null,
        payoutDelayDays: PAYOUT_DELAY_DAYS,
      },
      requestsPending,
      actionItems: [...needsVerification, ...needsTracking].slice(0, 6).map(forSeller),
      recentOrders: orders.slice(0, 5).map(forSeller),
    });
  } catch (err) {
    console.error('[seller-portal/dashboard]', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ─── Catalog ───────────────────────────────────────────────────────────────

router.get('/catalog', sellerAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const search = String(req.query.search || '').trim();
    const filter: Record<string, unknown> = { comingSoon: { $ne: true } };
    if (search) {
      const words = search.split(/\s+/).filter(Boolean).slice(0, 6);
      filter.$and = words.map((w) => {
        const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        return { $or: [{ name: re }, { brand: re }, { colorway: re }, { sku: re }, { tags: re }] };
      });
    }
    const products = await Product.find(filter).sort({ reviewCount: -1, createdAt: -1 }).limit(24).select(CATALOG_FIELDS).lean();
    res.json((products as unknown as LeanProduct[]).map(catalogSummary));
  } catch {
    res.status(500).json({ error: 'Failed to search catalog' });
  }
});

router.get('/catalog/:id', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid product id' }); return; }
    const product = await Product.findById(req.params.id).select(CATALOG_FIELDS).lean() as unknown as LeanProduct | null;
    if (!product || product.comingSoon) { res.status(404).json({ error: 'Product not found' }); return; }
    const [withOffers] = await attachSellerOffers([product]);
    const mine = await SellerListing.find({ seller: req.seller!.id, product: product._id as mongoose.Types.ObjectId }).lean();
    const beat: Record<string, number> = {};
    for (const offer of withOffers.offers) beat[String(offer.size)] = maxSellerPriceToBeat(offer.price);
    res.json({
      product: catalogSummary(product),
      offers: withOffers.offers.map((o) => ({ size: o.size, price: o.price, availability: o.availability, source: o.source, isMine: o.listingId ? mine.some((m) => String(m._id) === o.listingId) : false })),
      mine: mine.map((m) => ({ id: String(m._id), size: m.size, sellerPrice: m.sellerPrice, listPrice: m.listPrice, availability: m.availability, qty: m.qty, status: m.status })),
      beat,
      commissionPct: SELLER_COMMISSION_PCT,
    });
  } catch (err) {
    console.error('[seller-portal/catalog/:id]', err);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

// ─── Listings ──────────────────────────────────────────────────────────────

const LISTING_PRODUCT_FIELDS = 'slug name brand colorway images hoverImage price productType';

function shapeListing(l: any) {
  const p = l.product && typeof l.product === 'object' ? l.product : null;
  return {
    id: String(l._id),
    productId: p ? String(p._id) : String(l.product),
    product: p ? { id: String(p._id), slug: p.slug, name: p.name, brand: p.brand, colorway: p.colorway, image: p.images?.[0] || p.hoverImage || '', storePrice: p.price } : null,
    size: l.size,
    sellerPrice: l.sellerPrice,
    listPrice: l.listPrice,
    availability: l.availability,
    qty: l.qty,
    status: l.status,
    soldCount: l.soldCount ?? 0,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

router.get('/listings', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    const listings = await SellerListing.find({ seller: req.seller!.id })
      .sort({ updatedAt: -1 })
      .populate({ path: 'product', select: LISTING_PRODUCT_FIELDS })
      .lean();
    res.json(listings.map(shapeListing));
  } catch {
    res.status(500).json({ error: 'Failed to load listings' });
  }
});

router.post('/listings', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    const { productId, entries } = req.body;
    if (!isObjectId(productId) || !Array.isArray(entries) || entries.length === 0 || entries.length > 40) {
      res.status(400).json({ error: 'productId and 1-40 size entries are required' });
      return;
    }
    const product = await Product.findById(productId).select(CATALOG_FIELDS).lean() as unknown as LeanProduct | null;
    if (!product || product.comingSoon) {
      res.status(404).json({ error: 'Product not found in catalog. Request it first.' });
      return;
    }

    const prepared: Array<{ size: number | string; sellerPrice: number; availability: 'instant' | 'inhand' | 'eta'; qty: number }> = [];
    const seen = new Set<string>();
    for (const e of entries) {
      const size = normaliseSize(product, e?.size);
      if (size === null) { res.status(400).json({ error: `Size "${e?.size}" is not a valid size for this product` }); return; }
      if (seen.has(String(size))) { res.status(400).json({ error: `Size ${size} appears twice` }); return; }
      seen.add(String(size));
      const sellerPrice = Math.round(Number(e?.sellerPrice));
      if (!isFinite(sellerPrice) || sellerPrice < 500 || sellerPrice > 1000000) {
        res.status(400).json({ error: `Enter a price between ₹500 and ₹10,00,000 for size ${size}` });
        return;
      }
      if (!isAvailability(e?.availability)) { res.status(400).json({ error: `Pick availability for size ${size}` }); return; }
      const qty = Math.floor(Number(e?.qty ?? 1));
      if (!isFinite(qty) || qty < 1 || qty > 50) { res.status(400).json({ error: `Quantity for size ${size} must be 1-50` }); return; }
      prepared.push({ size, sellerPrice, availability: e.availability, qty });
    }

    const saved = [];
    for (const p of prepared) {
      const doc = await SellerListing.findOneAndUpdate(
        { seller: req.seller!.id, product: product._id, size: p.size } as any,
        { $set: { sellerPrice: p.sellerPrice, listPrice: computeListPrice(p.sellerPrice), availability: p.availability, qty: p.qty, status: 'active' } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      ).populate({ path: 'product', select: LISTING_PRODUCT_FIELDS }).lean();
      saved.push(shapeListing(doc));
    }
    res.status(201).json(saved);
  } catch (err) {
    console.error('[seller-portal/listings POST]', err);
    res.status(500).json({ error: 'Failed to save listings' });
  }
});

router.put('/listings/:id', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const listing = await SellerListing.findOne({ _id: req.params.id, seller: req.seller!.id });
    if (!listing) { res.status(404).json({ error: 'Listing not found' }); return; }

    const { sellerPrice, availability, qty, status } = req.body;
    if (sellerPrice !== undefined) {
      const sp = Math.round(Number(sellerPrice));
      if (!isFinite(sp) || sp < 500 || sp > 1000000) { res.status(400).json({ error: 'Price must be between ₹500 and ₹10,00,000' }); return; }
      listing.sellerPrice = sp;
      listing.listPrice = computeListPrice(sp);
    }
    if (availability !== undefined) {
      if (!isAvailability(availability)) { res.status(400).json({ error: 'Invalid availability' }); return; }
      listing.availability = availability;
    }
    if (qty !== undefined) {
      const q = Math.floor(Number(qty));
      if (!isFinite(q) || q < 0 || q > 50) { res.status(400).json({ error: 'Quantity must be 0-50' }); return; }
      listing.qty = q;
    }
    if (status !== undefined) {
      if (status !== 'active' && status !== 'paused') { res.status(400).json({ error: 'Status must be active or paused' }); return; }
      listing.status = status;
    }
    if (listing.qty === 0) listing.status = 'sold_out';
    else if (listing.status === 'sold_out') listing.status = 'active';
    await listing.save();
    const populated = await SellerListing.findById(listing._id).populate({ path: 'product', select: LISTING_PRODUCT_FIELDS }).lean();
    res.json(shapeListing(populated));
  } catch (err) {
    console.error('[seller-portal/listings PUT]', err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

router.delete('/listings/:id', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const result = await SellerListing.deleteOne({ _id: req.params.id, seller: req.seller!.id });
    if (result.deletedCount === 0) { res.status(404).json({ error: 'Listing not found' }); return; }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// ─── Orders ────────────────────────────────────────────────────────────────

function forSeller<T extends { items?: any[]; toObject?: () => any }>(doc: T): any {
  const o: any = typeof doc?.toObject === 'function' ? doc.toObject() : doc;
  return { ...o, items: (o.items || []).map(({ listPrice, ...rest }: any) => rest) };
}

router.get('/orders', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = { seller: req.seller!.id };
    const status = String(req.query.status || '');
    if (['pending_payment', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) filter.status = status;
    const orders = await SellerOrder.find(filter).sort({ createdAt: -1 }).lean();
    res.json(orders.map(forSeller));
  } catch {
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.get('/orders/:id', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller!.id }).lean();
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(forSeller(order));
  } catch {
    res.status(500).json({ error: 'Failed to load order' });
  }
});

router.post('/orders/:id/verification', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller!.id });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (order.status !== 'confirmed') { res.status(400).json({ error: 'This order is not awaiting verification' }); return; }
    if (order.verification.status === 'pending') { res.status(400).json({ error: 'Photos already submitted and awaiting review' }); return; }
    if (order.verification.status === 'approved') { res.status(400).json({ error: 'Verification already approved' }); return; }

    const photos = Array.isArray(req.body.photos) ? req.body.photos : [];
    const validIds = new Set<string>(VERIFICATION_ANGLES.map((a) => a.id));
    const clean: Array<{ angle: string; url: string }> = [];
    for (const p of photos) {
      if (!p || typeof p.angle !== 'string' || typeof p.url !== 'string') continue;
      if (!validIds.has(p.angle) || !/^https:\/\//.test(p.url) || p.url.length > 600) continue;
      if (clean.some((c) => c.angle === p.angle)) continue;
      clean.push({ angle: p.angle, url: p.url });
    }
    const missing = VERIFICATION_ANGLES.filter((a) => a.required && !clean.some((c) => c.angle === a.id));
    if (missing.length) {
      res.status(400).json({ error: `Missing required photos: ${missing.map((m) => m.label).join(', ')}` });
      return;
    }

    order.verification.photos = clean;
    order.verification.status = 'pending';
    order.verification.submittedAt = new Date();
    order.verification.reviewedAt = null;
    order.verification.adminNote = '';
    order.verification.attempts += 1;
    await order.save();

    const seller = await Seller.findById(req.seller!.id).select('name').lean();
    sendAdminVerificationSubmittedEmail(order, seller?.name ?? 'Seller');
    res.json(forSeller(order));
  } catch (err) {
    console.error('[seller-portal/verification]', err);
    res.status(500).json({ error: 'Failed to submit photos' });
  }
});

router.post('/orders/:id/tracking', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    if (!isObjectId(req.params.id)) { res.status(400).json({ error: 'Invalid id' }); return; }
    const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.seller!.id });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (order.trackingLockedAt) {
      res.status(400).json({ error: 'Tracking has already been added. Contact SNKRS CART to change it.' });
      return;
    }
    if (order.status !== 'confirmed' || order.verification.status !== 'approved') {
      res.status(400).json({ error: 'Tracking can be added only after verification is approved' });
      return;
    }
    const deliveryService = String(req.body.deliveryService || '').trim().slice(0, 60);
    const trackingNumber = String(req.body.trackingNumber || '').trim().replace(/\s+/g, '').slice(0, 60);
    if (!deliveryService || trackingNumber.length < 5) {
      res.status(400).json({ error: 'Courier and a valid tracking number are required' });
      return;
    }
    const now = new Date();
    order.deliveryService = deliveryService;
    order.trackingNumber = trackingNumber;
    order.trackingAddedAt = now;
    order.trackingLockedAt = now;
    order.status = 'shipped';
    await order.save();
    await applySellerTrackingToOrder(order, true);
    res.json(forSeller(order));
  } catch (err) {
    console.error('[seller-portal/tracking]', err);
    res.status(500).json({ error: 'Failed to add tracking' });
  }
});

// ─── Product requests ──────────────────────────────────────────────────────

router.get('/requests', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    const requests = await ProductRequest.find({ seller: req.seller!.id })
      .sort({ createdAt: -1 })
      .populate({ path: 'product', select: 'slug name brand images' })
      .lean();
    res.json(requests);
  } catch {
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

router.post('/requests', sellerAuth, async (req: SellerRequest, res: Response): Promise<void> => {
  try {
    const name = String(req.body.name || '').trim().slice(0, 150);
    const brand = String(req.body.brand || '').trim().slice(0, 60);
    const colorway = String(req.body.colorway || '').trim().slice(0, 120);
    const note = String(req.body.note || '').trim().slice(0, 1000);
    const sizes = Array.isArray(req.body.sizes) ? [...new Set(req.body.sizes.map((s: unknown) => String(s).trim()).filter(Boolean))].slice(0, 30) as string[] : [];
    const urls = Array.isArray(req.body.supportingUrls) ? req.body.supportingUrls.map((u: unknown) => String(u).trim()).filter(Boolean).slice(0, 5) as string[] : [];
    if (!name || !brand) { res.status(400).json({ error: 'Product name and brand are required' }); return; }
    if (sizes.length === 0) { res.status(400).json({ error: 'Select at least one size you can supply' }); return; }
    if (urls.length === 0) { res.status(400).json({ error: 'Add at least one supporting link (official page, StockX, GOAT, etc.)' }); return; }
    for (const u of urls) {
      try {
        const parsed = new URL(u);
        if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad');
      } catch {
        res.status(400).json({ error: `"${u}" is not a valid link` });
        return;
      }
    }
    const open = await ProductRequest.countDocuments({ seller: req.seller!.id, status: 'pending' });
    if (open >= 10) { res.status(400).json({ error: 'You have 10 pending requests. Wait for a review before adding more.' }); return; }

    const request = await ProductRequest.create({ seller: req.seller!.id, name, brand, colorway, sizes, supportingUrls: urls, note });
    const seller = await Seller.findById(req.seller!.id).select('name').lean();
    sendAdminProductRequestEmail(seller?.name ?? 'Seller', { name, brand, colorway, sizes, supportingUrls: urls, note });
    res.status(201).json(request);
  } catch (err) {
    console.error('[seller-portal/requests POST]', err);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

export default router;
