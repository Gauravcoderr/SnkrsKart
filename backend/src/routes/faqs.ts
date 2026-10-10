import { Router, Request, Response } from 'express';
import { SiteContent } from '../models/SiteContent';

const router = Router();

function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// GET /api/v1/faqs — the FAQ answers shown on /faqs (admin CMS page "faq"), for AI agents and
// the ChatGPT action schema.
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const doc = await SiteContent.findOne({ pageKey: 'faq' }).select('faqItems').lean();
    const faqs = (doc?.faqItems ?? [])
      .filter((f) => f.q && f.a)
      .map((f) => ({ question: f.q.trim(), answer: plainText(f.a) }));
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ faqs });
  } catch {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

export default router;
