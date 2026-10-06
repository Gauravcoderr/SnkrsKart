import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminAuth, AdminRequest } from '../middleware/adminAuth';
import { Product } from '../models/Product';
import { ScrapedProduct } from '../models/ScrapedProduct';
import { RejectedUrl } from '../models/RejectedUrl';
import { uploadToCloudinary } from '../services/scraper/utils';
import { runRenderScraper, ScraperRunResult } from '../services/scraper/index';
import { Brand } from '../models/Brand';
import { pingIndexNow } from '../lib/indexNow';
import { toSlug, buildProductSlug, cascadeProductSlug } from '../lib/productSlug';

// In-memory Render scraper state (resets on Render restart — intentional)
type RenderScraperState =
  | { status: 'idle' }
  | { status: 'running'; startedAt: string }
  | { status: 'done'; startedAt: string; finishedAt: string; result: ScraperRunResult }
  | { status: 'failed'; startedAt: string; finishedAt: string; error: string };
let renderScraperState: RenderScraperState = { status: 'idle' };
import { Inquiry } from '../models/Inquiry';
import { Review } from '../models/Review';
import { Banner } from '../models/Banner';
import { Seller } from '../models/Seller';
import { Blog } from '../models/Blog';
import { Order } from '../models/Order';
import { Newsletter } from '../models/Newsletter';
import { User } from '../models/User';
import ChatLead from '../models/ChatLead';
import { DealVerification } from '../models/DealVerification';
import { SneakerProfile } from '../models/SneakerProfile';
import { Drop } from '../models/Drop';
import { SiteContent } from '../models/SiteContent';
import { Coupon } from '../models/Coupon';
import { sendProductLaunchBlast, sendBlogPublishBlast, sendCustomBlast } from '../lib/marketingEmails';
import { sendMail } from '../lib/mailer';
import { syncBrevoUnsubscribes } from '../lib/syncUnsubscribes';
import { IOrder } from '../models/Order';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { SellerListing, computeListPrice, isAvailability } from '../models/SellerListing';
import { SellerOrder } from '../models/SellerOrder';
import { ProductRequest } from '../models/ProductRequest';
import { applySellerTrackingToOrder, syncSellerOrdersWithOrder } from '../lib/sellerOrders';
import { sendSellerCredentialsEmail, sendSellerVerificationResultEmail, sendSellerProductRequestResultEmail, sendSellerPayoutEmail } from '../lib/sellerEmails';
import { sendOrderCancelledEmail, sendReviewRequestEmail } from '../lib/orderEmails';
import { registerOrderShipment, getTracking, applyRawTracking } from '../services/aftership';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_USERNAME || !ADMIN_PASSWORD) throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD env vars are required');
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// ─── Auth ──────────────────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  if (username !== ADMIN_USERNAME || !bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username });
});

router.get('/me', adminAuth, (req: AdminRequest, res: Response) => {
  res.json({ username: req.admin?.username });
});

// ─── Products CRUD ─────────────────────────────────────────────────────────

// List all products (admin view - no pagination limit)
router.get('/products', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json(products.map((p) => ({ ...p, id: p._id.toString() })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product
router.post('/products', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    if (!data.name || !data.brand) {
      res.status(400).json({ error: 'Name and brand are required' });
      return;
    }

    data.slug = data.slug
      ? buildProductSlug(data.slug, data.brand)
      : buildProductSlug(`${data.brand}-${data.name}-${data.colorway || ''}`, data.brand);

    const existing = await Product.findOne({ slug: data.slug }).lean();
    if (existing) {
      res.status(409).json({ error: 'Product with this slug already exists' });
      return;
    }

    const { triggerEmail = true, emailSubject, emailHtml, ...productData } = data;
    if (productData.soldOut === true) {
      productData.availableSizes = [];
      productData.availableStringSizes = [];
    }
    if (productData.trending === true) {
      productData.trendingSince = new Date();
    }
    const product = await Product.create(productData);
    await syncBrandCounts();
    pingIndexNow([`/products/${product.slug}`]);
    if (triggerEmail !== false) {
      const subject = emailSubject || `Just Dropped: ${product.name}`;
      const html = emailHtml || undefined;
      sendProductLaunchBlast({ name: product.name, slug: product.slug, brand: product.brand, colorway: product.colorway, images: product.images, price: product.price }, subject, html)
        .catch((err: Error) => console.error('[email] product blast failed:', err));
    }
    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// Update product
router.put('/products/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const update = { ...req.body };
    delete update.previousSlugs;
    const before = await Product.findById(req.params.id).select('slug brand').lean();
    if (update.slug) {
      update.slug = buildProductSlug(update.slug, update.brand ?? before?.brand);
      const dup = await Product.findOne({ slug: update.slug, _id: { $ne: req.params.id } }).lean();
      if (dup) {
        res.status(409).json({ error: 'Product with this slug already exists' });
        return;
      }
    }
    if (update.soldOut === true) {
      update.availableSizes = [];
      update.availableStringSizes = [];
    }
    if (typeof update.trending === 'boolean') {
      if (update.trending) {
        const current = await Product.findById(req.params.id).select('trending').lean();
        if (!current?.trending) update.trendingSince = new Date();
      } else {
        update.trendingSince = null;
      }
    }
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: update }, { returnDocument: 'after', runValidators: true });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    if (before && before.slug !== product.slug) {
      await cascadeProductSlug(before.slug, product.slug);
      pingIndexNow([`/products/${before.slug}`, `/products/${product.slug}`]);
    }
    await syncBrandCounts();
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    await syncBrandCounts();
    res.json({ message: 'Product deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─── Banners ───────────────────────────────────────────────────────────────

router.get('/banners', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const banners = await Banner.find().sort({ order: 1 }).lean();
    res.json(banners);
  } catch {
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

router.post('/banners', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create banner' });
  }
});

router.put('/banners/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, { $set: req.body }, { returnDocument: 'after', runValidators: true });
    if (!banner) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(banner);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update banner' });
  }
});

router.delete('/banners/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// ─── Inquiries ─────────────────────────────────────────────────────────────

router.get('/inquiries', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }).lean();
    res.json(inquiries);
  } catch {
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

router.get('/inquiries/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const inquiry = await Inquiry.findById(req.params.id).lean();
    if (!inquiry) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(inquiry);
  } catch {
    res.status(500).json({ error: 'Failed to fetch inquiry' });
  }
});

// ─── Reviews ───────────────────────────────────────────────────────────────

router.get('/reviews', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.put('/reviews/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, rating, comment } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: { name, rating, comment } },
      { returnDocument: 'after', runValidators: true }
    );
    if (!review) { res.status(404).json({ error: 'Not found' }); return; }
    if (review.productSlug !== 'general') {
      const all = await Review.find({ productSlug: review.productSlug }).lean();
      const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
      await Product.findOneAndUpdate({ slug: review.productSlug }, { rating: Math.round(avg * 10) / 10, reviewCount: all.length });
    }
    res.json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update review' });
  }
});

