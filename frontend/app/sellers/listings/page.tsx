'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { sellerApi } from '@/lib/sellerApi';
import { useDebouncedSearch, SEARCH_DEBOUNCE_MS } from '@/lib/hooks/useDebouncedValue';
import LoadMoreSentinel from '@/components/seller/LoadMoreSentinel';
import type { SellerListing, ListingStatus, ListingCompetition } from '@/types/seller';
import type { Availability } from '@/types';
import { AVAILABILITY_META, AVAILABILITY_ORDER } from '@/lib/availability';
import { formatPrice, cn } from '@/lib/utils';
import AddListingModal from '@/components/seller/AddListingModal';
import RequestProductModal from '@/components/seller/RequestProductModal';
import {
  useHandleApiError,
  useToast,
  Toast,
  Panel,
  PageHeader,
  LoadingBlock,
  ErrorBlock,
  EmptyBlock,
  AvailabilityBadge,
  ProductThumb,
  sizeLabel,
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  btnGhost,
  btnDanger,
} from '@/components/seller/SellerShell';

type Filter = 'all' | ListingStatus;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'sold_out', label: 'Sold out' },
];

const LISTING_STATUS: Record<ListingStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused: { label: 'Paused', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  sold_out: { label: 'Sold out', className: 'bg-red-50 text-red-700 border-red-200' },
};

interface Draft {
  sellerPrice: string;
  availability: Availability;
  qty: string;
}

function ListingStatusPill({ status }: { status: ListingStatus }) {
  const meta = LISTING_STATUS[status] ?? LISTING_STATUS.paused;
  return <span className={cn('inline-flex items-center border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap', meta.className)}>{meta.label}</span>;
}

function competitorName(by: 'store' | 'seller', capital = true) {
  if (by === 'store') return 'SNKRS CART stock';
  return capital ? 'Another seller' : 'another seller';
}

function CompetitionPill({ competition, className }: { competition: ListingCompetition | null; className?: string }) {
  if (!competition) return null;
  const base = 'inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap';
  if (competition.lowest) {
    return (
      <span className={cn(base, 'bg-emerald-600 border-emerald-600 text-white', className)}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        Lowest
      </span>
    );
  }
  return <span className={cn(base, 'bg-amber-50 border-amber-300 text-amber-800', className)}>Not lowest</span>;
}

function competitionHint(competition: ListingCompetition | null): string | null {
  if (!competition || competition.lowest) return null;
  const who = competitorName(competition.by);
  const lead = competition.tie ? `Same price as ${competitorName(competition.by, false)}, their offer ranks first.` : `${who} is cheaper.`;
  return `${lead} List at ${formatPrice(competition.beat)} or less to be the lowest.`;
}

