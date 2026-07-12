import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDropPrice(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
  return currency === 'USD'
    ? `$${amount.toLocaleString('en-US')}`
    : `₹${amount.toLocaleString('en-IN')}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getDiscountPercent(price: number, originalPrice: number): number {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

// Transforms any Cloudinary URL to serve a 1200x630 JPEG crop — safe for WhatsApp/Facebook OG previews.
// WhatsApp's scraper doesn't handle WebP (f_auto), and mismatched dimensions drop the preview.
// Only strips Cloudinary transform segments (key_value pattern like c_fill,w_1200) — preserves version + folder paths.
export function cloudinaryOgImage(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  const TRANSFORM = 'c_fill,w_1200,h_630,q_auto,f_jpg';
  // Match only transform segments (contain underscore: c_fill, w_1200, q_auto, f_jpg)
  // Does NOT match version (v1234567890) or folder paths (blog-images, products, etc.)
  return url.replace(
    /\/upload\/((?:[a-z]+_[^,/]+(,[a-z]+_[^,/]+)*\/)*)/,
    `/upload/${TRANSFORM}/`
  );
}
