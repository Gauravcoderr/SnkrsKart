import { FilterState, SortOption } from '@/types';
import { BRANDS } from '@/lib/constants';

export const DEFAULT_FILTERS: FilterState = {
  brands: [],
  sizes: [],
  stringSizes: [],
  productTypes: [],
  colors: [],
  gender: [],
  minPrice: 0,
  maxPrice: 0,
  sort: 'popular',
  search: '',
};

const SLUG_TO_LABEL: Record<string, string> = Object.fromEntries(BRANDS.map((b) => [b.slug, b.label]));
const LABEL_TO_SLUG: Record<string, string> = Object.fromEntries(BRANDS.map((b) => [b.label, b.slug]));

// Next.js server searchParams come as { [key]: string | string[] | undefined } — normalize to URLSearchParams
export function toURLSearchParams(searchParams: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    params.set(key, Array.isArray(value) ? value[0] : value);
  }
  return params;
}

export function parseProductParams(params: URLSearchParams): { filters: FilterState; page: number } {
  const filters: FilterState = { ...DEFAULT_FILTERS };

  const brand = params.get('brand');
  if (brand) {
    filters.brands = brand
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((slug) => SLUG_TO_LABEL[slug] ?? slug);
  }

  const gender = params.get('gender');
  if (gender) filters.gender = gender.split(',').map((g) => g.trim().toLowerCase()).filter(Boolean);

  const productType = params.get('productType');
  if (productType) filters.productTypes = productType.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

  const size = params.get('size');
  if (size) {
    const tokens = size.split(',').map((s) => s.trim()).filter(Boolean);
    filters.sizes = tokens.filter((t) => !Number.isNaN(Number(t))).map(Number);
    filters.stringSizes = tokens.filter((t) => Number.isNaN(Number(t)));
  }

  const minPrice = params.get('minPrice');
  if (minPrice) filters.minPrice = Number(minPrice) || 0;

  const maxPrice = params.get('maxPrice');
  if (maxPrice) filters.maxPrice = Number(maxPrice) || 0;

  const sort = params.get('sort') as SortOption | null;
  if (sort) filters.sort = sort;

  const search = params.get('search');
  if (search) filters.search = search;

  const pageParam = params.get('page');
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

  return { filters, page };
}

export function buildProductQueryString(filters: FilterState, page = 1): string {
  const params = new URLSearchParams();
  if (filters.brands.length) {
    params.set('brand', filters.brands.map((b) => LABEL_TO_SLUG[b] ?? b.toLowerCase().replace(/\s+/g, '-')).join(','));
  }
  const allSizes: (string | number)[] = [...filters.sizes, ...filters.stringSizes];
  if (allSizes.length) params.set('size', allSizes.join(','));
  if (filters.productTypes.length) params.set('productType', filters.productTypes.join(','));
  if (filters.gender.length) params.set('gender', filters.gender.join(','));
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.sort && filters.sort !== 'popular') params.set('sort', filters.sort);
  if (filters.search) params.set('search', filters.search);
  if (page > 1) params.set('page', String(page));
  return params.toString();
}
