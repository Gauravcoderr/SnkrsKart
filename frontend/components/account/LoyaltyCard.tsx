'use client';

import { useState, useEffect } from 'react';
import { LoyaltyAccount } from '@/types';
import { getStoredToken } from '@/context/AuthContext';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const TIER_CONFIG = {
  rookie: {
    label: 'Rookie',
    next: 'Enthusiast',
    nextAt: 500,
    bg: 'from-zinc-600 to-zinc-800',
    badge: 'bg-zinc-700 text-zinc-100',
    ring: 'ring-zinc-300',
  },
  enthusiast: {
    label: 'Enthusiast',
    next: 'OG Sneakerhead',
    nextAt: 2000,
    bg: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500 text-white',
    ring: 'ring-amber-300',
  },
  og: {
    label: 'OG Sneakerhead',
    next: null,
    nextAt: null,
    bg: 'from-purple-600 to-indigo-700',
    badge: 'bg-purple-600 text-white',
    ring: 'ring-purple-300',
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LoyaltyCard() {
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) { setLoading(false); return; }
    fetch(`${BASE_URL}/loyalty/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      cache: 'no-store',
    } as RequestInit)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setLoyalty(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-zinc-100 p-6 mb-6 animate-pulse">
        <div className="h-4 bg-zinc-100 rounded w-32 mb-4" />
        <div className="h-20 bg-zinc-50 rounded" />
      </div>
    );
  }

  if (!loyalty) return null;

  const tier = TIER_CONFIG[loyalty.tier];
  const prevAt = loyalty.tier === 'rookie' ? 0 : loyalty.tier === 'enthusiast' ? 500 : 2000;
  const progress = tier.nextAt
    ? Math.min(100, ((loyalty.coins - prevAt) / (tier.nextAt - prevAt)) * 100)
    : 100;

  const recentHistory = loyalty.history.slice(-10).reverse();

  return (
    <div className="bg-white rounded-2xl shadow-md border border-zinc-100 mb-6 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${tier.bg} p-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 right-16 w-20 h-20 rounded-full bg-white/5 translate-y-6" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">Kart Coins</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{loyalty.coins.toLocaleString('en-IN')}</span>
                <span className="text-white/60 text-sm font-medium">coins</span>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider ${tier.badge} ring-2 ${tier.ring} ring-offset-1 ring-offset-transparent`}>
              {tier.label}
            </div>
          </div>

          {/* Progress to next tier */}
          {tier.next ? (
            <div>
              <div className="flex justify-between text-[10px] text-white/60 mb-1.5">
                <span>{loyalty.coins.toLocaleString('en-IN')} coins</span>
                <span>{tier.nextAt?.toLocaleString('en-IN')} for {tier.next}</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-white/50 mt-1.5">
                {(tier.nextAt! - loyalty.coins).toLocaleString('en-IN')} more coins to reach {tier.next}
              </p>
            </div>
          ) : (
            <div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '100%' }} />
              </div>
              <p className="text-[10px] text-white/60 mt-1.5">You&apos;ve reached the highest tier!</p>
            </div>
          )}
        </div>
      </div>

      {/* Redemption hint */}
      <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
        <p className="text-[10px] text-zinc-500">
          100 coins = <span className="font-bold text-zinc-900">₹100 off</span> your next order
        </p>
        {loyalty.coins >= 100 && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {loyalty.coins >= 100 ? `Save up to ₹${Math.floor(loyalty.coins)}` : ''}
          </span>
        )}
      </div>

      {/* Transaction history */}
      {recentHistory.length > 0 && (
        <div className="p-6">
          <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-3">Recent Activity</p>
          <div className="space-y-3">
            {recentHistory.map((event, i) => (
              <div key={i} className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    event.type === 'earn' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {event.type === 'earn' ? (
                      <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-800">{event.reason}</p>
                    <p className="text-[10px] text-zinc-400">{formatDate(event.createdAt)}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold shrink-0 ml-4 ${
                  event.type === 'earn' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {event.type === 'earn' ? '+' : '−'}{event.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