router.delete('/reviews/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) { res.status(404).json({ error: 'Not found' }); return; }
    if (review.productSlug !== 'general') {
      const all = await Review.find({ productSlug: review.productSlug }).lean();
      const newRating = all.length ? Math.round((all.reduce((s, r) => s + r.rating, 0) / all.length) * 10) / 10 : 0;
      await Product.findOneAndUpdate({ slug: review.productSlug }, { rating: newRating, reviewCount: all.length });
    }
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ─── Sellers ───────────────────────────────────────────────────────────────

const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
function generateTempPassword(): string {
  const bytes = crypto.randomBytes(10);
  return [...bytes].map((b) => PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]).join('');
}

const SELLER_LISTING_PRODUCT_FIELDS = 'slug name brand colorway images hoverImage price';

function shapeAdminSeller(s: any, counts?: { listings?: number; orders?: number }) {
  return {
    _id: String(s._id),
    name: s.name,
    email: s.email,
    phone: s.phone,
    brandsSell: s.brandsSell ?? '',
    pairsCount: s.pairsCount ?? '',
    message: s.message ?? '',
    status: s.status ?? 'applied',
    hasPassword: !!s.passwordHash,
    mustChangePassword: !!s.mustChangePassword,
    businessName: s.businessName ?? '',
    addressLine: s.addressLine ?? '',
    city: s.city ?? '',
    state: s.state ?? '',
    pincode: s.pincode ?? '',
    whatsapp: s.whatsapp ?? '',
    upiId: s.upiId ?? '',
    lastLoginAt: s.lastLoginAt ?? null,
    createdAt: s.createdAt,
    listingCount: counts?.listings ?? 0,
    orderCount: counts?.orders ?? 0,
  };
}

router.get('/sellers', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [sellers, listingCounts, orderCounts] = await Promise.all([
      Seller.find().sort({ createdAt: -1 }).lean(),
      SellerListing.aggregate([{ $group: { _id: '$seller', count: { $sum: 1 } } }]),
      SellerOrder.aggregate([{ $group: { _id: '$seller', count: { $sum: 1 } } }]),
    ]);
    const lc = new Map(listingCounts.map((r: any) => [String(r._id), r.count]));
    const oc = new Map(orderCounts.map((r: any) => [String(r._id), r.count]));
    res.json(sellers.map((s) => shapeAdminSeller(s, { listings: lc.get(String(s._id)), orders: oc.get(String(s._id)) })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

router.post('/sellers', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    if (!name || !email || !phone) { res.status(400).json({ error: 'Name, email and phone are required' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { res.status(400).json({ error: 'Invalid email address' }); return; }
    const clash = await Seller.findOne({ email, passwordHash: { $ne: null } }).lean();
    if (clash) { res.status(409).json({ error: 'A seller account with this email already exists' }); return; }

    const tempPassword = generateTempPassword();
    const seller = await Seller.create({
      name, email, phone,
      businessName: String(req.body.businessName || '').trim(),
      addressLine: String(req.body.addressLine || '').trim().slice(0, 300),
      city: String(req.body.city || '').trim(),
      state: String(req.body.state || '').trim().slice(0, 80),
      pincode: String(req.body.pincode || '').replace(/\D/g, '').slice(0, 6),
      whatsapp: String(req.body.whatsapp || phone).replace(/[^\d+]/g, ''),
      status: 'active',
      passwordHash: await bcrypt.hash(tempPassword, 10),
      mustChangePassword: true,
    });
    sendSellerCredentialsEmail(email, name, tempPassword, false);
    res.status(201).json({ seller: shapeAdminSeller(seller), tempPassword });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create seller' });
  }
});

router.get('/sellers/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const seller = await Seller.findById(req.params.id).lean();
    if (!seller) { res.status(404).json({ error: 'Not found' }); return; }
    const [listings, orders, requests] = await Promise.all([
      SellerListing.find({ seller: seller._id }).sort({ updatedAt: -1 }).populate({ path: 'product', select: SELLER_LISTING_PRODUCT_FIELDS }).lean(),
      SellerOrder.find({ seller: seller._id }).sort({ createdAt: -1 }).lean(),
      ProductRequest.find({ seller: seller._id }).sort({ createdAt: -1 }).populate({ path: 'product', select: 'slug name brand' }).lean(),
    ]);
    res.json({ seller: shapeAdminSeller(seller, { listings: listings.length, orders: orders.length }), listings, orders, requests });
  } catch {
    res.status(500).json({ error: 'Failed to fetch seller' });
  }
});

router.put('/sellers/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, name, phone, businessName, addressLine, city, state, pincode, whatsapp, upiId } = req.body;
    const update: Record<string, unknown> = {};
    if (typeof addressLine === 'string') update.addressLine = addressLine.trim().slice(0, 300);
    if (typeof state === 'string') update.state = state.trim().slice(0, 80);
    if (typeof pincode === 'string') update.pincode = pincode.replace(/\D/g, '').slice(0, 6);
    if (status !== undefined) {
      if (!['applied', 'active', 'suspended'].includes(status)) { res.status(400).json({ error: 'Invalid status' }); return; }
      update.status = status;
    }
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (typeof phone === 'string' && phone.trim()) update.phone = phone.trim();
    if (typeof businessName === 'string') update.businessName = businessName.trim();
    if (typeof city === 'string') update.city = city.trim();
    if (typeof whatsapp === 'string') update.whatsapp = whatsapp.replace(/[^\d+]/g, '');
    if (typeof upiId === 'string') update.upiId = upiId.trim();
    const seller = await Seller.findByIdAndUpdate(req.params.id, { $set: update }, { returnDocument: 'after' }).lean();
    if (!seller) { res.status(404).json({ error: 'Not found' }); return; }
    if (update.status === 'suspended') {
      await SellerListing.updateMany({ seller: seller._id, status: 'active' }, { $set: { status: 'paused' } });
    }
    res.json(shapeAdminSeller(seller));
  } catch {
    res.status(500).json({ error: 'Failed to update seller' });
  }
});

async function issueSellerPassword(sellerId: string, isReset: boolean, res: Response): Promise<void> {
  const seller = await Seller.findById(sellerId);
  if (!seller) { res.status(404).json({ error: 'Not found' }); return; }
  const clash = await Seller.findOne({ _id: { $ne: seller._id }, email: seller.email, passwordHash: { $ne: null } }).lean();
  if (clash) { res.status(409).json({ error: 'Another seller account already uses this email' }); return; }
  const tempPassword = generateTempPassword();
  seller.passwordHash = await bcrypt.hash(tempPassword, 10);
  seller.mustChangePassword = true;
  seller.status = 'active';
  if (!seller.whatsapp) seller.whatsapp = seller.phone.replace(/[^\d+]/g, '');
  await seller.save();
  sendSellerCredentialsEmail(seller.email, seller.name, tempPassword, isReset);
  res.json({ seller: shapeAdminSeller(seller), tempPassword });
}

router.post('/sellers/:id/activate', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try { await issueSellerPassword(req.params.id, false, res); }
  catch { res.status(500).json({ error: 'Failed to activate seller' }); }
});

