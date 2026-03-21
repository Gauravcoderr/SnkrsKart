import { Product, Brand, BannerSlide, ProductsResponse, FilterState, Review } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function buildQueryString(filters: Partial<FilterState> & { page?: number; limit?: number }): string {
  const params = new URLSearchParams();
  if (filters.brands?.length) params.set('brand', filters.brands.join(','));
  if (filters.sizes?.length) params.set('size', filters.sizes.join(','));
  if (filters.colors?.length) params.set('color', filters.colors.join(','));
  if (filters.gender?.length) params.set('gender', filters.gender.join(','));
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  return params.toString();
}

// Server-side fetch with ISR revalidation (for Server Components)
export async function fetchProducts(
  filters: Partial<FilterState> & { page?: number; limit?: number } = {},
  revalidate = 60
): Promise<ProductsResponse> {
  const qs = buildQueryString(filters);
  const res = await fetch(`${BASE_URL}/products${qs ? `?${qs}` : ''}`, {
    next: { revalidate },
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/${slug}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Product not found');
  return res.json();
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/products/featured`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch featured products');
  return res.json();
}

export async function fetchNewArrivals(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/products/new-arrivals`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch new arrivals');
  return res.json();
}

export async function fetchTrendingProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/products/trending`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch trending products');
  return res.json();
}

export async function fetchComingSoonProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/products/coming-soon`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Failed to fetch coming soon products');
  return res.json();
}

export async function fetchBanners(): Promise<BannerSlide[]> {
  const res = await fetch(`${BASE_URL}/banners`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('Failed to fetch banners');
  return res.json();
}

export async function fetchBrands(): Promise<Brand[]> {
  const res = await fetch(`${BASE_URL}/brands`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error('Failed to fetch brands');
  return res.json();
}

export async function fetchBrandBySlug(slug: string): Promise<Brand> {
  const res = await fetch(`${BASE_URL}/brands/${slug}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error('Brand not found');
  return res.json();
}

export async function fetchRecentReviews(): Promise<Review[]> {
  const res = await fetch(`${BASE_URL}/reviews/recent`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function fetchProductReviews(productSlug: string): Promise<Review[]> {
  const res = await fetch(`${BASE_URL}/reviews?productSlug=${productSlug}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch product reviews');
  return res.json();
}

export async function restockNotify(email: string, productSlug: string, size?: number | null): Promise<void> {
  const res = await fetch(`${BASE_URL}/restock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, productSlug, size: size ?? null }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save');
  }
}

// Client-side fetch (no cache, for filter interactions)
export async function fetchProductsClient(
  filters: Partial<FilterState> & { page?: number; limit?: number } = {}
): Promise<ProductsResponse> {
  const qs = buildQueryString(filters);
  const res = await fetch(`${BASE_URL}/products${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}
