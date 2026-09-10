'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SneakerProfile } from '@/types';

const ALL = 'All';
const PER_PAGE = 24;

type Sort = 'name' | 'year-desc' | 'year-asc' | 'brand';
const SORT_LABELS: Record<Sort, string> = {
  name: 'A to Z',
  'year-desc': 'Newest first',
  'year-asc': 'Oldest first',
  brand: 'Brand',
};

function cap(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

const CATEGORY_COLORS: Record<string, string> = {
  running: 'bg-blue-100 text-blue-700',
  basketball: 'bg-orange-100 text-orange-700',
  lifestyle: 'bg-purple-100 text-purple-700',
  skateboarding: 'bg-green-100 text-green-700',
  training: 'bg-red-100 text-red-700',
  tennis: 'bg-yellow-100 text-yellow-700',
  football: 'bg-emerald-100 text-emerald-700',
};

function CategoryPill({ category }: { category?: string }) {
  if (!category) return null;
  const cls = CATEGORY_COLORS[category.toLowerCase()] ?? 'bg-zinc-100 text-zinc-600';
  return (
    <span className={`inline-block text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${cls}`}>
      {cap(category)}
    </span>
  );
}

interface Props {
  profiles: SneakerProfile[];
  initial?: { brand?: string; category?: string; sort?: Sort; q?: string; page?: number };
}

export default function SneakersClient({ profiles, initial = {} }: Props) {
  const [activeBrand, setActiveBrand] = useState(initial.brand || ALL);
  const [activeCategory, setActiveCategory] = useState(initial.category || ALL);
  const [sort, setSort] = useState<Sort>(initial.sort || 'name');
  const [search, setSearch] = useState(initial.q || '');
  const [page, setPage] = useState(initial.page || 1);

  // Reset to page 1 when filters change (not on the initial server-provided state)
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    setPage(1);
  }, [activeBrand, activeCategory, sort, search]);

  // Keep the URL in sync so filtered views are shareable and server-renderable (no navigation, no refetch)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const params = new URLSearchParams();
    if (activeBrand !== ALL) params.set('brand', activeBrand);
    if (activeCategory !== ALL) params.set('category', activeCategory);
    if (sort !== 'name') params.set('sort', sort);
    if (search.trim()) params.set('q', search.trim());
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [activeBrand, activeCategory, sort, search, page]);

  const brands = useMemo(() => {
    const set = new Set(profiles.map((p) => p.brand));
    return [ALL, ...Array.from(set).sort()];
  }, [profiles]);

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    profiles.forEach((p) => { counts[p.brand] = (counts[p.brand] ?? 0) + 1; });
    return counts;
  }, [profiles]);

  // Categories scoped to the active brand so chips never lead to an empty list
  const categories = useMemo(() => {
    const scoped = activeBrand === ALL ? profiles : profiles.filter((p) => p.brand === activeBrand);
    const counts: Record<string, number> = {};
    scoped.forEach((p) => { const c = p.category?.toLowerCase(); if (c) counts[c] = (counts[c] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [profiles, activeBrand]);

  useEffect(() => {
    if (activeCategory !== ALL && !categories.some(([c]) => c === activeCategory)) setActiveCategory(ALL);
  }, [categories, activeCategory]);

  const filtered = useMemo(() => {
    let result = activeBrand === ALL ? profiles : profiles.filter((p) => p.brand === activeBrand);
    if (activeCategory !== ALL) result = result.filter((p) => p.category?.toLowerCase() === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.designer?.toLowerCase().includes(q)
      );
    }
    const byName = (a: SneakerProfile, b: SneakerProfile) => a.name.localeCompare(b.name);
    const year = (p: SneakerProfile) => p.releaseYear ?? null;
    return [...result].sort((a, b) => {
      if (sort === 'brand') return a.brand.localeCompare(b.brand) || byName(a, b);
      if (sort === 'year-desc' || sort === 'year-asc') {
        const ya = year(a), yb = year(b);
        if (ya == null && yb == null) return byName(a, b);
        if (ya == null) return 1;
        if (yb == null) return -1;
        return (sort === 'year-desc' ? yb - ya : ya - yb) || byName(a, b);
      }
      return byName(a, b);
    });
  }, [profiles, activeBrand, activeCategory, sort, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Group current page's profiles by brand (only when showing all brands without search)
  const isFiltering = activeBrand !== ALL || activeCategory !== ALL || search.trim() !== '' || sort !== 'name';

  const byBrand = useMemo(() => {
    if (isFiltering) {
      const label = activeBrand !== ALL && activeCategory === ALL && !search.trim() && sort === 'name' ? activeBrand : 'Results';
      return paginated.length > 0 ? { [label]: paginated } : {};
    }
    return paginated.reduce<Record<string, SneakerProfile[]>>((acc, p) => {
      (acc[p.brand] = acc[p.brand] || []).push(p);
      return acc;
    }, {});
  }, [paginated, activeBrand, activeCategory, search, sort, isFiltering]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search sneakers, brands, designers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-zinc-200 focus:border-zinc-400 focus:outline-none bg-white placeholder:text-zinc-400"
        />
        {search && (
          <button type="button" aria-label="Clear search" onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Brand tabs + sort */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {brands.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setActiveBrand(b)}
            className={`px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-all duration-150 rounded-sm ${
              activeBrand === b
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            {b}
            {b !== ALL && (
              <span className="ml-1.5 text-[9px] opacity-60">{brandCounts[b] ?? 0}</span>
            )}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-zinc-400">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="bg-white border border-zinc-200 text-zinc-700 text-[11px] font-bold tracking-wider uppercase px-2.5 py-1.5 focus:outline-none focus:border-zinc-400 rounded-sm"
          >
            {(Object.keys(SORT_LABELS) as Sort[]).map((k) => <option key={k} value={k}>{SORT_LABELS[k]}</option>)}
          </select>
        </label>
      </div>

      {/* Category chips */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            type="button"
            onClick={() => setActiveCategory(ALL)}
            className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full transition-colors ${activeCategory === ALL ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400'}`}
          >
            All types
          </button>
          {categories.map(([c, n]) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full transition-colors ${
                activeCategory === c ? 'bg-zinc-900 text-white' : `${CATEGORY_COLORS[c] ?? 'bg-zinc-100 text-zinc-600'} hover:opacity-80`
              }`}
            >
              {c} <span className="opacity-60">{n}</span>
            </button>
          ))}
        </div>
      )}
      {categories.length <= 1 && <div className="mb-5" />}

      {Object.keys(byBrand).length === 0 ? (
        <div className="py-20 text-center border border-dashed border-zinc-200">
          <p className="text-sm text-zinc-400">No sneakers match{search ? ` “${search}”` : ' these filters'}.</p>
          <button type="button" onClick={() => { setSearch(''); setActiveBrand(ALL); setActiveCategory(ALL); setSort('name'); }} className="mt-3 text-xs text-zinc-500 underline">Clear filters</button>
        </div>
      ) : (
        Object.entries(byBrand).map(([brand, brandProfiles]) => (
          <div key={brand} className="mb-14">
            {/* Brand header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-black tracking-[0.3em] uppercase text-zinc-900">
                  {brand === 'Results' ? `${filtered.length} Result${filtered.length !== 1 ? 's' : ''}` : brand}
                </h2>
                {brand !== 'Results' && !isFiltering && (
                  <span className="text-[9px] font-bold text-zinc-300 tracking-widest uppercase">
                    {brandProfiles.length} model{brandProfiles.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {!isFiltering && (
                <Link
                  href={`/products?brand=${encodeURIComponent(brand)}`}
                  className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  Shop {brand} →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {brandProfiles.map((p) => (
                <Link
                  key={p.slug}
                  href={`/sneakers/${p.slug}`}
                  className="group border border-zinc-100 hover:border-zinc-300 hover:shadow-md transition-all duration-200 overflow-hidden bg-white"
                >
                  <div className="relative aspect-square bg-zinc-50 overflow-hidden">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-400"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                        <svg className="w-8 h-8 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    {p.releaseYear && (
                      <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-zinc-900 text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-sm tabular-nums">
                        {p.releaseYear}
                      </span>
                    )}
                  </div>
                  <div className="p-3 pb-3.5">
                    {(isFiltering || activeBrand === ALL) && (
                      <p className="text-[8px] font-black tracking-[0.25em] uppercase text-zinc-400 mb-0.5">{p.brand}</p>
                    )}
                    <p className="text-xs font-black text-zinc-900 leading-snug group-hover:text-zinc-600 transition-colors mb-0.5">
                      {p.name}
                    </p>
                    {p.tagline && (
                      <p className="text-[10px] text-zinc-400 truncate mb-2">{p.tagline}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <CategoryPill category={p.category} />
                      {p.originalRetailPrice ? (
                        <p className="text-[9px] font-bold text-zinc-500 tabular-nums whitespace-nowrap">${p.originalRetailPrice} <span className="text-zinc-300 font-semibold">retail</span></p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-zinc-100 mt-8">
          <span className="text-xs text-zinc-400">
            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} models
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`e${i}`} className="px-2 text-zinc-300 text-sm select-none">...</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`min-w-[32px] h-8 text-sm rounded transition ${
                      p === page ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              type="button"
              onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
