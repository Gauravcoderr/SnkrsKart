import { NextResponse } from 'next/server';
import { fetchAllProducts } from '@/lib/catalog';

/**
 * Google Merchant Center "Product Reviews" feed, schema 2.3.
 * Submit at Merchant Center → Marketing → Product Reviews. Once Google has enough reviews
 * across the account (currently 50+), Shopping listings show star ratings.
 * Spec: https://developers.google.com/product-review-feeds/schema
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Review {
  id?: string;
  _id?: string; // GET /reviews returns lean docs, so the toJSON id transform does not run
  productSlug: string;
  productName: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Not prerendered at build; fetches cache 1h, response carries Cache-Control.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  let reviews: Review[] = [];
  try {
    const res = await fetch(`${API}/reviews`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`reviews upstream ${res.status}`);
    const data = await res.json();
    reviews = Array.isArray(data) ? data : data.reviews ?? [];
  } catch {
    return new NextResponse('Review source unavailable', {
      status: 503,
      headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' },
    });
  }

  const products = await fetchAllProducts();
  if (products.length === 0) {
    return new NextResponse('Catalogue unavailable', {
      status: 503,
      headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' },
    });
  }
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  // Reviews without a matching product (e.g. "General Review") cannot be attributed and are skipped.
  const entries = reviews
    .filter((r) => (r.id ?? r._id) && r.productSlug && bySlug.has(r.productSlug) && r.rating >= 1 && r.rating <= 5)
    .map((r) => {
      const p = bySlug.get(r.productSlug)!;
      const rid = String(r.id ?? r._id ?? '');
      const url = `${SITE_URL}/products/${p.slug}`;
      const ts = new Date(r.createdAt);
      return `
    <review>
      <review_id>${esc(rid)}</review_id>
      <reviewer>
        <name>${esc(r.name || 'Verified Buyer')}</name>
        <reviewer_id>${esc(rid)}</reviewer_id>
      </reviewer>
      <review_timestamp>${isNaN(ts.getTime()) ? new Date().toISOString() : ts.toISOString()}</review_timestamp>
      <content>${esc(r.comment)}</content>
      <review_url type="singleton">${esc(url)}#reviews</review_url>
      <ratings>
        <overall min="1" max="5">${Math.round(r.rating)}</overall>
      </ratings>
      <products>
        <product>
          <product_ids>
            ${p.sku ? `<mpns><mpn>${esc(p.sku)}</mpn></mpns>` : ''}
            <brands><brand>${esc(p.brand)}</brand></brands>
          </product_ids>
          <product_name>${esc(`${p.brand} ${p.name}`)}</product_name>
          <product_url>${esc(url)}</product_url>
        </product>
      </products>
      <is_spam>false</is_spam>
      <collection_method>unsolicited</collection_method>
    </review>`;
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:noNamespaceSchemaLocation="http://www.google.com/shopping/reviews/schema/product/2.3/product_reviews.xsd">
  <version>2.3</version>
  <publisher>
    <name>SNKRS CART</name>
    <favicon>${SITE_URL}/favicon.ico</favicon>
  </publisher>
  <reviews>${entries.join('')}
  </reviews>
</feed>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
