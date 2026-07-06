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

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

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

    if (!data.slug) {
      data.slug = toSlug(`${data.brand}-${data.name}-${data.colorway || ''}`);
    }

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
    const product = await Product.create(productData);
    await syncBrandCounts();
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
    if (update.soldOut === true) {
      update.availableSizes = [];
      update.availableStringSizes = [];
    }
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: update }, { returnDocument: 'after', runValidators: true });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
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

router.get('/sellers', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const sellers = await Seller.find().sort({ createdAt: -1 }).lean();
    res.json(sellers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

router.delete('/sellers/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const seller = await Seller.findByIdAndDelete(req.params.id);
    if (!seller) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete seller' });
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
    if (blog.published && triggerEmail !== false) {
      const subject = emailSubject || `New on the Blog: ${blog.title}`;
      const html = emailHtml || undefined;
      sendBlogPublishBlast({ title: blog.title, slug: blog.slug, coverImage: blog.coverImage, excerpt: blog.excerpt }, subject, html)
        .catch((err: Error) => console.error('[email] blog blast failed:', err));
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
    // fire email when draft is published for the first time
    if (req.body.published === true && before && !before.published) {
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
    const { status, trackingNumber, deliveryService, notes } = req.body;
    const update: Record<string, unknown> = {};
    if (status) {
      update.status = status;
      if (status === 'delivered') {
        const existing = await Order.findById(req.params.id).select('deliveredAt').lean();
        if (existing && !existing.deliveredAt) update.deliveredAt = new Date();
      }
    }
    if (trackingNumber !== undefined) update.trackingNumber = trackingNumber;
    if (deliveryService !== undefined) update.deliveryService = deliveryService;
    if (notes !== undefined) update.notes = notes;
    const order = await Order.findByIdAndUpdate(req.params.id, { $set: update }, { returnDocument: 'after', runValidators: true });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update order' });
  }
});

// ─── Users ─────────────────────────────────────────────────────────────────

router.get('/users', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find()
      .select('-otp -otpExpiry -otpAttempts -lastOtpSent -refreshToken')
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
      .select('-otp -otpExpiry -otpAttempts -lastOtpSent -refreshToken')
      .lean();
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const orders = await Order.find({ email: user.email }).sort({ createdAt: -1 }).lean();
    res.json({ ...user, id: user._id.toString(), orders });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ─── Newsletter ─────────────────────────────────────────────────────────────

router.get('/newsletter', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 }).lean();
    res.json(subscribers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch subscribers' });
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
  { pageKey: 'returns',     label: 'Returns & Refunds' },
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
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ coupons });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch coupons' });
  }
});

router.post('/coupons', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscountAmount, appliesTo, active, expiresAt } = req.body;
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
    // Explicitly exclude usedBy to prevent admin from wiping usage history
    const { usedBy: _usedBy, ...updates } = req.body;
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
    // Also fire Render-side scraper (Shopify + Nike) in background — non-blocking
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

    res.json({ message: 'Both scrapers triggered — GitHub Actions (Myntra/Footlocker/VegNonVeg) + Render (Shopify/Nike)' });
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
    let slug = toSlug(`${scraped.brand}-${scraped.name}${scraped.colorway ? `-${scraped.colorway}` : ''}`);
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
