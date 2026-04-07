'use client';

import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch(`${API}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="rounded-2xl bg-zinc-950 px-8 py-10 sm:px-12 sm:py-12 mb-6">
      <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-2">Newsletter</p>
      <h2 className="text-xl sm:text-2xl font-black text-white mb-1 leading-tight">
        Drop alerts. No spam.
      </h2>
      <p className="text-sm text-zinc-400 mb-6 max-w-sm">
        New releases, restocks & exclusive deals — straight to your inbox.
      </p>

      {status === 'success' ? (
        <div className="flex items-center gap-2 text-sm font-semibold text-green-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          You&apos;re on the list. Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 text-sm px-4 py-3 rounded-full border border-zinc-700 focus:outline-none focus:border-zinc-400 transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="shrink-0 bg-white text-zinc-950 font-black text-xs tracking-widest uppercase px-6 py-3 rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="mt-2 text-xs text-red-400">Something went wrong. Try again.</p>
      )}
    </div>
  );
}
