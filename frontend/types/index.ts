export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  colorway: string;
  gender: 'men' | 'women' | 'unisex' | 'kids';
  price: number;
  originalPrice: number | null;
  discount: number | null;
  images: string[];
  hoverImage: string;
  sizes: number[];
  availableSizes: number[];
  stringSizes?: string[];
  availableStringSizes?: string[];
  productType?: 'shoes' | 'clothing' | 'accessories';
  colors: string[];
  tags: string[];
  variants?: Array<{ size: number | string; price: number; originalPrice: number | null; maxQty: number }>;
  faqs?: Array<{ question: string; answer: string }>;
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
  soldOut: boolean;
  comingSoon: boolean;
  releaseDate?: string;
  rating: number;
  reviewCount: number;
  description: string;
  category: string;
  sku: string;
  /** Admin-only: where this listing was resold/sourced from. Never returned by public product routes. */
  sourceUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  /** Plain id strings in admin/list responses; populated Product objects on the single product-detail fetch. */
  relatedProducts?: Array<string | Product>;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  logoText: string;
  heroColor: string;
  description: string;
}

export interface CartItem {
  product: Product;
  size: number | string;
  quantity: number;
}

export type SortOption = 'newest' | 'popular' | 'price_asc' | 'price_desc';

export interface FilterState {
  brands: string[];
  sizes: number[];
  stringSizes: string[];
  productTypes: string[];
  colors: string[];
  gender: string[];
  minPrice: number;
  maxPrice: number;
  sort: SortOption;
  search: string;
}

export interface BannerSlide {
  id: string;
  brand: string;
  tag: string;
  headline: string[];
  sub: string;
  cta: string;
  href: string;
  image: string;
  accent: string;
  bg: string;
  imgBg: string;
  order: number;
  active: boolean;
  price?: number;
  headlineFontSize?: number;
  headlineFontWeight?: number;
}

export interface Review {
  id: string;
  productSlug: string;
  productName: string;
  name: string;
  email?: string;
  location?: string;
  rating: number;
  comment: string;
  photos?: string[];
  fitRating?: 'small' | 'true' | 'large' | null;
  createdAt: string;
}

export interface FitSummary {
  small: number;
  true: number;
  large: number;
  total: number;
}

export interface LoyaltyEvent {
  type: 'earn' | 'redeem';
  amount: number;
  reason: string;
  orderId?: string;
  createdAt: string;
}

export interface LoyaltyAccount {
  coins: number;
  tier: 'rookie' | 'enthusiast' | 'og';
  history: LoyaltyEvent[];
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  published: boolean;
  wordCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SneakerProfile {
  _id: string;
  slug: string;
  name: string;
  brand: string;
  tagline: string;
  description: string;
  releaseYear: number | null;
  designer: string;
  silhouette: string;
  category: string;
  originalRetailPrice: number | null;
  searchTags: string[];
  relatedSlugs: string[];
  image: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Drop {
  _id: string;
  slug: string;
  name: string;
  brand: string;
  colorway: string;
  releaseDate: string;
  retailPrice: number | null;
  currency: 'INR' | 'USD';
  image: string;
  description: string;
  where: string;
  availableAtStore: boolean;
  productSlug: string;
  published: boolean;
  createdAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  appliesTo: 'all' | 'shoes' | 'clothing' | 'accessories';
  active: boolean;
  expiresAt: string | null;
  usedBy: string[];
  createdAt: string;
  updatedAt: string;
}
