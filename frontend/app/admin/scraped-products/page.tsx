'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Paginator from '../_components/Paginator';
import PageHeader from '@/components/admin/scraped-products/PageHeader';
import ProductsTable from '@/components/admin/scraped-products/ProductsTable';
import FiltersPanel from '@/components/admin/scraped-products/FiltersPanel';
import { useFilters } from '@/components/admin/scraped-products/useFilters';
import { ScrapedProduct, Status, STATUS_TABS, API } from '@/components/admin/scraped-products/types';

const ScraperStatusPanel = dynamic(() => import('@/components/admin/scraped-products/ScraperStatusPanel'), { ssr: false });
const PublishModal = dynamic(() => import('@/components/admin/scraped-products/PublishModal'), { ssr: false });
const EditModal = dynamic(() => import('@/components/admin/scraped-products/EditModal'), { ssr: false });

type ScraperStatus = {
  github: { status: string; conclusion: string | null; startedAt: string; updatedAt: string; runUrl: string } | null;
  render: { status: string; startedAt?: string; finishedAt?: string; error?: string; result?: { inserted: number; updated: number; shopifyFailed: boolean; nikeFailed: boolean } };
};

export default function ScrapedProductsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ScrapedProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<Status>('draft');
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState<ScrapedProduct | null>(null);
  const [publishItem, setPublishItem] = useState<ScrapedProduct | null>(null);
  const [runningCron, setRunningCron] = useState(false);
  const [scraperCooldownUntil, setScraperCooldownUntil] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem('scraper_cooldown_until') ?? 0);
  });
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [toast, setToast] = useState('');

  const { filters, handlers } = useFilters(() => setPage(1));

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
      const { filterSearch, filterSite, filterBrand, filterDateFrom, filterDateTo, filterPriceMin, filterPriceMax } = filters;
      const params = new URLSearchParams({ status, page: String(page), limit: String(limit) });
      if (filterSite) params.set('site', filterSite);
      if (filterBrand) params.set('brand', filterBrand);
      if (filterSearch) params.set('search', filterSearch);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo);
      if (filterPriceMin) params.set('priceMin', filterPriceMin);
      if (filterPriceMax) params.set('priceMax', filterPriceMax);
      const res = await fetch(`${API}/admin/scraped-products?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      showToast('Failed to load scraped products');
    } finally {
      setLoading(false);
    }
  }, [getToken, status, page, limit, filters]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setPage(1); }, [status]);

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

  async function handleReject(id: string) {
    await fetch(`${API}/admin/scraped-products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    showToast('Rejected');
    fetchItems();
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
      <FiltersPanel {...filters} {...handlers} />

      <div className="flex gap-1 border-b border-zinc-800">
        {STATUS_TABS.map((s) => (
          <button key={s} type="button" onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-2 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px ${status === s ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
            {s}
          </button>
        ))}
      </div>

      <ProductsTable items={items} loading={loading} status={status} onEdit={setEditItem} onPublish={setPublishItem} onReject={handleReject} />

      {total > 0 && <Paginator page={page} totalPages={Math.ceil(total / limit)} onPage={setPage} pageSize={limit} onPageSizeChange={(s) => { setLimit(s); setPage(1); }} totalItems={total} />}

      {publishItem && <PublishModal item={publishItem} onClose={() => setPublishItem(null)} onSuccess={(msg) => { showToast(msg); fetchItems(); }} getToken={getToken} />}
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSuccess={(msg) => { showToast(msg); fetchItems(); }} getToken={getToken} />}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-800 border border-zinc-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
