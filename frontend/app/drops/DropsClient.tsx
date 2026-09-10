'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Drop } from '@/types';
import { formatDropPrice } from '@/lib/utils';
import { dateKey, daysUntil, formatDropDate, todayKey } from '@/lib/calendar';
import Countdown from '@/components/drops/Countdown';
import AddToCalendar from '@/components/drops/AddToCalendar';

const ALL = 'All';
type View = 'list' | 'calendar';
// 'all' | 'week' | 'YYYY-MM' (month) | 'YYYY-MM-DD' (single day, picked from calendar)
type Range = string;

function monthKey(k: string) { return k.slice(0, 7); }
function monthLabel(ym: string, opts: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', { ...opts, timeZone: 'UTC' });
}
function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

function CountdownBadge({ days }: { days: number }) {
  if (days < 0) return <span className="bg-zinc-200 text-zinc-600 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-sm">Released</span>;
  if (days === 0) return <span className="bg-red-500 text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-sm">Today</span>;
  if (days === 1) return <span className="bg-orange-500 text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-sm">Tomorrow</span>;
  if (days <= 7) return <span className="bg-amber-400 text-zinc-900 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-sm">{days}D left</span>;
  return <span className="bg-zinc-900/70 backdrop-blur-sm text-white text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-sm">{days} days</span>;
}