router.post('/sellers/:id/reset-password', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try { await issueSellerPassword(req.params.id, true, res); }
  catch { res.status(500).json({ error: 'Failed to reset password' }); }
});

router.delete('/sellers/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const seller = await Seller.findByIdAndDelete(req.params.id);
    if (!seller) { res.status(404).json({ error: 'Not found' }); return; }
    await SellerListing.deleteMany({ seller: seller._id });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete seller' });
  }
});

// ─── Seller listings (admin control) ───────────────────────────────────────

router.put('/seller-listings/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await SellerListing.findById(req.params.id);
    if (!listing) { res.status(404).json({ error: 'Not found' }); return; }
    const { status, qty, sellerPrice, availability } = req.body;
    if (status !== undefined) {
      if (!['active', 'paused', 'sold_out'].includes(status)) { res.status(400).json({ error: 'Invalid status' }); return; }
      listing.status = status;
    }
    if (qty !== undefined) {
      const q = Math.floor(Number(qty));
      if (!isFinite(q) || q < 0) { res.status(400).json({ error: 'Invalid qty' }); return; }
      listing.qty = q;
    }
    if (sellerPrice !== undefined) {
      const sp = Math.round(Number(sellerPrice));
      if (!isFinite(sp) || sp <= 0) { res.status(400).json({ error: 'Invalid price' }); return; }
      listing.sellerPrice = sp;
      listing.listPrice = computeListPrice(sp);
    }
    if (availability !== undefined) {
      if (!isAvailability(availability)) { res.status(400).json({ error: 'Invalid availability' }); return; }
      listing.availability = availability;
    }
    await listing.save();
    const populated = await SellerListing.findById(listing._id).populate({ path: 'product', select: SELLER_LISTING_PRODUCT_FIELDS }).lean();
    res.json(populated);
  } catch {
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

router.delete('/seller-listings/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await SellerListing.findByIdAndDelete(req.params.id);
    if (!result) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// ─── Seller orders ─────────────────────────────────────────────────────────

const SELLER_ORDER_SELLER_FIELDS = 'name email phone whatsapp businessName addressLine city state pincode';

router.get('/seller-orders', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    const status = String(req.query.status || '');
    const verification = String(req.query.verification || '');
    if (['pending_payment', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) filter.status = status;
    if (['none', 'pending', 'approved', 'rejected'].includes(verification)) filter['verification.status'] = verification;
    const payout = String(req.query.payout || '');
    if (['pending', 'due', 'paid'].includes(payout)) filter['payout.status'] = payout;
    const orders = await SellerOrder.find(filter).sort({ createdAt: -1 }).populate({ path: 'seller', select: SELLER_ORDER_SELLER_FIELDS }).lean();
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch seller orders' });
  }
});

router.get('/seller-orders/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await SellerOrder.findById(req.params.id).populate({ path: 'seller', select: SELLER_ORDER_SELLER_FIELDS }).lean();
    if (!order) { res.status(404).json({ error: 'Not found' }); return; }
    const parent = await Order.findById(order.order).select('name email phone addressLine city state pincode status paymentStatus trackingNumber deliveryService').lean();
    res.json({ ...order, customer: parent });
  } catch {
    res.status(500).json({ error: 'Failed to fetch seller order' });
  }
});

router.put('/seller-orders/:id/verification', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, adminNote } = req.body;
    if (status !== 'approved' && status !== 'rejected') { res.status(400).json({ error: 'Status must be approved or rejected' }); return; }
    const order = await SellerOrder.findById(req.params.id);
    if (!order) { res.status(404).json({ error: 'Not found' }); return; }
    if (order.verification.photos.length === 0) { res.status(400).json({ error: 'Seller has not submitted photos yet' }); return; }
    order.verification.status = status;
    order.verification.adminNote = typeof adminNote === 'string' ? adminNote.trim().slice(0, 1000) : '';
    order.verification.reviewedAt = new Date();
    await order.save();
    const seller = await Seller.findById(order.seller).select('name email').lean();
    if (seller) sendSellerVerificationResultEmail(seller.email, seller.name, order);
    const populated = await SellerOrder.findById(order._id).populate({ path: 'seller', select: SELLER_ORDER_SELLER_FIELDS }).lean();
    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update verification' });
  }
});

router.put('/seller-orders/:id/tracking', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await SellerOrder.findById(req.params.id);
    if (!order) { res.status(404).json({ error: 'Not found' }); return; }
    const deliveryService = String(req.body.deliveryService || '').trim().slice(0, 60);
    const trackingNumber = String(req.body.trackingNumber || '').trim().replace(/\s+/g, '').slice(0, 60);
    if (!deliveryService || trackingNumber.length < 5) { res.status(400).json({ error: 'Courier and tracking number are required' }); return; }
    const firstTime = !order.trackingNumber;
    const changed = order.trackingNumber !== trackingNumber || order.deliveryService !== deliveryService;
    const now = new Date();
    order.deliveryService = deliveryService;
    order.trackingNumber = trackingNumber;
    order.trackingAddedAt = order.trackingAddedAt ?? now;
    order.trackingLockedAt = order.trackingLockedAt ?? now;
    if (order.status === 'confirmed') order.status = 'shipped';
    await order.save();
    await applySellerTrackingToOrder(order, firstTime || (changed && req.body.notifyCustomer === true));
    const populated = await SellerOrder.findById(order._id).populate({ path: 'seller', select: SELLER_ORDER_SELLER_FIELDS }).lean();
    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update tracking' });
  }
});

router.put('/seller-orders/:id/payout', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await SellerOrder.findById(req.params.id);
    if (!order) { res.status(404).json({ error: 'Not found' }); return; }
    if (order.status !== 'delivered') { res.status(400).json({ error: 'Payout can be marked only after the order is delivered' }); return; }
    const screenshotUrl = String(req.body.screenshotUrl || '').trim();
    if (!/^https:\/\//.test(screenshotUrl) || screenshotUrl.length > 600) {
      res.status(400).json({ error: 'A payment screenshot is required' });
      return;
    }
    const amount = req.body.amount !== undefined ? Math.round(Number(req.body.amount)) : order.sellerTotal;
    if (!isFinite(amount) || amount <= 0) { res.status(400).json({ error: 'Invalid payout amount' }); return; }
    const firstTime = order.payout.status !== 'paid';
    order.payout.status = 'paid';
    order.payout.amount = amount;
    order.payout.paidAt = order.payout.paidAt ?? new Date();
    order.payout.screenshotUrl = screenshotUrl;
    order.payout.reference = String(req.body.reference || '').trim().slice(0, 80);
    order.payout.note = String(req.body.note || '').trim().slice(0, 500);
    await order.save();
    if (firstTime) {
      const seller = await Seller.findById(order.seller).select('name email').lean();
      if (seller) sendSellerPayoutEmail(seller.email, seller.name, order);
    }
    const populated = await SellerOrder.findById(order._id).populate({ path: 'seller', select: SELLER_ORDER_SELLER_FIELDS + ' upiId' }).lean();
    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to record payout' });
  }
});

