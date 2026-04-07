import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface BlogEntry {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

function escape(str: string) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let blogs: BlogEntry[] = [];
  try {
    const res = await fetch(`${API}/blogs?limit=50`, { next: { revalidate: 3600 } });
    if (res.ok) blogs = await res.json();
  } catch { /* ignore */ }

  const items = blogs
    .map((b) => {
      const url = `${SITE_URL}/blogs/${b.slug}`;
      const pubDate = new Date(b.createdAt).toUTCString();
      const categories = b.tags.map((t) => `<category>${escape(t)}</category>`).join('');
      const image = b.coverImage
        ? `<enclosure url="${escape(b.coverImage)}" type="image/jpeg" length="0" />`
        : '';
      return `
    <item>
      <title>${escape(b.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escape(b.excerpt)}</description>
      <author>infosnkrscart@gmail.com (${escape(b.author)})</author>
      <pubDate>${pubDate}</pubDate>
      ${categories}
      ${image}
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>SNKRS CART Blog</title>
    <link>${SITE_URL}/blogs</link>
    <description>Sneaker news, release guides, and style content from SNKRS CART — India's trusted sneaker platform.</description>
    <language>en-IN</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>SNKRS CART Blog</title>
      <link>${SITE_URL}/blogs</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
