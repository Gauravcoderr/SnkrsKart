import crypto from 'crypto';

export const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.70 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  // Edge
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  // Firefox
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:133.0) Gecko/20100101 Firefox/133.0',
  // Chrome Mobile
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.105 Mobile Safari/537.36',
];

export function randomUA(): string {
  return UA_POOL[crypto.randomInt(0, UA_POOL.length)];
}

export function jitter(min = 3000, max = 8000): Promise<void> {
  return new Promise((r) => setTimeout(r, crypto.randomInt(min, max)));
}

export interface ScrapedItem {
  sourceUrl: string;
  sourceSite: 'myntra' | 'footlocker' | 'vegnonveg' | 'limitededt' | 'superkicks' | 'nike' | 'crepdogcrew' | 'soleseriouss';
  name: string;
  brand: 'Nike' | 'Jordan';
  price?: number;
  originalPrice?: number;
  images: string[];
  sizes: string[];
  colorway?: string;
  sku?: string;
  description?: string;
  gender?: 'men' | 'women' | 'unisex' | 'kids';
  tags?: string[];
  sourceListedAt?: Date;
}
