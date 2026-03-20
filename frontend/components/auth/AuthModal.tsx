'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import OtpInput from './OtpInput';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type Step = 'email' | 'otp' | 'profile';

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Reset on close
  useEffect(() => {
    if (!authModalOpen) {
      setTimeout(() => {
        setStep('email');
        setEmail('');
        setOtp(Array(6).fill(''));
        setName('');
        setPhone('');
        setError('');
        setLoading(false);
        setCountdown(0);
      }, 300);
    }
  }, [authModalOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = authModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [authModalOpen]);

  async function handleSendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send code');
        if (data.retryAfter) setCountdown(data.retryAfter);
        return;
      }

      setIsNewUser(data.isNewUser);
      setStep('otp');
      setCountdown(60);
      setOtp(Array(6).fill(''));
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          otp: code,
          ...(name ? { name } : {}),
          ...(phone ? { phone } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid code');
        setOtp(Array(6).fill(''));
        return;
      }

      // Check if we need profile info
      if (data.user?.isNewUser && !name) {
        setStep('profile');
        return;
      }

      // Success — refresh user and close
      await refreshUser();
      closeAuthModal();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      if (!res.ok) {
        setError('Failed to save. Try again.');
        return;
      }

      await refreshUser();
      closeAuthModal();
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (!authModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAuthModal} />

      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
          {/* Close button */}
          <div className="flex justify-end p-4 pb-0">
            <button
              type="button"
              onClick={closeAuthModal}
              aria-label="Close"
              className="p-1.5 text-zinc-400 hover:text-zinc-900 transition"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 sm:px-8 pb-8">
            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight text-zinc-900">Welcome</h2>
                  <p className="text-sm text-zinc-500 mt-1">Sign in or create an account</p>
                </div>

                {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
                  What&apos;s your email?
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  required
                  className="w-full border-2 border-zinc-200 rounded-xl px-4 py-3 text-base outline-none focus:border-zinc-900 transition mb-4"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-900 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition disabled:opacity-50 text-sm tracking-wide"
                >
                  {loading ? 'Sending code...' : 'Continue'}
                </button>

                <p className="text-[11px] text-zinc-400 text-center mt-4 leading-relaxed">
                  We&apos;ll send a 6-digit code to your email. No passwords needed.
                </p>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight text-zinc-900">Check your email</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    We sent a code to <span className="font-semibold text-zinc-700">{email}</span>
                  </p>
                </div>

                {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

                <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyOtp} />

                {loading && (
                  <p className="text-sm text-zinc-400 text-center mt-4">Verifying...</p>
                )}

                <div className="flex items-center justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setError(''); }}
                    className="text-xs text-zinc-500 hover:text-zinc-900 transition"
                  >
                    Change email
                  </button>

                  {countdown > 0 ? (
                    <span className="text-xs text-zinc-400">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition"
                    >
                      Resend code
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Profile (new users) */}
            {step === 'profile' && (
              <form onSubmit={handleSaveProfile}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight text-zinc-900">Almost there</h2>
                  <p className="text-sm text-zinc-500 mt-1">Tell us a bit about yourself</p>
                </div>

                {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                  required
                  className="w-full border-2 border-zinc-200 rounded-xl px-4 py-3 text-base outline-none focus:border-zinc-900 transition mb-3"
                />

                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border-2 border-zinc-200 rounded-xl px-4 py-3 text-base outline-none focus:border-zinc-900 transition mb-4"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-zinc-900 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition disabled:opacity-50 text-sm tracking-wide"
                >
                  {loading ? 'Saving...' : 'Get Started'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
