'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { sellerApi } from '@/lib/sellerApi';
import type { CatalogDetail, CatalogOffer, CatalogProduct, SellerListing } from '@/types/seller';
import type { Availability } from '@/types';
import { AVAILABILITY_META, AVAILABILITY_ORDER } from '@/lib/availability';
import { formatPrice, cn } from '@/lib/utils';
import {
  ProductThumb,
  Spinner,
  inputClass,
  labelClass,
  btnPrimary,
  btnGhost,
  sizeLabel,
  useHandleApiError,
} from '@/components/seller/SellerShell';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (listings: SellerListing[]) => void;
  onRequestProduct: () => void;
  initialProductId?: string;
}

interface Entry {
  sellerPrice: string;
  availability: Availability;
  qty: string;
}

const MIN_PRICE = 500;
const MAX_PRICE = 1000000;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AddListingModal({ open, onClose, onCreated, onRequestProduct, initialProductId }: Props) {
  const handleError = useHandleApiError();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [productId, setProductId] = useState<string | null>(initialProductId ?? null);
  const [detail, setDetail] = useState<CatalogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showAllSizes, setShowAllSizes] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults([]);
    setSearchError('');
    setProductId(initialProductId ?? null);
    setDetail(null);
    setDetailError('');
    setEntries({});
    setSubmitError('');
  }, [open, initialProductId]);

  const debouncedQuery = useDebouncedValue(query.trim(), 400);
  type SearchPage = { products: CatalogProduct[]; page: number; hasMore: boolean };
  const searchCache = useRef(new Map<string, SearchPage>());
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || productId) return;
    const cached = searchCache.current.get(debouncedQuery);
    if (cached) {
      setResults(cached.products);
      setHasMore(cached.hasMore);
      pageRef.current = cached.page;
      setSearching(false);
      setSearchError('');
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError('');
    sellerApi.catalogSearch(debouncedQuery, 1)
      .then((res) => {
        if (cancelled) return;
        searchCache.current.set(debouncedQuery, res);
        setResults(res.products);
        setHasMore(res.hasMore);
        pageRef.current = 1;
        listRef.current?.scrollTo({ top: 0 });
      })
      .catch((err) => { if (!cancelled) setSearchError(handleError(err)); })
      .finally(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [open, productId, debouncedQuery, handleError]);

  const loadMore = useCallback(async () => {
    if (loadingMore || searching || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const q = debouncedQuery;
    try {
      const res = await sellerApi.catalogSearch(q, nextPage);
      if (q !== debouncedQuery) return;
      pageRef.current = nextPage;
      setResults((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev, ...res.products.filter((p) => !seen.has(p.id))];
        searchCache.current.set(q, { products: merged, page: nextPage, hasMore: res.hasMore });
        return merged;
      });
      setHasMore(res.hasMore);
    } catch (err) {
      setSearchError(handleError(err));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, searching, hasMore, debouncedQuery, handleError]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || productId) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore();
    }, { root: listRef.current, rootMargin: '120px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, productId, results.length]);

  useEffect(() => {
    if (!open) searchCache.current.clear();
  }, [open]);

  const loadDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true);
      setDetailError('');
      setDetail(null);
      setEntries({});
      setSubmitError('');
      try {
        setDetail(await sellerApi.catalogProduct(id));
      } catch (err) {
        setDetailError(handleError(err));
      } finally {
        setDetailLoading(false);
      }
    },
    [handleError],
  );

  useEffect(() => {
    if (open && productId) loadDetail(productId);
  }, [open, productId, loadDetail]);

  const offersBySize = useMemo(() => {
    const map: Record<string, CatalogOffer> = {};
    for (const offer of detail?.offers ?? []) map[String(offer.size)] = offer;
    return map;
  }, [detail]);

  const mineBySize = useMemo(() => {
    const map: Record<string, CatalogDetail['mine'][number]> = {};
    for (const m of detail?.mine ?? []) map[String(m.size)] = m;
    return map;
  }, [detail]);

  function toggleSize(size: number | string) {
    const key = String(size);
    setSubmitError('');
    setEntries((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      const mine = mineBySize[key];
      return {
        ...prev,
        [key]: {
          sellerPrice: mine ? String(mine.sellerPrice) : '',
          availability: mine?.availability ?? 'inhand',
          qty: mine && mine.qty > 0 ? String(mine.qty) : '1',
        },
      };
    });
  }

  function updateEntry(key: string, patch: Partial<Entry>) {
    setSubmitError('');
    setEntries((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], ...patch } } : prev));
  }

  const productSizeSet = useMemo(() => new Set((detail?.product.sizes ?? []).map(String)), [detail]);
  const extraSizes = useMemo(() => (detail?.product.allowedSizes ?? []).filter((s) => !productSizeSet.has(String(s))), [detail, productSizeSet]);
  const visibleSizes = useMemo(() => {
    if (!detail) return [];
    if (detail.product.sizes.length === 0) return detail.product.allowedSizes ?? [];
    return showAllSizes ? [...detail.product.sizes, ...extraSizes] : detail.product.sizes;
  }, [detail, extraSizes, showAllSizes]);

  const selectedSizes = useMemo(() => {
    if (!detail) return [];
    const all = detail.product.allowedSizes?.length ? detail.product.allowedSizes : detail.product.sizes;
    return all.filter((s) => entries[String(s)]);
  }, [detail, entries]);

  async function handleSubmit() {
    if (!detail) return;
    setSubmitError('');
    const payload: Array<{ size: number | string; sellerPrice: number; availability: Availability; qty: number }> = [];
    for (const size of selectedSizes) {
      const key = String(size);
      const entry = entries[key];
      const price = Math.round(Number(entry.sellerPrice));
      const qty = Math.floor(Number(entry.qty));
      if (!Number.isFinite(price) || price < MIN_PRICE || price > MAX_PRICE) {
        setSubmitError(`Enter a price between ${formatPrice(MIN_PRICE)} and ${formatPrice(MAX_PRICE)} for ${sizeLabel(size)}`);
        return;
      }
      if (!Number.isFinite(qty) || qty < 1 || qty > 50) {
        setSubmitError(`Quantity for ${sizeLabel(size)} must be 1-50`);
        return;
      }
      payload.push({ size: detail.product.stringSized ? key : Number(key), sellerPrice: price, availability: entry.availability, qty });
    }
    if (payload.length === 0) {
      setSubmitError('Select at least one size');
      return;
    }
    setSubmitting(true);
    try {
      const created = await sellerApi.createListings(detail.product.id, payload);
      onCreated(created);
      onClose();
    } catch (err) {
      setSubmitError(handleError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const step: 'search' | 'sizes' = productId ? 'sizes' : 'search';

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next && !submitting) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 animate-backdrop-in" />
        <Dialog.Content className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-fit w-full md:max-w-2xl max-h-[92vh] md:max-h-[88vh] bg-white shadow-2xl flex flex-col focus:outline-none animate-modal-up md:animate-modal-in">
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-100">
            <div className="min-w-0">
              <Dialog.Title asChild>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">
                  {step === 'search' ? 'Add listing' : 'Add listing, step 2 of 2'}
                </p>
              </Dialog.Title>
              <Dialog.Description asChild>
                <p className="text-sm font-bold text-zinc-900 mt-0.5 leading-tight">
                  {step === 'search' ? 'Pick a product from the SNKRS CART catalog' : 'Choose sizes, set your price and availability'}
                </p>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" disabled={submitting} className="p-2 -m-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {step === 'search' && (
            <>
              <div className="px-5 pt-4 pb-3 border-b border-zinc-100">
                <label htmlFor="catalog-search" className="sr-only">Search the catalog</label>
                <div className="relative">
                  <input
                    id="catalog-search"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, brand, colorway or SKU"
                    className={`${inputClass} pr-10`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    {searching || query.trim() !== debouncedQuery ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="7" />
                        <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto">
                {searchError ? (
                  <p className="px-5 py-8 text-sm text-red-600 text-center">{searchError}</p>
                ) : results.length === 0 && !searching ? (
                  <p className="px-5 py-10 text-sm text-zinc-500 text-center">
                    {debouncedQuery ? `Nothing in the catalog matches "${debouncedQuery}".` : 'Type to search the catalog.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {results.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setProductId(p.id)}
                          className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-zinc-50 transition-colors min-h-[64px]"
                        >
                          <ProductThumb src={p.image} alt={p.name} className="w-14 h-14" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{p.brand}</p>
                            <p className="text-sm font-bold text-zinc-900 truncate">{p.name}</p>
                            {p.colorway && <p className="text-xs text-zinc-500 truncate">{p.colorway}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Store</p>
                          </div>
                        </button>
                      </li>
                    ))}
                    {hasMore && (
                      <li ref={sentinelRef} className="px-5 py-4 flex justify-center">
                        {loadingMore ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <button type="button" onClick={loadMore} className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900">
                            Load more
                          </button>
                        )}
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-zinc-600">Can&apos;t find it?</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestProduct();
                  }}
                  className="text-xs font-bold tracking-widest uppercase text-zinc-900 underline underline-offset-4 min-h-[40px] text-left sm:text-right"
                >
                  Request a new product
                </button>
              </div>
            </>
          )}

          {step === 'sizes' && (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {detailLoading && (
                  <div className="flex items-center justify-center py-16">
                    <Spinner />
                  </div>
                )}
                {!detailLoading && detailError && (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-red-600 mb-4">{detailError}</p>
                    <button type="button" onClick={() => productId && loadDetail(productId)} className={btnGhost}>
                      Retry
                    </button>
                  </div>
                )}
                {!detailLoading && detail && (
                  <>
                    <div className="flex items-center gap-4 px-5 py-4 bg-zinc-50 border-b border-zinc-100">
                      <ProductThumb src={detail.product.image} alt={detail.product.name} className="w-16 h-16" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">{detail.product.brand}</p>
                        <p className="text-sm font-bold text-zinc-900 leading-tight">{detail.product.name}</p>
                        {detail.product.colorway && <p className="text-xs text-zinc-500 truncate">{detail.product.colorway}</p>}
                      </div>
                      {!initialProductId && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductId(null);
                            setDetail(null);
                            setEntries({});
                          }}
                          className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 underline underline-offset-4 min-h-[40px] shrink-0"
                        >
                          Change
                        </button>
                      )}
                    </div>

                    <div className="px-5 pt-5 pb-3">
                      <div className="flex items-baseline justify-between mb-3">
                        <p className={labelClass}>Tap the sizes you have</p>
                        <p className="text-[11px] text-zinc-400">{selectedSizes.length} selected</p>
                      </div>
                      {visibleSizes.length === 0 ? (
                        <p className="text-sm text-zinc-500">This product has no sizes set up yet. Contact SNKRS CART.</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {visibleSizes.map((size) => {
                            const key = String(size);
                            const offer = offersBySize[key];
                            const selected = !!entries[key];
                            const listed = !!mineBySize[key];
                            const isNewSize = !productSizeSet.has(key) && detail.product.sizes.length > 0;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => toggleSize(size)}
                                aria-pressed={selected}
                                className={cn(
                                  'relative border p-2.5 text-left min-h-[72px] transition-colors',
                                  selected ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400',
                                )}
                              >
                                <p className="text-sm font-black leading-none">{sizeLabel(size)}</p>
                                {offer ? (
                                  <>
                                    <p className={cn('text-[10px] mt-1.5', selected ? 'text-zinc-300' : 'text-zinc-500')}>Offer exists · {AVAILABILITY_META[offer.availability]?.short ?? ''}</p>
                                  </>
                                ) : (
                                  <p className={cn('text-[10px] mt-1.5', selected ? 'text-zinc-300' : 'text-zinc-400')}>No offers yet</p>
                                )}
                                {offer?.isMine ? (
                                  <span className="absolute top-1.5 right-1.5 text-[8px] font-bold tracking-widest uppercase bg-emerald-500 text-white px-1.5 py-0.5">Yours</span>
                                ) : listed ? (
                                  <span className={cn('absolute top-1.5 right-1.5 text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5', selected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500')}>Listed</span>
                                ) : null}
                                {isNewSize && !listed && (
                                  <span className={cn('absolute bottom-1 left-1.5 text-[8px] font-bold tracking-widest uppercase', selected ? 'text-white/70' : 'text-sky-600')}>New size</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {extraSizes.length > 0 && detail.product.sizes.length > 0 && (
                        <div className="mt-3">
                          <button type="button" onClick={() => setShowAllSizes((v) => !v)} className="text-[11px] font-bold tracking-widest uppercase text-zinc-600 underline underline-offset-4 hover:text-zinc-900">
                            {showAllSizes ? 'Hide other UK sizes' : `Have a size not shown? Show all UK sizes (${extraSizes.length} more)`}
                          </button>
                          {showAllSizes && <p className="text-[11px] text-zinc-400 mt-1">Sizes marked New are not on the product page yet. They appear in the size grid as soon as you list them.</p>}
                        </div>
                      )}
                    </div>

                    {selectedSizes.length > 0 && (
                      <div className="px-5 pb-5 space-y-3">
                        {selectedSizes.map((size) => {
                          const key = String(size);
                          const entry = entries[key];
                          const offer = offersBySize[key];
                          const beat = detail.beat[key];
                          const price = Number(entry.sellerPrice);
                          const priceValid = entry.sellerPrice !== '' && Number.isFinite(price) && price >= MIN_PRICE;
                          return (
                            <div key={key} className="border border-zinc-200 p-4">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-black text-zinc-900">{sizeLabel(size)}</p>
                                <button
                                  type="button"
                                  onClick={() => toggleSize(size)}
                                  className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-red-600 min-h-[40px] px-2 -mr-2"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-[1fr_1.3fr_80px] gap-3">
                                <div className="col-span-2 sm:col-span-1">
                                  <label htmlFor={`price-${key}`} className={labelClass}>Your price</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">₹</span>
                                    <input
                                      id={`price-${key}`}
                                      type="number"
                                      inputMode="numeric"
                                      min={MIN_PRICE}
                                      max={MAX_PRICE}
                                      step={1}
                                      value={entry.sellerPrice}
                                      onChange={(e) => updateEntry(key, { sellerPrice: e.target.value })}
                                      placeholder="e.g. 8500"
                                      className={`${inputClass} pl-7`}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label htmlFor={`avail-${key}`} className={labelClass}>Availability</label>
                                  <select
                                    id={`avail-${key}`}
                                    value={entry.availability}
                                    onChange={(e) => updateEntry(key, { availability: e.target.value as Availability })}
                                    className={inputClass}
                                  >
                                    {AVAILABILITY_ORDER.map((a) => (
                                      <option key={a} value={a}>
                                        {AVAILABILITY_META[a].label}, {AVAILABILITY_META[a].description.toLowerCase()}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor={`qty-${key}`} className={labelClass}>Qty</label>
                                  <input
                                    id={`qty-${key}`}
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={50}
                                    step={1}
                                    value={entry.qty}
                                    onChange={(e) => updateEntry(key, { qty: e.target.value })}
                                    className={inputClass}
                                  />
                                </div>
                              </div>
                              <div className="mt-3 space-y-1">
                                {priceValid ? (
                                  <p className="text-xs text-zinc-600">
                                    You receive <span className="font-bold text-zinc-900">{formatPrice(price)}</span> per pair when it sells.
                                  </p>
                                ) : (
                                  <p className="text-xs text-zinc-400">Minimum {formatPrice(MIN_PRICE)}. You are paid exactly the price you enter.</p>
                                )}
                                {offer ? (
                                  offer.isMine ? (
                                    <p className="text-xs font-bold text-emerald-700">You hold the top offer for this size</p>
                                  ) : priceValid && beat !== undefined && price <= beat ? (
                                    <p className="text-xs font-bold text-emerald-700">You&apos;ll be the top offer</p>
                                  ) : (
                                    <p className="text-xs text-zinc-600">
                                      Another seller or the store already offers this size.
                                      {beat !== undefined && <> Enter {formatPrice(beat)} or less to become the top offer</>}
                                    </p>
                                  )
                                ) : (
                                  <p className="text-xs text-zinc-500">No offers yet for this size, yours will be the first.</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="px-5 py-4 border-t border-zinc-100 bg-white">
                {submitError && <p className="text-xs text-red-600 font-medium mb-3">{submitError}</p>}
                <div className="flex items-center gap-3">
                  <Dialog.Close asChild>
                    <button type="button" disabled={submitting} className={btnGhost}>
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !detail || selectedSizes.length === 0}
                    className={`${btnPrimary} flex-1`}
                  >
                    {submitting ? 'Saving...' : selectedSizes.length > 0 ? `Save ${selectedSizes.length} listing${selectedSizes.length === 1 ? '' : 's'}` : 'Select sizes'}
                  </button>
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
