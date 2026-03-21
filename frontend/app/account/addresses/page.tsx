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
    setForm({ addressLine: addr.addressLine, city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault });
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 mb-2">Saved Addresses</h1>
          <p className="text-sm text-zinc-500 mb-6">Sign in to manage your delivery addresses.</p>
          <button type="button" onClick={openAuthModal} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase rounded-xl hover:opacity-90 shadow-md transition-all">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-zinc-50 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-10">
        {/* Hero header */}
        <div className="relative bg-gradient-to-br from-zinc-900 via-emerald-950 to-zinc-900 rounded-b-3xl px-6 pt-10 pb-8 mb-8 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-emerald-300/60 mb-0.5">Account</p>
                <h1 className="text-2xl font-black tracking-tight text-white">Saved Addresses</h1>
                {addresses.length > 0 && (
                  <p className="text-xs text-zinc-400 mt-0.5">{addresses.length} address{addresses.length > 1 ? 'es' : ''} saved</p>
                )}
              </div>
            </div>
            {mode === 'list' && (
              <button
                type="button"
                onClick={startAdd}
                className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 px-4 py-2.5 rounded-xl shadow-lg transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add New
              </button>
            )}
          </div>
        </div>

        {/* Add / Edit Form */}
        {(mode === 'add' || mode === 'edit') && (
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 mb-6 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-white">
                {mode === 'add' ? 'Add New Address' : 'Edit Address'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Address Line</label>
                <input
                  type="text"
                  value={form.addressLine}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  placeholder="House no., Street, Area"
                  className="w-full bg-zinc-800 border border-zinc-700 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    className="w-full bg-zinc-800 border border-zinc-700 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="State"
                    className="w-full bg-zinc-800 border border-zinc-700 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">Pincode</label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  className="w-full bg-zinc-800 border border-zinc-700 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span className="text-sm font-semibold text-zinc-300">Set as default address</span>
              </label>
            </div>

            {formError && (
              <p className="text-xs text-red-400 mt-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {formError}
              </p>
            )}

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => { setMode('list'); setFormError(''); }}
                className="flex-1 py-2.5 border border-zinc-700 text-sm font-bold text-zinc-400 hover:text-white hover:border-zinc-500 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 shadow-lg transition"
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
              <div className="text-center py-20 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 rounded-2xl border border-dashed border-emerald-100">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-zinc-600 mb-1">No saved addresses</p>
                <p className="text-xs text-zinc-400 mb-5">Add an address to speed up checkout</p>
                <button
                  type="button"
                  onClick={startAdd}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-xl hover:opacity-90 shadow-md transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add your first address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 hover:shadow-md hover:border-zinc-200 transition-all duration-200"
                  >
                    {/* Left status strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${addr.isDefault ? 'bg-gradient-to-b from-emerald-400 to-teal-600' : 'bg-gradient-to-b from-zinc-200 to-zinc-300'}`} />

                    <div className="pl-4 p-5">
                      <div className="flex items-start gap-4">
                        {/* Pin icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${addr.isDefault ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-zinc-100'}`}>
                          <svg className={`w-5 h-5 ${addr.isDefault ? 'text-white' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {addr.isDefault && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-zinc-900 leading-snug">{addr.addressLine}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{addr.city}, {addr.state} — {addr.pincode}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-50">
                        <button
                          type="button"
                          onClick={() => startEdit(addr)}
                          className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-indigo-600 bg-zinc-100 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                          Edit
                        </button>

                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => updateMutation.mutate({ id: addr._id, data: { addressLine: addr.addressLine, city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: true } })}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-emerald-600 bg-zinc-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Set Default
                          </button>
                        )}

                        {deleteConfirmId === addr._id ? (
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-xs text-zinc-500">Delete this?</span>
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(addr._id)}
                              disabled={deleteMutation.isPending}
                              className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {deleteMutation.isPending ? '...' : 'Yes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-xs font-bold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(addr._id)}
                            className="ml-auto flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-100">
          <Link href="/account" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Account
          </Link>
        </div>
      </div>
    </div>
  );
}
