'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Drop } from '@/types';
import { formatDropPrice } from '@/lib/utils';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(dateStr: string): number {
  const release = dateStr.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return Math.round((new Date(release).getTime() - new Date(today).getTime()) / 86400000);
}

function CountdownBadge({ days }: { days: number }) {
  if (days === 0) return <span className="bg-red-500 text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-sm">TODAY</span>;
  if (days === 1) return <span className="bg-orange-500 text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-sm">TOMORROW</span>;
  if (days <= 7) return <span className="bg-amber-400 text-zinc-900 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-sm">{days}D LEFT</span>;
  return <span className="bg-zinc-900/70 backdrop-blur-sm text-white text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-sm">{days} DAYS</span>;
}

interface Props {
  upcoming: Drop[];
  recent: Drop[];
}

const ALL = 'All';

export default function DropsClient({ upcoming, recent }: Props) {
  const [activeBrand, setActiveBrand] = useState(ALL);

  const brands = useMemo(() => {
    const set = new Set(upcoming.map((d) => d.brand));
    return [ALL, ...Array.from(set).sort()];
  }, [upcoming]);

  const filtered = activeBrand === ALL ? upcoming : upcoming.filter((d) => d.brand === activeBrand);
  const hero = filtered[0] ?? null;
  const rest = filtered.slice(1);

  return (
    <div>
      {/* Brand filter tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {brands.map((b) => (
          <button
            key={b}
            onClick={() => setActiveBrand(b)}
            className={`px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-all duration-150 rounded-sm ${
              activeBrand === b
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-zinc-200">
          <p className="text-sm text-zinc-400">No upcoming drops for {activeBrand}.</p>
        </div>
      ) : (
        <>
          {/* ── Hero drop ── */}
          {hero && (
            <Link href={`/drops/${hero.slug}`} className="group block mb-8">
              <div className="relative overflow-hidden bg-zinc-950 aspect-[16/7] sm:aspect-[21/8]">
                {hero.image && (
                  <Image
                    src={hero.image}
                    alt={hero.name}
                    fill
                    className="object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                    sizes="100vw"
                    priority
                  />
                )}
                {/* gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent" />

                {/* In Store badge */}
                {hero.availableAtStore && (
                  <div className="absolute top-4 right-4 bg-white text-zinc-900 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-sm">
                    In Store
                  </div>
                )}

                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black tracking-widest uppercase text-zinc-300">{hero.brand}</span>
                    <CountdownBadge days={daysUntil(hero.releaseDate)} />
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2 leading-tight max-w-xl">
                    {hero.name}
                  </h2>
                  {hero.colorway && <p className="text-sm text-zinc-400 mb-3">{hero.colorway}</p>}
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-zinc-400">{formatDate(hero.releaseDate)}</p>
                    {hero.retailPrice && (
                      <p className="text-base font-black text-white">{formatDropPrice(hero.retailPrice, hero.currency)}</p>
                    )}
                    <span className="text-xs font-bold text-zinc-300 underline underline-offset-4 group-hover:text-white transition-colors">
                      View Drop →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ── Rest of upcoming ── */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-16">
              {rest.map((drop) => {
                const days = daysUntil(drop.releaseDate);
                return (
                  <Link
                    key={drop._id}
                    href={`/drops/${drop.slug}`}
                    className="group border border-zinc-100 hover:border-zinc-300 hover:shadow-md transition-all duration-200 overflow-hidden bg-white"
                  >
                    <div className="relative aspect-[4/3] bg-zinc-50 overflow-hidden">
                      {drop.image ? (
                        <Image
                          src={drop.image}
                          alt={drop.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-400"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                          <p className="text-xs text-zinc-300 font-bold tracking-widest uppercase">{drop.brand}</p>
                        </div>
                      )}
                      <div className="absolute top-2.5 right-2.5">
                        <CountdownBadge days={days} />
                      </div>
                      {drop.availableAtStore && (
                        <div className="absolute top-2.5 left-2.5 bg-zinc-900 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm">
                          In Store
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-400 mb-1">{drop.brand}</p>
                      <p className="text-sm font-bold text-zinc-900 leading-snug mb-1 group-hover:text-zinc-600 transition-colors line-clamp-2">
                        {drop.name}
                      </p>
                      {drop.colorway && <p className="text-[10px] text-zinc-400 mb-3 truncate">{drop.colorway}</p>}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                        <p className="text-[10px] text-zinc-400">{formatDate(drop.releaseDate)}</p>
                        {drop.retailPrice && (
                          <p className="text-xs font-black text-zinc-900">{formatDropPrice(drop.retailPrice, drop.currency)}</p>
                        )}
                      </div>
                      {drop.where && (
                        <p className="text-[9px] text-zinc-300 mt-1.5 truncate">via {drop.where}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Recently Released ── */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-zinc-100" />
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300">Recently Released</p>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {recent.slice(0, 12).map((drop) => (
              <Link
                key={drop._id}
                href={`/drops/${drop.slug}`}
                className="group overflow-hidden"
              >
                <div className="relative aspect-square bg-zinc-100 overflow-hidden mb-2">
                  {drop.image ? (
                    <Image
                      src={drop.image}
                      alt={drop.name}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300 opacity-70 group-hover:opacity-100"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-100" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-0">
                    <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 bg-white/80 px-2 py-0.5">Released</span>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">{drop.brand}</p>
                <p className="text-[11px] font-bold text-zinc-600 leading-tight truncate group-hover:text-zinc-900 transition-colors">{drop.name}</p>
                <p className="text-[9px] text-zinc-300 mt-0.5">{formatDate(drop.releaseDate)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
