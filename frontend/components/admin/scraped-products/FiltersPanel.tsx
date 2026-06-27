'use client';

import { Filters, FilterHandlers } from './useFilters';
import { SourceSite } from './types';

const ALL_SITES: SourceSite[] = ['myntra', 'footlocker', 'vegnonveg', 'limitededt', 'superkicks', 'nike', 'crepdogcrew', 'soleseriouss'];

type Props = Filters & FilterHandlers;

export default function FiltersPanel({
  filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax,
  onSearchChange, onSiteChange, onBrandChange, onDateFromChange, onDateToChange, onPriceMinChange, onPriceMaxChange,
  onClear,
}: Props) {
  const hasActiveFilters = filterSearch || filterSite || filterBrand || filterDateFrom || filterDateTo || filterPriceMin || filterPriceMax;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          aria-label="Search by name"
          placeholder="Search by name..."
          value={filterSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
        />
        <select
          aria-label="Filter by site"
          value={filterSite}
          onChange={(e) => onSiteChange(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Sites</option>
          {ALL_SITES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter by brand"
          value={filterBrand}
          onChange={(e) => onBrandChange(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Brands</option>
          <option value="Nike">Nike</option>
          <option value="Jordan">Jordan</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase mb-1">Date From</label>
          <input type="date" aria-label="Date from" value={filterDateFrom} onChange={(e) => onDateFromChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500" />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase mb-1">Date To</label>
          <input type="date" aria-label="Date to" value={filterDateTo} onChange={(e) => onDateToChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500" />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase mb-1">Min Price (₹)</label>
          <input type="number" aria-label="Min price" placeholder="e.g. 1000" value={filterPriceMin} onChange={(e) => onPriceMinChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
        </div>
        <div>
          <label className="block text-[10px] text-zinc-500 uppercase mb-1">Max Price (₹)</label>
          <input type="number" aria-label="Max price" placeholder="e.g. 20000" value={filterPriceMax} onChange={(e) => onPriceMaxChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-zinc-400">
            {[filterSearch && 'search', filterSite && 'site', filterBrand && 'brand', (filterDateFrom || filterDateTo) && 'date', (filterPriceMin || filterPriceMax) && 'price'].filter(Boolean).join(' · ')} active
          </span>
          <button type="button" onClick={onClear} className="text-[11px] text-zinc-400 hover:text-white underline transition-colors">Clear all</button>
        </div>
      )}
    </div>
  );
}
