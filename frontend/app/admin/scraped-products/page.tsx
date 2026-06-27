'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Paginator from '../_components/Paginator';
import PageHeader from '@/components/admin/scraped-products/PageHeader';
import ProductsTable from '@/components/admin/scraped-products/ProductsTable';
import FiltersPanel from '@/components/admin/scraped-products/FiltersPanel';
import AdminFilterDrawer from '@/components/admin/AdminFilterDrawer';
import { useFilters } from '@/components/admin/scraped-products/useFilters';
import { ScrapedProduct, Status, STATUS_TABS, RejectedUrlEntry, API } from '@/components/admin/scraped-products/types';

const ScraperStatusPanel = dynamic(() => import('@/components/admin/scraped-products/ScraperStatusPanel'), { ssr: false });
const PublishModal = dynamic(() => import('@/components/admin/scraped-products/PublishModal'), { ssr: false });
const EditModal = dynamic(() => import('@/components/admin/scraped-products/EditModal'), { ssr: false });

type ScraperStatus = {
  github: { status: string; conclusion: string | null; startedAt: string; updatedAt: string; runUrl: string } | null;
  render: { status: string; startedAt?: string; finishedAt?: string; error?: string; result?: { inserted: number; updated: number; shopifyFailed: boolean; nikeFailed: boolean } };
};

type Tab = Status | 'blacklist';

