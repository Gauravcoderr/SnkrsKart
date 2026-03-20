'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function AccountPage() {
  const { user, isLoggedIn, loading, openAuthModal, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
        <h1 className="text-2xl font-black text-zinc-900 mb-2">My Account</h1>
        <p className="text-sm text-zinc-500 mb-6">Sign in to view your profile, orders, and saved addresses.</p>
        <button
          type="button"
          onClick={openAuthModal}
          className="bg-zinc-900 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  function startEdit() {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEditing(true);
    setMessage('');
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save');
      await refreshUser();
      setEditing(false);
      setMessage('Profile updated');
    } catch {
      setMessage('Failed to update. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-black tracking-tight text-zinc-900 mb-8">My Account</h1>

      {/* Profile card */}
      <div className="border border-zinc-100 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">Profile</p>
          {!editing && (
            <button type="button" onClick={startEdit} className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 underline transition">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-zinc-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-zinc-900 transition" />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-zinc-200 px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:border-zinc-900 transition" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-zinc-200 text-sm font-bold rounded-lg hover:border-zinc-400 transition">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <p className="text-sm font-bold text-zinc-900">{user?.name || 'No name set'}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
              {user?.phone && <p className="text-xs text-zinc-500">{user.phone}</p>}
            </div>
          </div>
        )}
        {message && <p className="text-xs text-emerald-600 mt-3">{message}</p>}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/account/orders" className="border border-zinc-100 rounded-xl p-5 hover:border-zinc-300 transition group">
          <p className="text-sm font-bold text-zinc-900 group-hover:text-zinc-600 transition">My Orders</p>
          <p className="text-xs text-zinc-400 mt-1">Track your orders and view history</p>
        </Link>
        <Link href="/account/addresses" className="border border-zinc-100 rounded-xl p-5 hover:border-zinc-300 transition group">
          <p className="text-sm font-bold text-zinc-900 group-hover:text-zinc-600 transition">Saved Addresses</p>
          <p className="text-xs text-zinc-400 mt-1">Manage your delivery addresses</p>
        </Link>
        <Link href="/wishlist" className="border border-zinc-100 rounded-xl p-5 hover:border-zinc-300 transition group">
          <p className="text-sm font-bold text-zinc-900 group-hover:text-zinc-600 transition">Wishlist</p>
          <p className="text-xs text-zinc-400 mt-1">Your saved sneakers</p>
        </Link>
        <Link href="/products" className="border border-zinc-100 rounded-xl p-5 hover:border-zinc-300 transition group">
          <p className="text-sm font-bold text-zinc-900 group-hover:text-zinc-600 transition">Continue Shopping</p>
          <p className="text-xs text-zinc-400 mt-1">Browse all sneakers</p>
        </Link>
      </div>
    </div>
  );
}
