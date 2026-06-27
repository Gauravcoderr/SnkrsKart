import { NextRequest, NextResponse } from 'next/server';

function extractMeta(html: string, url: string) {
  const getMeta = (property: string): string | undefined => {
    const match =
      html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'));
    return match?.[1];
  };
  const getMetaName = (name: string): string | undefined => {
    const match =
      html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'));
    return match?.[1];
  };

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

  const ogTitle = getMeta('og:title');
  const ogSiteName = getMeta('og:site_name');
  const ogImage = getMeta('og:image');
  const twitterTitle = getMetaName('twitter:title');
  const twitterImage = getMetaName('twitter:image');

  const title = ogTitle || twitterTitle || titleMatch?.[1]?.trim();
  const siteName = ogSiteName;
  const image = ogImage || twitterImage;

  // Use Google favicon service for reliability
  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {}

  return {
    title: title ? title.slice(0, 200) : undefined,
    siteName: siteName ? siteName.slice(0, 100) : domain || undefined,
    favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : undefined,
    ogImage: image,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only HTTP/HTTPS URLs allowed' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SNKRSCARTBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        // Return domain-only meta even if fetch fails
        const domain = parsedUrl.hostname;
        return NextResponse.json({
          title: undefined,
          siteName: domain,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
          ogImage: undefined,
        });
      }

      const html = await res.text();
      const meta = extractMeta(html, url);
      return NextResponse.json(meta);
    } catch {
      clearTimeout(timeout);
      const domain = parsedUrl.hostname;
      return NextResponse.json({
        title: undefined,
        siteName: domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        ogImage: undefined,
      });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to fetch URL metadata' }, { status: 500 });
  }
}