export default function ScrapedProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ScrapedProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [tab, setTab] = useState<Tab>('draft');
  const [rejectedItems, setRejectedItems] = useState<RejectedUrlEntry[]>([]);
  const [rejectedTotal, setRejectedTotal] = useState(0);
  const [rejectedLoading, setRejectedLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState<ScrapedProduct | null>(null);
  const [publishItem, setPublishItem] = useState<ScrapedProduct | null>(null);
  const [runningCron, setRunningCron] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [scraperCooldownUntil, setScraperCooldownUntil] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem('scraper_cooldown_until') ?? 0);
  });
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [toast, setToast] = useState('');

  const { filters, handlers } = useFilters(() => setPage(1));
  const { filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax, filterFlag } = filters;
  const { onSearchChange, onSiteChange, onBrandChange, onDateFromChange, onDateToChange, onPriceMinChange, onPriceMaxChange, onFlagChange, onClear } = handlers;

  const activeFilterCount = [filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax, filterFlag].filter(Boolean).length;

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
    if (tab === 'blacklist') return;
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ status: tab, page: String(page), limit: String(limit) });
      if (filterSite) params.set('site', filterSite);
      if (filterBrand) params.set('brand', filterBrand);
      if (filterSearch) params.set('search', filterSearch);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo);
      if (filterPriceMin) params.set('priceMin', filterPriceMin);
      if (filterPriceMax) params.set('priceMax', filterPriceMax);
      if (filterFlag) params.set('flags', filterFlag);
      const res = await fetch(`${API}/admin/scraped-products?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      showToast('Failed to load scraped products');
    } finally {
      setLoading(false);
    }
  }, [getToken, tab, page, limit, filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax, filterFlag]);

  const fetchRejected = useCallback(async () => {
    setRejectedLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/admin/scraped-products/rejected-urls?limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRejectedItems(data.items ?? []);
      setRejectedTotal(data.total ?? 0);
    } catch {
      showToast('Failed to load blacklist');
    } finally {
      setRejectedLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (tab === 'blacklist') fetchRejected();
    else fetchItems();
  }, [tab, fetchItems, fetchRejected]);

  useEffect(() => { setPage(1); }, [tab]);

  useEffect(() => {
    if (Date.now() >= scraperCooldownUntil) return;
    const token = localStorage.getItem('admin_token') ?? '';
    async function pollStatus() {
      try {
        const res = await fetch(`${API}/admin/scraped-products/scraper-status`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json() as ScraperStatus;
        setScraperStatus(data);
        const done = (!data?.github || data.github.status === 'completed') &&
          (!data?.render || ['done', 'failed', 'idle'].includes(data.render.status));
        if (done) {
          localStorage.removeItem('scraper_cooldown_until');
          setScraperCooldownUntil(0);
          const failed = (data?.github?.conclusion && data.github.conclusion !== 'success') || data?.render?.status === 'failed';
          showToast(failed ? 'Some scrapers failed -- check status panel' : 'All scrapers finished -- check new drafts');
          if (!failed) fetchItems();
        }
      } catch { /* silent */ }
    }
    pollStatus();
    const id = setInterval(pollStatus, 30_000);
    return () => clearInterval(id);
  }, [scraperCooldownUntil, fetchItems]);

  async function handleBulkDelete(ids: string[]) {
    const token = getToken();
    await fetch(`${API}/admin/scraped-products/bulk-delete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    showToast(`Deleted ${ids.length} product${ids.length !== 1 ? 's' : ''}`);
    fetchItems();
  }

  async function handleReject(id: string) {
    await fetch(`${API}/admin/scraped-products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    showToast('Rejected');
    fetchItems();
  }

  async function handleUnreject(id: string) {
    await fetch(`${API}/admin/scraped-products/rejected-urls/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    showToast('Removed from blacklist');
    fetchRejected();
  }

  async function handleRunScraper() {
    setRunningCron(true);
    try {
      const res = await fetch(`${API}/admin/scraped-products/run-scraper`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      const until = Date.now() + 20 * 60 * 1000;
      localStorage.setItem('scraper_cooldown_until', String(until));
      setScraperCooldownUntil(until);
      showToast('Scraper triggered -- results appear in ~20 min');
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setRunningCron(false);
    }
  }

  const scraperLocked = runningCron || Date.now() < scraperCooldownUntil;
  const scraperCooldownMinsLeft = scraperCooldownUntil > Date.now() ? Math.ceil((scraperCooldownUntil - Date.now()) / 60000) : 0;

  return (
    <div className="space-y-5">
      <PageHeader runningCron={runningCron} scraperLocked={scraperLocked} scraperCooldownMinsLeft={scraperCooldownMinsLeft} onRunScraper={handleRunScraper} />

      {scraperStatus && <ScraperStatusPanel status={scraperStatus} />}

      {/* Search + Filters button row — hidden on blacklist tab */}
      {tab !== 'blacklist' && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            aria-label="Search scraped products"
            placeholder="Search by name..."
            value={filterSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 max-w-sm bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm rounded-lg border transition-colors shrink-0 ${
              activeFilterCount > 0
                ? 'bg-white text-zinc-900 border-white font-semibold'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-zinc-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-800">
        {STATUS_TABS.map((s) => (
          <button key={s} type="button" onClick={() => setTab(s)}
            className={`px-4 py-2 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px ${tab === s ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
            {s}
          </button>
        ))}
        <button type="button" onClick={() => setTab('blacklist')}
          className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${tab === 'blacklist' ? 'border-red-500 text-red-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
          Blacklist {rejectedTotal > 0 && <span className="ml-1 text-[10px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded">{rejectedTotal}</span>}
        </button>
      </div>

      {/* Products table */}
      {tab !== 'blacklist' && (
        <>
          <ProductsTable items={items} loading={loading} status={tab} onEdit={setEditItem} onPublish={setPublishItem} onReject={handleReject} onBulkDelete={handleBulkDelete} />
          {total > 0 && <Paginator page={page} totalPages={Math.ceil(total / limit)} onPage={setPage} pageSize={limit} onPageSizeChange={(s) => { setLimit(s); setPage(1); }} totalItems={total} />}
        </>
      )}

      {/* Blacklist table */}
      {tab === 'blacklist' && (
        <div className="overflow-x-auto">
          {rejectedLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            </div>
          ) : rejectedItems.length === 0 ? (
            <div className="text-center py-20 text-zinc-600 text-sm">No blacklisted URLs yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                  <th className="pb-2 pr-4 font-medium">Source URL</th>
                  <th className="pb-2 pr-4 font-medium">SKU</th>
                  <th className="pb-2 pr-4 font-medium">Rejected On</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {rejectedItems.map((r) => (
                  <tr key={r._id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 pr-4 max-w-[400px]">
                      <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-zinc-300 text-xs hover:underline hover:text-white break-all line-clamp-2">
                        {r.sourceUrl}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-zinc-500 text-xs">{r.sku ?? '—'}</td>
                    <td className="py-3 pr-4 text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(r.rejectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="py-3">
                      <button type="button" onClick={() => handleUnreject(r._id)}
                        className="text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors">
                        Un-reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {publishItem && <PublishModal item={publishItem} onClose={() => setPublishItem(null)} onSuccess={(msg) => { showToast(msg); fetchItems(); }} getToken={getToken} />}
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSuccess={(msg) => { showToast(msg); fetchItems(); }} getToken={getToken} />}

      {/* Filter drawer */}
      <AdminFilterDrawer open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}>
        <FiltersPanel
          filterSite={filterSite}
          filterBrand={filterBrand}
          filterDateFrom={filterDateFrom}
          filterDateTo={filterDateTo}
          filterPriceMin={filterPriceMin}
          filterPriceMax={filterPriceMax}
          filterFlag={filterFlag}
          onSiteChange={onSiteChange}
          onBrandChange={onBrandChange}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
          onPriceMinChange={onPriceMinChange}
          onPriceMaxChange={onPriceMaxChange}
          onFlagChange={onFlagChange}
          onClear={() => { onClear(); setFilterDrawerOpen(false); }}
        />
      </AdminFilterDrawer>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-800 border border-zinc-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
