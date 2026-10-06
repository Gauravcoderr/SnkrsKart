'use client';

import { useEffect, useState } from 'react';
import { Coupon } from '@/types';
import { useAdminToast } from '@/app/admin/_components/AdminToast';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export type AssignedCoupon = Omit<Coupon, 'assignedUsers' | 'usedBy'> & { maxUses: number; usedCount: number };

export interface RedeemedOrder {
  _id: string;
  orderNumber: string;
  couponCode?: string;
  couponDiscount?: number;
  status: string;
  createdAt: string;
}

type NewCouponForm = {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: string;
  maxDiscountAmount: string;
  minOrderValue: string;
  appliesTo: Coupon['appliesTo'];
  expiresAt: string;
};

const EMPTY_NEW: NewCouponForm = {
  code: '',
  discountType: 'flat',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderValue: '0',
  appliesTo: 'all',
  expiresAt: '',
};

const NEW_OPTION = '__new__';

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500';

function formatDiscount(c: Pick<Coupon, 'discountType' | 'discountValue' | 'maxDiscountAmount'>) {
  if (c.discountType === 'percentage') {
    return c.maxDiscountAmount ? `${c.discountValue}% (max ₹${c.maxDiscountAmount})` : `${c.discountValue}%`;
  }
  return `₹${c.discountValue}`;
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('admin_token')}` };
}

export default function UserCoupons({
  userId,
  assigned,
  orders,
  onChange,
}: {
  userId: string;
  assigned: AssignedCoupon[];
  orders: RedeemedOrder[];
  onChange: () => void;
}) {
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [selected, setSelected] = useState('');
  const [maxUses, setMaxUses] = useState('1');
  const [newForm, setNewForm] = useState<NewCouponForm>(EMPTY_NEW);
  const [saving, setSaving] = useState(false);
  const toast = useAdminToast();
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/admin/coupons`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setAllCoupons(d.coupons || []))
      .catch(() => {});
  }, [assigned]);

  const assignedIds = new Set(assigned.map((c) => c._id));
  const available = allCoupons.filter((c) => !assignedIds.has(c._id));
  const redeemed = orders.filter((o) => o.couponCode);
  const totalSaved = redeemed
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + (o.couponDiscount ?? 0), 0);

  async function assign(couponId: string, uses: number) {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/coupons`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ couponId, maxUses: uses }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Assign failed');
  }

  async function handleAssign() {
    const uses = Math.floor(Number(maxUses));
    if (!selected) { toast('Pick a coupon', 'error'); return; }
    if (!Number.isFinite(uses) || uses < 1) { toast('Uses must be 1 or more', 'error'); return; }
    setSaving(true);
    try {
      let couponId = selected;
      if (selected === NEW_OPTION) {
        const { code, discountType, discountValue, maxDiscountAmount, minOrderValue, appliesTo, expiresAt } = newForm;
        if (!code.trim()) throw new Error('Code is required');
        if (!(Number(discountValue) > 0)) throw new Error('Discount value must be a positive number');
        const res = await fetch(`${BASE_URL}/admin/coupons`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            discountType,
            discountValue: Number(discountValue),
            maxDiscountAmount: discountType === 'percentage' && maxDiscountAmount ? Number(maxDiscountAmount) : null,
            minOrderValue: Number(minOrderValue) || 0,
            appliesTo,
            expiresAt: expiresAt || null,
            active: true,
            restricted: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Create failed');
        couponId = data.coupon._id;
      }
      await assign(couponId, uses);
      setSelected('');
      setMaxUses('1');
      setNewForm(EMPTY_NEW);
      onChange();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateUses() {
    if (!editing) return;
    const uses = Math.floor(Number(editing.value));
    if (!Number.isFinite(uses) || uses < 1) { toast('Uses must be 1 or more', 'error'); return; }
    try {
      await assign(editing.id, uses);
      setEditing(null);
      onChange();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function handleRemove(couponId: string) {
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/coupons/${couponId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) { toast('Remove failed', 'error'); return; }
    onChange();
  }

  const selectedCoupon = allCoupons.find((c) => c._id === selected);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <p className="text-sm font-bold text-white">Coupons</p>
        {totalSaved > 0 && (
          <p className="text-xs text-zinc-400">
            Saved <span className="text-emerald-400 font-bold">₹{totalSaved.toLocaleString('en-IN')}</span> with coupons
          </p>
        )}
      </div>

      <div className="p-5 space-y-3 border-b border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Assign coupon</p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className={inputCls}>
            <option value="">Select a coupon…</option>
            <option value={NEW_OPTION}>+ Create new private coupon</option>
            {available.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code} · {formatDiscount(c)} · {c.restricted ? 'Private' : 'Global'}{c.active ? '' : ' · Inactive'}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Uses"
            aria-label="Max uses for this user"
            className={inputCls}
          />
          <button
            type="button"
            onClick={handleAssign}
            disabled={saving}
            className="px-4 py-2 bg-white text-zinc-900 text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Assign'}
          </button>
        </div>

        {selectedCoupon && !selectedCoupon.restricted && (
          <p className="text-[11px] text-zinc-500">
            Global coupon: everyone can still use it once. This user gets {maxUses || '1'} use{maxUses === '1' ? '' : 's'} instead.
          </p>
        )}

        {selected === NEW_OPTION && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <input
              type="text"
              value={newForm.code}
              onChange={(e) => setNewForm({ ...newForm, code: e.target.value.toUpperCase() })}
              placeholder="Code, e.g. VIP500"
              className={`${inputCls} font-mono tracking-widest`}
            />
            <select
              value={newForm.discountType}
              onChange={(e) => setNewForm({ ...newForm, discountType: e.target.value as NewCouponForm['discountType'] })}
              className={inputCls}
            >
              <option value="flat">Flat amount (₹)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
            <input
              type="number"
              min="0"
              value={newForm.discountValue}
              onChange={(e) => setNewForm({ ...newForm, discountValue: e.target.value })}
              placeholder={newForm.discountType === 'percentage' ? 'Discount %' : 'Discount ₹'}
              className={inputCls}
            />
            {newForm.discountType === 'percentage' ? (
              <input
                type="number"
                min="0"
                value={newForm.maxDiscountAmount}
                onChange={(e) => setNewForm({ ...newForm, maxDiscountAmount: e.target.value })}
                placeholder="Max cap ₹ (optional)"
                className={inputCls}
              />
            ) : (
              <input
                type="number"
                min="0"
                value={newForm.minOrderValue}
                onChange={(e) => setNewForm({ ...newForm, minOrderValue: e.target.value })}
                placeholder="Min order ₹"
                className={inputCls}
              />
            )}
            <select
              value={newForm.appliesTo}
              onChange={(e) => setNewForm({ ...newForm, appliesTo: e.target.value as Coupon['appliesTo'] })}
              className={inputCls}
            >
              <option value="all">All Products</option>
              <option value="shoes">Shoes only</option>
              <option value="clothing">Clothing only</option>
              <option value="accessories">Accessories only</option>
            </select>
            <input
              type="date"
              value={newForm.expiresAt}
              onChange={(e) => setNewForm({ ...newForm, expiresAt: e.target.value })}
              aria-label="Expiry date"
              className={inputCls}
            />
            {newForm.discountType === 'percentage' && (
              <input
                type="number"
                min="0"
                value={newForm.minOrderValue}
                onChange={(e) => setNewForm({ ...newForm, minOrderValue: e.target.value })}
                placeholder="Min order ₹"
                className={inputCls}
              />
            )}
          </div>
        )}
      </div>

      {assigned.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 text-sm">No coupons assigned.</div>
      ) : (
        <div className="divide-y divide-zinc-800">
          {assigned.map((c) => {
            const left = Math.max(0, c.maxUses - c.usedCount);
            const expired = !!c.expiresAt && new Date(c.expiresAt) < new Date();
            return (
              <div key={c._id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-white tracking-widest text-xs">{c.code}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${c.restricted ? 'bg-violet-900/40 text-violet-300' : 'bg-zinc-800 text-zinc-400'}`}>
                      {c.restricted ? 'Private' : 'Global'}
                    </span>
                    {(!c.active || expired) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-red-900/30 text-red-400">
                        {expired ? 'Expired' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {formatDiscount(c)}
                    {c.minOrderValue > 0 && ` · min ₹${c.minOrderValue}`}
                    {c.appliesTo !== 'all' && ` · ${c.appliesTo}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {editing?.id === c._id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        value={editing.value}
                        onChange={(e) => setEditing({ id: c._id, value: e.target.value })}
                        aria-label="Max uses"
                        className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-xs focus:outline-none"
                      />
                      <button type="button" onClick={handleUpdateUses} className="text-xs text-emerald-400 hover:text-emerald-300 underline">Save</button>
                      <button type="button" onClick={() => setEditing(null)} className="text-xs text-zinc-500 hover:text-zinc-300 underline">Cancel</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing({ id: c._id, value: String(c.maxUses) })}
                      className="text-right"
                      title="Edit allowed uses"
                    >
                      <p className="text-xs font-bold text-white">{c.usedCount} / {c.maxUses} used</p>
                      <p className={`text-[10px] ${left > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>{left} left</p>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(c._id)}
                    className="text-xs text-red-500 hover:text-red-400 underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {redeemed.length > 0 && (
        <div className="border-t border-zinc-800">
          <p className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Redeemed</p>
          <div className="divide-y divide-zinc-800">
            {redeemed.map((o) => (
              <div key={o._id} className="px-5 py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-zinc-300 tracking-widest">{o.couponCode}</span>
                  <span className="text-zinc-500 truncate">{o.orderNumber}</span>
                  {o.status === 'cancelled' && <span className="text-[10px] text-red-400 font-bold">CANCELLED</span>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-bold ${o.status === 'cancelled' ? 'text-zinc-500 line-through' : 'text-emerald-400'}`}>
                    −₹{(o.couponDiscount ?? 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-zinc-500">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
