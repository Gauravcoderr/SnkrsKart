'use client';

import { useState } from 'react';
import { useProductFilters } from '@/hooks/useProductFilters';
import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/products/ProductGrid';
import SortDropdown from '@/components/products/SortDropdown';
import ActiveFilterTags from '@/components/products/ActiveFilterTags';
import { SortOption } from '@/types';

const BANNER_SLIDES = [
  {
    text: 'NEW DROPS EVERY WEEK',
    sub: 'Fresh kicks, straight to your door',
    bg: 'bg-zinc-900',
    color: 'text-white',
  },
  {
    text: 'FREE SHIPPING ON ORDERS ABOVE \u20B910,000',
    sub: '100% Authentic Sneakers',
    bg: 'bg-zinc-900',
    color: 'text-white',
  },
];

export default function ProductsClient() {
  const {
    filters,
    products,
    total,
    loadedCount,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    handleFilterChange,
    handleRemoveBrand,
    handleRemoveSize,
    handleRemoveStringSize,
    handleRemoveProductType,
    handleRemoveGender,
    handleClearAll,
  } = useProductFilters();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div>
      {/* ── Top Banner ──────────────────────────────────────────────────────── */}
      <div className="bg-zinc-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 text-center">
          <p className="text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-white">
            {BANNER_SLIDES[0].text}
          </p>
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-1 tracking-wide">
            {BANNER_SLIDES[0].sub}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">
            Sneakers
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-[0.1em] uppercase text-zinc-900">
              {filters.search ? `Search: "${filters.search}"` : 'All Products'}
            </h1>
            {filters.search && (
              <button
                type="button"
                onClick={() => handleFilterChange('search', '')}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-widest uppercase border border-zinc-300 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar — desktop, sticky */}
          <div className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto hide-scrollbar">
              <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              {/* Mobile filter toggle */}
              <button
                type="button"
                className="lg:hidden self-start flex items-center gap-2 border border-zinc-200 px-4 py-2 text-xs font-bold tracking-widest uppercase text-zinc-700 hover:border-zinc-900 transition-colors"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zM6 10h12M9 16h6" />
                </svg>
                Filters
              </button>

              <SortDropdown
                value={filters.sort}
                onChange={(v: SortOption) => handleFilterChange('sort', v)}
                total={total}
              />
            </div>

            {/* Active filter tags */}
            <div className="mb-4">
              <ActiveFilterTags
                filters={filters}
                onRemoveBrand={handleRemoveBrand}
                onRemoveSize={handleRemoveSize}
                onRemoveStringSize={handleRemoveStringSize}
                onRemoveProductType={handleRemoveProductType}
                onRemoveGender={handleRemoveGender}
                onClearAll={handleClearAll}
              />
            </div>

            {/* Grid */}
            <ProductGrid products={products} loading={loading} />

            {/* Load more */}
            {!loading && products.length > 0 && (
              <div className="flex flex-col items-center gap-4 mt-12">
                <p className="text-xs tracking-widest uppercase text-zinc-500">
                  Showing <span className="font-semibold text-zinc-900">{loadedCount}</span> of{' '}
                  <span className="font-semibold text-zinc-900">{total}</span>
                </p>
                <div className="w-48 h-px bg-zinc-200 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-zinc-900 transition-all duration-500"
                    style={{ width: `${total ? Math.min(100, (loadedCount / total) * 100) : 100}%` }}
                  />
                </div>
                {hasMore ? (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    aria-busy={loadingMore}
                    className="min-w-[200px] px-8 py-3 text-xs font-bold tracking-widest uppercase border border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-50 disabled:cursor-wait transition-colors"
                  >
                    {loadingMore ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" d="M12 3a9 9 0 1 0 9 9" />
                        </svg>
                        Loading
                      </span>
                    ) : (
                      'Load more'
                    )}
                  </button>
                ) : (
                  <p className="text-xs text-zinc-400">You&apos;ve seen them all</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl overflow-y-auto p-6 animate-slide-in-right lg:hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold tracking-widest uppercase">Filters</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-900"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-6 w-full bg-zinc-900 text-white py-3 text-sm font-bold tracking-widest uppercase"
              >
                Apply Filters
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
