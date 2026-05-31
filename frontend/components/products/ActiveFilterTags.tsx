'use client';

import { FilterState } from '@/types';

interface ActiveFilterTagsProps {
  filters: FilterState;
  onRemoveBrand: (brand: string) => void;
  onRemoveSize: (size: number) => void;
  onRemoveStringSize: (size: string) => void;
  onRemoveProductType: (type: string) => void;
  onRemoveGender: (gender: string) => void;
  onClearAll: () => void;
}

const XIcon = () => (
  <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function ActiveFilterTags({
  filters,
  onRemoveBrand,
  onRemoveSize,
  onRemoveStringSize,
  onRemoveProductType,
  onRemoveGender,
  onClearAll,
}: ActiveFilterTagsProps) {
  const hasFilters =
    filters.brands.length > 0 ||
    filters.sizes.length > 0 ||
    filters.stringSizes.length > 0 ||
    filters.productTypes.length > 0 ||
    filters.gender.length > 0;

  if (!hasFilters) return null;

  const chipClass = 'inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white text-xs font-medium tracking-wide hover:bg-zinc-700 transition-colors group';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mr-1">
        Filters:
      </span>
      {filters.productTypes.map((type) => (
        <button key={type} type="button" onClick={() => onRemoveProductType(type)} className={chipClass}>
          <span className="capitalize">{type}</span>
          <XIcon />
        </button>
      ))}
      {filters.brands.map((brand) => (
        <button key={brand} type="button" onClick={() => onRemoveBrand(brand)} className={chipClass}>
          {brand}
          <XIcon />
        </button>
      ))}
      {filters.sizes.map((size) => (
        <button key={size} type="button" onClick={() => onRemoveSize(size)} className={chipClass}>
          UK {size}
          <XIcon />
        </button>
      ))}
      {filters.stringSizes.map((size) => (
        <button key={size} type="button" onClick={() => onRemoveStringSize(size)} className={chipClass}>
          {size}
          <XIcon />
        </button>
      ))}
      {filters.gender.map((g) => (
        <button key={g} type="button" onClick={() => onRemoveGender(g)} className={`${chipClass} capitalize`}>
          {g}
          <XIcon />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-semibold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 underline transition-colors ml-1"
      >
        Clear All
      </button>
    </div>
  );
}
