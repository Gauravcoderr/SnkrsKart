import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminAuth, AdminRequest } from '../middleware/adminAuth';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { Inquiry } from '../models/Inquiry';
import { Review } from '../models/Review';
import { Banner } from '../models/Banner';
import { Seller } from '../models/Seller';
import { Blog } from '../models/Blog';
import { Order } from '../models/Order';
import { Newsletter } from '../models/Newsletter';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'snkrs-cart-admin-secret-key';

// Admin credentials from env (or defaults for dev)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'snkrs@admin123', 10);

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

    const product = await Product.create(data);
    await syncBrandCounts();
    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// Update product
router.put('/products/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
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
    const banner = await Banner.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
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
      { new: true, runValidators: true }
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
    const blog = await Blog.create(data);
    res.status(201).json(blog);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create blog' });
  }
});

router.put('/blogs/:id', adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!blog) { res.status(404).json({ error: 'Not found' }); return; }
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
    const { status, trackingNumber, notes } = req.body;
    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (trackingNumber !== undefined) update.trackingNumber = trackingNumber;
    if (notes !== undefined) update.notes = notes;
    const order = await Order.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update order' });
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
