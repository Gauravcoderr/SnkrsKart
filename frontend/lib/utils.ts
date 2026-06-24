import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
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
export function cloudinaryOgImage(url: string): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  const TRANSFORM = 'c_fill,w_1200,h_630,q_auto,f_jpg';
  // Already has /upload/ path — inject transforms right after it
  return url.replace('/upload/', `/upload/${TRANSFORM}/`);
}