router.post('/seller-orders/:id/sync-tracking', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await SellerOrder.findById(req.params.id);
    if (!order) { res.status(404).json({ error: 'Not found' }); return; }
    if (!order.shipment?.aftershipId) {
      const parent = await Order.findById(order.order);
      const { registerSellerShipment } = await import('../services/aftership');
      await registerSellerShipment(order, parent && parent.items.every((it) => it.listingId) ? parent : null);
    } else {
      const raw = await getTracking(order.shipment.aftershipId);
      if (raw) await applyRawTracking(raw);
    }
    const populated = await SellerOrder.findById(order._id).populate({ path: 'seller', select: SELLER_ORDER_SELLER_FIELDS }).lean();
    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sync tracking' });
  }
});

router.get('/payouts', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const orders = await SellerOrder.find({ status: 'delivered' })
      .sort({ 'payout.status': 1, 'payout.dueAt': 1, deliveredAt: -1 })
      .populate({ path: 'seller', select: SELLER_ORDER_SELLER_FIELDS + ' upiId' })
      .lean();
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// ─── Product requests ──────────────────────────────────────────────────────

router.get('/product-requests', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    const status = String(req.query.status || '');
    if (['pending', 'approved', 'rejected'].includes(status)) filter.status = status;
    const requests = await ProductRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: 'seller', select: 'name email phone businessName' })
      .populate({ path: 'product', select: 'slug name brand images' })
      .lean();
    res.json(requests);
  } catch {
    res.status(500).json({ error: 'Failed to fetch product requests' });
  }
});

router.put('/product-requests/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, adminNote, productId } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) { res.status(400).json({ error: 'Invalid status' }); return; }
    const request = await ProductRequest.findById(req.params.id);
    if (!request) { res.status(404).json({ error: 'Not found' }); return; }

    let productSlug: string | undefined;
    if (status === 'approved') {
      if (!productId || !mongoose.isValidObjectId(productId)) {
        res.status(400).json({ error: 'Pick the catalog product this request was added as' });
        return;
      }
      const product = await Product.findById(productId).select('slug').lean();
      if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
      request.product = product._id as any;
      productSlug = product.slug;
    }
    const prevStatus = request.status;
    request.status = status;
    request.adminNote = typeof adminNote === 'string' ? adminNote.trim().slice(0, 1000) : '';
    request.reviewedAt = status === 'pending' ? null : new Date();
    await request.save();

    if (status !== 'pending' && (prevStatus !== status || request.adminNote)) {
      const seller = await Seller.findById(request.seller).select('name email').lean();
      if (seller) sendSellerProductRequestResultEmail(seller.email, seller.name, { name: request.name, brand: request.brand, status, adminNote: request.adminNote }, productSlug);
    }
    const populated = await ProductRequest.findById(request._id)
      .populate({ path: 'seller', select: 'name email phone businessName' })
      .populate({ path: 'product', select: 'slug name brand images' })
      .lean();
    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update request' });
  }
});

// ─── Blogs ─────────────────────────────────────────────────────────────────

router.get('/blogs', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
    res.json(blogs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

router.get('/blogs/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findById(req.params.id).lean();
    if (!blog) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(blog);
  } catch {
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

router.post('/blogs', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    if (!data.title) { res.status(400).json({ error: 'Title is required' }); return; }
    if (!data.slug) data.slug = toSlug(data.title);
    const existing = await Blog.findOne({ slug: data.slug }).lean();
    if (existing) { res.status(409).json({ error: 'Slug already exists' }); return; }
    const { triggerEmail = true, emailSubject, emailHtml, ...blogData } = data;
    const blog = await Blog.create(blogData);
    if (blog.published) {
      pingIndexNow([`/blogs/${blog.slug}`]);
      if (triggerEmail !== false) {
        const subject = emailSubject || `New on the Blog: ${blog.title}`;
        const html = emailHtml || undefined;
        sendBlogPublishBlast({ title: blog.title, slug: blog.slug, coverImage: blog.coverImage, excerpt: blog.excerpt }, subject, html)
          .catch((err: Error) => console.error('[email] blog blast failed:', err));
      }
    }
    res.status(201).json(blog);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create blog' });
  }
});

router.put('/blogs/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.body.content !== undefined) {
      req.body.wordCount = (req.body.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    }
    const before = await Blog.findById(req.params.id).lean();
    const blog = await Blog.findByIdAndUpdate(req.params.id, { $set: req.body }, { returnDocument: 'after', runValidators: true });
    if (!blog) { res.status(404).json({ error: 'Not found' }); return; }
    // fire email + IndexNow ping when draft is published for the first time
    if (req.body.published === true && before && !before.published) {
      pingIndexNow([`/blogs/${blog.slug}`]);
      sendBlogPublishBlast({ title: blog.title, slug: blog.slug, coverImage: blog.coverImage, excerpt: blog.excerpt })
        .catch((err: Error) => console.error('[email] blog publish blast failed:', err));
    }
    res.json(blog);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update blog' });
  }
});

