'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLoader from '@/app/admin/_components/AdminLoader';
import { formatPrice } from '@/lib/utils';
import { BASE_URL } from '@/app/admin/_lib/config';
import { ACTION_BUTTON, ageLabel, CELL, dayText, dropStoresLabel, HEAD, NAME_LINK, ownPriceNote, safeHref, STORE_LINK, storeLabel } from '@/app/admin/_lib/insights';
import type { DailyInsights } from '@/app/admin/_lib/insights';
import { Empty, MoveTable, Section, Tile } from './_components/InsightParts';

export default function InsightsPage() {
  const router = useRouter();
  const [data, setData] = useState<DailyInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/admin/insights/daily`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
        return;
      }
      if (!res.ok) {
        setError(`Server error: ${res.status}`);
        setLoading(false);
        return;
      }
      setData(await res.json());
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect to API');
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  function reload() {
    setError('');
    setLoading(true);
    load();
  }

  if (loading) return <AdminLoader />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-400 font-medium text-sm">{error || 'No insights returned'}</p>
        <button type="button" onClick={reload} className={ACTION_BUTTON}>
          Retry
        </button>
      </div>
    );
  }

  const now = new Date();
  const stale = data.sources.filter((source) => source.stale);
  const noLivePrices = stale.length === data.sources.length;

  return (
    <div className="text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-zinc-500">Built {ageLabel(data.generatedAt, now)} from the price scraper. Store names here are for internal use only.</p>
        <button type="button" onClick={reload} className={ACTION_BUTTON}>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Tile label="New at stores" value={String(data.newListings.lastDay)} hint={`${data.newListings.lastWeek} in the last 7 days`} />
        <Tile label="Price drops" value={String(data.priceMoves.dropCount)} hint={`${data.priceMoves.riseCount} rises, last 7 days`} />
        <Tile label="Pairs matched" value={String(data.samePairs.total)} hint="2+ stores, or a store and our stock" />
        <Tile
          label="Price history"
          value={`${data.history.points.toLocaleString('en-IN')} points`}
          hint={data.history.since ? `since ${dayText(data.history.since)}` : 'starts with the next scrape'}
        />
      </div>

      <Section title="Sources" note={stale.length > 0 ? `${stale.length} not seen for 48 hours` : 'all seen in the last 48 hours'}>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-left">
                <th className={HEAD}>Store</th>
                <th className={HEAD}>Live, 30 days</th>
                <th className={HEAD}>Seen today</th>
                <th className={HEAD}>New today</th>
                <th className={HEAD}>With style code</th>
                <th className={HEAD}>Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.sources.map((source) => (
                <tr key={source.site}>
                  <td className={CELL}>
                    <span className="font-medium text-white">{storeLabel(source.site)}</span>
                    {source.stale && <span className="ml-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">Stale</span>}
                  </td>
                  <td data-label="Live, 30 days" className={`${CELL} text-zinc-300`}>
                    {source.live}
                  </td>
                  <td data-label="Seen today" className={`${CELL} text-zinc-300`}>
                    {source.seenLastDay}
                  </td>
                  <td data-label="New today" className={`${CELL} text-zinc-300`}>
                    {source.newLastDay}
                  </td>
                  <td data-label="With style code" className={`${CELL} text-zinc-300`}>
                    {source.withStyleCode}
                  </td>
                  <td data-label="Last seen" className={`${CELL} text-xs text-zinc-500 whitespace-nowrap`}>
                    {ageLabel(source.lastSeenAt, now)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Price drops" note="last 7 days, biggest first">
        <MoveTable moves={data.priceMoves.drops} tone="text-emerald-400" empty="No price drops recorded yet. Moves appear once a store changes a price after history starts." />
      </Section>

      <Section title="Price rises" note="last 7 days, biggest first">
        <MoveTable moves={data.priceMoves.rises} tone="text-red-400" empty="No price rises recorded yet." />
      </Section>

      <Section title="Same pair across stores" note={`${data.samePairs.items.length} of ${data.samePairs.total} shown`}>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-left">
                <th className={HEAD}>Pair</th>
                <th className={HEAD}>Stores</th>
                <th className={HEAD}>Spread</th>
                <th className={HEAD}>Our price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.samePairs.items.map((pair) => (
                <tr key={pair.styleCode}>
                  <td className={CELL}>
                    <div className="font-medium text-white">{pair.name}</div>
                    <div className="text-xs text-zinc-500">{pair.styleCode}</div>
                  </td>
                  <td data-label="Stores" className={CELL}>
                    <div className="flex flex-col gap-1 items-end md:items-start">
                      {pair.stores.map((store) => (
                        <a key={store.site} href={safeHref(store.url)} target="_blank" rel="noopener noreferrer nofollow" className={STORE_LINK}>
                          {storeLabel(store.site)} {formatPrice(store.price)}
                        </a>
                      ))}
                    </div>
                  </td>
                  <td data-label="Spread" className={`${CELL} text-zinc-300`}>
                    {pair.stores.length > 1 ? `${pair.spreadPct}%` : 'one store'}
                  </td>
                  <td data-label="Our price" className={CELL}>
                    {pair.own ? (
                      <>
                        <a href={`/products/${pair.own.slug}`} target="_blank" rel="noopener noreferrer" className={NAME_LINK}>
                          {formatPrice(pair.own.priceFrom)}
                        </a>
                        <div className={`text-xs ${pair.own.gapPct > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{ownPriceNote(pair.own.gapPct)}</div>
                      </>
                    ) : (
                      <span className="text-zinc-500">not stocked</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.samePairs.items.length === 0 && (
                <Empty columns={4}>
                  {noLivePrices
                    ? 'No store listing was seen in the last 48 hours, so there is no current price to match.'
                    : 'No pair matched by style code yet. Matches appear when two stores, or a store and our catalogue, carry the same code.'}
                </Empty>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="New at stores" note={`latest ${data.newListings.items.length} of ${data.newListings.lastWeek} this week`}>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-left">
                <th className={HEAD}>Pair</th>
                <th className={HEAD}>Store</th>
                <th className={HEAD}>Price</th>
                <th className={HEAD}>First seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.newListings.items.map((item) => (
                <tr key={item.url}>
                  <td className={CELL}>
                    <a href={safeHref(item.url)} target="_blank" rel="noopener noreferrer nofollow" className={NAME_LINK}>
                      {item.name}
                    </a>
                    <div className="text-xs text-zinc-500">{item.brand}</div>
                  </td>
                  <td data-label="Store" className={`${CELL} text-zinc-300`}>
                    {storeLabel(item.site)}
                  </td>
                  <td data-label="Price" className={`${CELL} text-zinc-300`}>
                    {item.price ? formatPrice(item.price) : 'no price'}
                  </td>
                  <td data-label="First seen" className={`${CELL} text-xs text-zinc-500 whitespace-nowrap`}>
                    {ageLabel(item.firstSeenAt, now)}
                  </td>
                </tr>
              ))}
              {data.newListings.items.length === 0 && <Empty columns={4}>Nothing new at the tracked stores this week.</Empty>}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Launches in the next 14 days" note="from our drop calendar">
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="admin-table w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-left">
                <th className={HEAD}>Drop</th>
                <th className={HEAD}>Date</th>
                <th className={HEAD}>Style code</th>
                <th className={HEAD}>Stores listing it</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.upcomingDrops.map((drop) => (
                <tr key={drop.slug}>
                  <td className={CELL}>
                    <a href={`/drops/${drop.slug}`} target="_blank" rel="noopener noreferrer" className={NAME_LINK}>
                      {drop.name}
                    </a>
                    <div className="text-xs text-zinc-500">{drop.brand}</div>
                  </td>
                  <td data-label="Date" className={`${CELL} text-zinc-300 whitespace-nowrap`}>
                    {dayText(drop.releaseDate)}
                  </td>
                  <td data-label="Style code" className={`${CELL} text-zinc-300`}>
                    {drop.styleCode || 'not set'}
                  </td>
                  <td data-label="Stores listing it" className={`${CELL} text-zinc-300`}>
                    {dropStoresLabel(drop, noLivePrices)}
                  </td>
                </tr>
              ))}
              {data.upcomingDrops.length === 0 && <Empty columns={4}>No published drop in the next 14 days.</Empty>}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
