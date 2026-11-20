import type { FilterState, ProductsResponse, SortOption } from "@/types";

export const GRID_PAGE_SIZE = 12;

export const DEFAULT_FILTERS: FilterState = {
  brands: [],
  sizes: [],
  stringSizes: [],
  productTypes: [],
  colors: [],
  gender: [],
  minPrice: 0,
  maxPrice: 0,
  sort: "popular",
  search: "",
};

export interface InitialGrid {
  key: string;
  page: ProductsResponse;
}

export interface KnownFilterValues {
  brands: readonly string[];
  genders: readonly string[];
  productTypes: readonly string[];
  sorts: readonly string[];
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function list(
  value: string | null,
  format: (item: string) => string,
): string[] | null {
  if (!value) return null;
  return value
    .split(",")
    .map((item) => format(item.trim()))
    .filter(Boolean);
}

export function parseFilterParams(
  params: URLSearchParams,
): Partial<FilterState> {
  const out: Partial<FilterState> = {};
  const brands = list(params.get("brand"), slugToDisplayName);
  if (brands) out.brands = brands;
  const gender = list(params.get("gender"), (g) => g.toLowerCase());
  if (gender) out.gender = gender;
  const productTypes = list(params.get("productType"), (t) => t.toLowerCase());
  if (productTypes) out.productTypes = productTypes;
  const search = params.get("search");
  if (search) out.search = search;
  const sort = params.get("sort") as SortOption | null;
  if (sort) out.sort = sort;
  return out;
}

export function filtersFromParams(params: URLSearchParams): FilterState {
  return { ...DEFAULT_FILTERS, ...parseFilterParams(params) };
}

export function filterKey(filters: FilterState): string {
  return JSON.stringify(filters);
}

export function toSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(record)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) params.append(name, item);
    }
  }
  return params;
}

export function prefetchable(
  filters: FilterState,
  known: KnownFilterValues,
): boolean {
  return (
    !filters.search &&
    filters.brands.every((brand) => known.brands.includes(brand)) &&
    filters.gender.every((gender) => known.genders.includes(gender)) &&
    filters.productTypes.every((type) => known.productTypes.includes(type)) &&
    known.sorts.includes(filters.sort)
  );
}