router.delete('/blogs/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// ─── Orders ────────────────────────────────────────────────────────────────

router.get('/orders', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/orders/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.put('/orders/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, trackingNumber, deliveryService, notes, cancelReason } = req.body;
    const existing = await Order.findById(req.params.id).select('status deliveredAt trackingNumber deliveryService').lean();
    if (!existing) { res.status(404).json({ error: 'Order not found' }); return; }

    const update: Record<string, unknown> = {};
    if (status) {
      update.status = status;
      if (status === 'delivered' && !existing.deliveredAt) update.deliveredAt = new Date();
    }
    if (trackingNumber !== undefined) update.trackingNumber = trackingNumber;
    if (deliveryService !== undefined) update.deliveryService = deliveryService;
    if (notes !== undefined) update.notes = notes;
    if (cancelReason !== undefined) update.cancelReason = cancelReason;
    const order = await Order.findByIdAndUpdate(req.params.id, { $set: update }, { returnDocument: 'after', runValidators: true });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
    if (status === 'cancelled' && existing.status !== 'cancelled') {
      sendOrderCancelledEmail(order, siteUrl, cancelReason || order.cancelReason || undefined);
    }
    if (status === 'delivered' && existing.status !== 'delivered') {
      sendReviewRequestEmail(order, siteUrl);
    }
    if (status && status !== existing.status) {
      syncSellerOrdersWithOrder(order._id, status, cancelReason || order.cancelReason || undefined)
        .catch((e) => console.error('[sellerOrders] sync failed', e));
    }
    const trackingChanged = order.trackingNumber && order.deliveryService
      && (order.trackingNumber !== existing.trackingNumber || order.deliveryService !== existing.deliveryService);
    if (trackingChanged && !order.items.some((it) => it.listingId)) {
      registerOrderShipment(order).catch((e) => console.error('[aftership] register order failed', e));
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update order' });
  }
});

// ─── Users ─────────────────────────────────────────────────────────────────

router.get('/users', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find()
      .select('-otp -otpExpiry -otpAttempts -lastOtpSent -refreshToken -refreshTokens')
      .sort({ createdAt: -1 })
      .lean();
    const result = await Promise.all(users.map(async (u) => {
      const [orderCount, spend] = await Promise.all([
        Order.countDocuments({ email: u.email }),
        Order.aggregate([
          { $match: { email: u.email, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);
      return { ...u, id: u._id.toString(), orderCount, totalSpend: spend[0]?.total ?? 0 };
    }));
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
      .select('-otp -otpExpiry -otpAttempts -lastOtpSent -refreshToken -refreshTokens')
      .lean();
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const [orders, assigned] = await Promise.all([
      Order.find({ email: user.email }).sort({ createdAt: -1 }).lean(),
      Coupon.find({ 'assignedUsers.user': user._id }).sort({ createdAt: -1 }).lean(),
    ]);
    const coupons = assigned.map(({ assignedUsers, usedBy: _usedBy, ...c }) => {
      const a = assignedUsers.find((x) => String(x.user) === String(user._id))!;
      return { ...c, maxUses: a.maxUses, usedCount: a.usedCount };
    });
    res.json({ ...user, id: user._id.toString(), orders, coupons });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/users/:id/coupons', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { couponId } = req.body;
    const maxUses = Math.floor(Number(req.body.maxUses));
    if (!couponId || !Number.isFinite(maxUses) || maxUses < 1) {
      res.status(400).json({ error: 'couponId and maxUses (>= 1) are required' });
      return;
    }
    const user = await User.findById(req.params.id).select('_id').lean();
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const updated = await Coupon.findOneAndUpdate(
      { _id: couponId, 'assignedUsers.user': user._id },
      { $set: { 'assignedUsers.$.maxUses': maxUses } },
      { new: true },
    );
    if (updated) { res.json({ coupon: updated }); return; }

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { $push: { assignedUsers: { user: user._id, maxUses, usedCount: 0 } } },
      { new: true },
    );
    if (!coupon) { res.status(404).json({ error: 'Coupon not found' }); return; }
    res.status(201).json({ coupon });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to assign coupon' });
  }
});

router.delete('/users/:id/coupons/:couponId', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.couponId,
      { $pull: { assignedUsers: { user: req.params.id } } },
      { new: true },
    );
    if (!coupon) { res.status(404).json({ error: 'Coupon not found' }); return; }
    res.json({ message: 'Coupon unassigned' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to unassign coupon' });
  }
});

// ─── Newsletter ─────────────────────────────────────────────────────────────

router.get('/newsletter', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 }).lean();
    res.json(subscribers.map((s) => ({ ...s, source: s.source || 'subscribed', unsubscribed: !!s.unsubscribed, bounced: !!s.bounced })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// POST /admin/newsletter/sync-unsubscribes — pull Brevo blacklist, flag rows
router.post('/newsletter/sync-unsubscribes', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await syncBrevoUnsubscribes();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Unsubscribe sync error:', err);
    res.status(500).json({ error: 'Failed to sync unsubscribes' });
  }
});

// POST /admin/newsletter/upload — bulk import contacts (source: uploaded)
// body: { contacts: [{ email?, name?, phone? }] }  — dedup on email OR phone
router.post('/newsletter/upload', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const raw = Array.isArray(req.body?.contacts) ? req.body.contacts : [];
    if (raw.length === 0) { res.status(400).json({ error: 'contacts array required' }); return; }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let inserted = 0, skipped = 0, invalid = 0;

    for (const c of raw) {
      const email = c?.email ? String(c.email).trim().toLowerCase() : '';
      const phone = c?.phone ? String(c.phone).trim() : '';
      const name = c?.name ? String(c.name).trim() : '';

      if (email && !emailRe.test(email)) { invalid++; continue; }
      if (!email && !phone) { invalid++; continue; } // need at least one identifier

      // dedup: skip if email OR phone already exists
      const or: any[] = [];
      if (email) or.push({ email });
      if (phone) or.push({ phone });
      const exists = or.length ? await Newsletter.findOne({ $or: or }).lean() : null;
      if (exists) { skipped++; continue; }

      try {
        await Newsletter.create({
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          ...(name ? { name } : {}),
          source: 'uploaded',
        });
        inserted++;
      } catch {
        skipped++; // race on unique email
      }
    }

    res.json({ success: true, inserted, skipped, invalid, total: raw.length });
  } catch (err) {
    console.error('Newsletter upload error:', err);
    res.status(500).json({ error: 'Failed to upload contacts' });
  }
});

// POST /admin/newsletter — manually add one contact (source: uploaded)
router.post('/newsletter', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : '';
    const phone = req.body?.phone ? String(req.body.phone).trim() : '';
    const name = req.body?.name ? String(req.body.name).trim() : '';

    if (!email && !phone) { res.status(400).json({ error: 'Email or phone is required' }); return; }
    if (email && !emailRe.test(email)) { res.status(400).json({ error: 'Invalid email address' }); return; }

    const or: any[] = [];
    if (email) or.push({ email });
    if (phone) or.push({ phone });
    const exists = or.length ? await Newsletter.findOne({ $or: or }).lean() : null;
    if (exists) { res.status(409).json({ error: 'A contact with this email or phone already exists' }); return; }

    const doc = await Newsletter.create({
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(name ? { name } : {}),
      source: 'uploaded',
    });
    res.status(201).json({ ...doc.toObject(), source: doc.source });
  } catch (err) {
    console.error('Newsletter add error:', err);
    res.status(500).json({ error: 'Failed to add contact' });
  }
});

// PUT /admin/newsletter/:id — edit a contact
router.put('/newsletter/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : '';
    const phone = req.body?.phone ? String(req.body.phone).trim() : '';
    const name = req.body?.name ? String(req.body.name).trim() : '';

    if (!email && !phone) { res.status(400).json({ error: 'Email or phone is required' }); return; }
    if (email && !emailRe.test(email)) { res.status(400).json({ error: 'Invalid email address' }); return; }

    // dedup against OTHER docs
    const or: any[] = [];
    if (email) or.push({ email });
    if (phone) or.push({ phone });
    if (or.length) {
      const clash = await Newsletter.findOne({ $or: or, _id: { $ne: req.params.id } }).lean();
      if (clash) { res.status(409).json({ error: 'Another contact already uses this email or phone' }); return; }
    }

    const updated = await Newsletter.findByIdAndUpdate(
      req.params.id,
      { email: email || undefined, phone: phone || undefined, name: name || undefined },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) { res.status(404).json({ error: 'Contact not found' }); return; }
    res.json({ ...updated, source: updated.source || 'subscribed' });
  } catch (err) {
    console.error('Newsletter update error:', err);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /admin/newsletter/:id
router.delete('/newsletter/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Newsletter.findByIdAndDelete(req.params.id).lean();
    if (!deleted) { res.status(404).json({ error: 'Contact not found' }); return; }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// ─── Chat Leads ────────────────────────────────────────────────────────────

router.get('/chat-leads', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const leads = await ChatLead.find().sort({ capturedAt: -1 }).lean();
    res.json(leads);
  } catch {
    res.status(500).json({ error: 'Failed to fetch chat leads' });
  }
});

