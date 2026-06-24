import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:4000/api/v1';

interface Blog {
  title: string; slug: string; excerpt: string; tags?: string[];
  author?: string; createdAt?: string; updatedAt?: string; metaDescription?: string;
}

function freshnessLabel(dateStr?: string): string {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days <= 3)  return ' [NEW — published in last 3 days]';
  if (days <= 14) return ' [RECENT — published in last 2 weeks]';
  if (days <= 30) return ' [published this month]';
  return '';
}

export async function GET() {
  const res = await fetch(`${API}/blogs?limit=200`, { next: { revalidate: 3600 } });
  const raw = res.ok ? await res.json() : [];
  const blogs: Blog[] = Array.isArray(raw) ? raw : (raw.blogs ?? []);

  // Sort newest first so AI crawlers see freshest content at the top of the feed
  const sorted = [...blogs].sort((a, b) =>
    new Date(b.updatedAt || b.createdAt || 0).getTime() -
    new Date(a.updatedAt || a.createdAt || 0).getTime()
  );

  const blogBlocks = sorted.map((b) => {
    const lines: string[] = [`## ${b.title}${freshnessLabel(b.updatedAt || b.createdAt)}`];
    lines.push(`URL: ${SITE}/blogs/${b.slug}`);
    if (b.createdAt) {
      lines.push(`Published: ${new Date(b.createdAt).toISOString().split('T')[0]}`);
    }
    if (b.updatedAt && b.updatedAt !== b.createdAt) {
      lines.push(`Last Updated: ${new Date(b.updatedAt).toISOString().split('T')[0]}`);
    }
    if (b.author)       lines.push(`Author: ${b.author}`);
    if (b.tags?.length) lines.push(`Tags: ${b.tags.join(', ')}`);
    if (b.excerpt)      lines.push(`\n${b.excerpt.replace(/\n/g, ' ').trim()}`);
    if (b.metaDescription) lines.push(`\nSEO Summary: ${b.metaDescription}`);
    return lines.join('\n');
  }).join('\n\n---\n\n');

  const newCount  = sorted.filter(b => {
    const d = b.updatedAt || b.createdAt;
    return d && Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) <= 14;
  }).length;

  const body = `# SNKRS CART — Sneaker Blog Articles

All articles about sneaker releases, culture, history, styling, and buying guides for India.
Website: ${SITE} | Full feed: ${SITE}/llms.txt

Total articles: ${sorted.length}
Recent articles (last 14 days): ${newCount}

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
