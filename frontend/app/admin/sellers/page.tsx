'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Paginator from '../_components/Paginator';
import ConfirmModal from '../_components/ConfirmModal';
import { BASE_URL } from '../_lib/config';
import type { SellerStatus } from '@/types/seller';
import AdminLoader from '@/app/admin/_components/AdminLoader';
import ActionsMenu from '../_components/ActionsMenu';

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

interface Credentials {
  name: string;
  email: string;
  tempPassword: string;
  title: string;
}

type Tab = 'accounts' | 'applications';

const EMPTY_FORM = { name: '', email: '', phone: '', businessName: '', addressLine: '', city: '', state: '', pincode: '', whatsapp: '' };

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusPill({ status }: { status: SellerStatus }) {
  const cls =
    status === 'active'
      ? 'bg-emerald-900/30 text-emerald-400'
      : status === 'suspended'
        ? 'bg-red-900/30 text-red-400'
        : 'bg-amber-900/30 text-amber-400';
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

function CredentialsModal({ creds, onClose }: { creds: Credentials; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.tempPassword}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-1">{creds.title}</h3>
        <p className="text-sm text-zinc-400 mb-4">Login details for {creds.name}</p>
        <div className="space-y-2 mb-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Email</p>
            <p className="text-sm text-white font-mono break-all">{creds.email}</p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Temporary password</p>
            <p className="text-base text-white font-mono tracking-wider break-all">{creds.tempPassword}</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mb-5">Emailed to the seller as well. They must change it on first login.</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={copy}
            className="text-sm px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg bg-white text-zinc-900 font-medium hover:bg-zinc-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SellersPage() {
  const router = useRouter();
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('accounts');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('admin_token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, []);

  const handle401 = useCallback(() => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }, [router]);

  const fetchSellers = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    try {
      const res = await fetch(`${BASE_URL}/admin/sellers`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handle401(); return; }
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      setSellers(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, [router, handle401]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  async function request<T>(path: string, init: RequestInit): Promise<T | null> {
    setActionError('');
    try {
      const res = await fetch(`${BASE_URL}${path}`, { ...init, headers: authHeaders() });
      if (res.status === 401) { handle401(); return null; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setActionError(data.error || `Request failed (${res.status})`); return null; }
      return data as T;
    } catch (e: any) {
      setActionError(e.message || 'Network error');
      return null;
    }
  }

  function upsert(seller: AdminSeller) {
    setSellers((prev) => {
      const exists = prev.some((s) => s._id === seller._id);
      if (!exists) return [seller, ...prev];
      return prev.map((s) => (s._id === seller._id ? { ...s, ...seller, listingCount: s.listingCount, orderCount: s.orderCount } : s));
    });
  }

  async function handleDelete() {
    if (!confirmId) return;
    const id = confirmId;
    setBusyId(id);
    const ok = await request<{ success: boolean }>(`/admin/sellers/${id}`, { method: 'DELETE' });
    if (ok) {
      setSellers((prev) => prev.filter((s) => s._id !== id));
      setConfirmId(null);
    }
    setBusyId(null);
  }

  async function handleStatus(s: AdminSeller, status: SellerStatus) {
    setBusyId(s._id);
    const updated = await request<AdminSeller>(`/admin/sellers/${s._id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    if (updated) upsert(updated);
    setBusyId(null);
  }

  async function handleActivate(s: AdminSeller) {
    setBusyId(s._id);
    const data = await request<{ seller: AdminSeller; tempPassword: string }>(`/admin/sellers/${s._id}/activate`, { method: 'POST' });
    if (data) {
      upsert(data.seller);
      setCreds({ name: data.seller.name, email: data.seller.email, tempPassword: data.tempPassword, title: 'Account activated' });
      setTab('accounts');
    }
    setBusyId(null);
  }

  async function handleReset(s: AdminSeller) {
    setBusyId(s._id);
    const data = await request<{ seller: AdminSeller; tempPassword: string }>(`/admin/sellers/${s._id}/reset-password`, { method: 'POST' });
    if (data) {
      upsert(data.seller);
      setCreds({ name: data.seller.name, email: data.seller.email, tempPassword: data.tempPassword, title: 'Password reset' });
    }
    setBusyId(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setCreateError('Name, email and phone are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/sellers`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(form) });
      if (res.status === 401) { handle401(); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setCreateError(data.error || `Request failed (${res.status})`); return; }
      upsert(data.seller);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setTab('accounts');
      setCreds({ name: data.seller.name, email: data.seller.email, tempPassword: data.tempPassword, title: 'Seller created' });
    } catch (err: any) {
      setCreateError(err.message || 'Network error');
    } finally {
      setCreating(false);
    }
  }

  const accounts = sellers.filter((s) => s.status === 'active' || s.status === 'suspended');
  const applications = sellers.filter((s) => s.status === 'applied');
  const source = tab === 'accounts' ? accounts : applications;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? source.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.businessName || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.brandsSell || '').toLowerCase().includes(q)
      )
    : source;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const confirmTarget = confirmId ? sellers.find((s) => s._id === confirmId) : null;

  if (loading) {
    return (
      <AdminLoader />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-400 font-medium text-sm">{error}</p>
        <button type="button" onClick={() => { setError(''); setLoading(true); fetchSellers(); }} className="text-xs text-zinc-400 hover:text-white underline">
          Retry
        </button>
      </div>
    );
  }

  const inputClass = 'w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20';

  return (
    <div className="text-white">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {([
            { key: 'accounts', label: 'Accounts', count: accounts.length },
            { key: 'applications', label: 'Applications', count: applications.length },
          ] as const).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                tab === t.key ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 ${tab === t.key ? 'text-zinc-500' : 'text-zinc-600'}`}>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search name, email, phone, business, city"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full sm:w-72 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <button
            type="button"
            onClick={() => { setShowCreate(true); setCreateError(''); }}
            className="shrink-0 text-sm font-medium px-4 py-2 rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition"
          >
            New seller
          </button>
        </div>
      </div>

      {actionError && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">
          <p className="text-sm text-red-300">{actionError}</p>
          <button type="button" onClick={() => setActionError('')} className="text-xs text-red-400 hover:text-white">Dismiss</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        {tab === 'accounts' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-left">
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Phone / WhatsApp</th>
                <th className="px-4 py-3 font-medium text-center">Listings</th>
                <th className="px-4 py-3 font-medium text-center">Orders</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {paginated.map((s) => {
                const busy = busyId === s._id;
                return (
                  <tr key={s._id} className="hover:bg-zinc-900/50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/admin/sellers/${s._id}`} className="font-medium text-white hover:underline">{s.name}</Link>
                      <div className="text-xs text-zinc-500">{s.email}</div>
                      {(s.businessName || s.city) && (
                        <div className="text-xs text-zinc-500">{[s.businessName, s.city].filter(Boolean).join(' / ')}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                      <a href={`tel:${s.phone}`} className="hover:text-white transition">{s.phone}</a>
                      {s.whatsapp && s.whatsapp !== s.phone.replace(/[^\d+]/g, '') && (
                        <div className="text-xs text-zinc-500">WA {s.whatsapp}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-300">{s.listingCount}</td>
                    <td className="px-4 py-3 text-center text-zinc-300">{s.orderCount}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{timeAgo(s.lastLoginAt)}</td>
                    <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/sellers/${s._id}`}
                          className="text-xs text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-zinc-800 transition"
                        >
                          View
                        </Link>
                        <ActionsMenu
                          busy={busy}
                          items={[
                            { label: 'Reset password', onClick: () => handleReset(s) },
                            { label: 'Suspend seller', onClick: () => handleStatus(s, 'suspended'), tone: 'danger', hidden: s.status !== 'active' },
                            { label: 'Reactivate seller', onClick: () => handleStatus(s, 'active'), tone: 'success', hidden: s.status === 'active' },
                            { label: 'WhatsApp', href: `https://wa.me/${(s.whatsapp || s.phone).replace(/\D/g, '')}`, external: true },
                            { label: 'Email', href: `mailto:${s.email}`, external: true },
                            { label: 'Delete seller', onClick: () => setConfirmId(s._id), tone: 'danger' },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    {search ? 'No accounts match your search.' : 'No seller accounts yet. Activate an application or create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-left">
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Brands</th>
                <th className="px-4 py-3 font-medium">Pairs/Month</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {paginated.map((s) => {
                const busy = busyId === s._id;
                return (
                  <tr key={s._id} className="hover:bg-zinc-900/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{s.name}</div>
                      <div className="text-xs text-zinc-500">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <a href={`tel:${s.phone}`} className="hover:text-white transition">{s.phone}</a>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {s.brandsSell || <span className="text-zinc-600">-</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {s.pairsCount || <span className="text-zinc-600">-</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs max-w-[200px]">
                      {s.message ? <span className="line-clamp-2">{s.message}</span> : <span className="text-zinc-600">-</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{timeAgo(s.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleActivate(s)}
                          disabled={busy}
                          className="text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-200 px-2.5 py-1.5 rounded-md transition disabled:opacity-40 whitespace-nowrap"
                        >
                          {busy ? 'Working' : 'Activate account'}
                        </button>
                        <ActionsMenu
                          busy={busy}
                          items={[
                            { label: 'WhatsApp', href: `https://wa.me/${s.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${s.name}, thanks for reaching out to SNKRS CART!`)}`, external: true, tone: 'success' },
                            { label: 'Email', href: `mailto:${s.email}?subject=${encodeURIComponent('Re: Seller Application, SNKRS CART')}`, external: true },
                            { label: 'Delete application', onClick: () => setConfirmId(s._id), tone: 'danger' },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    {search ? 'No applications match your search.' : 'No pending applications.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Paginator
        page={safePage}
        totalPages={totalPages}
        onPage={setPage}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        totalItems={filtered.length}
      />

      {confirmId && (
        <ConfirmModal
          title={confirmTarget?.status === 'applied' ? 'Delete seller application' : 'Delete seller account'}
          message={
            confirmTarget?.status === 'applied'
              ? 'Remove this application? This cannot be undone.'
              : 'This removes the seller account and every listing they have created. Their past orders stay on record. This cannot be undone.'
          }
          highlight={confirmTarget ? `${confirmTarget.name} (${confirmTarget.email})` : undefined}
          busy={busyId === confirmId}
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {creds && <CredentialsModal creds={creds} onClose={() => setCreds(null)} />}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !creating && setShowCreate(false)} />
          <form onSubmit={handleCreate} className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-white mb-1">New seller</h3>
            <p className="text-sm text-zinc-400 mb-5">Creates an active account and emails a temporary password.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputClass} placeholder="seller@example.com" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Phone *</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Business name</label>
                <input value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} className={inputClass} placeholder="Optional" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Shipping address line</label>
                <input value={form.addressLine} onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))} className={inputClass} placeholder="Where the seller ships from" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">City</label>
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputClass} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">State</label>
                <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} className={inputClass} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Pincode</label>
                <input value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} className={inputClass} placeholder="6 digits" inputMode="numeric" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">WhatsApp</label>
                <input value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} className={inputClass} placeholder="Defaults to phone" />
              </div>
            </div>
            {createError && <p className="text-sm text-red-400 mt-4">{createError}</p>}
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="text-sm px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="text-sm px-4 py-2 rounded-lg bg-white text-zinc-900 font-medium hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {creating ? 'Creating' : 'Create seller'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
