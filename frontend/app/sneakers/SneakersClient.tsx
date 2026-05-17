'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SneakerProfile } from '@/types';

const ALL = 'All';

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
      {category}
    </span>
  );
}

interface Props {
  profiles: SneakerProfile[];
}

export default function SneakersClient({ profiles }: Props) {
  const [activeBrand, setActiveBrand] = useState(ALL);
  const [search, setSearch] = useState('');

  const brands = useMemo(() => {
    const set = new Set(profiles.map((p) => p.brand));
    return [ALL, ...Array.from(set).sort()];
  }, [profiles]);

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    profiles.forEach((p) => { counts[p.brand] = (counts[p.brand] ?? 0) + 1; });
    return counts;
  }, [profiles]);

  const filtered = useMemo(() => {
    let result = activeBrand === ALL ? profiles : profiles.filter((p) => p.brand === activeBrand);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.designer?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [profiles, activeBrand, search]);

  const byBrand = useMemo(() => {
    if (activeBrand !== ALL || search.trim()) {
      return filtered.length > 0 ? { [activeBrand === ALL ? 'Results' : activeBrand]: filtered } : {};
    }
    return filtered.reduce<Record<string, SneakerProfile[]>>((acc, p) => {
      (acc[p.brand] = acc[p.brand] || []).push(p);
      return acc;
    }, {});
  }, [filtered, activeBrand, search]);

  return (
    <div>
      {/* Search + Brand Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search sneakers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-200 focus:border-zinc-400 focus:outline-none bg-white placeholder:text-zinc-400 rounded-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setActiveBrand(b)}
              className={`px-4 py-2 text-[11px] font-bold tracking-widest uppercase transition-all duration-150 rounded-sm ${
                activeBrand === b
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
            >
              {b}
              {b !== ALL && (
                <span className={`ml-1.5 text-[9px] ${activeBrand === b ? 'text-zinc-400' : 'text-zinc-400'}`}>
                  {brandCounts[b] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(byBrand).length === 0 ? (
        <div className="py-20 text-center border border-dashed border-zinc-200">
          <p className="text-sm text-zinc-400">No sneakers found for "{search}".</p>
          <button onClick={() => { setSearch(''); setActiveBrand(ALL); }} className="mt-3 text-xs text-zinc-500 underline">Clear filters</button>
        </div>
      ) : (
        Object.entries(byBrand).map(([brand, brandProfiles]) => (
          <div key={brand} className="mb-14">
            {/* Brand header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-black tracking-[0.3em] uppercase text-zinc-900">{brand === 'Results' ? `${filtered.length} Result${filtered.length !== 1 ? 's' : ''}` : brand}</h2>
                {brand !== 'Results' && (
                  <span className="text-[9px] font-bold text-zinc-300 tracking-widest uppercase">
                    {brandProfiles.length} model{brandProfiles.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {brand !== 'Results' && (
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
                        className="object-cover group-hover:scale-108 transition-transform duration-400"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                        <svg className="w-8 h-8 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    {/* Year badge on hover */}
                    {p.releaseYear && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900/60 to-transparent py-2 px-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        <p className="text-[9px] font-bold text-zinc-300 tracking-widest uppercase">Est. {p.releaseYear}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 pb-3.5">
                    <p className="text-xs font-black text-zinc-900 leading-snug group-hover:text-zinc-600 transition-colors mb-0.5">
                      {p.name}
                    </p>
                    {p.tagline && (
                      <p className="text-[10px] text-zinc-400 truncate mb-1.5">{p.tagline}</p>
                    )}
                    <CategoryPill category={p.category} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
