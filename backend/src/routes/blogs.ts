import { Router, Request, Response } from 'express';
import { Blog } from '../models/Blog';

const router = Router();

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// GET /api/v1/blogs — published blogs list (supports ?search=, ?tag=, ?limit=)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tag, limit, search } = req.query;
    const query: Record<string, unknown> = { published: true };
    if (tag) query.tags = tag;
    if (search) {
      // AND-of-OR: every word must appear in title, excerpt, or tags
      const words = (search as string).trim().split(/\s+/).filter((w) => w.length > 1);
      if (words.length > 0) {
        (query as any).$and = words.map((w) => {
          const re = new RegExp(w, 'i');
          return { $or: [{ title: re }, { excerpt: re }, { tags: re }] };
        });
      }
    }
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit as string) : 50)
      .select('title slug excerpt coverImage author tags createdAt')
      .lean();
    res.json(blogs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// GET /api/v1/blogs/:slug — single blog by slug
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, published: true }).lean();
    if (!blog) { res.status(404).json({ error: 'Blog not found' }); return; }
    res.json(blog);
  } catch {
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

export default router;
