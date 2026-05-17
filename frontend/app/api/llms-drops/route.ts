import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:4000/api/v1';

interface Drop {
  name: string; brand: string; slug: string; releaseDate: string;
  retailPrice: number | null; colorway?: string; description?: string;
  where?: string; availableAtStore?: boolean; productSlug?: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export async function GET() {
  const res = await fetch(`${API}/drops`, { next: { revalidate: 300 } });
  const raw = res.ok ? await res.json() : [];
  const drops: Drop[] = Array.isArray(raw) ? raw : [];

  const now = Date.now();
  const upcoming = drops
    .filter((d) => new Date(d.releaseDate).getTime() >= now)
    .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
  const released = drops
    .filter((d) => new Date(d.releaseDate).getTime() < now)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  function dropBlock(d: Drop): string {
    const lines: string[] = [
      `### ${d.name}`,
      `URL: ${SITE}/drops/${d.slug}`,
      `Brand: ${d.brand} | Release Date: ${formatDate(d.releaseDate)}`,
    ];
    if (d.retailPrice) lines.push(`Retail Price (India): ₹${d.retailPrice.toLocaleString('en-IN')}`);
    if (d.colorway)    lines.push(`Colorway: ${d.colorway}`);
    if (d.where)       lines.push(`Where to Buy: ${d.where}`);
    if (d.description) lines.push(`\n${d.description.trim()}`);
    if (d.availableAtStore && d.productSlug) {
      lines.push(`Available at SNKRS CART: ${SITE}/products/${d.productSlug}`);
    }
    return lines.join('\n');
  }

  const body = `# SNKRS CART — Sneaker Drop Calendar India

Official sneaker release dates for India — sourced from Nike SNKRS App, adidas.com, Jordan Brand, and verified brand announcements.
Website: ${SITE}/drops | Full index: ${SITE}/llms.txt

Total upcoming: ${upcoming.length} | Total tracked: ${drops.length}

---

## Upcoming Releases

${upcoming.length > 0 ? upcoming.map(dropBlock).join('\n\n') : 'No upcoming drops currently listed.'}

---

## Recently Released

${released.length > 0 ? released.map(dropBlock).join('\n\n') : 'No recent drops.'}
`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