router.delete('/chat-leads/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await ChatLead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ─── Deal Verifications ────────────────────────────────────────────────────

router.get('/deal-verifications', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const deals = await DealVerification.find().sort({ submittedAt: -1 }).lean();
    res.json(deals.map((d) => ({ ...d, id: d._id.toString() })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch deal verifications' });
  }
});

router.put('/deal-verifications/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, adminNote } = req.body;
    if (!status || !['pending', 'real', 'fake', 'inconclusive'].includes(status)) {
      res.status(400).json({ error: 'Valid status required' });
      return;
    }

    const deal = await DealVerification.findByIdAndUpdate(
      req.params.id,
      { $set: { status, adminNote: adminNote ?? '', reviewedAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!deal) { res.status(404).json({ error: 'Deal not found' }); return; }

    // Notify user of verdict
    const verdictLabel: Record<string, string> = {
      real: 'REAL DEAL',
      fake: 'FAKE / SUSPICIOUS',
      inconclusive: 'INCONCLUSIVE',
    };
    const verdictColor: Record<string, string> = {
      real: '#16a34a',
      fake: '#dc2626',
      inconclusive: '#d97706',
    };
    const label = verdictLabel[status] ?? status.toUpperCase();
    const color = verdictColor[status] ?? '#111';

    const { sendMail } = await import('../lib/mailer');
    sendMail({
      to: deal.userEmail,
      subject: `Deal Check Result: ${deal.productName} — ${label}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;">
          <div style="background:#111;padding:16px;text-align:center;border-radius:8px 8px 0 0;">
            <img src="https://snkrs-kart.vercel.app/logo.jpg" alt="SNKRS CART" style="height:40px;width:auto;" />
          </div>
          <div style="background:#fafafa;padding:32px 24px;border-radius:0 0 8px 8px;border:1px solid #eee;">
            <h2 style="margin:0 0 8px;color:#111;font-size:18px;">Deal Verification Result</h2>
            <p style="color:#555;font-size:14px;margin:0 0 16px;">Product: <strong>${deal.productName}</strong></p>
            <div style="background:${color};color:#fff;font-size:20px;font-weight:900;letter-spacing:2px;text-align:center;padding:14px;border-radius:6px;margin:0 0 16px;">${label}</div>
            ${adminNote ? `<p style="color:#444;font-size:14px;background:#fff;border:1px solid #e5e7eb;padding:12px;border-radius:6px;margin:0 0 16px;"><strong>Our note:</strong> ${adminNote}</p>` : ''}
            <a href="https://www.snkrscart.com/products/${deal.productSlug}" style="display:block;background:#111;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;text-align:center;">View Product on SNKRS CART</a>
            <p style="color:#999;font-size:11px;margin:16px 0 0;text-align:center;">We verify deals to help you shop smart. Stay real.</p>
          </div>
        </div>
      `,
    });

    res.json({ ...deal.toObject(), id: deal._id.toString() });
  } catch (err) {
    console.error('[admin/deal-verifications PUT]', err);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// ─── Sneaker Profiles CRUD ─────────────────────────────────────────────────

router.get('/sneaker-profiles', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const profiles = await SneakerProfile.find().sort({ name: 1 }).lean();
    res.json(profiles);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sneaker profiles' });
  }
});

router.post('/sneaker-profiles', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, brand } = req.body;
    if (!name || !brand) { res.status(400).json({ error: 'name and brand are required' }); return; }
    const slug = req.body.slug || toSlug(`${brand}-${name}`);
    const profile = await SneakerProfile.create({ ...req.body, slug });
    res.status(201).json(profile);
  } catch (err: any) {
    if (err.code === 11000) { res.status(409).json({ error: 'Slug already exists' }); return; }
    res.status(500).json({ error: 'Failed to create sneaker profile' });
  }
});

router.put('/sneaker-profiles/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await SneakerProfile.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!profile) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(profile);
  } catch {
    res.status(500).json({ error: 'Failed to update sneaker profile' });
  }
});

router.delete('/sneaker-profiles/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await SneakerProfile.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ─── Drops CRUD ────────────────────────────────────────────────────────────

router.get('/drops', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const [drops, total] = await Promise.all([
      Drop.find().sort({ releaseDate: 1 }).skip(skip).limit(limit).lean(),
      Drop.countDocuments(),
    ]);
    res.json({ drops, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch drops' });
  }
});

router.post('/drops', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, brand, releaseDate } = req.body;
    if (!name || !brand || !releaseDate) { res.status(400).json({ error: 'name, brand and releaseDate are required' }); return; }
    const slug = req.body.slug || toSlug(`${brand}-${name}`);
    const drop = await Drop.create({ ...req.body, slug });
    pingIndexNow([`/drops/${drop.slug}`]);
    res.status(201).json(drop);
  } catch (err: any) {
    if (err.code === 11000) { res.status(409).json({ error: 'Slug already exists' }); return; }
    res.status(500).json({ error: 'Failed to create drop' });
  }
});

router.put('/drops/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const drop = await Drop.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!drop) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(drop);
  } catch {
    res.status(500).json({ error: 'Failed to update drop' });
  }
});

router.delete('/drops/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await Drop.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ─── Site Content ─────────────────────────────────────────────────────────

const PAGE_DEFS = [
  { pageKey: 'home',     label: 'Homepage' },
  { pageKey: 'faq',      label: 'FAQs' },
  { pageKey: 'privacy',  label: 'Privacy Policy' },
  { pageKey: 'about',    label: 'About Us' },
  { pageKey: 'terms',    label: 'Terms & Conditions' },
  { pageKey: 'products', label: 'Products' },
  { pageKey: 'brands',   label: 'Brands' },
  { pageKey: 'blogs',    label: 'Blogs' },
  { pageKey: 'drops',    label: 'Drop Calendar' },
  { pageKey: 'sneakers',    label: 'Sneaker Guide' },
  { pageKey: 'shipping',    label: 'Shipping Info' },
  { pageKey: 'returns',     label: 'Cancellation & Refund' },
  { pageKey: 'track-order', label: 'Track Order' },
];

const EMPTY_CONTENT = {
  metaTitle: '', metaDescription: '', metaKeywords: '',
  ogTitle: '', ogDescription: '', htmlContent: '', faqItems: [],
};

router.get('/site-content', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const existing = await SiteContent.find().lean();
    const map = new Map(existing.map((d) => [d.pageKey, d]));
    const result = PAGE_DEFS.map((def) => ({
      ...EMPTY_CONTENT,
      ...(map.get(def.pageKey) || {}),
      pageKey: def.pageKey,
      label: def.label,
    }));
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch site content' });
  }
});

