import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminAuth, AdminRequest } from '../middleware/adminAuth';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';

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
    res.json(products);
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
