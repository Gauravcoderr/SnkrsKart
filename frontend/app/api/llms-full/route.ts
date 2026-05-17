import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:4000/api/v1';

interface Product {
  name: string; brand: string; slug: string; price: number; originalPrice?: number;
  description?: string; colorway?: string; colors?: string[]; availableSizes?: number[];
  category?: string; gender?: string; tags?: string[]; newArrival?: boolean; trending?: boolean; soldOut?: boolean;
}
interface Profile {
  name: string; brand: string; slug: string; tagline?: string; description?: string;
  releaseYear?: number | null; designer?: string; silhouette?: string; category?: string;
  originalRetailPrice?: number | null;
}

export async function GET() {
  const [productsRes, profilesRes] = await Promise.allSettled([
    fetch(`${API}/products?limit=500`, { next: { revalidate: 3600 } }),
    fetch(`${API}/sneaker-profiles`,   { next: { revalidate: 3600 } }),
  ]);

  const rawProducts = productsRes.status === 'fulfilled' && productsRes.value.ok ? await productsRes.value.json() : {};
  const rawProfiles = profilesRes.status === 'fulfilled' && profilesRes.value.ok ? await profilesRes.value.json() : [];

  const products: Product[] = rawProducts.products        ?? [];
  const profiles: Profile[] = Array.isArray(rawProfiles)  ? rawProfiles : [];

  const productBlocks = products.map((p) => {
    const lines: string[] = [
      `### ${p.brand} ${p.name}`,
      `URL: ${SITE}/products/${p.slug}`,
      `Price: ₹${p.price.toLocaleString('en-IN')}${p.originalPrice && p.originalPrice > p.price ? ` (was ₹${p.originalPrice.toLocaleString('en-IN')})` : ''} | Brand: ${p.brand}`,
    ];
    if (p.colorway)                  lines.push(`Colorway: ${p.colorway}`);
    if (p.category)                  lines.push(`Category: ${p.category}`);
    if (p.gender)                    lines.push(`Gender: ${p.gender}`);
    if (p.colors?.length)            lines.push(`Colors: ${p.colors.join(', ')}`);
    if (p.availableSizes?.length)    lines.push(`Available Sizes (UK): ${p.availableSizes.join(', ')}`);
    if (p.description)               lines.push(`Description: ${p.description.replace(/\n/g, ' ').trim()}`);
    const badges = [p.newArrival && 'New Arrival', p.trending && 'Trending', p.soldOut && 'Sold Out'].filter(Boolean);
    if (badges.length)               lines.push(`Status: ${badges.join(' | ')}`);
    if (p.tags?.length)              lines.push(`Tags: ${p.tags.join(', ')}`);
    return lines.join('\n');
  }).join('\n\n');

  const profileBlocks = profiles.map((p) => {
    const lines: string[] = [
      `### ${p.name}`,
      `URL: ${SITE}/sneakers/${p.slug}`,
      `Brand: ${p.brand}`,
    ];
    if (p.releaseYear)             lines.push(`Year Released: ${p.releaseYear}`);
    if (p.designer)                lines.push(`Designer: ${p.designer}`);
    if (p.silhouette)              lines.push(`Silhouette: ${p.silhouette}`);
    if (p.category)                lines.push(`Category: ${p.category}`);
    if (p.originalRetailPrice)     lines.push(`Original Retail: $${p.originalRetailPrice} USD`);
    if (p.tagline)                 lines.push(`Tagline: ${p.tagline}`);
    if (p.description)             lines.push(`About: ${p.description.replace(/\n/g, ' ').trim()}`);
    return lines.join('\n');
  }).join('\n\n');

  const body = `# SNKRS CART — Full Product & Sneaker Guide

> India's trusted authentic sneaker store. ${SITE}
> For the drop calendar see: ${SITE}/llms-drops.txt
> For blog articles see: ${SITE}/llms-blogs.txt

## Products in Stock

${productBlocks || 'No products currently listed.'}

## Sneaker Guide (Model Profiles)

${profileBlocks || 'No profiles currently listed.'}
`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