router.get('/site-content/:pageKey', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const def = PAGE_DEFS.find((d) => d.pageKey === req.params.pageKey);
    if (!def) { res.status(404).json({ error: 'Unknown page key' }); return; }
    const content = await SiteContent.findOne({ pageKey: req.params.pageKey }).lean();
    res.json(content || { ...EMPTY_CONTENT, pageKey: def.pageKey, label: def.label });
  } catch {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.put('/site-content/:pageKey', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const def = PAGE_DEFS.find((d) => d.pageKey === req.params.pageKey);
    if (!def) { res.status(404).json({ error: 'Unknown page key' }); return; }
    const content = await SiteContent.findOneAndUpdate(
      { pageKey: req.params.pageKey },
      { $set: { ...req.body, pageKey: req.params.pageKey, label: def.label } },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update content' });
  }
});

// ─── Coupons ───────────────────────────────────────────────────────────────

router.get('/coupons', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [coupons, usage] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).lean(),
      Order.aggregate([
        { $match: { couponCode: { $ne: '' } } },
        { $group: { _id: '$couponCode', count: { $sum: 1 } } },
      ]),
    ]);
    const usageMap = new Map(usage.map((u) => [u._id, u.count]));
    res.json({ coupons: coupons.map((c) => ({ ...c, useCount: usageMap.get(c.code) ?? 0 })) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch coupons' });
  }
});

router.post('/coupons', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscountAmount, appliesTo, active, expiresAt, restricted } = req.body;
    if (!code || !discountType || discountValue == null) {
      res.status(400).json({ error: 'code, discountType, and discountValue are required' });
      return;
    }
    const coupon = await Coupon.create({
      code: String(code).trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: minOrderValue != null ? Number(minOrderValue) : 0,
      maxDiscountAmount: maxDiscountAmount != null && maxDiscountAmount !== '' ? Number(maxDiscountAmount) : null,
      appliesTo: appliesTo || 'all',
      active: active !== false,
      expiresAt: expiresAt || null,
      restricted: restricted === true,
    });
    res.status(201).json({ coupon });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'A coupon with this code already exists' });
      return;
    }
    res.status(500).json({ error: err.message || 'Failed to create coupon' });
  }
});

router.put('/coupons/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // Explicitly exclude usedBy/assignedUsers to prevent admin from wiping usage history
    const { usedBy: _usedBy, assignedUsers: _assignedUsers, useCount: _useCount, ...updates } = req.body;
    if (updates.code) updates.code = String(updates.code).trim().toUpperCase();
    if (updates.discountValue != null) updates.discountValue = Number(updates.discountValue);
    if (updates.minOrderValue != null) updates.minOrderValue = Number(updates.minOrderValue);
    if (updates.maxDiscountAmount != null && updates.maxDiscountAmount !== '') {
      updates.maxDiscountAmount = Number(updates.maxDiscountAmount);
    } else if (updates.maxDiscountAmount === '' || updates.maxDiscountAmount === null) {
      updates.maxDiscountAmount = null;
    }
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!coupon) { res.status(404).json({ error: 'Coupon not found' }); return; }
    res.json({ coupon });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ error: 'A coupon with this code already exists' });
      return;
    }
    res.status(500).json({ error: err.message || 'Failed to update coupon' });
  }
});

router.delete('/coupons/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) { res.status(404).json({ error: 'Coupon not found' }); return; }
    res.json({ message: 'Coupon deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete coupon' });
  }
});

// ─── Email Blast ───────────────────────────────────────────────────────────

router.post('/email-blast', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, html } = req.body;
    if (!subject || !html) { res.status(400).json({ error: 'subject and html are required' }); return; }
    sendCustomBlast(subject, html).catch((err: Error) => console.error('[email] custom blast failed:', err));
    res.json({ message: 'Blast queued' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send blast' });
  }
});

// ─── Scraped Products ──────────────────────────────────────────────────────

router.get('/scraped-products', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'draft', site, brand, search, dateFrom, dateTo, priceMin, priceMax, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { status };
    if (site) filter.sourceSite = site;
    if (brand) filter.brand = brand;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); dateFilter.$lte = d; }
      filter.scrapedAt = dateFilter;
    }
    if (priceMin || priceMax) {
      const priceFilter: Record<string, number> = {};
      if (priceMin) priceFilter.$gte = parseFloat(priceMin);
      if (priceMax) priceFilter.$lte = parseFloat(priceMax);
      filter.price = priceFilter;
    }
    const { flags } = req.query as Record<string, string>;
    if (flags) filter.flags = { $in: flags.split(',').map((f) => f.trim()).filter(Boolean) };
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;
    const [items, total] = await Promise.all([
      ScrapedProduct.find(filter).sort({ scrapedAt: -1 }).skip(skip).limit(limitNum).lean(),
      ScrapedProduct.countDocuments(filter),
    ]);

    const skus = items.map((i) => i.sku).filter((s): s is string => !!s);
    const baseSlugs = items.map((i) => toSlug(`${i.brand}-${i.name}${i.colorway ? `-${i.colorway}` : ''}`));
    // One regex per slug (not a single joined pattern) — a giant OR'd regex string here
    // once overflowed the Atlas proxy's read buffer ("bufio: buffer full") at limit=100.
    const matchedProducts = items.length
      ? await Product.find({
          $or: [
            { sku: { $in: skus } },
            { slug: { $in: baseSlugs.map((s) => new RegExp(`^${s}(-\\d+)?$`)) } },
          ],
        }, 'slug sku').lean()
      : [];
    const matchedSkus = new Set(matchedProducts.map((p) => p.sku));
    const matchedSlugs = new Set(matchedProducts.map((p) => p.slug));
    const itemsWithPublishState = items.map((i) => {
      const baseSlug = toSlug(`${i.brand}-${i.name}${i.colorway ? `-${i.colorway}` : ''}`);
      const alreadyPublished = i.status !== 'published' && (
        (!!i.sku && matchedSkus.has(i.sku)) ||
        Array.from(matchedSlugs).some((slug) => slug === baseSlug || slug.startsWith(`${baseSlug}-`))
      );
      return { ...i, alreadyPublished };
    });

    res.json({ items: itemsWithPublishState, total, page: pageNum, limit: limitNum });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch scraped products' });
  }
});

router.put('/scraped-products/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const allowed = ['name', 'brand', 'price', 'originalPrice', 'images', 'sizes', 'colorway', 'sku', 'description', 'gender', 'tags'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const item = await ScrapedProduct.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!item) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update' });
  }
});

router.post('/scraped-products/bulk-delete', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) { res.status(400).json({ error: 'ids array required' }); return; }
    const items = await ScrapedProduct.find({ _id: { $in: ids } }).lean();
    await ScrapedProduct.deleteMany({ _id: { $in: ids } });
    const blacklistOps = items.map((item) => ({
      updateOne: {
        filter: { sourceUrl: item.sourceUrl },
        update: { $set: { sourceUrl: item.sourceUrl, sku: item.sku, rejectedAt: new Date() } },
        upsert: true,
      },
    }));
    if (blacklistOps.length) await RejectedUrl.bulkWrite(blacklistOps);
    res.json({ deleted: ids.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to bulk delete' });
  }
});

