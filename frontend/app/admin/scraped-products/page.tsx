'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Paginator from '../_components/Paginator';
import { SHOE_SIZES, CLOTHING_SIZES, ACCESSORY_SIZES } from '@/lib/constants';
import ImageLightbox from '@/components/ui/ImageLightbox';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type SourceSite = 'myntra' | 'footlocker' | 'vegnonveg' | 'limitededt' | 'superkicks' | 'nike' | 'crepdogcrew' | 'soleseriouss';
type Status = 'draft' | 'published' | 'rejected';
type Gender = 'men' | 'women' | 'unisex' | 'kids';
type PublishProductType = 'shoes' | 'clothing' | 'accessories';

interface ScrapedProduct {
  _id: string;
  sourceUrl: string;
  sourceSite: SourceSite;
  name: string;
  brand: 'Nike' | 'Jordan';
  price?: number;
  originalPrice?: number;
  images: string[];
  sizes: string[];
  colorway?: string;
  sku?: string;
  description?: string;
  gender: Gender;
  tags: string[];
  status: Status;
  scrapedAt: string;
}

const SITE_COLORS: Record<SourceSite, string> = {
  myntra:       'bg-pink-900/40 text-pink-300 border-pink-800',
  footlocker:   'bg-purple-900/40 text-purple-300 border-purple-800',
  vegnonveg:    'bg-green-900/40 text-green-300 border-green-800',
  limitededt:   'bg-blue-900/40 text-blue-300 border-blue-800',
  superkicks:   'bg-orange-900/40 text-orange-300 border-orange-800',
  nike:         'bg-zinc-800/60 text-zinc-300 border-zinc-700',
  crepdogcrew:  'bg-red-900/40 text-red-300 border-red-800',
  soleseriouss: 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
};

const STATUS_TABS: Status[] = ['draft', 'published', 'rejected'];

