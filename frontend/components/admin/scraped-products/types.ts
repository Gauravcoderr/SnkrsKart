export type SourceSite = 'myntra' | 'footlocker' | 'vegnonveg' | 'limitededt' | 'superkicks' | 'nike' | 'crepdogcrew' | 'soleseriouss';
export type Status = 'draft' | 'published' | 'rejected';
export type Gender = 'men' | 'women' | 'unisex' | 'kids';
export type PublishProductType = 'shoes' | 'clothing' | 'accessories';

export interface ScrapedProduct {
  _id: string;
  sourceUrl: string;
  sourceSite: SourceSite;
  name: string;
  brand: 'Nike' | 'Jordan';
  price?: number;
  originalPrice?: number;
  images: string[];
  sizes: string[];
  colorway?: string;
  sku?: string;
  description?: string;
  gender: Gender;
  tags: string[];
  flags: string[];
  status: Status;
  scrapedAt: string;
  sourceListedAt?: string;
  sourceUpdatedAt?: string;
}

export const SITE_COLORS: Record<SourceSite, string> = {
  myntra:       'bg-pink-900/40 text-pink-300 border-pink-800',
  footlocker:   'bg-purple-900/40 text-purple-300 border-purple-800',
  vegnonveg:    'bg-green-900/40 text-green-300 border-green-800',
  limitededt:   'bg-blue-900/40 text-blue-300 border-blue-800',
  superkicks:   'bg-orange-900/40 text-orange-300 border-orange-800',
  nike:         'bg-zinc-800/60 text-zinc-300 border-zinc-700',
  crepdogcrew:  'bg-red-900/40 text-red-300 border-red-800',
  soleseriouss: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
};

export const STATUS_TABS: Status[] = ['draft', 'published'];

export const ALL_FLAGS = ['bestseller', 'trending', 'limited', 'hyped', 'popular'] as const;
export type ProductFlag = typeof ALL_FLAGS[number];

export const FLAG_STYLES: Record<ProductFlag, string> = {
  bestseller: 'bg-amber-900/40 text-amber-300 border-amber-700',
  trending:   'bg-sky-900/40 text-sky-300 border-sky-700',
  limited:    'bg-purple-900/40 text-purple-300 border-purple-700',
  hyped:      'bg-red-900/40 text-red-300 border-red-700',
  popular:    'bg-emerald-900/40 text-emerald-300 border-emerald-700',
};

export const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
