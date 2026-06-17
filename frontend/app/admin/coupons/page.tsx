'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Coupon } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type CouponForm = {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: string;
  minOrderValue: string;
  maxDiscountAmount: string;
  appliesTo: 'all' | 'shoes' | 'clothing' | 'accessories';
  expiresAt: string;
  active: boolean;
};

const EMPTY_FORM: CouponForm = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderValue: '0',
  maxDiscountAmount: '',
  appliesTo: 'all',
  expiresAt: '',
  active: true,
};

function couponToForm(c: Coupon): CouponForm {
  return {
    code: c.code,
    discountType: c.discountType,
    discountValue: String(c.discountValue),
    minOrderValue: String(c.minOrderValue),
    maxDiscountAmount: c.maxDiscountAmount != null ? String(c.maxDiscountAmount) : '',
    appliesTo: c.appliesTo,
    expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    active: c.active,
  };
}

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; form: CouponForm; id?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getToken = useCallback(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return null; }
    return token;
  }, [router]);

  const fetchCoupons = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/admin/coupons`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return; }
      const data = await res.json();
      setCoupons(data.coupons || []);
    } finally {
      setLoading(false);
    }
  }, [getToken, router]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  function openCreate() {
    setSaveError('');
    setModal({ mode: 'create', form: { ...EMPTY_FORM } });
  }

  function openEdit(c: Coupon) {
    setSaveError('');
    setModal({ mode: 'edit', form: couponToForm(c), id: c._id });
  }

  function setField(k: keyof CouponForm, v: string | boolean) {
    setModal((prev) => prev ? { ...prev, form: { ...prev.form, [k]: v } } : prev);
  }

  async function handleSave() {
    if (!modal) return;
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setSaveError('');

    const { code, discountType, discountValue, minOrderValue, maxDiscountAmount, appliesTo, expiresAt, active } = modal.form;
    if (!code.trim()) { setSaveError('Code is required'); setSaving(false); return; }
    if (!discountValue || isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
      setSaveError('Discount value must be a positive number'); setSaving(false); return;
    }

    const body = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscountAmount: discountType === 'percentage' && maxDiscountAmount ? Number(maxDiscountAmount) : null,
      appliesTo,
      expiresAt: expiresAt || null,
      active,
    };

    try {
      const url = modal.mode === 'create'
        ? `${API}/admin/coupons`
        : `${API}/admin/coupons/${modal.id}`;
      const res = await fetch(url, {
        method: modal.mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error || 'Save failed'); return; }
      setModal(null);
      fetchCoupons();
    } catch {
      setSaveError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const token = getToken();
    if (!token) return;
    setDeleting(true);
    try {
      await fetch(`${API}/admin/coupons/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTarget(null);
      fetchCoupons();
    } finally {
      setDeleting(false);
    }
  }

  const APPLIES_LABELS: Record<string, string> = {
    all: 'All', shoes: 'Shoes', clothing: 'Clothing', accessories: 'Accessories',
  };

  function formatDiscount(c: Coupon) {
    if (c.discountType === 'percentage') {
      return c.maxDiscountAmount
        ? `${c.discountValue}% (max ₹${c.maxDiscountAmount})`
        : `${c.discountValue}%`;
    }
    return `₹${c.discountValue}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Coupons</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 bg-white text-zinc-900 text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-zinc-200 transition-colors"
        >
          + New Coupon
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Code</th>
              <th className="text-left px-4 py-3 font-medium">Discount</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Min Order</th>
              <th className="text-left px-4 py-3 font-medium">Expiry</th>
              <th className="text-left px-4 py-3 font-medium">Uses</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 text-xs">
                  No coupons yet. Create one to get started.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-white tracking-widest text-xs">{c.code}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{formatDiscount(c)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.appliesTo === 'all'
                        ? 'bg-zinc-700 text-zinc-300'
                        : 'bg-amber-900/40 text-amber-400'
                    }`}>
                      {APPLIES_LABELS[c.appliesTo]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {c.minOrderValue > 0 ? `₹${c.minOrderValue}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-xs font-medium">{c.usedBy.length}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="text-xs text-zinc-400 hover:text-white transition-colors underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(c)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-white">
              {modal.mode === 'create' ? 'New Coupon' : 'Edit Coupon'}
            </h2>

            <div className="space-y-3">
              {/* Code */}
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1">Code *</label>
                <input
                  type="text"
                  value={modal.form.code}
                  onChange={(e) => setField('code', e.target.value.toUpperCase())}
                  placeholder="e.g. SNKRS10"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm font-mono tracking-widest focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1">Discount Type *</label>
                <select
                  value={modal.form.discountType}
                  onChange={(e) => setField('discountType', e.target.value as 'percentage' | 'flat')}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat amount (₹)</option>
                </select>
              </div>

              {/* Discount Value */}
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1">
                  {modal.form.discountType === 'percentage' ? 'Discount (%)' : 'Discount Amount (₹)'} *
                </label>
                <input
                  type="number"
                  min="0"
                  value={modal.form.discountValue}
                  onChange={(e) => setField('discountValue', e.target.value)}
                  placeholder={modal.form.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 200'}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Max Discount Cap (percentage only) */}
              {modal.form.discountType === 'percentage' && (
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">
                    Max Discount Cap (₹) <span className="text-zinc-500">optional</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modal.form.maxDiscountAmount}
                    onChange={(e) => setField('maxDiscountAmount', e.target.value)}
                    placeholder="e.g. 500 (no cap if empty)"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
                  />
                </div>
              )}

              {/* Applies To */}
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1">Applies To</label>
                <select
                  value={modal.form.appliesTo}
                  onChange={(e) => setField('appliesTo', e.target.value as CouponForm['appliesTo'])}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
                >
                  <option value="all">All Products</option>
                  <option value="shoes">Shoes only</option>
                  <option value="clothing">Clothing only</option>
                  <option value="accessories">Accessories only</option>
                </select>
              </div>

              {/* Min Order Value */}
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1">Min Order Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={modal.form.minOrderValue}
                  onChange={(e) => setField('minOrderValue', e.target.value)}
                  placeholder="0 (no minimum)"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Expires At */}
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1">
                  Expiry Date <span className="text-zinc-500">optional</span>
                </label>
                <input
                  type="date"
                  value={modal.form.expiresAt}
                  onChange={(e) => setField('expiresAt', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-zinc-400 font-medium">Active</span>
                <button
                  type="button"
                  onClick={() => setField('active', !modal.form.active)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${modal.form.active ? 'bg-amber-400' : 'bg-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${modal.form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            {saveError && <p className="text-xs text-red-500">{saveError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-white text-zinc-900 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : modal.mode === 'create' ? 'Create Coupon' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Delete Coupon</h2>
            <p className="text-sm text-zinc-400">
              Delete coupon <span className="font-mono font-bold text-white">{deleteTarget.code}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