export default function ScrapedProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ScrapedProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<Status>('draft');
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState<ScrapedProduct | null>(null);
  const [publishItem, setPublishItem] = useState<ScrapedProduct | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [scraperCooldownUntil, setScraperCooldownUntil] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem('scraper_cooldown_until') ?? 0);
  });
  const [scraperStatus, setScraperStatus] = useState<{
    github: { status: string; conclusion: string | null; startedAt: string; updatedAt: string; runUrl: string } | null;
    render: { status: string; startedAt?: string; finishedAt?: string; error?: string; result?: { inserted: number; updated: number; shopifyFailed: boolean; nikeFailed: boolean } };
  } | null>(null);
  const [toast, setToast] = useState('');
  const limit = 20;

  // ── Lightbox state ──────────────────────────────────────────────────────────
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  // ── Publish config state ────────────────────────────────────────────────────
  const [publishProductType, setPublishProductType] = useState<PublishProductType>('shoes');
  const [publishSelectedSizes, setPublishSelectedSizes] = useState<Set<number>>(new Set());
  const [publishAvailableSizes, setPublishAvailableSizes] = useState<Set<number>>(new Set());
  const [publishSelectedStringSizes, setPublishSelectedStringSizes] = useState<Set<string>>(new Set());
  const [publishAvailableStringSizes, setPublishAvailableStringSizes] = useState<Set<string>>(new Set());
  const [publishSamePriceForAll, setPublishSamePriceForAll] = useState(true);
  const [publishUniformPrice, setPublishUniformPrice] = useState('');
  const [publishUniformOriginal, setPublishUniformOriginal] = useState('');
  const [publishUniformMaxQty, setPublishUniformMaxQty] = useState('1');
  const [publishVariantPrices, setPublishVariantPrices] = useState<Record<string, { price: string; originalPrice: string; maxQty: string }>>({});

  const publishActiveSizeKeys: string[] = publishProductType === 'shoes'
    ? Array.from(publishSelectedSizes).sort((a, b) => a - b).map(String)
    : Array.from(publishSelectedStringSizes);

  // Pre-populate publish config when an item is selected
  useEffect(() => {
    if (!publishItem) return;
    const parsedSizes = publishItem.sizes
      .map((s) => parseFloat(s.replace(/[^0-9.]/g, '')))
      .filter((n) => !isNaN(n));
    const price = String(publishItem.price ?? '');
    const original = String(publishItem.originalPrice ?? '');
    setPublishProductType('shoes');
    setPublishSelectedSizes(new Set(parsedSizes));
    setPublishAvailableSizes(new Set(parsedSizes));
    setPublishSelectedStringSizes(new Set());
    setPublishAvailableStringSizes(new Set());
    setPublishSamePriceForAll(true);
    setPublishUniformPrice(price);
    setPublishUniformOriginal(original);
    setPublishUniformMaxQty('1');
    const init: Record<string, { price: string; originalPrice: string; maxQty: string }> = {};
    for (const s of parsedSizes) {
      init[String(s)] = { price, originalPrice: original, maxQty: '1' };
    }
    setPublishVariantPrices(init);
  }, [publishItem]);

  // Sync variant price keys when selected sizes change
  useEffect(() => {
    setPublishVariantPrices((prev) => {
      const next: Record<string, { price: string; originalPrice: string; maxQty: string }> = {};
      for (const key of publishActiveSizeKeys) {
        next[key] = prev[key] ?? { price: publishUniformPrice, originalPrice: publishUniformOriginal, maxQty: publishUniformMaxQty };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishSelectedSizes, publishSelectedStringSizes, publishProductType]);

  // ── Publish size toggle helpers ─────────────────────────────────────────────
  function togglePublishNumericSize(size: number) {
    setPublishSelectedSizes((prev) => {
      const next = new Set(prev);
      if (next.has(size)) {
        next.delete(size);
        setPublishAvailableSizes((a) => { const na = new Set(a); na.delete(size); return na; });
      } else {
        next.add(size);
      }
      return next;
    });
  }

  function togglePublishNumericAvailable(size: number) {
    if (!publishSelectedSizes.has(size)) return;
    setPublishAvailableSizes((prev) => {
      const next = new Set(prev);
      next.has(size) ? next.delete(size) : next.add(size);
      return next;
    });
  }

  function togglePublishStringSize(size: string) {
    setPublishSelectedStringSizes((prev) => {
      const next = new Set(prev);
      if (next.has(size)) {
        next.delete(size);
        setPublishAvailableStringSizes((a) => { const na = new Set(a); na.delete(size); return na; });
      } else {
        next.add(size);
      }
      return next;
    });
  }

  function togglePublishStringAvailable(size: string) {
    if (!publishSelectedStringSizes.has(size)) return;
    setPublishAvailableStringSizes((prev) => {
      const next = new Set(prev);
      next.has(size) ? next.delete(size) : next.add(size);
      return next;
    });
  }

  function handlePublishSamePriceToggle(checked: boolean) {
    setPublishSamePriceForAll(checked);
    if (checked) {
      setPublishVariantPrices((prev) => {
        const next = { ...prev };
        for (const key of publishActiveSizeKeys) {
          next[key] = { price: publishUniformPrice, originalPrice: publishUniformOriginal, maxQty: publishUniformMaxQty };
        }
        return next;
      });
    }
  }

  function handlePublishUniformPriceChange(price: string) {
    setPublishUniformPrice(price);
    if (publishSamePriceForAll) {
      setPublishVariantPrices((prev) => {
        const next = { ...prev };
        for (const key of publishActiveSizeKeys) next[key] = { ...next[key], price };
        return next;
      });
    }
  }

  function handlePublishUniformOriginalChange(orig: string) {
    setPublishUniformOriginal(orig);
    if (publishSamePriceForAll) {
      setPublishVariantPrices((prev) => {
        const next = { ...prev };
        for (const key of publishActiveSizeKeys) next[key] = { ...next[key], originalPrice: orig };
        return next;
      });
    }
  }

  function handlePublishUniformMaxQtyChange(qty: string) {
    setPublishUniformMaxQty(qty);
    if (publishSamePriceForAll) {
      setPublishVariantPrices((prev) => {
        const next = { ...prev };
        for (const key of publishActiveSizeKeys) next[key] = { ...next[key], maxQty: qty };
        return next;
      });
    }
  }

  function setPublishVariantField(key: string, field: 'price' | 'originalPrice' | 'maxQty', value: string) {
    setPublishVariantPrices((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  // ───────────────────────────────────────────────────────────────────────────

  const getToken = useCallback(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) router.push('/admin/login');
    return t ?? '';
  }, [router]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(
        `${API}/admin/scraped-products?status=${status}&page=${page}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      showToast('Failed to load scraped products');
    } finally {
      setLoading(false);
    }
  }, [getToken, status, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    if (Date.now() >= scraperCooldownUntil) return;
    const token = localStorage.getItem('admin_token') ?? '';
    async function pollStatus() {
      try {
        const res = await fetch(`${API}/admin/scraped-products/scraper-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json() as typeof scraperStatus;
        setScraperStatus(data);
        const ghDone = !data?.github || data.github.status === 'completed';
        const renderDone = !data?.render || data.render.status === 'done' || data.render.status === 'failed' || data.render.status === 'idle';
        if (ghDone && renderDone) {
          localStorage.removeItem('scraper_cooldown_until');
          setScraperCooldownUntil(0);
          const ghFailed = data?.github?.conclusion && data.github.conclusion !== 'success';
          const renderFailed = data?.render?.status === 'failed';
          if (ghFailed || renderFailed) {
            showToast(`Some scrapers failed — check status panel`);
          } else {
            showToast('All scrapers finished — check new drafts');
            fetchItems();
          }
        }
      } catch { /* silent */ }
    }
    pollStatus();
    const id = setInterval(pollStatus, 30_000);
    return () => clearInterval(id);
  }, [scraperCooldownUntil, fetchItems]);

  async function handleReject(id: string) {
    const token = getToken();
    await fetch(`${API}/admin/scraped-products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    showToast('Rejected');
    fetchItems();
  }

  async function handlePublish() {
    if (!publishItem) return;
    setPublishing(true);
    try {
      const token = getToken();
      const isShoes = publishProductType === 'shoes';
      const numericSizes = Array.from(publishSelectedSizes).sort((a, b) => a - b);
      const strSizes = Array.from(publishSelectedStringSizes);
      const strAvailable = Array.from(publishAvailableStringSizes);

      const variantKeys = isShoes ? numericSizes.map(String) : strSizes;
      const variants = variantKeys.map((key) => {
        const entry = publishVariantPrices[key] ?? { price: publishUniformPrice, originalPrice: publishUniformOriginal, maxQty: publishUniformMaxQty };
        return {
          size: isShoes ? Number(key) : key,
          price: Number(entry.price),
          originalPrice: entry.originalPrice ? Number(entry.originalPrice) : null,
          maxQty: Math.max(1, Number(entry.maxQty) || 1),
        };
      });

      const basePrice = variants.length ? Math.min(...variants.map((v) => v.price)) : Number(publishUniformPrice);
      const baseOriginal = variants.length
        ? (() => {
            const origs = variants.map((v) => v.originalPrice).filter((v): v is number => v !== null);
            return origs.length ? Math.min(...origs) : null;
          })()
        : (publishUniformOriginal ? Number(publishUniformOriginal) : null);

      const res = await fetch(`${API}/admin/scraped-products/${publishItem._id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: publishProductType,
          sizes: isShoes ? numericSizes : [],
          availableSizes: isShoes ? Array.from(publishAvailableSizes).sort((a, b) => a - b) : [],
          stringSizes: isShoes ? [] : strSizes,
          availableStringSizes: isShoes ? [] : strAvailable,
          variants,
          price: basePrice,
          originalPrice: baseOriginal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Publish failed');
      showToast(`Published: ${data.product?.name}`);
      setPublishItem(null);
      fetchItems();
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setPublishing(false);
    }
  }

  async function handleSaveEdit() {
    if (!editItem) return;
    const token = getToken();
    const res = await fetch(`${API}/admin/scraped-products/${editItem._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editItem.name,
        brand: editItem.brand,
        price: editItem.price,
        originalPrice: editItem.originalPrice,
        colorway: editItem.colorway,
        sku: editItem.sku,
        description: editItem.description,
        gender: editItem.gender,
        sizes: editItem.sizes,
        tags: editItem.tags,
      }),
    });
    if (res.ok) { showToast('Saved'); setEditItem(null); fetchItems(); }
    else showToast('Save failed');
  }

  async function handleRunScraper() {
    setRunningCron(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/admin/scraped-products/run-scraper`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      const until = Date.now() + 20 * 60 * 1000;
      localStorage.setItem('scraper_cooldown_until', String(until));
      setScraperCooldownUntil(until);
      showToast('Scraper triggered — results appear in ~20 min');
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setRunningCron(false);
    }
  }

  const scraperLocked = runningCron || Date.now() < scraperCooldownUntil;
  const scraperCooldownMinsLeft = scraperCooldownUntil > Date.now()
    ? Math.ceil((scraperCooldownUntil - Date.now()) / 60000)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Scraped Products</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Draft sneakers scraped from 6 sites — review, edit, and publish as real products.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRunScraper}
          disabled={scraperLocked}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white text-zinc-900 rounded-lg hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {runningCron ? (
            <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {scraperCooldownMinsLeft > 0
            ? `Scraping... ~${scraperCooldownMinsLeft}m left`
            : 'Run Scraper Now'}
        </button>
      </div>

      {/* Per-scraper status panel */}
      {scraperStatus && (
        <div className="flex flex-wrap gap-3">
          {scraperStatus.github ? (() => {
            const gh = scraperStatus.github;
            const isDone = gh.status === 'completed';
            const isOk = isDone && gh.conclusion === 'success';
            const isFailed = isDone && gh.conclusion !== 'success';
            const isRunning = !isDone;
            return (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                isOk ? 'bg-green-950/40 border-green-800 text-green-300' :
                isFailed ? 'bg-red-950/40 border-red-800 text-red-300' :
                'bg-yellow-950/40 border-yellow-800 text-yellow-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOk ? 'bg-green-400' : isFailed ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
                <span>GitHub Actions</span>
                <span className="text-zinc-500">—</span>
                <span>{isRunning ? (gh.status === 'in_progress' ? 'running' : 'queued') : isOk ? 'success' : gh.conclusion ?? 'failed'}</span>
                {gh.runUrl && (
                  <a href={gh.runUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 underline ml-1">
                    view
                  </a>
                )}
              </div>
            );
          })() : null}

          {scraperStatus.render && scraperStatus.render.status !== 'idle' && (() => {
            const r = scraperStatus.render;
            const isRunning = r.status === 'running';
            const isDone = r.status === 'done';
            const isFailed = r.status === 'failed';
            return (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                isDone && !r.result?.shopifyFailed && !r.result?.nikeFailed ? 'bg-green-950/40 border-green-800 text-green-300' :
                isFailed || (isDone && (r.result?.shopifyFailed || r.result?.nikeFailed)) ? 'bg-red-950/40 border-red-800 text-red-300' :
                'bg-yellow-950/40 border-yellow-800 text-yellow-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isDone && !r.result?.shopifyFailed && !r.result?.nikeFailed ? 'bg-green-400' :
                  isFailed || (isDone && (r.result?.shopifyFailed || r.result?.nikeFailed)) ? 'bg-red-400' :
                  'bg-yellow-400 animate-pulse'
                }`} />
                <span>Render (Shopify + Nike)</span>
                <span className="text-zinc-500">—</span>
                {isRunning && <span>running</span>}
                {isDone && (
                  <span>
                    {r.result?.shopifyFailed && r.result?.nikeFailed ? 'both failed' :
                     r.result?.shopifyFailed ? 'shopify failed' :
                     r.result?.nikeFailed ? 'nike failed' :
                     `+${r.result?.inserted ?? 0} new`}
                  </span>
                )}
                {isFailed && <span title={r.error}>failed</span>}
              </div>
            );
          })()}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-2 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px ${
              status === s
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-zinc-600 text-sm">
          No {status} products found.{status === 'draft' && ' Run the scraper to populate drafts.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                <th className="pb-2 pr-3 font-medium w-14">Img</th>
                <th className="pb-2 pr-3 font-medium">Name</th>
                <th className="pb-2 pr-3 font-medium">Brand</th>
                <th className="pb-2 pr-3 font-medium">Site</th>
                <th className="pb-2 pr-3 font-medium">Price</th>
                <th className="pb-2 pr-3 font-medium">Sizes</th>
                <th className="pb-2 pr-3 font-medium">Scraped</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {items.map((item) => (
                <tr key={item._id} className="group hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3 pr-3">
                    {item.images[0] ? (
                      <button
                        type="button"
                        onClick={() => setLightbox({ images: item.images, index: 0 })}
                        className="focus:outline-none"
                      >
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg bg-zinc-800 cursor-zoom-in hover:opacity-80 transition-opacity"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </button>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs">—</div>
                    )}
                  </td>
                  <td className="py-3 pr-3 max-w-[220px]">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-medium hover:underline line-clamp-2 text-xs leading-5"
                    >
                      {item.name}
                    </a>
                    {item.colorway && (
                      <p className="text-zinc-500 text-[10px] mt-0.5">{item.colorway}</p>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-zinc-300 text-xs">{item.brand}</td>
                  <td className="py-3 pr-3">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${SITE_COLORS[item.sourceSite]}`}>
                      {item.sourceSite}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-zinc-300 text-xs whitespace-nowrap">
                    {item.price ? `₹${item.price.toLocaleString('en-IN')}` : '—'}
                    {item.originalPrice && item.originalPrice > (item.price ?? 0) && (
                      <span className="text-zinc-600 line-through ml-1">₹{item.originalPrice.toLocaleString('en-IN')}</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-zinc-500 text-xs">
                    {item.sizes.length > 0 ? `${item.sizes.length} sizes` : '—'}
                  </td>
                  <td className="py-3 pr-3 text-zinc-500 text-xs whitespace-nowrap">
                    {new Date(item.scrapedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditItem(item)}
                        className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                      >
                        Edit
                      </button>
                      {item.status === 'draft' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPublishItem(item)}
                            className="text-xs px-2 py-1 rounded bg-white text-zinc-900 hover:bg-zinc-100 font-semibold transition-colors"
                          >
                            Publish
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(item._id)}
                            className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <Paginator page={page} totalPages={Math.ceil(total / limit)} onPage={setPage} pageSize={limit} totalItems={total} />
      )}

      {/* Publish modal */}
      {publishItem && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-8 pb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-base font-bold text-white">Configure & Publish</h2>
              <button type="button" onClick={() => setPublishItem(null)} className="text-zinc-400 hover:text-white text-xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Compact product preview */}
              <div className="flex gap-3 items-center bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                {publishItem.images[0] && (
                  <img
                    src={publishItem.images[0]}
                    alt=""
                    className="w-14 h-14 object-cover rounded-lg bg-zinc-800 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold leading-tight line-clamp-2">{publishItem.name}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    {publishItem.brand} ·{' '}
                    <a href={publishItem.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {publishItem.sourceSite}
                    </a>
                  </p>
                  {publishItem.colorway && <p className="text-zinc-500 text-[10px] mt-0.5">{publishItem.colorway}</p>}
                </div>
              </div>

              {/* Product type */}
              <div>
                <p className="text-sm font-semibold text-zinc-300 mb-2">Product Type</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['shoes', 'clothing', 'accessories'] as PublishProductType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setPublishProductType(type);
                        setPublishSelectedSizes(new Set());
                        setPublishAvailableSizes(new Set());
                        setPublishSelectedStringSizes(new Set());
                        setPublishAvailableStringSizes(new Set());
                      }}
                      className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                        publishProductType === type
                          ? 'bg-white text-zinc-900 border-white'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="border border-zinc-700 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-white">
                  {publishProductType === 'shoes' ? 'Sizes (UK)' : 'Sizes'}
                  <span className="ml-2 text-xs font-normal text-zinc-400">click to select · bottom row = in-stock</span>
                </p>

                {publishProductType === 'shoes' ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {SHOE_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => togglePublishNumericSize(size)}
                          className={`px-2.5 py-1.5 text-xs font-semibold border rounded transition-all ${
                            publishSelectedSizes.has(size)
                              ? 'bg-white text-zinc-900 border-white'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-600 hover:border-zinc-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {publishSelectedSizes.size > 0 && (
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">In Stock (Available)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(publishSelectedSizes).sort((a, b) => a - b).map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => togglePublishNumericAvailable(size)}
                              className={`px-2.5 py-1.5 text-xs font-semibold border rounded transition-all ${
                                publishAvailableSizes.has(size)
                                  ? 'bg-emerald-500 text-white border-emerald-500'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-600 hover:border-zinc-400'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {(publishProductType === 'clothing' ? [...CLOTHING_SIZES] : [...ACCESSORY_SIZES]).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => togglePublishStringSize(size)}
                          className={`px-3 py-1.5 text-xs font-semibold border rounded transition-all ${
                            publishSelectedStringSizes.has(size)
                              ? 'bg-white text-zinc-900 border-white'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-600 hover:border-zinc-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {publishSelectedStringSizes.size > 0 && (
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">In Stock (Available)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(publishSelectedStringSizes).map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => togglePublishStringAvailable(size)}
                              className={`px-3 py-1.5 text-xs font-semibold border rounded transition-all ${
                                publishAvailableStringSizes.has(size)
                                  ? 'bg-emerald-500 text-white border-emerald-500'
                                  : 'bg-zinc-800 text-zinc-500 border-zinc-600 hover:border-zinc-400'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="border border-zinc-700 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Pricing per Size</span>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={publishSamePriceForAll}
                      onChange={(e) => handlePublishSamePriceToggle(e.target.checked)}
                      className="w-4 h-4 rounded accent-white"
                    />
                    Same price for all sizes
                  </label>
                </div>

                {publishSamePriceForAll ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Price (₹) *</label>
                      <input
                        type="number"
                        value={publishUniformPrice}
                        onChange={(e) => handlePublishUniformPriceChange(e.target.value)}
                        placeholder="e.g. 12000"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Original Price (₹)</label>
                      <input
                        type="number"
                        value={publishUniformOriginal}
                        onChange={(e) => handlePublishUniformOriginalChange(e.target.value)}
                        placeholder="e.g. 14000"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Max Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={publishUniformMaxQty}
                        onChange={(e) => handlePublishUniformMaxQtyChange(e.target.value)}
                        placeholder="1"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {publishActiveSizeKeys.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">Select sizes above to set per-size prices.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-[80px_1fr_1fr_80px] gap-3 text-xs font-medium text-zinc-500 pb-1 border-b border-zinc-800">
                          <span>{publishProductType === 'shoes' ? 'UK Size' : 'Size'}</span>
                          <span>Price (₹) *</span>
                          <span>Original (₹)</span>
                          <span>Max Qty</span>
                        </div>
                        {publishActiveSizeKeys.map((key) => (
                          <div key={key} className="grid grid-cols-[80px_1fr_1fr_80px] gap-3 items-center">
                            <span className="text-sm font-semibold text-zinc-300">
                              {publishProductType === 'shoes' ? `UK ${key}` : key}
                            </span>
                            <input
                              type="number"
                              value={publishVariantPrices[key]?.price ?? ''}
                              onChange={(e) => setPublishVariantField(key, 'price', e.target.value)}
                              placeholder="Price"
                              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                            />
                            <input
                              type="number"
                              value={publishVariantPrices[key]?.originalPrice ?? ''}
                              onChange={(e) => setPublishVariantField(key, 'originalPrice', e.target.value)}
                              placeholder="Optional"
                              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                            />
                            <input
                              type="number"
                              min={1}
                              value={publishVariantPrices[key]?.maxQty ?? '1'}
                              onChange={(e) => setPublishVariantField(key, 'maxQty', e.target.value)}
                              placeholder="1"
                              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                            />
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setPublishItem(null)}
                  disabled={publishing}
                  className="flex-1 px-4 py-2.5 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold text-zinc-900 bg-white rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {publishing && <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />}
                  {publishing ? 'Publishing...' : 'Confirm Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-white">Edit Draft</h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Name', key: 'name' as const, type: 'text' },
                { label: 'Colorway', key: 'colorway' as const, type: 'text' },
                { label: 'Price (₹)', key: 'price' as const, type: 'number' },
                { label: 'Original Price (₹)', key: 'originalPrice' as const, type: 'number' },
                { label: 'SKU', key: 'sku' as const, type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key} className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">{label}</label>
                  <input
                    type={type}
                    aria-label={label}
                    value={(editItem[key] as string | number) ?? ''}
                    onChange={(e) => setEditItem({ ...editItem, [key]: type === 'number' ? parseFloat(e.target.value) || undefined : e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              ))}

              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Brand</label>
                <select
                  aria-label="Brand"
                  value={editItem.brand}
                  onChange={(e) => setEditItem({ ...editItem, brand: e.target.value as 'Nike' | 'Jordan' })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                >
                  <option value="Nike">Nike</option>
                  <option value="Jordan">Jordan</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Gender</label>
                <select
                  aria-label="Gender"
                  value={editItem.gender}
                  onChange={(e) => setEditItem({ ...editItem, gender: e.target.value as Gender })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                >
                  {(['men', 'women', 'unisex', 'kids'] as Gender[]).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Sizes (comma separated)</label>
                <input
                  type="text"
                  aria-label="Sizes"
                  value={editItem.sizes.join(', ')}
                  onChange={(e) => setEditItem({ ...editItem, sizes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Description</label>
                <textarea
                  aria-label="Description"
                  rows={3}
                  value={editItem.description ?? ''}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="flex-1 px-4 py-2 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 text-xs font-semibold text-zinc-900 bg-white rounded-lg hover:bg-zinc-100 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          currentIndex={lightbox.index}
          onIndexChange={(i) => setLightbox({ ...lightbox, index: i })}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-800 border border-zinc-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
