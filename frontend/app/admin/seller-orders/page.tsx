'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useDebouncedSearch, LOCAL_SEARCH_DEBOUNCE_MS } from '@/lib/hooks/useDebouncedValue';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Paginator from '../_components/Paginator';
import DetailPane from '../_components/DetailPane';
import { BASE_URL } from '../_lib/config';
import { DELIVERY_SERVICES } from '@/lib/couriers';
import { getTrackingUrl, shipmentHeadline, shipmentTone, formatCheckpointTime } from '@/lib/tracking';
import { AVAILABILITY_META } from '@/lib/availability';
import type { SellerOrder, SellerOrderStatus, VerificationStatus } from '@/types/seller';
import AdminLoader, { Spinner } from '@/app/admin/_components/AdminLoader';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  status: string;
  paymentStatus: string;
  trackingNumber?: string;
  deliveryService?: string;
}

type SellerOrderDetail = SellerOrder & { customer: Customer | null };

type VerificationFilter = VerificationStatus | 'all';
type StatusFilter = SellerOrderStatus | 'all';

const VERIFICATION_ANGLES: Array<{ id: string; label: string; required: boolean }> = [
  { id: 'side-lateral', label: 'Lateral side', required: true },
  { id: 'side-medial', label: 'Medial side', required: true },
  { id: 'top-down', label: 'Top down', required: true },
  { id: 'heel', label: 'Heel', required: true },
  { id: 'sole', label: 'Sole', required: true },
  { id: 'size-tag', label: 'Size tag', required: true },
  { id: 'tongue', label: 'Tongue label', required: false },
  { id: 'box-label', label: 'Box label', required: false },
];

const ANGLE_LABEL: Record<string, string> = Object.fromEntries(VERIFICATION_ANGLES.map((a) => [a.id, a.label]));

