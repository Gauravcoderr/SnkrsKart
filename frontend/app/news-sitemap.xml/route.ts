const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const PUBLICATION_NAME = 'SNKRS CART';
const WINDOW_MS = 48 * 60 * 60 * 1000;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface BlogEntry { slug: string; title: string; createdAt: string }

function xmlEscape(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fetchLatestBlogs(): Promise<BlogEntry[]> {
  try {
    const res = await fetch(`${API}/blogs?limit=100&page=1`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return [];
    const data: { blogs?: BlogEntry[] } = await res.json();
    return data.blogs ?? [];
  } catch {
    return [];
  }
}

export async function GET() {
  const since = Date.now() - WINDOW_MS;
  const blogs = (await fetchLatestBlogs()).filter((b) => new Date(b.createdAt).getTime() >= since);

  const items = blogs.map((b) => `  <url>
    <loc>${SITE_URL}/blogs/${b.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION_NAME}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(b.createdAt).toISOString()}</news:publication_date>
      <news:title>${xmlEscape(b.title)}</news:title>
    </news:news>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
