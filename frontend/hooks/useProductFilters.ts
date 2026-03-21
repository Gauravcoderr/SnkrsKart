'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FilterState, SortOption } from '@/types';
import { fetchProductsClient } from '@/lib/api';

const DEFAULT_FILTERS: FilterState = {
  brands: [],
  sizes: [],
  colors: [],
  gender: [],
  minPrice: 0,
  maxPrice: 0,
  sort: 'popular',
  search: '',
};

const LIMIT = 12;

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseSearchParams(params: URLSearchParams): Partial<FilterState> {
  const out: Partial<FilterState> = {};
  const brand = params.get('brand');
  if (brand) out.brands = brand.split(',').map((b) => slugToDisplayName(b.trim())).filter(Boolean);
  const gender = params.get('gender');
  if (gender) out.gender = gender.split(',').map((g) => g.trim().toLowerCase()).filter(Boolean);
  const search = params.get('search');
  if (search) out.search = search;
  const sort = params.get('sort') as SortOption | null;
  if (sort) out.sort = sort;
  return out;
}

export function useProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    ...parseSearchParams(searchParams),
  }));
  const [page, setPage] = useState(1);

  // Sync URL → filters when searchParams change (e.g. Navbar search)
  const prevParams = useRef(searchParams.toString());
  useEffect(() => {
    const curr = searchParams.toString();
    if (curr !== prevParams.current) {
      prevParams.current = curr;
      setFilters((f) => ({ ...f, ...parseSearchParams(searchParams) }));
      setPage(1);
    }
  }, [searchParams]);

  const { data, isFetching } = useQuery({
    queryKey: ['products', filters, page],
    queryFn: () => fetchProductsClient({ ...filters, page, limit: LIMIT }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const handleFilterChange = useCallback((key: keyof FilterState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleRemoveBrand = useCallback((brand: string) => {
    setFilters((prev) => ({ ...prev, brands: prev.brands.filter((b) => b !== brand) }));
    setPage(1);
  }, []);

  const handleRemoveSize = useCallback((size: number) => {
    setFilters((prev) => ({ ...prev, sizes: prev.sizes.filter((s) => s !== size) }));
    setPage(1);
  }, []);

  const handleRemoveGender = useCallback((gender: string) => {
    setFilters((prev) => ({ ...prev, gender: prev.gender.filter((g) => g !== gender) }));
    setPage(1);
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    router.push('/products');
  }, [router]);

  return {
    filters,
    products: data?.products ?? [],
    total: data?.total ?? 0,
    page,
    totalPages: data?.totalPages ?? 1,
    loading: isFetching,
    limit: LIMIT,
    setPage,
    handleFilterChange,
    handleRemoveBrand,
    handleRemoveSize,
    handleRemoveGender,
    handleClearAll,
  };
}