function Chip({ active, onClick, children, size = 'md' }: { active: boolean; onClick: () => void; children: React.ReactNode; size?: 'md' | 'sm' }) {
  const pad = size === 'sm' ? 'px-3 py-1 text-[10px]' : 'px-4 py-1.5 text-[11px]';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${pad} font-bold tracking-widest uppercase transition-all duration-150 rounded-sm whitespace-nowrap ${
        active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
      }`}
    >
      {children}
    </button>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────── */
function DropCard({ drop }: { drop: Drop }) {
  const days = daysUntil(drop.releaseDate);
  const href = `/drops/${drop.slug}`;
  return (
    <article className="group border border-zinc-100 hover:border-zinc-300 hover:shadow-md transition-all duration-200 bg-white flex flex-col">
      <Link href={href} className="relative block aspect-[4/3] bg-zinc-50 overflow-hidden">
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
        <div className="absolute top-2.5 right-2.5"><CountdownBadge days={days} /></div>
        {drop.availableAtStore && (
          <div className="absolute top-2.5 left-2.5 bg-zinc-900 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm">In Store</div>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-400 mb-1">{drop.brand}</p>
        <Link href={href} className="text-sm font-bold text-zinc-900 leading-snug mb-1 hover:text-zinc-600 transition-colors line-clamp-2">
          {drop.name}
        </Link>
        {drop.colorway && <p className="text-[10px] text-zinc-400 truncate">{drop.colorway}</p>}
        <div className="flex items-center justify-between pt-2.5 mt-auto border-t border-zinc-50">
          <p className="text-[10px] text-zinc-500">{formatDropDate(drop.releaseDate, { day: 'numeric', month: 'short' })}{drop.where ? <span className="text-zinc-300"> · {drop.where}</span> : null}</p>
          {drop.retailPrice ? <p className="text-xs font-black text-zinc-900">{formatDropPrice(drop.retailPrice, drop.currency)}</p> : <p className="text-[10px] text-zinc-300 font-bold uppercase">Price TBC</p>}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <AddToCalendar drop={drop} variant="compact" />
          {drop.availableAtStore && drop.productSlug ? (
            <Link href={`/products/${drop.productSlug}`} className="ml-auto inline-flex items-center px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors rounded-sm">
              Shop
            </Link>
          ) : (
            <Link href={href} className="ml-auto text-[10px] font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors">
              Details →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/* ── Month calendar ───────────────────────────────────────────────────── */
function MonthGrid({ ym, byDay, today, onShift, onPick }: {
  ym: string;
  byDay: Map<string, Drop[]>;
  today: string;
  onShift: (delta: number) => void;
  onPick: (key: string) => void;
}) {
  const [y, m] = ym.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday-first
  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const monthTotal = Array.from(byDay.entries()).filter(([k]) => k.startsWith(ym)).reduce((n, [, v]) => n + v.length, 0);

  return (
    <div className="border border-zinc-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <button type="button" onClick={() => onShift(-1)} aria-label="Previous month" className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-black tracking-tight text-zinc-900">{monthLabel(ym)}</p>
          <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400">{monthTotal} release{monthTotal !== 1 ? 's' : ''}</p>
        </div>
        <button type="button" onClick={() => onShift(1)} aria-label="Next month" className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-zinc-100">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <p key={d} className="py-2 text-center text-[9px] font-bold tracking-widest uppercase text-zinc-400">{d}</p>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day == null) return <div key={`e${i}`} className="aspect-square sm:aspect-[5/4] border-b border-r border-zinc-50 bg-zinc-50/40" />;
          const key = `${ym}-${String(day).padStart(2, '0')}`;
          const drops = byDay.get(key) ?? [];
          const isToday = key === today;
          const isPast = key < today;
          const has = drops.length > 0;
          return (
            <button
              key={key}
              type="button"
              disabled={!has}
              onClick={() => onPick(key)}
              aria-label={has ? `${drops.length} release${drops.length > 1 ? 's' : ''} on ${formatDropDate(key)}` : undefined}
              className={`relative aspect-square sm:aspect-[5/4] border-b border-r border-zinc-50 p-1.5 sm:p-2 text-left flex flex-col transition-colors ${
                has ? 'hover:bg-zinc-50 cursor-pointer' : 'cursor-default'
              } ${isPast && !has ? 'bg-zinc-50/40' : ''}`}
            >
              <span className={`text-[11px] font-bold tabular-nums leading-none ${
                isToday ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900 text-white' : isPast ? 'text-zinc-300' : has ? 'text-zinc-900' : 'text-zinc-400'
              }`}>{day}</span>
              {has && (
                <div className="mt-auto flex items-end gap-1">
                  {drops.slice(0, 2).map((d) => (
                    <span key={d._id} className={`relative block w-6 h-6 sm:w-8 sm:h-8 overflow-hidden rounded-sm bg-zinc-100 ring-1 ring-zinc-200 ${isPast ? 'grayscale opacity-60' : ''}`}>
                      {d.image && <Image src={d.image} alt="" fill className="object-cover" sizes="32px" />}
                    </span>
                  ))}
                  {drops.length > 2 && <span className="text-[9px] font-bold text-zinc-500">+{drops.length - 2}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
interface Props {
  upcoming: Drop[];   // sorted ascending by release date
  recent: Drop[];     // sorted descending by release date
  initial?: { brand?: string; q?: string; view?: View; range?: Range };
}

export default function DropsClient({ upcoming, recent, initial = {} }: Props) {
  const today = todayKey();
  const [brand, setBrand] = useState(initial.brand || ALL);
  const [search, setSearch] = useState(initial.q || '');
  const [range, setRange] = useState<Range>(initial.range || 'all');
  const [view, setView] = useState<View>(initial.view || 'list');
  const [calMonth, setCalMonth] = useState(initial.range && initial.range.length >= 7 ? initial.range.slice(0, 7) : monthKey(today));

  // Keep the URL in sync so filtered views are shareable and server-renderable (no navigation, no refetch)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const params = new URLSearchParams();
    if (brand !== ALL) params.set('brand', brand);
    if (search.trim()) params.set('q', search.trim());
    if (view !== 'list') params.set('view', view);
    if (range !== 'all') params.set('range', range);
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [brand, search, view, range]);

  const brands = useMemo(() => [ALL, ...Array.from(new Set(upcoming.map((d) => d.brand))).sort()], [upcoming]);
  const months = useMemo(() => Array.from(new Set(upcoming.map((d) => monthKey(dateKey(d.releaseDate))))).sort(), [upcoming]);
  const hasWeek = useMemo(() => upcoming.some((d) => daysUntil(d.releaseDate) <= 7), [upcoming]);

  const matchesBrandSearch = (d: Drop) => {
    if (brand !== ALL && d.brand !== brand) return false;
    const q = search.trim().toLowerCase();
    if (q && !`${d.name} ${d.brand} ${d.colorway} ${d.where}`.toLowerCase().includes(q)) return false;
    return true;
  };

  const filtered = useMemo(() => upcoming.filter((d) => {
    if (!matchesBrandSearch(d)) return false;
    const k = dateKey(d.releaseDate);
    if (range === 'week') return daysUntil(d.releaseDate) <= 7;
    if (range.length === 7) return monthKey(k) === range;
    if (range.length === 10) return k === range;
    return true;
  }), [upcoming, brand, search, range]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const map = new Map<string, Drop[]>();
    filtered.forEach((d) => { const k = dateKey(d.releaseDate); map.set(k, [...(map.get(k) ?? []), d]); });
    return Array.from(map.entries());
  }, [filtered]);

  // Calendar shows everything we know about (past + upcoming), brand/search-filtered but not range-filtered
  const byDay = useMemo(() => {
    const map = new Map<string, Drop[]>();
    [...recent, ...upcoming].filter(matchesBrandSearch).forEach((d) => { const k = dateKey(d.releaseDate); map.set(k, [...(map.get(k) ?? []), d]); });
    return map;
  }, [upcoming, recent, brand, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = upcoming[0] ?? null;
  const recentFiltered = recent.filter(matchesBrandSearch);
  const isFiltering = brand !== ALL || search.trim() !== '' || range !== 'all';

  function pickDay(key: string) {
    const drops = byDay.get(key) ?? [];
    if (drops.length === 0) return;
    if (key < today) {
      // past day: jump to the recently released section
      setView('list');
      setRange('all');
      setTimeout(() => document.getElementById('recent-releases')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      return;
    }
    setRange(key);
    setView('list');
  }

  return (
    <div>
      {/* ── Next up strip ── */}
      {next && (
        <section className="relative bg-zinc-950 text-white mb-8 overflow-hidden">
          {next.image && (
            <Image src={next.image} alt="" fill className="object-cover opacity-20 blur-sm scale-110" sizes="100vw" aria-hidden />
          )}
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 p-5 sm:p-7">
            <Link href={`/drops/${next.slug}`} className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-zinc-900 overflow-hidden rounded-sm ring-1 ring-white/10">
              {next.image && <Image src={next.image} alt={next.name} fill className="object-cover" sizes="112px" priority />}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Next drop · {next.brand}
              </p>
              <Link href={`/drops/${next.slug}`} className="block text-xl sm:text-2xl font-black tracking-tight leading-tight hover:text-zinc-300 transition-colors truncate">
                {next.name}
              </Link>
              <p className="text-xs text-zinc-400 mt-1">
                {formatDropDate(next.releaseDate, { weekday: 'long', day: 'numeric', month: 'long' })}
                {next.retailPrice ? <span className="text-white font-bold"> · {formatDropPrice(next.retailPrice, next.currency)}</span> : null}
                {next.where ? <span> · {next.where}</span> : null}
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <Countdown releaseDate={next.releaseDate} size="lg" />
            </div>
          </div>
        </section>
      )}

      {/* ── Toolbar ── */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search drops, colorways, retailers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-200 focus:border-zinc-400 focus:outline-none bg-white placeholder:text-zinc-400"
            />
          </div>
          <div className="inline-flex border border-zinc-200 rounded-sm overflow-hidden self-start sm:ml-auto" role="tablist" aria-label="View">
            {(['list', 'calendar'] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${view === v ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-500 hover:text-zinc-900'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {brands.map((b) => <Chip key={b} active={brand === b} onClick={() => setBrand(b)}>{b}</Chip>)}
        </div>

        {view === 'list' && (
          <div className="flex gap-2 flex-wrap items-center">
            <Chip size="sm" active={range === 'all'} onClick={() => setRange('all')}>All dates</Chip>
            {hasWeek && <Chip size="sm" active={range === 'week'} onClick={() => setRange('week')}>Next 7 days</Chip>}
            {months.map((ym) => (
              <Chip key={ym} size="sm" active={range === ym} onClick={() => setRange(ym)}>
                {monthLabel(ym, { month: 'short', year: ym.slice(0, 4) === today.slice(0, 4) ? undefined : '2-digit' })}
              </Chip>
            ))}
            {range.length === 10 && (
              <Chip size="sm" active onClick={() => setRange('all')}>{formatDropDate(range, { day: 'numeric', month: 'short' })} ✕</Chip>
            )}
          </div>
        )}
      </div>

      {/* ── Calendar view ── */}
      {view === 'calendar' && (
        <div className="mb-16">
          <MonthGrid ym={calMonth} byDay={byDay} today={today} onShift={(d) => setCalMonth((m) => shiftMonth(m, d))} onPick={pickDay} />
          <p className="text-[10px] text-zinc-400 mt-3">Tap a date to see that day&apos;s releases. Past dates jump to recently released.</p>
        </div>
      )}

      {/* ── List view (grouped by date) ── */}
      {view === 'list' && (
        groups.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-200 mb-16">
            <p className="text-sm text-zinc-400">No upcoming drops match{brand !== ALL ? ` ${brand}` : ''}{search ? ` “${search}”` : ''}.</p>
            {isFiltering && (
              <button type="button" onClick={() => { setBrand(ALL); setSearch(''); setRange('all'); }} className="mt-3 text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-900">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="mb-16">
            {groups.map(([key, drops]) => {
              const d = new Date(key);
              const days = daysUntil(key);
              return (
                <section key={key} className="mb-10" aria-label={formatDropDate(key)}>
                  <header className="sticky top-16 z-10 bg-white/95 backdrop-blur border-b border-zinc-200 mb-4">
                    <div className="flex items-end gap-4 py-3">
                      <p className="text-4xl sm:text-5xl font-black leading-none tabular-nums tracking-tight text-zinc-900">
                        {String(d.getUTCDate()).padStart(2, '0')}
                      </p>
                      <div className="pb-0.5">
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 leading-none mb-1">
                          {d.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'UTC' })}
                        </p>
                        <p className="text-sm font-bold text-zinc-900 leading-none">
                          {d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                        </p>
                      </div>
                      <div className="pb-1"><CountdownBadge days={days} /></div>
                      <p className="ml-auto pb-1 text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                        {drops.length} release{drops.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </header>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {drops.map((drop) => <DropCard key={drop._id} drop={drop} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )
      )}

      {/* ── Recently released ── */}
      {recentFiltered.length > 0 && (
        <section id="recent-releases" className="scroll-mt-24">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-zinc-100" />
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">Recently released</p>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {recentFiltered.slice(0, 12).map((drop) => (
              <div key={drop._id} className="group">
                <Link href={`/drops/${drop.slug}`} className="relative block aspect-square bg-zinc-100 overflow-hidden mb-2">
                  {drop.image ? (
                    <Image
                      src={drop.image}
                      alt={drop.name}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300 opacity-70 group-hover:opacity-100"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                    />
                  ) : <div className="w-full h-full bg-zinc-100" />}
                  {drop.availableAtStore && (
                    <span className="absolute top-2 left-2 bg-zinc-900 text-white text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-sm">In Store</span>
                  )}
                </Link>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">{drop.brand}</p>
                <Link href={`/drops/${drop.slug}`} className="block text-[11px] font-bold text-zinc-600 leading-tight truncate group-hover:text-zinc-900 transition-colors">{drop.name}</Link>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[9px] text-zinc-400">{formatDropDate(drop.releaseDate, { day: 'numeric', month: 'short' })}</p>
                  {drop.availableAtStore && drop.productSlug && (
                    <Link href={`/products/${drop.productSlug}`} className="text-[9px] font-bold tracking-widest uppercase text-zinc-900 hover:underline underline-offset-2">Shop</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
