'use client';

import { useState } from 'react';
import { restockNotify } from '@/lib/api';

interface RestockNotifyProps {
  productSlug: string;
  selectedSize?: number | null;
}

type State = 'idle' | 'open' | 'loading' | 'success' | 'error';

export default function RestockNotify({ productSlug, selectedSize }: RestockNotifyProps) {
  const [state, setState] = useState<State>('idle');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('loading');
    setErrorMsg('');
    try {
      await restockNotify(email, productSlug, selectedSize);
      setState('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setState('error');
    }
  };

  if (state === 'success') {
    return (
      <div className="flex items-center gap-2 py-3.5 px-4 bg-emerald-50 border border-emerald-200">
        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-xs font-semibold text-emerald-700">
          You&apos;re on the list! We&apos;ll email you when this{selectedSize ? ` (UK ${selectedSize})` : ''} is back.
        </p>
      </div>
    );
  }

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setState('open')}
        className="w-full py-3.5 border-2 border-zinc-300 text-sm font-bold tracking-widest uppercase text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Notify Me When Back in Stock{selectedSize ? ` — UK ${selectedSize}` : ''}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-2 border-zinc-200 p-4 space-y-3">
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-1">
          Restock Alert{selectedSize ? ` — UK ${selectedSize}` : ''}
        </p>
        <p className="text-xs text-zinc-500">
          Enter your email and we&apos;ll notify you the moment it&apos;s available.
        </p>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2.5 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="px-4 py-2.5 bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase hover:bg-zinc-700 disabled:opacity-60 transition-colors shrink-0"
        >
          {state === 'loading' ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : 'Notify Me'}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
      )}
      <button
        type="button"
        onClick={() => { setState('idle'); setErrorMsg(''); }}
        className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