const VERIFICATION_FILTERS: Array<{ key: VerificationFilter; label: string }> = [
  { key: 'pending', label: 'Pending review' },
  { key: 'none', label: 'Not submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'Any status' },
  { key: 'pending_payment', label: 'Pending payment' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_PILL: Record<SellerOrderStatus, string> = {
  pending_payment: 'bg-amber-900/30 text-amber-400',
  confirmed: 'bg-blue-900/30 text-blue-400',
  shipped: 'bg-purple-900/30 text-purple-400',
  delivered: 'bg-emerald-900/30 text-emerald-400',
  cancelled: 'bg-red-900/30 text-red-400',
};

const VERIFICATION_PILL: Record<VerificationStatus, string> = {
  none: 'bg-zinc-800 text-zinc-400',
  pending: 'bg-amber-900/30 text-amber-400',
  approved: 'bg-emerald-900/30 text-emerald-400',
  rejected: 'bg-red-900/30 text-red-400',
};

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  none: 'No photos',
  pending: 'Review',
  approved: 'Verified',
  rejected: 'Rejected',
};

const PARENT_STATUS_PILL: Record<string, string> = {
  pending: 'bg-amber-900/30 text-amber-400',
  confirmed: 'bg-blue-900/30 text-blue-400',
  shipped: 'bg-purple-900/30 text-purple-400',
  delivered: 'bg-emerald-900/30 text-emerald-400',
  cancelled: 'bg-red-900/30 text-red-400',
};

function sellerOf(o: SellerOrder) {
  if (typeof o.seller === 'string') return { _id: o.seller, name: 'Unknown seller', email: '', phone: '', whatsapp: '', businessName: '', city: '' };
  return o.seller;
}

function fmt(d: string | null | undefined, withTime = false) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function label(s: string) {
  return s.replace(/_/g, ' ');
}

function Pill({ text, cls }: { text: string; cls: string }) {
  return <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded whitespace-nowrap ${cls}`}>{text}</span>;
}

function SellerOrdersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectId = searchParams.get('id');

  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>(preselectId ? 'all' : 'pending');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedSearch(search, LOCAL_SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [selectedId, setSelectedId] = useState<string | null>(preselectId);
  const [detail, setDetail] = useState<SellerOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [adminNote, setAdminNote] = useState('');
  const [verifying, setVerifying] = useState<'approved' | 'rejected' | null>(null);
  const [trackingForm, setTrackingForm] = useState({ deliveryService: '', trackingNumber: '', notifyCustomer: true });
  const [savingTracking, setSavingTracking] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const handle401 = useCallback(() => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }, [router]);

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetch(`${BASE_URL}/admin/seller-orders`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handle401(); return; }
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      setOrders(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, [router, handle401]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const fetchDetail = useCallback(async (id: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    setDetailLoading(true);
    setDetailError('');
    setActionError('');
    setActionMsg('');
    try {
      const res = await fetch(`${BASE_URL}/admin/seller-orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handle401(); return; }
      if (res.status === 404) { setDetailError('Seller order not found'); setDetail(null); return; }
      if (!res.ok) { setDetailError(`Server error: ${res.status}`); return; }
      const json: SellerOrderDetail = await res.json();
      setDetail(json);
      setAdminNote(json.verification?.adminNote || '');
      setTrackingForm({ deliveryService: json.deliveryService || '', trackingNumber: json.trackingNumber || '', notifyCustomer: true });
    } catch (e: any) {
      setDetailError(e.message || 'Failed to load order');
    } finally {
      setDetailLoading(false);
    }
  }, [router, handle401]);

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId);
    else setDetail(null);
  }, [selectedId, fetchDetail]);

  function select(id: string | null) {
    setSelectedId(id);
    setLightbox(null);
    const url = id ? `/admin/seller-orders?id=${id}` : '/admin/seller-orders';
    window.history.replaceState(null, '', url);
  }

  async function mutate<T>(path: string, body: unknown, method: 'PUT' | 'POST' = 'PUT'): Promise<T | null> {
    setActionError('');
    setActionMsg('');
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) { handle401(); return null; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setActionError(json.error || `Request failed (${res.status})`); return null; }
      return json as T;
    } catch (e: any) {
      setActionError(e.message || 'Network error');
      return null;
    }
  }

  function applyUpdate(updated: SellerOrder) {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    setDetail((prev) => (prev ? { ...prev, ...updated, customer: prev.customer } : prev));
  }

  async function handleVerification(status: 'approved' | 'rejected') {
    if (!detail) return;
    if (status === 'rejected' && !adminNote.trim()) {
      setActionError('Add a note so the seller knows what to fix');
      return;
    }
    setVerifying(status);
    const updated = await mutate<SellerOrder>(`/admin/seller-orders/${detail._id}/verification`, { status, adminNote });
    if (updated) {
      applyUpdate(updated);
      setActionMsg(status === 'approved' ? 'Verification approved. Seller emailed.' : 'Verification rejected. Seller emailed.');
    }
    setVerifying(null);
  }

  const [syncing, setSyncing] = useState(false);
  async function handleSyncTracking() {
    if (!detail) return;
    setSyncing(true);
    const updated = await mutate<SellerOrder>(`/admin/seller-orders/${detail._id}/sync-tracking`, {}, 'POST');
    if (updated) {
      applyUpdate(updated);
      setActionMsg(updated.shipment?.tag ? `AfterShip: ${updated.shipment.subtagMessage || updated.shipment.tag}` : 'No AfterShip data yet for this courier or number.');
    }
    setSyncing(false);
  }

  async function handleTracking(e: React.FormEvent) {
    e.preventDefault();
    if (!detail) return;
    if (!trackingForm.deliveryService || trackingForm.trackingNumber.replace(/\s+/g, '').length < 5) {
      setActionError('Pick a courier and enter a tracking number of at least 5 characters');
      return;
    }
    setSavingTracking(true);
    const updated = await mutate<SellerOrder>(`/admin/seller-orders/${detail._id}/tracking`, trackingForm);
    if (updated) {
      applyUpdate(updated);
      setActionMsg('Tracking saved and synced to the customer order.');
    }
    setSavingTracking(false);
  }

  const q = debouncedSearch.toLowerCase();
  const filtered = orders.filter((o) => {
    if (verificationFilter !== 'all' && (o.verification?.status ?? 'none') !== verificationFilter) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (!q) return true;
    const s = sellerOf(o);
    return o.orderNumber.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.businessName || '').toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const verificationCounts = VERIFICATION_FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? orders.length : orders.filter((o) => (o.verification?.status ?? 'none') === f.key).length;
    return acc;
  }, {} as Record<VerificationFilter, number>);

  if (loading) {
    return (
      <AdminLoader />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-400 font-medium text-sm">{error}</p>
        <button type="button" onClick={() => { setError(''); setLoading(true); fetchOrders(); }} className="text-xs text-zinc-400 hover:text-white underline">
          Retry
        </button>
      </div>
    );
  }

  const photos = detail?.verification?.photos ?? [];
  const sortedPhotos = [...photos].sort((a, b) => {
    const ia = VERIFICATION_ANGLES.findIndex((x) => x.id === a.angle);
    const ib = VERIFICATION_ANGLES.findIndex((x) => x.id === b.angle);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const missingRequired = VERIFICATION_ANGLES.filter((a) => a.required && !photos.some((p) => p.angle === a.id));
  const detailSeller = detail ? sellerOf(detail) : null;
  const currentTrackUrl = detail?.trackingNumber && detail.deliveryService ? getTrackingUrl(detail.deliveryService, detail.trackingNumber) : null;
  const inputClass = 'w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600';

  return (
    <div className="space-y-5 text-white">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {VERIFICATION_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => { setVerificationFilter(f.key); setPage(1); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                verificationFilter === f.key ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{verificationCounts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => { setStatusFilter(f.key); setPage(1); }}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition ${
                statusFilter === f.key ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-6 ${selectedId ? 'grid-cols-1 xl:grid-cols-[1fr_440px]' : 'grid-cols-1'}`}>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden min-w-0">
          <div className="px-5 py-4 border-b border-zinc-800 space-y-3">
            <p className="text-sm font-bold text-white">Seller orders ({filtered.length})</p>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by order number or seller name"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm pl-9 pr-3 py-2 rounded focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              {orders.length === 0 ? 'No seller orders yet.' : 'No seller orders match these filters.'}
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {paginated.map((o) => {
                const s = sellerOf(o);
                const v = o.verification?.status ?? 'none';
                return (
                  <button
                    key={o._id}
                    type="button"
                    onClick={() => select(o._id)}
                    className={`w-full text-left px-5 py-4 hover:bg-zinc-800/50 transition-colors ${selectedId === o._id ? 'bg-zinc-800/80' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-xs font-bold text-zinc-300">{o.orderNumber}</p>
                          <Pill text={label(o.status)} cls={STATUS_PILL[o.status]} />
                          <Pill text={VERIFICATION_LABEL[v]} cls={VERIFICATION_PILL[v]} />
                          {o.trackingNumber && <Pill text="Tracked" cls="bg-zinc-800 text-zinc-300" />}
                          {o.status === 'confirmed' && !o.trackingNumber && o.shipBy && (
                            new Date(o.shipBy).getTime() < Date.now()
                              ? <Pill text={`Overdue ${Math.max(1, Math.round((Date.now() - new Date(o.shipBy).getTime()) / 86400000))}d`} cls="bg-red-900/40 text-red-300" />
                              : <Pill text={`Ship by ${fmt(o.shipBy)}`} cls="bg-amber-900/30 text-amber-400" />
                          )}
                          {o.trackingAddedAt && o.shipBy && new Date(o.trackingAddedAt).getTime() > new Date(o.shipBy).getTime() && (
                            <Pill text="Shipped late" cls="bg-red-900/30 text-red-400" />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{s.name}{s.businessName ? ` (${s.businessName})` : ''}</p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {o.items.map((it) => `${it.name} UK ${it.size}${it.qty > 1 ? ` x${it.qty}` : ''}`).join(', ')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">&#8377;{o.sellerTotal.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">payout</p>
                        <p className="text-[10px] text-zinc-500">{fmt(o.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <Paginator page={safePage} totalPages={totalPages} onPage={(p) => setPage(Math.max(1, Math.min(p, totalPages)))} pageSize={PAGE_SIZE} totalItems={filtered.length} />
        </div>

        {selectedId && (
          <DetailPane onClose={() => select(null)} label={detail?.orderNumber ? `Seller order ${detail.orderNumber}` : 'Seller order'}>
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between gap-3 sticky top-0 bg-zinc-900 z-10 xl:static">
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">{detail?.orderNumber ?? 'Seller order'}</p>
                <p className="text-sm font-bold text-white truncate">{detailSeller?.name ?? 'Loading'}</p>
                {detail && (
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Pill text={label(detail.status)} cls={STATUS_PILL[detail.status]} />
                    <Pill text={VERIFICATION_LABEL[detail.verification?.status ?? 'none']} cls={VERIFICATION_PILL[detail.verification?.status ?? 'none']} />
                    {detail.shipBy && (
                      <Pill
                        text={detail.trackingAddedAt
                          ? (new Date(detail.trackingAddedAt).getTime() > new Date(detail.shipBy).getTime() ? `Shipped late (due ${fmt(detail.shipBy)})` : 'Shipped on time')
                          : (new Date(detail.shipBy).getTime() < Date.now() ? `Overdue, due ${fmt(detail.shipBy)}` : `Ship by ${fmt(detail.shipBy)}`)}
                        cls={detail.trackingAddedAt
                          ? (new Date(detail.trackingAddedAt).getTime() > new Date(detail.shipBy).getTime() ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400')
                          : (new Date(detail.shipBy).getTime() < Date.now() ? 'bg-red-900/40 text-red-300' : 'bg-amber-900/30 text-amber-400')}
                      />
                    )}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => select(null)} className="w-10 h-10 -mr-2 inline-flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors shrink-0" aria-label="Close">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {detailLoading && (
              <div className="flex items-center justify-center h-40">
                <Spinner className="w-5 h-5" />
              </div>
            )}

            {!detailLoading && detailError && (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <p className="text-red-400 text-sm">{detailError}</p>
                <button type="button" onClick={() => fetchDetail(selectedId)} className="text-xs text-zinc-400 hover:text-white underline">Retry</button>
              </div>
            )}

            {!detailLoading && !detailError && detail && detailSeller && (
              <div className="px-5 py-4 space-y-5">
                {(actionError || actionMsg) && (
                  <div className={`rounded-lg px-3 py-2 text-xs ${actionError ? 'bg-red-950/40 border border-red-900/50 text-red-300' : 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-300'}`}>
                    {actionError || actionMsg}
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Seller</p>
                  <Link href={`/admin/sellers/${detailSeller._id}`} className="text-xs font-semibold text-white hover:underline">
                    {detailSeller.name}{detailSeller.businessName ? ` (${detailSeller.businessName})` : ''}
                  </Link>
                  {detailSeller.email && <p className="text-xs text-zinc-300 break-all">{detailSeller.email}</p>}
                  <div className="flex items-center gap-3 mt-0.5">
                    {detailSeller.phone && <a href={`tel:${detailSeller.phone}`} className="text-xs text-zinc-300 hover:text-white">{detailSeller.phone}</a>}
                    {(detailSeller.whatsapp || detailSeller.phone) && (
                      <a
                        href={`https://wa.me/${(detailSeller.whatsapp || detailSeller.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${detailSeller.name}, regarding order ${detail.orderNumber}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                  {(detailSeller.addressLine || detailSeller.city) && (
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Ships from: {[detailSeller.addressLine, detailSeller.city, detailSeller.state, detailSeller.pincode].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Customer</p>
                  {detail.customer ? (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-white">{detail.customer.name}</p>
                        <Pill text={`Order ${detail.customer.status}`} cls={PARENT_STATUS_PILL[detail.customer.status] ?? 'bg-zinc-800 text-zinc-400'} />
                        {detail.customer.paymentStatus !== 'paid' && <Pill text={`Payment ${detail.customer.paymentStatus}`} cls="bg-amber-900/30 text-amber-400" />}
                      </div>
                      <p className="text-xs text-zinc-300">{detail.customer.phone}</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {detail.customer.addressLine}, {detail.customer.city}, {detail.customer.state} {detail.customer.pincode}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-zinc-500">Parent order not found. Ship to {detail.deliveryCity}, {detail.deliveryState}.</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Items</p>
                  <div className="space-y-2">
                    {detail.items.map((it, i) => (
                      <div key={`${it.listingId}-${i}`} className="flex items-start gap-3 text-xs">
                        <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden shrink-0">
                          {it.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.image} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {it.slug ? (
                            <Link href={`/products/${it.slug}`} target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:text-white hover:underline block truncate">
                              {it.brand} {it.name}
                            </Link>
                          ) : (
                            <span className="text-zinc-200 block truncate">{it.brand} {it.name}</span>
                          )}
                          <p className="text-zinc-500">UK {it.size} x {it.qty}{it.availability ? ` / ${AVAILABILITY_META[it.availability]?.label ?? it.availability}` : ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white">&#8377;{(it.sellerPrice * it.qty).toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-zinc-500">public &#8377;{((it.listPrice ?? 0) * it.qty).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-800 mt-3 pt-3 flex justify-between text-sm font-bold text-white">
                    <span>Seller payout</span><span>&#8377;{detail.sellerTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Verification photos</p>
                    <span className="text-[10px] text-zinc-500">
                      {detail.verification.attempts} attempt{detail.verification.attempts === 1 ? '' : 's'}
                    </span>
                  </div>
                  {photos.length === 0 ? (
                    <p className="text-xs text-zinc-500 bg-zinc-800/50 rounded px-3 py-2">Seller has not uploaded verification photos yet.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {sortedPhotos.map((p, i) => (
                          <button key={`${p.angle}-${i}`} type="button" onClick={() => setLightbox(i)} className="group text-left">
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 group-hover:border-zinc-500 transition">
                              <Image src={p.url} alt={ANGLE_LABEL[p.angle] ?? p.angle} fill sizes="140px" className="object-cover" unoptimized />
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-1 truncate">{ANGLE_LABEL[p.angle] ?? p.angle}</p>
                          </button>
                        ))}
                      </div>
                      {missingRequired.length > 0 && (
                        <p className="text-[11px] text-amber-400 mt-2">Missing: {missingRequired.map((a) => a.label).join(', ')}</p>
                      )}
                      <p className="text-[11px] text-zinc-500 mt-2">
                        Submitted {fmt(detail.verification.submittedAt, true)}
                        {detail.verification.reviewedAt ? ` / reviewed ${fmt(detail.verification.reviewedAt, true)}` : ''}
                      </p>
                    </>
                  )}

                  <div className="mt-3 space-y-2">
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={2}
                      placeholder="Note to seller (required when rejecting)"
                      className={`${inputClass} resize-none`}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleVerification('approved')}
                        disabled={!!verifying || photos.length === 0}
                        className="py-2 rounded bg-emerald-500 text-zinc-950 text-xs font-bold tracking-widest uppercase hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 transition"
                      >
                        {verifying === 'approved' ? 'Saving' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVerification('rejected')}
                        disabled={!!verifying || photos.length === 0}
                        className="py-2 rounded bg-red-600 text-white text-xs font-bold tracking-widest uppercase hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 transition"
                      >
                        {verifying === 'rejected' ? 'Saving' : 'Reject'}
                      </button>
                    </div>
                    {detail.verification.status !== 'none' && detail.verification.status !== 'pending' && (
                      <p className="text-[11px] text-zinc-500">Already {detail.verification.status}. Saving again overwrites the verdict and emails the seller.</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Tracking</p>
                  {detail.trackingNumber ? (
                    <div className="flex items-center gap-2 bg-zinc-800 px-3 py-2 rounded mb-3">
                      <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400 shrink-0">{detail.deliveryService}:</span>
                      {currentTrackUrl ? (
                        <a href={currentTrackUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-violet-400 hover:text-violet-300 underline underline-offset-2 truncate">
                          {detail.trackingNumber}
                        </a>
                      ) : (
                        <span className="text-sm font-mono text-white truncate">{detail.trackingNumber}</span>
                      )}
                      {detail.trackingAddedAt && <span className="text-[10px] text-zinc-500 ml-auto shrink-0">{fmt(detail.trackingAddedAt)}</span>}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 bg-zinc-800/50 rounded px-3 py-2 mb-3">No tracking from the seller yet.</p>
                  )}
                  {detail.shipment?.tag && (
                    <div className="mb-3 px-3 py-2 rounded bg-zinc-800/60 border border-zinc-700">
                      <p className={`text-xs font-bold ${shipmentTone(detail.shipment.tag) === 'ok' ? 'text-emerald-400' : shipmentTone(detail.shipment.tag) === 'warn' ? 'text-red-400' : 'text-sky-400'}`}>
                        {shipmentHeadline(detail.shipment)}
                      </p>
                      {detail.shipment.lastCheckpoint && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {detail.shipment.lastCheckpoint.message}
                          {detail.shipment.lastCheckpoint.location ? ` · ${detail.shipment.lastCheckpoint.location}` : ''}
                          {detail.shipment.lastCheckpoint.at ? ` · ${formatCheckpointTime(detail.shipment.lastCheckpoint.at)}` : ''}
                        </p>
                      )}
                      {detail.shipment.expectedDelivery && detail.shipment.tag !== 'Delivered' && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">Courier estimate {fmt(detail.shipment.expectedDelivery)}</p>
                      )}
                      <p className="text-[10px] text-zinc-500 mt-1">AfterShip{detail.shipment.syncedAt ? ` · synced ${formatCheckpointTime(detail.shipment.syncedAt)}` : ''}. Delivery auto-marks the order delivered and starts the payout timer.</p>
                    </div>
                  )}
                  {detail.trackingNumber && (
                    <button
                      type="button"
                      onClick={handleSyncTracking}
                      disabled={syncing}
                      className="mb-3 text-[11px] font-bold tracking-widest uppercase text-sky-400 hover:text-sky-300 disabled:opacity-50"
                    >
                      {syncing ? 'Syncing…' : 'Sync AfterShip now'}
                    </button>
                  )}
                  <p className="text-[11px] text-zinc-500 mb-2">Sellers can enter tracking only once. Change or correct it here.</p>
                  <form onSubmit={handleTracking} className="space-y-2">
                    <select
                      value={trackingForm.deliveryService}
                      onChange={(e) => setTrackingForm((f) => ({ ...f, deliveryService: e.target.value }))}
                      className={inputClass}
                    >
                      {DELIVERY_SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      {trackingForm.deliveryService && !DELIVERY_SERVICES.some((s) => s.value === trackingForm.deliveryService) && (
                        <option value={trackingForm.deliveryService}>{trackingForm.deliveryService}</option>
                      )}
                    </select>
                    <input
                      type="text"
                      value={trackingForm.trackingNumber}
                      onChange={(e) => setTrackingForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                      placeholder="Tracking number"
                      className={inputClass}
                    />
                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={trackingForm.notifyCustomer}
                        onChange={(e) => setTrackingForm((f) => ({ ...f, notifyCustomer: e.target.checked }))}
                        className="accent-white"
                      />
                      Email customer about this update
                    </label>
                    <button
                      type="submit"
                      disabled={savingTracking}
                      className="w-full py-2.5 bg-white text-zinc-900 text-xs font-bold tracking-widest uppercase rounded hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-400 transition-colors"
                    >
                      {savingTracking ? 'Saving' : detail.trackingNumber ? 'Override tracking' : 'Set tracking'}
                    </button>
                  </form>
                </div>

                {detail.cancelReason && (
                  <div className="border-t border-zinc-800 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Cancel reason</p>
                    <p className="text-xs text-zinc-300 whitespace-pre-wrap">{detail.cancelReason}</p>
                  </div>
                )}
              </div>
            )}
          </DetailPane>
        )}
      </div>

      {lightbox !== null && sortedPhotos[lightbox] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative w-full max-w-4xl flex-1 min-h-0" onClick={(e) => e.stopPropagation()}>
            <Image src={sortedPhotos[lightbox].url} alt={ANGLE_LABEL[sortedPhotos[lightbox].angle] ?? sortedPhotos[lightbox].angle} fill sizes="100vw" className="object-contain" unoptimized />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightbox((i) => (i === null ? null : (i - 1 + sortedPhotos.length) % sortedPhotos.length))}
              className="text-sm text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition"
            >
              Prev
            </button>
            <p className="text-sm text-white font-medium">
              {ANGLE_LABEL[sortedPhotos[lightbox].angle] ?? sortedPhotos[lightbox].angle}
              <span className="text-zinc-500 ml-2">{lightbox + 1} / {sortedPhotos.length}</span>
            </p>
            <button
              type="button"
              onClick={() => setLightbox((i) => (i === null ? null : (i + 1) % sortedPhotos.length))}
              className="text-sm text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition"
            >
              Next
            </button>
            <button type="button" onClick={() => setLightbox(null)} className="text-sm text-zinc-400 hover:text-white px-3 py-1.5">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSellerOrdersPage() {
  return (
    <Suspense
      fallback={
        <AdminLoader />
      }
    >
      <SellerOrdersInner />
    </Suspense>
  );
}
