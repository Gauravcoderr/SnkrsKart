'use client';

import { useState, FormEvent } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function NewsletterBar() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    setMessage('');
    try {
      const res = await fetch(`${BASE_URL}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe');
      if (data.alreadySubscribed) {
        setMessage("You're already subscribed!");
      } else {
        setMessage("You're in! Check your inbox.");
      }
      setState('success');
      setEmail('');
    } catch (err: any) {
      setMessage(err.message || 'Something went wrong');
      setState('error');
    }
  }

  return (
    <section className="bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500 mb-2">Stay in the Loop</p>
        <h2 className="text-2xl font-black tracking-tight text-white mb-2">Get drop alerts before anyone else.</h2>
        <p className="text-sm text-zinc-400 mb-6">New arrivals, restocks, and exclusive deals — straight to your inbox.</p>

        {state === 'success' ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-semibold">{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-zinc-900 border border-zinc-700 text-white text-sm px-4 py-3 focus:outline-none focus:border-zinc-400 placeholder:text-zinc-600 transition-colors"
            />
            <button
              type="submit"
              disabled={state === 'loading'}
              className="px-6 py-3 bg-white text-zinc-900 text-xs font-bold tracking-widest uppercase hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-400 transition-colors shrink-0"
            >
              {state === 'loading' ? '...' : 'Get Alerts'}
            </button>
          </form>
        )}

        {state === 'error' && (
          <p className="text-xs text-red-400 mt-2">{message}</p>
        )}
      </div>
    </section>
  );
}
