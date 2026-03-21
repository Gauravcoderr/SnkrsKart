'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useAuth, authHeaders } from '@/context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Address {
  _id: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface AddressFormState {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressFormState = { addressLine: '', city: '', state: '', pincode: '', isDefault: false };

export default function AddressesPage() {
  const { user, isLoggedIn, loading, openAuthModal, refreshUser } = useAuth();
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const addresses: Address[] = (user?.addresses ?? []) as Address[];

  // Add address
  const addMutation = useMutation({
    mutationFn: async (data: AddressFormState) => {
      const res = await fetch(`${API}/auth/me/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add address');
      }
      return res.json();
    },
    onSuccess: async () => {
      await refreshUser();
      setMode('list');
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (err: Error) => setFormError(err.message),
  });

  // Update address
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddressFormState }) => {
      const res = await fetch(`${API}/auth/me/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update address');
      }
      return res.json();
    },
    onSuccess: async () => {
      await refreshUser();
      setMode('list');
      setEditingId(null);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (err: Error) => setFormError(err.message),
  });

  // Delete address
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/auth/me/addresses/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete address');
      return res.json();
    },
    onSuccess: async () => {
      await refreshUser();
      setDeleteConfirmId(null);
    },
  });

  function startAdd() {
    setForm(EMPTY_FORM);
    setFormError('');
    setEditingId(null);
    setMode('add');
  }

  function startEdit(addr: Address) {
    setForm({
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setFormError('');
    setEditingId(addr._id);
    setMode('edit');
  }

  function handleSubmit() {
    if (!form.addressLine.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      setFormError('All fields are required.');
      return;
    }
    if (mode === 'edit' && editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      addMutation.mutate(form);
    }
  }

  const isSaving = addMutation.isPending || updateMutation.isPending;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-black text-zinc-900 mb-2">Saved Addresses</h1>
        <p className="text-sm text-zinc-500 mb-6">Sign in to manage your delivery addresses.</p>
        <button type="button" onClick={openAuthModal} className="bg-zinc-900 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 transition rounded-lg">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-0.5">Account</p>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Saved Addresses</h1>
        </div>
        {mode === 'list' && (
          <button
            type="button"
            onClick={startAdd}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-700 px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(mode === 'add' || mode === 'edit') && (
        <div className="border border-zinc-200 rounded-2xl p-5 mb-6 bg-zinc-50">
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-500 mb-4">
            {mode === 'add' ? 'Add New Address' : 'Edit Address'}
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Address Line</label>
              <input
                type="text"
                value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                placeholder="House no., Street, Area"
                className="w-full border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 rounded-lg focus:outline-none focus:border-zinc-900 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City"
                  className="w-full border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 rounded-lg focus:outline-none focus:border-zinc-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="State"
                  className="w-full border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 rounded-lg focus:outline-none focus:border-zinc-900 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                placeholder="6-digit pincode"
                maxLength={6}
                className="w-full border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 rounded-lg focus:outline-none focus:border-zinc-900 transition-colors"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="w-4 h-4 accent-zinc-900"
              />
              <span className="text-xs font-semibold text-zinc-700">Set as default address</span>
            </label>
          </div>

          {formError && <p className="text-xs text-red-600 mt-3">{formError}</p>}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => { setMode('list'); setFormError(''); }}
              className="flex-1 py-2.5 border border-zinc-200 text-sm font-bold text-zinc-600 rounded-lg hover:border-zinc-400 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition"
            >
              {isSaving ? 'Saving...' : mode === 'add' ? 'Add Address' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Address list */}
      {mode === 'list' && (
        <>
          {addresses.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-200 rounded-2xl">
              <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-500 mb-1">No saved addresses</p>
              <p className="text-xs text-zinc-400 mb-4">Add an address to speed up checkout</p>
              <button type="button" onClick={startAdd} className="text-xs font-bold text-zinc-900 underline hover:text-zinc-600 transition">
                Add your first address
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr._id} className={`border rounded-2xl p-5 transition-all ${addr.isDefault ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {addr.isDefault && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black tracking-widest uppercase bg-zinc-900 text-white rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">{addr.addressLine}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{addr.city}, {addr.state} — {addr.pincode}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => startEdit(addr)}
                      className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      Edit
                    </button>
                    <span className="text-zinc-200 text-xs">|</span>
                    {deleteConfirmId === addr._id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Delete?</span>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(addr._id)}
                          disabled={deleteMutation.isPending}
                          className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
                        >
                          {deleteMutation.isPending ? '...' : 'Yes, Delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(addr._id)}
                        className="text-xs font-semibold text-zinc-500 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                    {!addr.isDefault && (
                      <>
                        <span className="text-zinc-200 text-xs">|</span>
                        <button
                          type="button"
                          onClick={() => updateMutation.mutate({ id: addr._id, data: { addressLine: addr.addressLine, city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: true } })}
                          disabled={updateMutation.isPending}
                          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                          Set as Default
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-10 pt-6 border-t border-zinc-100">
        <Link href="/account" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
          ← Back to Account
        </Link>
      </div>
    </div>
  );
}
