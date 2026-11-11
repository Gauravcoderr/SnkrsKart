import { NextResponse } from 'next/server';
import { fetchAllProducts } from '@/lib/catalog';
import { openaiFeedRows, toJsonl } from '@/lib/openaiFeed';

// Not prerendered at build; fetches cache 1h via lib/catalog, response carries Cache-Control.
export const dynamic = 'force-dynamic';
// Render free tier sleeps; first fetch after idle can take 30-50s. Vercel default is 10s.
export const maxDuration = 60;

export async function GET() {
  const products = await fetchAllProducts();

  if (products.length === 0) {
    return new NextResponse('Feed source unavailable', {
      status: 503,
      headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' },
    });
  }

  return new NextResponse(toJsonl(openaiFeedRows(products)), {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Content-Disposition': 'inline; filename="snkrscart-openai-product-feed.jsonl"',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
