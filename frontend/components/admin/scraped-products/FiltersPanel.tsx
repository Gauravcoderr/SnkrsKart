'use client';

import { Filters, FilterHandlers } from './useFilters';
import { SourceSite } from './types';

const ALL_SITES: SourceSite[] = ['myntra', 'footlocker', 'vegnonveg', 'limitededt', 'superkicks', 'nike', 'crepdogcrew', 'soleseriouss'];

type Props = Pick<Filters, 'filterSite' | 'filterBrand' | 'filterDateFrom' | 'filterDateTo' | 'filterPriceMin' | 'filterPriceMax'> &
  Pick<FilterHandlers, 'onSiteChange' | 'onBrandChange' | 'onDateFromChange' | 'onDateToChange' | 'onPriceMinChange' | 'onPriceMaxChange' | 'onClear'>;

export default function FiltersPanel({
  filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax,
  onSiteChange, onBrandChange, onDateFromChange, onDateToChange, onPriceMinChange, onPriceMaxChange,
  onClear,
}: Props) {
  const hasActiveFilters = filterSite || filterBrand || filterDateFrom || filterDateTo || filterPriceMin || filterPriceMax;

  return (
    <div className="space-y-5">
      {/* Site */}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-3">Source Site</p>
        <select
          aria-label="Filter by site"
          value={filterSite}
          onChange={(e) => onSiteChange(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
        >
          <option value="">All Sites</option>
          {ALL_SITES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Brand */}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-3">Brand</p>
        <div className="space-y-1">
          {['Nike', 'Jordan'].map((b) => (
            <button key={b} type="button"
              onClick={() => onBrandChange(filterBrand === b ? '' : b)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg transition ${filterBrand === b ? 'bg-white text-zinc-900 font-semibold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-3">Scraped Date</p>
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">From</label>
            <input type="date" aria-label="Date from" value={filterDateFrom} onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">To</label>
            <input type="date" aria-label="Date to" value={filterDateTo} onChange={(e) => onDateToChange(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500" />
          </div>
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-3">Price (&#8377;)</p>
        <div className="space-y-2">
          <input type="number" aria-label="Min price" placeholder="Min e.g. 1000" value={filterPriceMin} onChange={(e) => onPriceMinChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
          <input type="number" aria-label="Max price" placeholder="Max e.g. 20000" value={filterPriceMax} onChange={(e) => onPriceMaxChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500" />
        </div>
      </div>

      {hasActiveFilters && (
        <button type="button" onClick={onClear}
          className="w-full py-2.5 border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg transition">
          Clear all filters
        </button>
      )}
    </div>
  );
}
