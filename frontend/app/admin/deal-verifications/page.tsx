'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface UrlMeta {
  title?: string;
  siteName?: string;
  favicon?: string;
  ogImage?: string;
}

interface DealVerification {
  _id: string;
  productSlug: string;
  productName: string;
  submittedUrl: string;
  urlMeta: UrlMeta;
  screenshotUrl: string;
  userEmail: string;
  status: 'pending' | 'real' | 'fake' | 'inconclusive';
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending:      'bg-amber-100 text-amber-700',
  real:         'bg-emerald-100 text-emerald-700',
  fake:         'bg-red-100 text-red-600',
  inconclusive: 'bg-zinc-100 text-zinc-500',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function VerdictRow({ deal, onUpdate }: { deal: DealVerification; onUpdate: (id: string, status: string, note: string) => Promise<void> }) {
  const [status, setStatus] = useState(deal.status);
  const [note, setNote] = useState(deal.adminNote ?? '');
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const save = async () => {
    setSaving(true);
    await onUpdate(deal._id, status, note);
    setSaving(false);
  };

  const changed = status !== deal.status || note !== (deal.adminNote ?? '');

  return (
    <div className="border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{deal.productName}</p>
          <p className="text-xs text-zinc-500">{deal.userEmail}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${STATUS_STYLES[deal.status]}`}>
            {deal.status}
          </span>
          <span className="text-[10px] text-zinc-600">{timeAgo(deal.submittedAt)}</span>
        </div>
      </div>

      {/* URL preview */}
      <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2">
        {deal.urlMeta?.favicon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.urlMeta.favicon} alt="" className="w-4 h-4 rounded-sm shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-zinc-300 truncate">{deal.urlMeta?.siteName || new URL(deal.submittedUrl).hostname}</p>
          {deal.urlMeta?.title && <p className="text-[11px] text-zinc-500 truncate">{deal.urlMeta.title}</p>}
        </div>
        <a href={deal.submittedUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-white shrink-0">
          Open ↗
        </a>
      </div>

      {/* Screenshot */}
      <div>
        <p className="text-[10px] text-zinc-500 mb-1.5 uppercase tracking-wider font-semibold">Screenshot</p>
        <button type="button" onClick={() => setLightbox(true)} className="block w-full">
          <Image
            src={deal.screenshotUrl}
            alt="Deal screenshot"
            width={400}
            height={200}
            className="w-full max-h-48 object-cover rounded-lg border border-zinc-700 hover:opacity-80 transition cursor-pointer"
            unoptimized
          />
        </button>
      </div>

      {/* Verdict controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold shrink-0">Verdict</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DealVerification['status'])}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <option value="pending">Pending</option>
            <option value="real">Real Deal</option>
            <option value="fake">Fake / Suspicious</option>
            <option value="inconclusive">Inconclusive</option>
          </select>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note to user..."
          rows={2}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving || !changed}
          className="w-full py-2 bg-white text-zinc-900 text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-zinc-100 transition disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save & Notify User'}
        </button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <Image
            src={deal.screenshotUrl}
            alt="Deal screenshot full"
            width={1200}
            height={800}
            className="max-w-full max-h-full object-contain rounded-lg"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}

export default function DealVerificationsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<DealVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | DealVerification['status']>('all');

  const fetchDeals = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetch(`${API}/admin/deal-verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      setDeals(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const handleUpdate = async (id: string, status: string, adminNote: string) => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API}/admin/deal-verifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, adminNote }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDeals((prev) => prev.map((d) => (d._id === id ? { ...d, ...updated } : d)));
    }
  };

  const filtered = filter === 'all' ? deals : deals.filter((d) => d.status === filter);
  const counts = {
    all: deals.length,
    pending: deals.filter((d) => d.status === 'pending').length,
    real: deals.filter((d) => d.status === 'real').length,
    fake: deals.filter((d) => d.status === 'fake').length,
    inconclusive: deals.filter((d) => d.status === 'inconclusive').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-400 font-medium text-sm">{error}</p>
        <button type="button" onClick={() => { setError(''); setLoading(true); fetchDeals(); }} className="text-xs text-zinc-400 hover:text-white underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="text-white">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', 'pending', 'real', 'fake', 'inconclusive'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              filter === f
                ? 'bg-white text-zinc-900'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">
          {filter === 'all' ? 'No deal verifications yet.' : `No ${filter} deals.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((deal) => (
            <VerdictRow key={deal._id} deal={deal} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
