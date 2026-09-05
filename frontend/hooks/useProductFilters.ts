'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { FilterState, ProductsResponse, SortOption } from '@/types';
import { fetchProductsClient } from '@/lib/api';

const DEFAULT_FILTERS: FilterState = {
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

const LIMIT = 12;
// Max pages auto-loaded when landing on /products?page=N (back button, shared link)
const MAX_RESTORE_PAGES = 20;

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseSearchParams(params: URLSearchParams): Partial<FilterState> {
  const out: Partial<FilterState> = {};
  const brand = params.get('brand');
  if (brand) out.brands = brand.split(',').map((b) => slugToDisplayName(b.trim())).filter(Boolean);
  const gender = params.get('gender');
  if (gender) out.gender = gender.split(',').map((g) => g.trim().toLowerCase()).filter(Boolean);
  const productType = params.get('productType');
  if (productType) out.productTypes = productType.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const search = params.get('search');
  if (search) out.search = search;
  const sort = params.get('sort') as SortOption | null;
  if (sort) out.sort = sort;
  return out;
}

function parsePageParam(params: URLSearchParams): number {
  const n = parseInt(params.get('page') ?? '1', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_RESTORE_PAGES);
}

// Everything except `page` — used to detect real filter changes coming from the URL
function filterParamsKey(params: URLSearchParams): string {
  const copy = new URLSearchParams(params.toString());
  copy.delete('page');
  return copy.toString();
}

export function useProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    ...parseSearchParams(searchParams),
  }));

  // How many pages to restore on first load (from ?page=N). Consumed once.
  const restoreTarget = useRef(parsePageParam(searchParams));

  // Sync URL → filters when non-page params change (e.g. Navbar search)
  const prevParams = useRef(filterParamsKey(searchParams));
  useEffect(() => {
    const curr = filterParamsKey(searchParams);
    if (curr !== prevParams.current) {
      prevParams.current = curr;
      setFilters((f) => ({ ...f, ...parseSearchParams(searchParams) }));
      restoreTarget.current = 1;
    }
  }, [searchParams]);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<ProductsResponse>({
    queryKey: ['products', filters],
    queryFn: ({ pageParam }) =>
      fetchProductsClient({ ...filters, page: pageParam as number, limit: LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const pages = data?.pages ?? [];
  const loadedPages = pages.length;
  const products = useMemo(() => pages.flatMap((p) => p.products), [pages]);
  const total = pages[0]?.total ?? 0;
  const totalPages = pages[0]?.totalPages ?? 1;

  // Restore deep page on mount: /products?page=3 → load pages 1, 2, 3
  useEffect(() => {
    if (loadedPages === 0 || isFetching) return;
    if (loadedPages < restoreTarget.current && hasNextPage) {
      fetchNextPage();
    } else {
      restoreTarget.current = 1;
    }
  }, [loadedPages, isFetching, hasNextPage, fetchNextPage]);

  // Keep ?page=N in the URL in sync with how many pages are loaded,
  // so back button and shared links land on the same list depth.
  // Reads window.location (not useSearchParams) because Next syncs
  // searchParams to replaceState asynchronously and would go stale here.
  useEffect(() => {
    if (loadedPages === 0) return;
    // Still restoring a deep link: don't clobber ?page=N until pages are loaded (or list ends)
    if (loadedPages < restoreTarget.current && hasNextPage) return;
    const params = new URLSearchParams(window.location.search);
    const current = params.get('page') ?? '1';
    const next = String(loadedPages);
    if (current === next) return;
    if (loadedPages === 1) params.delete('page');
    else params.set('page', next);
    const qs = params.toString();
    window.history.replaceState(window.history.state, '', qs ? `${pathname}?${qs}` : pathname);
  }, [loadedPages, hasNextPage, pathname]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const resetPage = useCallback(() => {
    restoreTarget.current = 1;
  }, []);

  const handleFilterChange = useCallback((key: keyof FilterState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    resetPage();
  }, [resetPage]);

  const handleRemoveBrand = useCallback((brand: string) => {
    setFilters((prev) => ({ ...prev, brands: prev.brands.filter((b) => b !== brand) }));
    resetPage();
  }, [resetPage]);

  const handleRemoveSize = useCallback((size: number) => {
    setFilters((prev) => ({ ...prev, sizes: prev.sizes.filter((s) => s !== size) }));
    resetPage();
  }, [resetPage]);

  const handleRemoveStringSize = useCallback((size: string) => {
    setFilters((prev) => ({ ...prev, stringSizes: prev.stringSizes.filter((s) => s !== size) }));
    resetPage();
  }, [resetPage]);

  const handleRemoveProductType = useCallback((type: string) => {
    setFilters((prev) => ({ ...prev, productTypes: prev.productTypes.filter((t) => t !== type) }));
    resetPage();
  }, [resetPage]);

  const handleRemoveGender = useCallback((gender: string) => {
    setFilters((prev) => ({ ...prev, gender: prev.gender.filter((g) => g !== gender) }));
    resetPage();
  }, [resetPage]);

  const handleClearAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    resetPage();
    router.push('/products');
  }, [router, resetPage]);

  return {
    filters,
    products,
    total,
    loadedCount: products.length,
    loadedPages,
    totalPages,
    hasMore: Boolean(hasNextPage),
    // Skeleton grid only on initial load / filter change, not while appending
    loading: isFetching && !isFetchingNextPage,
    loadingMore: isFetchingNextPage,
    limit: LIMIT,
    loadMore,
    handleFilterChange,
    handleRemoveBrand,
    handleRemoveSize,
    handleRemoveStringSize,
    handleRemoveProductType,
    handleRemoveGender,
    handleClearAll,
  };
}
