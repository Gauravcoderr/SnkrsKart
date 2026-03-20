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
  colors: string[];
  tags: string[];
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
  soldOut: boolean;
  rating: number;
  reviewCount: number;
  description: string;
  category: string;
  sku: string;
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
  size: number;
  quantity: number;
}

export type SortOption = 'newest' | 'popular' | 'price_asc' | 'price_desc';

export interface FilterState {
  brands: string[];
  sizes: number[];
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
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
