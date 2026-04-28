'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useAuth, authHeaders } from '@/context/AuthContext';
import LoyaltyCard from '@/components/account/LoyaltyCard';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function AccountPage() {
  const { user, isLoggedIn, loading, openAuthModal, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      refreshUser();
      setEditing(false);
      setMessage('Profile updated');
    },
    onError: () => {
      setMessage('Failed to update. Try again.');
    },
  });

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

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
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 mb-2">My Account</h1>
          <p className="text-sm text-zinc-500 mb-6">Sign in to view your profile, orders, and saved addresses.</p>
          <button type="button" onClick={openAuthModal} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  function startEdit() {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEditing(true);
    setMessage('');
  }

  const quickLinks = [
    {
      href: '/account/orders',
      label: 'My Orders',
      desc: 'Track your orders and view history',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      bg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      border: 'border-indigo-100 hover:border-indigo-400',
      accent: 'group-hover:text-indigo-600',
      badge: 'bg-indigo-600',
    },
    {
      href: '/account/addresses',
      label: 'Saved Addresses',
      desc: 'Manage your delivery addresses',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-100 hover:border-emerald-400',
      accent: 'group-hover:text-emerald-600',
      badge: 'bg-emerald-600',
    },
    {
      href: '/wishlist',
      label: 'Wishlist',
      desc: 'Your saved sneakers',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      bg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      border: 'border-rose-100 hover:border-rose-400',
      accent: 'group-hover:text-rose-500',
      badge: 'bg-rose-500',
    },
    {
      href: '/products',
      label: 'Continue Shopping',
      desc: 'Browse all sneakers',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
        </svg>
      ),
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      border: 'border-amber-100 hover:border-amber-400',
      accent: 'group-hover:text-amber-600',
      badge: 'bg-amber-500',
    },
  ];

  return (
    <div className="bg-gradient-to-b from-zinc-50 to-white">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-4 sm:px-6 pt-10 pb-20">
        <div className="max-w-2xl mx-auto flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center flex-shrink-0 shadow-xl">
            <span className="text-2xl font-black text-white">{initials}</span>
          </div>
          <div>
            <p className="text-white/70 text-xs font-semibold tracking-widest uppercase mb-0.5">Welcome back</p>
            <h1 className="text-2xl font-black text-white tracking-tight">{user?.name || 'Sneakerhead'}</h1>
            <p className="text-white/60 text-xs mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-10 pb-8">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-md border border-zinc-100 p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-400">Profile</p>
            {!editing && (
              <button type="button" onClick={startEdit} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-3 py-1 rounded-full transition">
                Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="edit-name" className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Name</label>
                <input id="edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full border border-zinc-200 px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition" />
              </div>
              <div>
                <label htmlFor="edit-phone" className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Phone</label>
                <input id="edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full border border-zinc-200 px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-zinc-200 text-sm font-bold rounded-xl hover:border-zinc-400 transition">Cancel</button>
                <button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 shadow transition">
                  {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow">
                <span className="text-base font-black text-white">{initials}</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-base font-bold text-zinc-900">{user?.name || 'No name set'}</p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
                {user?.phone && <p className="text-xs text-zinc-400">{user.phone}</p>}
              </div>
            </div>
          )}
          {message && (
            <p className="text-xs text-emerald-600 font-semibold mt-3 flex items-center gap-1">
              <span>✓</span> {message}
            </p>
          )}
        </div>

        {/* Kart Coins loyalty */}
        <LoyaltyCard />

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group bg-white border-2 ${item.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 relative overflow-hidden`}
            >
              <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.iconColor} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold text-zinc-900 ${item.accent} transition-colors`}>{item.label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{item.desc}</p>
              </div>
              <svg className={`w-4 h-4 ${item.iconColor} opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
