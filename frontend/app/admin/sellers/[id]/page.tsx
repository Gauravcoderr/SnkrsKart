'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmModal from '../../_components/ConfirmModal';
import { BASE_URL } from '../../_lib/config';
import { AVAILABILITY_META } from '@/lib/availability';
import { getTrackingUrl } from '@/lib/tracking';
import type { Availability } from '@/types';
import type { ListingStatus, ProductRequest, SellerOrder, SellerStatus } from '@/types/seller';
import AdminLoader from '@/app/admin/_components/AdminLoader';

interface AdminSeller {
  _id: string;
  name: string;
  email: string;
  phone: string;
  brandsSell: string;
  pairsCount: string;
  message: string;
  status: SellerStatus;
  hasPassword: boolean;
  mustChangePassword: boolean;
  businessName: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  whatsapp: string;
  upiId: string;
  lastLoginAt: string | null;
  createdAt: string;
  listingCount: number;
  orderCount: number;
}

interface ListingProduct {
  _id: string;
  slug: string;
  name: string;
  brand: string;
  colorway: string;
  images?: string[];
  hoverImage?: string;
  price: number;
}

interface AdminListing {
  _id: string;
  product: ListingProduct | null;
  size: number | string;
  sellerPrice: number;
  listPrice: number;
  availability: Availability;
  qty: number;
  status: ListingStatus;
  soldCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SellerDetail {
  seller: AdminSeller;
  listings: AdminListing[];
  orders: SellerOrder[];
  requests: ProductRequest[];
}

interface ProfileForm {
  name: string;
  phone: string;
  businessName: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  whatsapp: string;
  upiId: string;
  status: SellerStatus;
}

const SELLER_STATUS_PILL: Record<SellerStatus, string> = {
  active: 'bg-emerald-900/30 text-emerald-400',
  suspended: 'bg-red-900/30 text-red-400',
  applied: 'bg-amber-900/30 text-amber-400',
};

const LISTING_STATUS_PILL: Record<ListingStatus, string> = {
  active: 'bg-emerald-900/30 text-emerald-400',
  paused: 'bg-amber-900/30 text-amber-400',
  sold_out: 'bg-zinc-800 text-zinc-400',
};

const ORDER_STATUS_PILL: Record<string, string> = {
  pending_payment: 'bg-amber-900/30 text-amber-400',
  confirmed: 'bg-blue-900/30 text-blue-400',
  shipped: 'bg-purple-900/30 text-purple-400',
  delivered: 'bg-emerald-900/30 text-emerald-400',
  cancelled: 'bg-red-900/30 text-red-400',
};

const VERIFICATION_PILL: Record<string, string> = {
  none: 'bg-zinc-800 text-zinc-400',
  pending: 'bg-amber-900/30 text-amber-400',
  approved: 'bg-emerald-900/30 text-emerald-400',
  rejected: 'bg-red-900/30 text-red-400',
};

const REQUEST_STATUS_PILL: Record<string, string> = {
  pending: 'bg-amber-900/30 text-amber-400',
  approved: 'bg-emerald-900/30 text-emerald-400',
  rejected: 'bg-red-900/30 text-red-400',
};

const AVAILABILITY_PILL: Record<Availability, string> = {
  instant: 'bg-emerald-900/30 text-emerald-400',
  inhand: 'bg-sky-900/30 text-sky-400',
  eta: 'bg-amber-900/30 text-amber-400',
};

function fmtDate(d: string | null | undefined, withTime = false) {
  if (!d) return 'Never';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function label(s: string) {
  return s.replace(/_/g, ' ');
}

function Pill({ text, cls }: { text: string; cls: string }) {
  return <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>{text}</span>;
}

function SectionCard({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <p className="text-sm font-bold text-white">{title}</p>
        {count !== undefined && <span className="text-xs text-zinc-500">{count}</span>}
      </div>
      {children}
    </div>
  );
}

export default function AdminSellerDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SellerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyListing, setBusyListing] = useState<string | null>(null);
  const [confirmListing, setConfirmListing] = useState<AdminListing | null>(null);

