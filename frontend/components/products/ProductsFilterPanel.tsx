'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FilterState } from '@/types';
import FilterSidebar from './FilterSidebar';
import SortDropdown from './SortDropdown';
import ActiveFilterTags from './ActiveFilterTags';
import { buildProductQueryString } from '@/lib/productFilters';

interface Props {
  filters: FilterState;
  total: number;
  children: React.ReactNode;
}

export default function ProductsFilterPanel({ filters, total, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const navigate = (next: FilterState) => {
    const qs = buildProductQueryString(next, 1);
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleFilterChange = (key: keyof FilterState, value: unknown) => {
    navigate({ ...filters, [key]: value } as FilterState);
  };
  const handleRemoveBrand = (brand: string) => navigate({ ...filters, brands: filters.brands.filter((b) => b !== brand) });
  const handleRemoveSize = (size: number) => navigate({ ...filters, sizes: filters.sizes.filter((s) => s !== size) });
  const handleRemoveStringSize = (size: string) => navigate({ ...filters, stringSizes: filters.stringSizes.filter((s) => s !== size) });
  const handleRemoveProductType = (type: string) => navigate({ ...filters, productTypes: filters.productTypes.filter((t) => t !== type) });
  const handleRemoveGender = (gender: string) => navigate({ ...filters, gender: filters.gender.filter((g) => g !== gender) });
  const handleClearAll = () => router.push(pathname);

  return (
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

          <SortDropdown value={filters.sort} onChange={(v) => handleFilterChange('sort', v)} total={total} />
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

        {children}
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
  );
}