router.delete('/scraped-products/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await ScrapedProduct.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ error: 'Not found' }); return; }
    await RejectedUrl.updateOne(
      { sourceUrl: item.sourceUrl },
      { $set: { sourceUrl: item.sourceUrl, sku: item.sku, rejectedAt: new Date() } },
      { upsert: true }
    );
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete' });
  }
});

router.post('/scraped-products/run-scraper', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const pat = process.env.GITHUB_PAT;
    if (!pat) { res.status(500).json({ error: 'GITHUB_PAT not configured' }); return; }
    const r = await fetch(
      'https://api.github.com/repos/Gauravcoderr/SnkrsKart/actions/workflows/scraper.yml/dispatches',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    );
    if (!r.ok && r.status !== 204) {
      const body = await r.text();
      res.status(r.status).json({ error: `GitHub API error: ${body}` });
      return;
    }
    // Also fire Render-side scraper (Shopify) in background — non-blocking
    if (renderScraperState.status !== 'running') {
      const startedAt = new Date().toISOString();
      renderScraperState = { status: 'running', startedAt };
      runRenderScraper()
        .then((result) => {
          renderScraperState = { status: 'done', startedAt, finishedAt: new Date().toISOString(), result };
        })
        .catch((e: Error) => {
          renderScraperState = { status: 'failed', startedAt, finishedAt: new Date().toISOString(), error: e.message };
          console.error('[run-scraper] Render scraper error:', e.message);
        });
    }

    res.json({ message: 'Both scrapers triggered — GitHub Actions (Myntra/Footlocker/VegNonVeg/Superkicks/Tata CLiQ/Tata CLiQ Luxury/AJIO) + Render (Shopify)' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to trigger scraper' });
  }
});

router.get('/scraped-products/scraper-status', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const pat = process.env.GITHUB_PAT;
    if (!pat) { res.status(500).json({ error: 'GITHUB_PAT not configured' }); return; }
    const r = await fetch(
      'https://api.github.com/repos/Gauravcoderr/SnkrsKart/actions/workflows/scraper.yml/runs?per_page=1',
      {
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    if (!r.ok) {
      const body = await r.text();
      res.status(r.status).json({ error: `GitHub API error: ${body}` });
      return;
    }
    const data = await r.json() as { workflow_runs: Array<{ status: string; conclusion: string | null; created_at: string; updated_at: string; html_url: string }> };
    const run = data.workflow_runs[0] ?? null;
    res.json({
      github: run ? {
        status: run.status,
        conclusion: run.conclusion,
        startedAt: run.created_at,
        updatedAt: run.updated_at,
        runUrl: run.html_url,
      } : null,
      render: renderScraperState,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch scraper status' });
  }
});

router.get('/scraped-products/rejected-urls', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? 1)));
    const limit = Math.min(100, parseInt(String(req.query.limit ?? 50)));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      RejectedUrl.find().sort({ rejectedAt: -1 }).skip(skip).limit(limit).lean(),
      RejectedUrl.countDocuments(),
    ]);
    res.json({ items, total, page, limit });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch rejected URLs' });
  }
});

router.delete('/scraped-products/rejected-urls/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await RejectedUrl.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete' });
  }
});

router.post('/scraped-products/:id/publish', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const scraped = await ScrapedProduct.findById(req.params.id);
    if (!scraped) { res.status(404).json({ error: 'Not found' }); return; }
    if (scraped.status === 'published') { res.status(400).json({ error: 'Already published' }); return; }

    // Upload images to Cloudinary
    const cloudinaryImages: string[] = [];
    for (const imgUrl of scraped.images.slice(0, 5)) {
      try {
        const uploaded = await uploadToCloudinary(imgUrl);
        cloudinaryImages.push(uploaded);
      } catch (err) {
        console.error('[publish] Image upload failed:', imgUrl, (err as Error).message);
      }
    }
    if (cloudinaryImages.length === 0 && scraped.images.length > 0) {
      res.status(500).json({ error: 'All image uploads failed' });
      return;
    }

    // Generate unique slug
    let slug = buildProductSlug(`${scraped.brand}-${scraped.name}${scraped.colorway ? `-${scraped.colorway}` : ''}`, scraped.brand);
    const baseSlug = slug;
    let suffix = 2;
    while (await Product.exists({ slug })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    // Accept size/pricing overrides from the frontend config step
    const {
      productType = 'shoes',
      sizes: reqSizes,
      availableSizes: reqAvailableSizes,
      stringSizes: reqStringSizes,
      availableStringSizes: reqAvailableStringSizes,
      variants: reqVariants,
      price: reqPrice,
      originalPrice: reqOriginalPrice,
    } = req.body;

    const fallbackNumericSizes = scraped.sizes.map(s => parseFloat(s.replace(/[^0-9.]/g, ''))).filter(n => !isNaN(n));
    const isShoes = productType === 'shoes';

    const finalPrice = reqPrice ?? scraped.price ?? 0;
    const finalOriginalPrice = reqOriginalPrice ?? scraped.originalPrice ?? finalPrice;
    const discount = finalOriginalPrice > finalPrice
      ? Math.round(((finalOriginalPrice - finalPrice) / finalOriginalPrice) * 100)
      : 0;

    const productPayload = {
      name: scraped.name,
      brand: scraped.brand,
      slug,
      colorway: scraped.colorway || 'N/A',
      price: finalPrice,
      originalPrice: finalOriginalPrice,
      discount,
      images: cloudinaryImages,
      hoverImage: cloudinaryImages[1] ?? cloudinaryImages[0] ?? '',
      productType,
      sizes: reqSizes ?? (isShoes ? fallbackNumericSizes : []),
      availableSizes: reqAvailableSizes ?? (isShoes ? fallbackNumericSizes : []),
      stringSizes: reqStringSizes ?? (isShoes ? [] : scraped.sizes),
      availableStringSizes: reqAvailableStringSizes ?? (isShoes ? [] : scraped.sizes),
      variants: reqVariants ?? [],
      gender: scraped.gender ?? 'unisex',
      tags: scraped.tags ?? [],
      sku: scraped.sku ?? slug,
      description: scraped.description ?? scraped.name,
      category: 'lifestyle',
      newArrival: true,
      triggerEmail: false,
    };
    const product = await Product.create(productPayload);

    await syncBrandCounts();
    await ScrapedProduct.findByIdAndUpdate(req.params.id, {
      status: 'published',
      publishedProductId: product._id,
    });
    pingIndexNow([`/products/${product.slug}`]);

    res.status(201).json({ product, message: 'Published successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to publish' });
  }
});

// ─── Helpers ───────────────────────────────────────────────────────────────

async function syncBrandCounts() {
  const distinctBrands: string[] = await Product.distinct('brand');
  for (const brandName of distinctBrands) {
    const count = await Product.countDocuments({ brand: brandName });
    const slug = toSlug(brandName);
    await Brand.findOneAndUpdate(
      { slug },
      { $set: { name: brandName, slug, productCount: count, logoText: brandName.toUpperCase(), heroColor: '#18181b' } },
      { upsert: true }
    );
  }
}

export default router;