function EditFields({ draft, onChange, compact, competition, currentPrice }: { draft: Draft; onChange: (patch: Partial<Draft>) => void; compact?: boolean; competition?: ListingCompetition | null; currentPrice?: number }) {
  const price = Number(draft.sellerPrice);
  const priceValid = draft.sellerPrice !== '' && Number.isFinite(price) && price >= 500;
  let rankHint: { text: string; tone: 'good' | 'warn' } | null = null;
  if (priceValid && competition) {
    if (competition.lowest) {
      if (currentPrice !== undefined && price <= currentPrice) rankHint = { text: 'You hold the lowest offer for this size', tone: 'good' };
    } else if (price <= competition.beat) {
      rankHint = { text: "You'll be the lowest offer", tone: 'good' };
    } else {
      rankHint = { text: `${competitorName(competition.by)} ranks first. Enter ${formatPrice(competition.beat)} or less to be the lowest`, tone: 'warn' };
    }
  }
  return (
    <div className={cn('grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-[1fr_1.4fr_72px]')}>
      <div className={compact ? 'col-span-2' : ''}>
        <label className={labelClass}>Your price</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">₹</span>
          <input
            type="number"
            inputMode="numeric"
            min={500}
            step={1}
            value={draft.sellerPrice}
            onChange={(e) => onChange({ sellerPrice: e.target.value })}
            className={`${inputClass} pl-7`}
          />
        </div>
        <p className="text-[11px] text-zinc-500 mt-1">
          {priceValid ? <>You receive <span className="font-bold text-zinc-900">{formatPrice(price)}</span> per pair</> : 'Minimum ₹500'}
        </p>
        {rankHint && (
          <p className={cn('text-[11px] font-bold mt-1', rankHint.tone === 'good' ? 'text-emerald-700' : 'text-amber-700')}>{rankHint.text}</p>
        )}
      </div>
      <div>
        <label className={labelClass}>Availability</label>
        <select value={draft.availability} onChange={(e) => onChange({ availability: e.target.value as Availability })} className={inputClass}>
          {AVAILABILITY_ORDER.map((a) => (
            <option key={a} value={a}>{AVAILABILITY_META[a].label}, {AVAILABILITY_META[a].description.toLowerCase()}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Qty</label>
        <input type="number" inputMode="numeric" min={0} max={50} step={1} value={draft.qty} onChange={(e) => onChange({ qty: e.target.value })} className={inputClass} />
      </div>
    </div>
  );
}

export default function SellerListingsPage() {
  const handleError = useHandleApiError();
  const { toast, show } = useToast();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedSearch(search, SEARCH_DEBOUNCE_MS);
  const loadSeq = useRef(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<Filter, number>>({ all: 0, active: 0, paused: 0, sold_out: 0 });
  const [hasAny, setHasAny] = useState<boolean | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ sellerPrice: '', availability: 'inhand', qty: '1' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SellerListing | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const applyCounts = useCallback((c: Record<string, number>) => {
    setCounts({ all: c.all ?? 0, active: c.active ?? 0, paused: c.paused ?? 0, sold_out: c.sold_out ?? 0 });
  }, []);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError('');
    try {
      const res = await sellerApi.listings({ search: debouncedSearch, status: filter, page: 1 });
      if (seq !== loadSeq.current) return;
      setListings(res.items);
      setPage(1);
      setHasMore(res.hasMore);
      setTotal(res.total);
      applyCounts(res.counts);
      if (!debouncedSearch && filter === 'all') setHasAny(res.total > 0);
      else if (res.counts.all > 0) setHasAny(true);
    } catch (err) {
      if (seq === loadSeq.current) setError(handleError(err));
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [debouncedSearch, filter, handleError, applyCounts]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await sellerApi.listings({ search: debouncedSearch, status: filter, page: next });
      setListings((prev) => {
        const seen = new Set(prev.map((l) => l.id));
        return [...prev, ...res.items.filter((l) => !seen.has(l.id))];
      });
      setPage(next);
      setHasMore(res.hasMore);
      setTotal(res.total);
      applyCounts(res.counts);
    } catch (err) {
      show(handleError(err), 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMore, page, debouncedSearch, filter, handleError, applyCounts, show]);

  const refreshCounts = useCallback(async () => {
    try {
      const res = await sellerApi.listings({ search: debouncedSearch, status: filter, page: 1, limit: 1 });
      applyCounts(res.counts);
      setTotal(res.total);
      if (res.counts.all > 0) setHasAny(true);
    } catch {}
  }, [debouncedSearch, filter, applyCounts]);

  const filtered = listings;

  function replaceListing(updated: SellerListing) {
    setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    refreshCounts();
  }

  function startEdit(l: SellerListing) {
    setEditingId(l.id);
    setDraft({ sellerPrice: String(l.sellerPrice), availability: l.availability, qty: String(l.qty) });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(l: SellerListing) {
    const price = Math.round(Number(draft.sellerPrice));
    const qty = Math.floor(Number(draft.qty));
    if (!Number.isFinite(price) || price < 500 || price > 1000000) {
      show('Price must be between ₹500 and ₹10,00,000', 'error');
      return;
    }
    if (!Number.isFinite(qty) || qty < 0 || qty > 50) {
      show('Quantity must be 0-50', 'error');
      return;
    }
    setBusyId(l.id);
    try {
      const updated = await sellerApi.updateListing(l.id, { sellerPrice: price, availability: draft.availability, qty });
      replaceListing(updated);
      setEditingId(null);
      show(`Saved ${sizeLabel(updated.size)}`);
    } catch (err) {
      show(handleError(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(l: SellerListing) {
    const next = l.status === 'active' ? 'paused' : 'active';
    setBusyId(l.id);
    try {
      const updated = await sellerApi.updateListing(l.id, { status: next });
      replaceListing(updated);
      show(updated.status === 'active' ? 'Listing is live again' : updated.status === 'paused' ? 'Listing paused, hidden from customers' : 'Listing is sold out, add quantity to activate it');
    } catch (err) {
      show(handleError(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setBusyId(target.id);
    try {
      await sellerApi.deleteListing(target.id);
      setListings((prev) => prev.filter((l) => l.id !== target.id));
      setDeleteTarget(null);
      show('Listing deleted');
    } catch (err) {
      show(handleError(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  function handleCreated(created: SellerListing[]) {
    setListings((prev) => {
      const ids = new Set(created.map((c) => c.id));
      return [...created, ...prev.filter((l) => !ids.has(l.id))];
    });
    setFilter('all');
    show(`${created.length} listing${created.length === 1 ? '' : 's'} saved and live`);
  }

  const actions = (
    <>
      <button type="button" onClick={() => setRequestOpen(true)} className={btnSecondary}>
        Request new product
      </button>
      <button type="button" onClick={() => setAddOpen(true)} className={btnPrimary}>
        + Add listing
      </button>
    </>
  );

  return (
    <div>
      <PageHeader eyebrow="Inventory" title="Listings" description="Your price is exactly what you get paid when a pair sells." actions={actions} />

      {hasAny !== false && (
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, brand, colorway or size"
              className={`${inputClass} pl-10`}
              aria-label="Search listings"
            />
            <svg className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
            </svg>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1" role="tablist" aria-label="Listing filters">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'shrink-0 min-h-[40px] px-3.5 border text-[11px] font-bold tracking-widest uppercase transition-colors',
                  filter === f.value ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-900',
                )}
              >
                {f.label} {hasAny !== null && <span className="text-zinc-400">{counts[f.value]}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <LoadingBlock label="Loading listings" />}
      {!loading && error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          {hasAny === false && listings.length === 0 ? (
            <EmptyBlock
              title="No listings yet"
              body="Add your first listing from the SNKRS CART catalog. Pick the sizes you have, set your price, and customers can buy right away."
              action={<button type="button" onClick={() => setAddOpen(true)} className={btnPrimary}>+ Add listing</button>}
            />
          ) : filtered.length === 0 ? (
            <EmptyBlock title="Nothing matches" body="Try a different search or status filter." action={<button type="button" onClick={() => { setSearch(''); setFilter('all'); }} className={btnSecondary}>Clear filters</button>} />
          ) : (
            <>
              <Panel className="hidden md:block overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-left">
                      <th className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500">Product</th>
                      <th className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500">Your price</th>
                      <th className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500">Availability</th>
                      <th className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500">Qty</th>
                      <th className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500">Status</th>
                      <th className="px-4 py-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filtered.map((l) => {
                      const editing = editingId === l.id;
                      const busy = busyId === l.id;
                      return (
                        <tr key={l.id} className={cn('align-top', editing && 'bg-zinc-50')}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <ProductThumb src={l.product?.image ?? ''} alt={l.product?.name ?? 'Product'} className="w-12 h-12" />
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{l.product?.brand ?? ''}</p>
                                <p className="font-bold text-zinc-900 leading-tight">{l.product?.name ?? 'Product removed'}</p>
                                <p className="text-xs text-zinc-500 truncate max-w-[260px]">
                                  {l.product?.colorway ? `${l.product.colorway}, ` : ''}
                                  <span className="font-bold text-zinc-700">{sizeLabel(l.size)}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          {editing ? (
                            <td className="px-4 py-3" colSpan={3}>
                              <EditFields draft={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} competition={l.competition} currentPrice={l.sellerPrice} />
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-3">
                                <p className="font-black text-zinc-900 whitespace-nowrap">{formatPrice(l.sellerPrice)}</p>
                                <CompetitionPill competition={l.competition} className="mt-1" />
                                {(() => { const hint = competitionHint(l.competition); return hint ? <p className="text-[11px] text-amber-700 mt-1 max-w-[220px] leading-snug">{hint}</p> : null; })()}
                              </td>
                              <td className="px-4 py-3">
                                <AvailabilityBadge availability={l.availability} showDescription />
                              </td>
                              <td className="px-4 py-3 font-bold text-zinc-900">
                                {l.qty}
                                {l.soldCount > 0 && <p className="text-[10px] text-zinc-400 font-medium">{l.soldCount} sold</p>}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3">
                            <ListingStatusPill status={l.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {editing ? (
                                <>
                                  <button type="button" onClick={cancelEdit} disabled={busy} className={btnGhost}>Cancel</button>
                                  <button type="button" onClick={() => saveEdit(l)} disabled={busy} className={cn(btnPrimary, 'min-h-[40px] px-4')}>{busy ? 'Saving...' : 'Save'}</button>
                                </>
                              ) : (
                                <>
                                  <button type="button" onClick={() => startEdit(l)} disabled={busy} className={btnGhost}>Edit</button>
                                  {l.status !== 'sold_out' && (
                                    <button type="button" onClick={() => toggleStatus(l)} disabled={busy} className={btnGhost}>
                                      {busy ? '...' : l.status === 'active' ? 'Pause' : 'Activate'}
                                    </button>
                                  )}
                                  <button type="button" onClick={() => setDeleteTarget(l)} disabled={busy} className={cn(btnGhost, 'text-red-600 hover:text-red-700 hover:bg-red-50')}>Delete</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Panel>

              <div className="md:hidden space-y-3">
                {filtered.map((l) => {
                  const editing = editingId === l.id;
                  const busy = busyId === l.id;
                  return (
                    <Panel key={l.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <ProductThumb src={l.product?.image ?? ''} alt={l.product?.name ?? 'Product'} className="w-16 h-16" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{l.product?.brand ?? ''}</p>
                          <p className="text-sm font-bold text-zinc-900 leading-tight">{l.product?.name ?? 'Product removed'}</p>
                          {l.product?.colorway && <p className="text-xs text-zinc-500 truncate">{l.product.colorway}</p>}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-xs font-black text-zinc-900">{sizeLabel(l.size)}</span>
                            <ListingStatusPill status={l.status} />
                            <CompetitionPill competition={l.competition} />
                          </div>
                        </div>
                      </div>

                      {editing ? (
                        <div className="mt-4">
                          <EditFields draft={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} compact competition={l.competition} currentPrice={l.sellerPrice} />
                          <div className="flex gap-2 mt-4">
                            <button type="button" onClick={cancelEdit} disabled={busy} className={`${btnSecondary} flex-1`}>Cancel</button>
                            <button type="button" onClick={() => saveEdit(l)} disabled={busy} className={`${btnPrimary} flex-1`}>{busy ? 'Saving...' : 'Save'}</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-2 mt-4 border-t border-zinc-100 pt-3">
                            <div>
                              <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400">Your price</p>
                              <p className="text-sm font-black text-zinc-900 mt-0.5">{formatPrice(l.sellerPrice)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400">Qty</p>
                              <p className="text-sm font-black text-zinc-900 mt-0.5">{l.qty}{l.soldCount > 0 && <span className="text-[10px] text-zinc-400 font-medium"> ({l.soldCount} sold)</span>}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <AvailabilityBadge availability={l.availability} showDescription />
                          </div>
                          {(() => { const hint = competitionHint(l.competition); return hint ? <p className="text-[11px] text-amber-700 mt-3 leading-snug border-l-2 border-amber-300 pl-2">{hint}</p> : null; })()}
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            <button type="button" onClick={() => startEdit(l)} disabled={busy} className={`${btnSecondary} min-h-[40px] px-2`}>Edit</button>
                            {l.status !== 'sold_out' ? (
                              <button type="button" onClick={() => toggleStatus(l)} disabled={busy} className={`${btnSecondary} min-h-[40px] px-2`}>
                                {busy ? '...' : l.status === 'active' ? 'Pause' : 'Activate'}
                              </button>
                            ) : (
                              <button type="button" onClick={() => startEdit(l)} disabled={busy} className={`${btnSecondary} min-h-[40px] px-2`}>Add qty</button>
                            )}
                            <button type="button" onClick={() => setDeleteTarget(l)} disabled={busy} className="min-h-[40px] px-2 border border-red-200 text-red-600 text-xs font-bold tracking-widest uppercase hover:bg-red-50 disabled:opacity-40 transition-colors">Delete</button>
                          </div>
                        </>
                      )}
                    </Panel>
                  );
                })}
              </div>
              <LoadMoreSentinel hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} label={`Load more (${Math.max(0, total - listings.length)} left)`} />
            </>
          )}
        </>
      )}

      <AddListingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
        onRequestProduct={() => setRequestOpen(true)}
      />
      <RequestProductModal open={requestOpen} onClose={() => setRequestOpen(false)} onCreated={() => show('Request sent to SNKRS CART')} />

      <Dialog.Root open={!!deleteTarget} onOpenChange={(next) => { if (!next && busyId === null) setDeleteTarget(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 animate-backdrop-in" />
          <Dialog.Content className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-fit w-full md:max-w-md bg-white shadow-2xl focus:outline-none animate-modal-up md:animate-modal-in">
            <div className="px-6 py-6">
              <Dialog.Title asChild>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Delete listing</p>
              </Dialog.Title>
              <Dialog.Description asChild>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  Remove <span className="font-bold text-zinc-900">{deleteTarget?.product?.name ?? 'this product'}</span> in <span className="font-bold text-zinc-900">{deleteTarget ? sizeLabel(deleteTarget.size) : ''}</span> from your listings? Customers will no longer see this offer. Existing orders are not affected.
                </p>
              </Dialog.Description>
              <div className="flex gap-2 mt-6">
                <Dialog.Close asChild>
                  <button type="button" disabled={busyId !== null} className={`${btnSecondary} flex-1`}>Keep it</button>
                </Dialog.Close>
                <button type="button" onClick={confirmDelete} disabled={busyId !== null} className={`${btnDanger} flex-1`}>
                  {busyId && deleteTarget && busyId === deleteTarget.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Toast toast={toast} />
    </div>
  );
}