  const handle401 = useCallback(() => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }, [router]);

  const load = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetch(`${BASE_URL}/admin/sellers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handle401(); return; }
      if (res.status === 404) { setError('Seller not found'); return; }
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      const json: SellerDetail = await res.json();
      setData(json);
      setForm({
        name: json.seller.name,
        phone: json.seller.phone,
        businessName: json.seller.businessName || '',
        addressLine: json.seller.addressLine || '',
        city: json.seller.city || '',
        state: json.seller.state || '',
        pincode: json.seller.pincode || '',
        whatsapp: json.seller.whatsapp || '',
        upiId: json.seller.upiId || '',
        status: json.seller.status,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, [id, router, handle401]);

  useEffect(() => { load(); }, [load]);

  async function request<T>(path: string, init: RequestInit): Promise<T | null> {
    setActionError('');
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !data) return;
    setSaving(true);
    setSaveMsg('');
    const updated = await request<AdminSeller>(`/admin/sellers/${id}`, { method: 'PUT', body: JSON.stringify(form) });
    if (updated) {
      setData((prev) => (prev ? { ...prev, seller: { ...prev.seller, ...updated } } : prev));
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(''), 2000);
      if (form.status === 'suspended' && data.seller.status !== 'suspended') {
        setData((prev) => prev ? {
          ...prev,
          listings: prev.listings.map((l) => (l.status === 'active' ? { ...l, status: 'paused' } : l)),
        } : prev);
      }
    }
    setSaving(false);
  }

  async function toggleListing(l: AdminListing) {
    setBusyListing(l._id);
    const next: ListingStatus = l.status === 'active' ? 'paused' : 'active';
    const updated = await request<AdminListing>(`/admin/seller-listings/${l._id}`, { method: 'PUT', body: JSON.stringify({ status: next }) });
    if (updated) {
      setData((prev) => prev ? { ...prev, listings: prev.listings.map((x) => (x._id === l._id ? { ...x, ...updated } : x)) } : prev);
    }
    setBusyListing(null);
  }

  async function deleteListing() {
    if (!confirmListing) return;
    const target = confirmListing;
    setBusyListing(target._id);
    const ok = await request<{ success: boolean }>(`/admin/seller-listings/${target._id}`, { method: 'DELETE' });
    if (ok) {
      setData((prev) => prev ? {
        ...prev,
        listings: prev.listings.filter((x) => x._id !== target._id),
        seller: { ...prev.seller, listingCount: Math.max(0, prev.seller.listingCount - 1) },
      } : prev);
      setConfirmListing(null);
    }
    setBusyListing(null);
  }

  if (loading) {
    return (
      <AdminLoader />
    );
  }

  if (error || !data || !form) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-400 font-medium text-sm">{error || 'Failed to load seller'}</p>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => { setError(''); setLoading(true); load(); }} className="text-xs text-zinc-400 hover:text-white underline">
            Retry
          </button>
          <Link href="/admin/sellers" className="text-xs text-zinc-400 hover:text-white underline">Back to sellers</Link>
        </div>
      </div>
    );
  }

  const { seller, listings, orders, requests } = data;
  const inputClass = 'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20';
  const waNumber = (seller.whatsapp || seller.phone).replace(/\D/g, '');

  return (
    <div className="text-white space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/sellers" className="text-zinc-500 hover:text-white transition text-sm">
            &larr; Sellers
          </Link>
          <span className="text-zinc-700">/</span>
          <h1 className="text-lg font-bold text-white">{seller.name}</h1>
          <Pill text={seller.status} cls={SELLER_STATUS_PILL[seller.status]} />
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition"
          >
            WhatsApp
          </a>
          <a
            href={`mailto:${seller.email}`}
            className="text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition"
          >
            Email
          </a>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center justify-between gap-3 bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">
          <p className="text-sm text-red-300">{actionError}</p>
          <button type="button" onClick={() => setActionError('')} className="text-xs text-red-400 hover:text-white">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
        <form onSubmit={saveProfile} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <p className="text-sm font-bold text-white">Profile</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Email</p>
              <p className="text-sm text-zinc-300 break-all">{seller.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Joined</p>
                <p className="text-zinc-300">{fmtDate(seller.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Last login</p>
                <p className="text-zinc-300">{fmtDate(seller.lastLoginAt, true)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Listings</p>
                <p className="text-zinc-300">{seller.listingCount}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Orders</p>
                <p className="text-zinc-300">{seller.orderCount}</p>
              </div>
            </div>
            {!seller.hasPassword && (
              <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-900/40 rounded-lg px-3 py-2">
                No password set yet. Activate from the sellers list to issue one.
              </p>
            )}
            {seller.hasPassword && seller.mustChangePassword && (
              <p className="text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                Temporary password still in use. The seller must change it on next login.
              </p>
            )}
            {(seller.brandsSell || seller.pairsCount || seller.message) && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 space-y-1 text-xs">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Application</p>
                {seller.brandsSell && <p className="text-zinc-300">Brands: {seller.brandsSell}</p>}
                {seller.pairsCount && <p className="text-zinc-300">Pairs/month: {seller.pairsCount}</p>}
                {seller.message && <p className="text-zinc-400 whitespace-pre-wrap">{seller.message}</p>}
              </div>
            )}

            <div className="border-t border-zinc-800 pt-3 space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">WhatsApp</label>
                <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputClass} placeholder="Digits with country code" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Business name</label>
                <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Shipping address line</label>
                <input value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} className={inputClass} placeholder="Where the seller ships from" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">State</label>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Pincode</label>
                <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} className={inputClass} inputMode="numeric" placeholder="6 digits" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">UPI ID</label>
                <input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} className={inputClass} placeholder="name@bank" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as SellerStatus })}
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="applied">Applied</option>
                </select>
                {form.status === 'suspended' && seller.status !== 'suspended' && (
                  <p className="text-[11px] text-amber-400 mt-1">Suspending pauses all active listings.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-white text-zinc-900 text-sm font-bold tracking-widest uppercase rounded-lg hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-400 transition-colors"
              >
                {saving ? 'Saving' : saveMsg || 'Save profile'}
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-6 min-w-0">
          <SectionCard title="Listings" count={listings.length}>
            {listings.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">No listings yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-400 text-left text-xs">
                      <th className="px-4 py-2.5 font-medium">Product</th>
                      <th className="px-4 py-2.5 font-medium">Size</th>
                      <th className="px-4 py-2.5 font-medium text-right">Seller price</th>
                      <th className="px-4 py-2.5 font-medium text-right">Public price</th>
                      <th className="px-4 py-2.5 font-medium">Availability</th>
                      <th className="px-4 py-2.5 font-medium text-center">Qty</th>
                      <th className="px-4 py-2.5 font-medium text-center">Sold</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {listings.map((l) => {
                      const p = l.product;
                      const thumb = p?.images?.[0] || p?.hoverImage || '';
                      const busy = busyListing === l._id;
                      return (
                        <tr key={l._id} className="hover:bg-zinc-800/40 transition">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-md bg-zinc-800 overflow-hidden shrink-0">
                                {thumb && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div className="min-w-0">
                                {p ? (
                                  <Link href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-white hover:underline text-xs font-medium block truncate max-w-[220px]">
                                    {p.brand} {p.name}
                                  </Link>
                                ) : (
                                  <span className="text-zinc-500 text-xs">Product removed</span>
                                )}
                                {p?.colorway && <p className="text-[11px] text-zinc-500 truncate max-w-[220px]">{p.colorway}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-zinc-300 whitespace-nowrap">UK {l.size}</td>
                          <td className="px-4 py-2.5 text-right text-zinc-300 whitespace-nowrap">&#8377;{l.sellerPrice.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <span className="text-white">&#8377;{l.listPrice.toLocaleString('en-IN')}</span>
                            {p && <span className="block text-[10px] text-zinc-500">store &#8377;{p.price.toLocaleString('en-IN')}</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <Pill text={AVAILABILITY_META[l.availability]?.label ?? l.availability} cls={AVAILABILITY_PILL[l.availability] ?? 'bg-zinc-800 text-zinc-400'} />
                          </td>
                          <td className="px-4 py-2.5 text-center text-zinc-300">{l.qty}</td>
                          <td className="px-4 py-2.5 text-center text-zinc-300">{l.soldCount}</td>
                          <td className="px-4 py-2.5"><Pill text={label(l.status)} cls={LISTING_STATUS_PILL[l.status]} /></td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {l.status !== 'sold_out' && (
                                <button
                                  type="button"
                                  onClick={() => toggleListing(l)}
                                  disabled={busy}
                                  className={`text-xs px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition disabled:opacity-40 ${
                                    l.status === 'active' ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                                  }`}
                                >
                                  {l.status === 'active' ? 'Pause' : 'Activate'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setConfirmListing(l)}
                                disabled={busy}
                                className="text-xs text-red-500 hover:text-red-400 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition disabled:opacity-40"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Seller orders" count={orders.length}>
            {orders.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">No orders routed to this seller yet.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {orders.map((o) => {
                  const trackUrl = o.trackingNumber && o.deliveryService ? getTrackingUrl(o.deliveryService, o.trackingNumber) : null;
                  return (
                    <div key={o._id} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Link href={`/admin/seller-orders?id=${o._id}`} className="text-xs font-bold text-zinc-200 hover:text-white hover:underline">
                            {o.orderNumber}
                          </Link>
                          <Pill text={label(o.status)} cls={ORDER_STATUS_PILL[o.status] ?? 'bg-zinc-800 text-zinc-400'} />
                          <Pill text={`Verify: ${o.verification?.status ?? 'none'}`} cls={VERIFICATION_PILL[o.verification?.status ?? 'none']} />
                          {o.status === 'delivered' && (
                            <Pill
                              text={o.payout?.status === 'paid' ? 'Payout paid' : 'Payout due'}
                              cls={o.payout?.status === 'paid' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}
                            />
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 truncate">
                          {o.items.map((it) => `${it.brand} ${it.name} UK ${it.size}${it.qty > 1 ? ` x${it.qty}` : ''}`).join(', ')}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          {o.trackingNumber ? (
                            <>
                              {o.deliveryService}{' '}
                              {trackUrl ? (
                                <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-violet-400 hover:text-violet-300 underline underline-offset-2">{o.trackingNumber}</a>
                              ) : (
                                <span className="font-mono text-zinc-300">{o.trackingNumber}</span>
                              )}
                            </>
                          ) : (
                            'No tracking yet'
                          )}
                        </p>
                        {o.status === 'delivered' && (
                          <p className="text-[11px] text-zinc-500 mt-1">
                            {o.payout?.status === 'paid'
                              ? <>Paid &#8377;{(o.payout.amount || o.sellerTotal).toLocaleString('en-IN')} on {fmtDate(o.payout.paidAt || o.updatedAt)}{o.payout.reference ? <> · Ref <span className="font-mono text-zinc-300">{o.payout.reference}</span></> : null}{o.payout.screenshotUrl ? <> · <a href={o.payout.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">Screenshot</a></> : null}</>
                              : <>Payout due {o.payout?.dueAt ? fmtDate(o.payout.dueAt) : 'after delivery'} · <Link href="/admin/payouts" className="text-amber-400 hover:text-amber-300 underline">Mark paid</Link></>}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">&#8377;{o.sellerTotal.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">{fmtDate(o.createdAt)}</p>
                        <Link href={`/admin/seller-orders?id=${o._id}`} className="text-[11px] text-zinc-400 hover:text-white underline mt-1 inline-block">
                          Open
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Product requests" count={requests.length}>
            {requests.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">No product requests from this seller.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {requests.map((r) => (
                  <div key={r._id} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-white">{r.brand} {r.name}</p>
                        <Pill text={r.status} cls={REQUEST_STATUS_PILL[r.status]} />
                      </div>
                      {r.colorway && <p className="text-xs text-zinc-400">{r.colorway}</p>}
                      {r.sizes.length > 0 && <p className="text-[11px] text-zinc-500 mt-1">Sizes: {r.sizes.map((s) => `UK ${s}`).join(', ')}</p>}
                      {r.product && (
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Linked to{' '}
                          <Link href={`/products/${r.product.slug}`} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white underline">
                            {r.product.brand} {r.product.name}
                          </Link>
                        </p>
                      )}
                      {r.adminNote && <p className="text-[11px] text-zinc-500 mt-1">Note: {r.adminNote}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-zinc-500">{fmtDate(r.createdAt)}</p>
                      <Link href={`/admin/product-requests`} className="text-[11px] text-zinc-400 hover:text-white underline mt-1 inline-block">
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {confirmListing && (
        <ConfirmModal
          title="Delete listing"
          message="Remove this listing from the storefront? Past orders are unaffected."
          highlight={confirmListing.product ? `${confirmListing.product.brand} ${confirmListing.product.name} UK ${confirmListing.size}` : `UK ${confirmListing.size}`}
          busy={busyListing === confirmListing._id}
          onConfirm={deleteListing}
          onCancel={() => setConfirmListing(null)}
        />
      )}
    </div>
  );
}
