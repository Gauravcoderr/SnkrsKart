import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:4000/api/v1';

interface Blog {
  title: string; slug: string; excerpt: string; tags?: string[];
  author?: string; createdAt?: string; metaDescription?: string;
}

export async function GET() {
  const res = await fetch(`${API}/blogs?limit=200`, { next: { revalidate: 3600 } });
  const raw = res.ok ? await res.json() : [];
  const blogs: Blog[] = Array.isArray(raw) ? raw : (raw.blogs ?? []);

  const blogBlocks = blogs.map((b) => {
    const lines: string[] = [`## ${b.title}`, `URL: ${SITE}/blogs/${b.slug}`];
    if (b.createdAt) {
      const date = new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      lines.push(`Published: ${date}`);
    }
    if (b.author)          lines.push(`Author: ${b.author}`);
    if (b.tags?.length)    lines.push(`Tags: ${b.tags.join(', ')}`);
    if (b.excerpt)         lines.push(`\n${b.excerpt.replace(/\n/g, ' ').trim()}`);
    if (b.metaDescription) lines.push(`\nSEO Summary: ${b.metaDescription}`);
    return lines.join('\n');
  }).join('\n\n---\n\n');

  const body = `# SNKRS CART — Sneaker Blog Articles

All articles about sneaker releases, culture, history, styling, and buying guides for India.
Website: ${SITE} | Full feed: ${SITE}/llms.txt

Total articles: ${blogs.length}

---

${blogBlocks || 'No articles published yet.'}
`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
