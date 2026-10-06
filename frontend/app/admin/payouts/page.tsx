'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BASE_URL } from '../_lib/config';
import { compressImage } from '@/lib/compressImage';
import { uploadImage } from '@/lib/uploadImage';
import type { SellerOrder } from '@/types/seller';
import AdminLoader from '@/app/admin/_components/AdminLoader';

interface PayoutSeller {
  _id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  businessName?: string;
  upiId?: string;
}

type PayoutRow = Omit<SellerOrder, 'seller'> & { seller: PayoutSeller | string };

type Tab = 'due' | 'paid' | 'all';

const DAY = 24 * 60 * 60 * 1000;

function sellerOf(row: PayoutRow): PayoutSeller {
  if (typeof row.seller === 'string') return { _id: row.seller, name: 'Unknown seller', email: '', phone: '' };
  return row.seller;
}

function fmt(d: string | null | undefined, withTime = false) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) });
}

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function dueLabel(row: PayoutRow): { text: string; cls: string } {
  const due = row.payout?.dueAt ? new Date(row.payout.dueAt).getTime() : null;
  if (!due) return { text: 'Due date not set', cls: 'text-zinc-500' };
  const days = Math.ceil((due - Date.now()) / DAY);
  if (days > 1) return { text: `Due in ${days} days`, cls: 'text-amber-400' };
  if (days === 1) return { text: 'Due tomorrow', cls: 'text-amber-300' };
  if (days === 0) return { text: 'Due today', cls: 'text-amber-300' };
  return { text: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`, cls: 'text-red-400' };
}

function itemsSummary(row: PayoutRow) {
  return row.items.map((it) => `${it.brand} ${it.name} UK ${it.size}${it.qty > 1 ? ` x${it.qty}` : ''}`).join(', ');
}

const inputClass = 'w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600';

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('due');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PayoutRow | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const token = () => (typeof window === 'undefined' ? null : localStorage.getItem('admin_token'));
  const handle401 = useCallback(() => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  }, [router]);

  const load = useCallback(async () => {
    const t = token();
    if (!t) { handle401(); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/admin/payouts`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.status === 401) { handle401(); return; }
      if (!res.ok) { setError(`Server error: ${res.status}`); return; }
      setRows(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, [handle401]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    let due = 0, dueCount = 0, paid = 0, paidMonth = 0, overdue = 0;
    for (const r of rows) {
      if (r.payout?.status === 'paid') {
        paid += r.payout.amount || r.sellerTotal;
        if (r.payout.paidAt && new Date(r.payout.paidAt) >= monthStart) paidMonth += r.payout.amount || r.sellerTotal;
      } else {
        due += r.sellerTotal; dueCount += 1;
        if (r.payout?.dueAt && new Date(r.payout.dueAt).getTime() < Date.now()) overdue += 1;
      }
    }
    return { due, dueCount, paid, paidMonth, overdue };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === 'due' && r.payout?.status === 'paid') return false;
      if (tab === 'paid' && r.payout?.status !== 'paid') return false;
      if (!q) return true;
      const s = sellerOf(r);
      return r.orderNumber.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.businessName || '').toLowerCase().includes(q) || (s.upiId || '').toLowerCase().includes(q) || (r.payout?.reference || '').toLowerCase().includes(q);
    });
  }, [rows, tab, search]);

  function onSaved(updated: PayoutRow) {
    setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    setEditing(null);
  }

  if (loading) {
    return (
      <AdminLoader />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-400 font-medium text-sm">{error}</p>
        <button type="button" onClick={load} className="text-xs text-zinc-400 hover:text-white underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg border border-amber-900/40 bg-amber-950/20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Payout due</p>
          <p className="text-xl font-black text-white">{inr(totals.due)}</p>
          <p className="text-[11px] text-zinc-500 mt-1">{totals.dueCount} order{totals.dueCount === 1 ? '' : 's'}{totals.overdue ? ` · ${totals.overdue} overdue` : ''}</p>
        </div>
        <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Paid this month</p>
          <p className="text-xl font-black text-white">{inr(totals.paidMonth)}</p>
        </div>
        <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Paid all time</p>
          <p className="text-xl font-black text-white">{inr(totals.paid)}</p>
        </div>
        <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Rule</p>
          <p className="text-sm text-zinc-300 leading-snug">Release about 7 days after delivery. Attach the UPI screenshot when marking paid.</p>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            {(['due', 'paid', 'all'] as Tab[]).map((t) => {
              const count = t === 'due' ? totals.dueCount : t === 'paid' ? rows.length - totals.dueCount : rows.length;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${tab === t ? 'bg-white text-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                >
                  {t === 'due' ? 'Due' : t === 'paid' ? 'Paid' : 'All'} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, seller, UPI, reference…"
            className="w-full sm:w-80 bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            {tab === 'due' ? 'Nothing due. Payouts appear here once an order is delivered.' : 'No payouts match.'}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filtered.map((row) => {
              const s = sellerOf(row);
              const paid = row.payout?.status === 'paid';
              const due = dueLabel(row);
              return (
                <div key={row._id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-xs font-bold text-zinc-300">{row.orderNumber}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${paid ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}`}>
                        {paid ? 'PAID' : 'DUE'}
                      </span>
                      {!paid && <span className={`text-[11px] font-medium ${due.cls}`}>{due.text}</span>}
                    </div>
                    <Link href={`/admin/sellers/${s._id}`} className="text-sm font-semibold text-white hover:underline">
                      {s.name}{s.businessName ? ` (${s.businessName})` : ''}
                    </Link>
                    <p className="text-xs text-zinc-500 truncate">{itemsSummary(row)}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Delivered {fmt(row.deliveredAt)}
                      {s.upiId ? <> · UPI <span className="font-mono text-zinc-300">{s.upiId}</span></> : <span className="text-red-400"> · No UPI ID on file</span>}
                      {paid && row.payout?.paidAt ? ` · Paid ${fmt(row.payout.paidAt)}` : ''}
                      {paid && row.payout?.reference ? <> · Ref <span className="font-mono text-zinc-300">{row.payout.reference}</span></> : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 shrink-0">
                    {paid && row.payout?.screenshotUrl && (
                      <button type="button" onClick={() => setLightbox(row.payout!.screenshotUrl)} className="block">
                        <Image src={row.payout.screenshotUrl} alt="Payment screenshot" width={56} height={56} unoptimized className="w-14 h-14 object-cover rounded border border-zinc-700 hover:opacity-80" />
                      </button>
                    )}
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500">Amount</p>
                      <p className="text-base font-black text-white">{inr(paid ? row.payout!.amount || row.sellerTotal : row.sellerTotal)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditing(row)}
                      className={`text-xs font-bold tracking-widest uppercase px-3 py-2 rounded ${paid ? 'text-zinc-300 border border-zinc-700 hover:bg-zinc-800' : 'bg-white text-zinc-900 hover:bg-zinc-200'} transition`}
                    >
                      {paid ? 'Edit' : 'Mark paid'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <MarkPaidModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
          onUnauthorized={handle401}
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <Image src={lightbox} alt="Payment screenshot" width={1200} height={1200} unoptimized className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}

function MarkPaidModal({ row, onClose, onSaved, onUnauthorized }: { row: PayoutRow; onClose: () => void; onSaved: (r: PayoutRow) => void; onUnauthorized: () => void }) {
  const s = sellerOf(row);
  const paid = row.payout?.status === 'paid';
  const [amount, setAmount] = useState(String(paid ? row.payout!.amount || row.sellerTotal : row.sellerTotal));
  const [reference, setReference] = useState(row.payout?.reference || '');
  const [note, setNote] = useState(row.payout?.note || '');
  const [screenshotUrl, setScreenshotUrl] = useState(row.payout?.screenshotUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const compressed = await compressImage(file);
      setScreenshotUrl(await uploadImage(compressed, 'payouts'));
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setError('');
    if (!screenshotUrl) { setError('Attach the payment screenshot first'); return; }
    const amt = Math.round(Number(amount));
    if (!isFinite(amt) || amt <= 0) { setError('Enter a valid amount'); return; }
    setSaving(true);
    try {
      const t = localStorage.getItem('admin_token');
      const res = await fetch(`${BASE_URL}/admin/seller-orders/${row._id}/payout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ amount: amt, reference, note, screenshotUrl }),
      });
      if (res.status === 401) { onUnauthorized(); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || `Request failed (${res.status})`); return; }
      onSaved(data);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white">{paid ? 'Edit payout' : 'Mark payout as paid'}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{row.orderNumber} · {s.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-400 space-y-1">
            <p>{itemsSummary(row)}</p>
            <p>Seller payout {inr(row.sellerTotal)} · Delivered {fmt(row.deliveredAt)}</p>
            <p>UPI: {s.upiId ? <span className="font-mono text-zinc-200">{s.upiId}</span> : <span className="text-red-400">not set by seller</span>}{s.phone ? ` · ${s.phone}` : ''}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Amount paid (₹)</label>
              <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">UPI reference / UTR</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} placeholder="12 digit UTR" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Payment screenshot *</label>
            {screenshotUrl ? (
              <div className="flex items-center gap-3">
                <Image src={screenshotUrl} alt="Payment screenshot" width={96} height={96} unoptimized className="w-24 h-24 object-cover rounded border border-zinc-700" />
                <label className="text-xs text-zinc-300 underline cursor-pointer hover:text-white">
                  Replace
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} disabled={uploading} />
                </label>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-lg px-4 py-6 cursor-pointer transition ${uploading ? 'border-zinc-700 opacity-60' : 'border-zinc-700 hover:border-zinc-500'}`}>
                <span className="text-sm text-zinc-300">{uploading ? 'Uploading…' : 'Tap to upload the UPI payment screenshot'}</span>
                <span className="text-[11px] text-zinc-500">JPG or PNG, compressed before upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} disabled={uploading} />
              </label>
            )}
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Note to seller (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="e.g. Paid via GPay from store account" />
          </div>
          <p className="text-[11px] text-zinc-500">{paid ? 'Saving updates the record. The seller was already emailed when first marked paid.' : 'Saving marks this payout as paid and emails the seller the amount, reference and screenshot link.'}</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="text-sm px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50">Cancel</button>
          <button type="button" onClick={submit} disabled={saving || uploading} className="px-5 py-2 bg-white text-zinc-900 text-sm font-bold tracking-widest uppercase rounded hover:bg-zinc-200 transition disabled:opacity-50">
            {saving ? 'Saving…' : paid ? 'Save changes' : 'Mark paid & notify'}
          </button>
        </div>
      </div>
    </div>
  );
}
