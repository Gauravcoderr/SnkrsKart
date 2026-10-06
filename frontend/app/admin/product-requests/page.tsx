'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BASE_URL } from '../_lib/config';
import type { ProductRequest, ProductRequestStatus } from '@/types/seller';
import AdminLoader, { Spinner } from '@/app/admin/_components/AdminLoader';

interface AdminProduct {
  id: string;
  _id?: string;
  slug: string;
  name: string;
  brand: string;
  colorway?: string;
  sku?: string;
  images?: string[];
  price?: number;
}

type Filter = ProductRequestStatus | 'all';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const STATUS_PILL: Record<ProductRequestStatus, string> = {
  pending: 'bg-amber-900/30 text-amber-400',
  approved: 'bg-emerald-900/30 text-emerald-400',
  rejected: 'bg-red-900/30 text-red-400',
};

function sellerOf(r: ProductRequest) {
  if (typeof r.seller === 'string') return { _id: r.seller, name: 'Unknown seller', email: '', phone: '', businessName: '' };
  return r.seller;
}

function fmt(d: string | null | undefined) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function ApproveModal({
  request,
  products,
  productsLoading,
  productsError,
  onRetryProducts,
  onSubmit,
  onClose,
  busy,
  error,
}: {
  request: ProductRequest;
  products: AdminProduct[];
  productsLoading: boolean;
  productsError: string;
  onRetryProducts: () => void;
  onSubmit: (productId: string, note: string) => void;
  onClose: () => void;
  busy: boolean;
  error: string;
}) {
  const [query, setQuery] = useState(`${request.brand} ${request.name}`.trim());
  const [picked, setPicked] = useState<AdminProduct | null>(request.product ? { id: request.product._id, slug: request.product.slug, name: request.product.name, brand: request.product.brand, images: request.product.images } : null);
  const [note, setNote] = useState(request.adminNote || '');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 10);
    const terms = q.split(/\s+/).filter(Boolean);
    return products
      .filter((p) => {
        const hay = `${p.brand} ${p.name} ${p.colorway ?? ''} ${p.sku ?? ''}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .slice(0, 10);
  }, [products, query]);

  const inputClass = 'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !busy && onClose()} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-1">Approve request</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Pick the catalog product that <span className="text-white">{request.brand} {request.name}</span> was added as. The seller gets a link to list on it.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 mb-4">
          <p className="text-xs text-zinc-400">Not in the catalog yet? Create it first, then approve and pick it here.</p>
          <a
            href="/admin/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-medium text-zinc-200 hover:text-white px-2.5 py-1.5 rounded-md border border-zinc-700 hover:bg-zinc-800 transition"
          >
            Create product in catalog
          </a>
        </div>

        <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Search catalog</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, brand, colorway or SKU"
          className={inputClass}
          autoFocus
        />

        <div className="mt-2 border border-zinc-800 rounded-lg overflow-hidden">
          {productsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Spinner className="w-5 h-5" />
            </div>
          ) : productsError ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <p className="text-xs text-red-400">{productsError}</p>
              <button type="button" onClick={onRetryProducts} className="text-xs text-zinc-400 hover:text-white underline">Retry</button>
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">No products match. Try fewer words.</div>
          ) : (
            <div className="divide-y divide-zinc-800 max-h-72 overflow-y-auto">
              {results.map((p) => {
                const active = picked?.id === p.id;
                const thumb = p.images?.[0];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPicked(p)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${active ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                  >
                    <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden shrink-0">
                      {thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white truncate">{p.brand} {p.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{[p.colorway, p.sku].filter(Boolean).join(' / ') || p.slug}</p>
                    </div>
                    {typeof p.price === 'number' && <span className="text-xs text-zinc-400 shrink-0">&#8377;{p.price.toLocaleString('en-IN')}</span>}
                    {active && <span className="text-[10px] font-bold text-emerald-400 shrink-0">Picked</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {picked && (
          <p className="text-xs text-zinc-400 mt-2">
            Selected: <span className="text-white">{picked.brand} {picked.name}</span>{' '}
            <Link href={`/products/${picked.slug}`} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white underline">view</Link>
          </p>
        )}

        <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 mt-4">Note to seller (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Anything the seller should know"
          className={`${inputClass} resize-none`}
        />

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

        <div className="flex gap-3 justify-end mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-sm px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => picked && onSubmit(picked.id, note)}
            disabled={busy || !picked}
            className="text-sm px-4 py-2 rounded-lg bg-white text-zinc-900 font-medium hover:bg-zinc-200 transition disabled:opacity-50"
          >
            {busy ? 'Approving' : 'Approve and notify seller'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({
  request,
  onSubmit,
  onClose,
  busy,
  error,
}: {
  request: ProductRequest;
  onSubmit: (note: string) => void;
  onClose: () => void;
  busy: boolean;
  error: string;
}) {
  const [note, setNote] = useState('');
  const valid = note.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !busy && onClose()} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-1">Reject request</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Tell the seller why <span className="text-white">{request.brand} {request.name}</span> will not be added. This note is emailed to them.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          autoFocus
          placeholder="Reason (required)"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
        />
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        <div className="flex gap-3 justify-end mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-sm px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => valid && onSubmit(note.trim())}
            disabled={busy || !valid}
            className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {busy ? 'Rejecting' : 'Reject and notify seller'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('pending');

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');

  const [approving, setApproving] = useState<ProductRequest | null>(null);
  const [rejecting, setRejecting] = useState<ProductRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState('');

  const handle401 = useCallback(() => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }, [router]);

  const fetchRequests = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetch(`${BASE_URL}/admin/product-requests`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handle401(); return; }
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      setRequests(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, [router, handle401]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const fetchProducts = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    setProductsLoading(true);
    setProductsError('');
    try {
      const res = await fetch(`${BASE_URL}/admin/products`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handle401(); return; }
      if (!res.ok) { setProductsError(`Could not load catalog (${res.status})`); return; }
      const data: AdminProduct[] = await res.json();
      setProducts(data.map((p) => ({ ...p, id: p.id || String(p._id) })));
      setProductsLoaded(true);
    } catch (e: any) {
      setProductsError(e.message || 'Could not load catalog');
    } finally {
      setProductsLoading(false);
    }
  }, [router, handle401]);

  function openApprove(r: ProductRequest) {
    setModalError('');
    setApproving(r);
    if (!productsLoaded && !productsLoading) fetchProducts();
  }

  async function update(id: string, body: { status: ProductRequestStatus; adminNote: string; productId?: string }) {
    setBusy(true);
    setModalError('');
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${BASE_URL}/admin/product-requests/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) { handle401(); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setModalError(json.error || `Request failed (${res.status})`); return; }
      setRequests((prev) => prev.map((r) => (r._id === id ? (json as ProductRequest) : r)));
      setApproving(null);
      setRejecting(null);
    } catch (e: any) {
      setModalError(e.message || 'Network error');
    } finally {
      setBusy(false);
    }
  }

  const counts = FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? requests.length : requests.filter((r) => r.status === f.key).length;
    return acc;
  }, {} as Record<Filter, number>);

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  if (loading) {
    return (
      <AdminLoader />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-400 font-medium text-sm">{error}</p>
        <button type="button" onClick={() => { setError(''); setLoading(true); fetchRequests(); }} className="text-xs text-zinc-400 hover:text-white underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                filter === f.key ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <a
          href="/admin/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition"
          title="Create it first, then approve and pick it here"
        >
          Create product in catalog
        </a>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 text-sm">
          {requests.length === 0 ? 'No product requests from sellers yet.' : `No ${filter === 'all' ? '' : filter} requests.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => {
            const s = sellerOf(r);
            return (
              <div key={r._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">{r.brand}</p>
                    <p className="text-sm font-semibold text-white break-words">{r.name}</p>
                    {r.colorway && <p className="text-xs text-zinc-400">{r.colorway}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_PILL[r.status]}`}>{r.status}</span>
                    <span className="text-[10px] text-zinc-600">{fmt(r.createdAt)}</span>
                  </div>
                </div>

                <div className="bg-zinc-950 rounded-lg px-3 py-2">
                  <Link href={`/admin/sellers/${s._id}`} className="text-xs font-medium text-zinc-200 hover:text-white hover:underline">
                    {s.name}{s.businessName ? ` (${s.businessName})` : ''}
                  </Link>
                  {s.email && <p className="text-[11px] text-zinc-500 break-all">{s.email}</p>}
                </div>

                {r.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.sizes.map((sz) => (
                      <span key={sz} className="text-[10px] font-semibold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">UK {sz}</span>
                    ))}
                  </div>
                )}

                {r.supportingUrls.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">Links</p>
                    {r.supportingUrls.map((u, i) => (
                      <a
                        key={`${u}-${i}`}
                        href={u}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-violet-400 hover:text-violet-300 truncate"
                        title={u}
                      >
                        {hostOf(u)} &#8599;
                      </a>
                    ))}
                  </div>
                )}

                {r.note && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Seller note</p>
                    <p className="text-xs text-zinc-300 whitespace-pre-wrap">{r.note}</p>
                  </div>
                )}

                {r.product && (
                  <p className="text-xs text-zinc-400">
                    Linked to{' '}
                    <Link href={`/products/${r.product.slug}`} target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:text-white underline">
                      {r.product.brand} {r.product.name}
                    </Link>
                  </p>
                )}

                {r.adminNote && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Admin note</p>
                    <p className="text-xs text-zinc-400 whitespace-pre-wrap">{r.adminNote}</p>
                  </div>
                )}

                <div className="mt-auto pt-1">
                  {r.status === 'pending' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openApprove(r)}
                        className="py-2 rounded-lg bg-white text-zinc-900 text-xs font-bold tracking-widest uppercase hover:bg-zinc-200 transition"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => { setModalError(''); setRejecting(r); }}
                        className="py-2 rounded-lg border border-red-900/60 text-red-400 text-xs font-bold tracking-widest uppercase hover:bg-red-950/40 transition"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      {r.status === 'approved' ? 'Approved' : 'Rejected'}{r.reviewedAt ? ` on ${fmt(r.reviewedAt)}` : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {approving && (
        <ApproveModal
          request={approving}
          products={products}
          productsLoading={productsLoading}
          productsError={productsError}
          onRetryProducts={fetchProducts}
          busy={busy}
          error={modalError}
          onClose={() => setApproving(null)}
          onSubmit={(productId, note) => update(approving._id, { status: 'approved', adminNote: note, productId })}
        />
      )}

      {rejecting && (
        <RejectModal
          request={rejecting}
          busy={busy}
          error={modalError}
          onClose={() => setRejecting(null)}
          onSubmit={(note) => update(rejecting._id, { status: 'rejected', adminNote: note })}
        />
      )}
    </div>
  );
}
