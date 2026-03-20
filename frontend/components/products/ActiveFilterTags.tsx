'use client';

import { FilterState } from '@/types';

interface ActiveFilterTagsProps {
  filters: FilterState;
  onRemoveBrand: (brand: string) => void;
  onRemoveSize: (size: number) => void;
  onRemoveGender: (gender: string) => void;
  onClearAll: () => void;
}

export default function ActiveFilterTags({
  filters,
  onRemoveBrand,
  onRemoveSize,
  onRemoveGender,
  onClearAll,
}: ActiveFilterTagsProps) {
  const hasFilters =
    filters.brands.length > 0 ||
    filters.sizes.length > 0 ||
    filters.gender.length > 0;

  if (!hasFilters) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mr-1">
        Filters:
      </span>
      {filters.brands.map((brand) => (
        <button
          key={brand}
          onClick={() => onRemoveBrand(brand)}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white text-xs font-medium tracking-wide hover:bg-zinc-700 transition-colors group"
        >
          {brand}
          <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
      {filters.sizes.map((size) => (
        <button
          key={size}
          onClick={() => onRemoveSize(size)}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white text-xs font-medium tracking-wide hover:bg-zinc-700 transition-colors group"
        >
          UK {size}
          <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
      {filters.gender.map((g) => (
        <button
          key={g}
          onClick={() => onRemoveGender(g)}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white text-xs font-medium tracking-wide hover:bg-zinc-700 transition-colors group capitalize"
        >
          {g}
          <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs font-semibold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 underline transition-colors ml-1"
      >
        Clear All
      </button>
    </div>
  );
}
