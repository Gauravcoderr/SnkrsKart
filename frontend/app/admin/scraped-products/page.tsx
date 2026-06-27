'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Paginator from '../_components/Paginator';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type SourceSite = 'myntra' | 'footlocker' | 'vegnonveg' | 'limitededt' | 'superkicks' | 'nike' | 'crepdogcrew' | 'soleseriouss';
type Status = 'draft' | 'published' | 'rejected';
type Gender = 'men' | 'women' | 'unisex' | 'kids';

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
  const [scraperRunStatus, setScraperRunStatus] = useState<{
    status: string;
    conclusion: string | null;
    startedAt: string;
    updatedAt: string;
    runUrl: string;
  } | null>(null);
  const [toast, setToast] = useState('');
  const limit = 20;

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
        const data = await res.json();
        if (data.status) setScraperRunStatus(data);
        if (data.status === 'completed') {
          localStorage.removeItem('scraper_cooldown_until');
          setScraperCooldownUntil(0);
          if (data.conclusion === 'success') {
            showToast('Scraper finished — new drafts ready');
            fetchItems();
          } else {
            showToast(`Scraper ${data.conclusion ?? 'failed'} — check GitHub Actions`);
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
      const res = await fetch(`${API}/admin/scraped-products/${publishItem._id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
      // Lock button for 20 min — GitHub Actions takes ~15-20 min to complete
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

      {/* Scraper status badge */}
      {scraperRunStatus && (
        <div className="flex items-center gap-2 text-xs">
          {scraperRunStatus.status === 'completed' ? (
            scraperRunStatus.conclusion === 'success' ? (
              <span className="flex items-center gap-1.5 text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Scraper succeeded
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Scraper {scraperRunStatus.conclusion ?? 'failed'}
              </span>
            )
          ) : (
            <span className="flex items-center gap-1.5 text-yellow-400">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              {scraperRunStatus.status === 'in_progress' ? 'Running on GitHub Actions...' : 'Queued...'}
            </span>
          )}
          <a
            href={scraperRunStatus.runUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 underline"
          >
            View run
          </a>
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
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg bg-zinc-800"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Publish Product</h2>
            <p className="text-xs text-zinc-400">
              This will upload images to Cloudinary and create a real product in the store.
            </p>

            {/* Image preview */}
            <div className="flex gap-2 flex-wrap">
              {publishItem.images.slice(0, 4).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-20 h-20 object-cover rounded-lg bg-zinc-800"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ))}
            </div>

            <div className="text-xs text-zinc-300 space-y-1">
              <p><span className="text-zinc-500">Name:</span> {publishItem.name}</p>
              <p><span className="text-zinc-500">Brand:</span> {publishItem.brand}</p>
              <p><span className="text-zinc-500">Price:</span> {publishItem.price ? `₹${publishItem.price.toLocaleString('en-IN')}` : '—'}</p>
              <p><span className="text-zinc-500">Source:</span> <a href={publishItem.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{publishItem.sourceSite}</a></p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPublishItem(null)}
                disabled={publishing}
                className="flex-1 px-4 py-2 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="flex-1 px-4 py-2 text-xs font-semibold text-zinc-900 bg-white rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {publishing && <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />}
                {publishing ? 'Publishing...' : 'Confirm Publish'}
              </button>
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
                    value={(editItem[key] as string | number) ?? ''}
                    onChange={(e) => setEditItem({ ...editItem, [key]: type === 'number' ? parseFloat(e.target.value) || undefined : e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              ))}

              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Brand</label>
                <select
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
                  value={editItem.sizes.join(', ')}
                  onChange={(e) => setEditItem({ ...editItem, sizes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Description</label>
                <textarea
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-800 border border-zinc-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
