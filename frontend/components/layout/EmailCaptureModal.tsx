'use client';

import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'snkrs_email_modal_dismissed';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function EmailCaptureModal() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const triggered = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const handleScroll = () => {
      if (triggered.current) return;
      const scrollable = document.body.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= 0.3) {
        triggered.current = true;
        setVisible(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${BASE_URL}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        setStatus('success');
        localStorage.setItem(STORAGE_KEY, '1');
        setTimeout(() => setVisible(false), 2800);
      } else {
        setStatus('error');
        setErrorMsg(data.error ?? 'Something went wrong. Try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Try again.');
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Subscribe to drop alerts"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-backdrop-in"
        onClick={dismiss}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-sm bg-zinc-950 border border-zinc-800 sm:rounded-2xl overflow-hidden shadow-2xl animate-modal-up sm:animate-modal-in">
        {/* Top accent bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-zinc-100 via-zinc-500 to-zinc-800" />

        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-zinc-600 hover:text-white transition-colors z-10"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="px-7 pt-5 pb-7">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase">
              Exclusive Access
            </span>
          </div>

          {status === 'success' ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🔥</div>
              <h3 className="font-display text-white text-4xl tracking-wider mb-2">
                YOU&apos;RE ON THE LIST
              </h3>
              <p className="text-zinc-400 text-sm">Check your inbox — drops incoming.</p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-white text-5xl tracking-wider leading-none mb-3">
                DROP ALERTS.<br />FIRST ACCESS.
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                First in line for new drops, restocks &amp; exclusive deals.
                No spam — only the heat that matters.
              </p>

              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={status === 'loading'}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-zinc-600 transition-colors disabled:opacity-50"
                />
                {errorMsg && (
                  <p className="text-red-400 text-xs pl-1">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-white text-zinc-950 font-bold text-[11px] tracking-[0.18em] uppercase py-4 rounded-xl hover:bg-zinc-100 active:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {status === 'loading' ? 'LOCKING IN...' : 'GET DROP ALERTS →'}
                </button>
              </form>

              <p className="text-zinc-700 text-[10px] text-center mt-5 tracking-wider uppercase">
                Unsubscribe anytime · No spam ever
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
