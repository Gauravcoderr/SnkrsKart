'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth, authHeaders } from '@/context/AuthContext';
import OtpInput from './OtpInput';
import { useScrollLock } from '@/hooks/useScrollLock';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type Step = 'email' | 'otp' | 'success' | 'profile';
type LoginMode = 'email' | 'phone';

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, loginWithData } = useAuth();
  const pendingTokenRef = useRef<string>('');

  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Reset on close
  useEffect(() => {
    if (!authModalOpen) {
      setTimeout(() => {
        setLoginMode('email');
        setStep('email');
        setEmail('');
        setPhoneInput('');
        setOtp(Array(6).fill(''));
        setName('');
        setPhone('');
        setError('');
        setCountdown(0);
      }, 300);
    }
  }, [authModalOpen]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useScrollLock(authModalOpen);

  // ── Mutations ────────────────────────────────────────────────────────────

  const sendOtpMutation = useMutation({
    mutationFn: async (arg: { email?: string; loginPhone?: string }) => {
      const res = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(arg),
      });
      const data = await res.json();
      if (!res.ok) throw { ...data, status: res.status };
      return data;
    },
    onSuccess: () => {
      setStep('otp');
      setCountdown(60);
      setOtp(Array(6).fill(''));
      setError('');
    },
    onError: (err: any) => {
      setError(err.error || 'Failed to send code');
      if (err.retryAfter) setCountdown(err.retryAfter);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...(loginMode === 'phone' ? { loginPhone: phoneInput.trim() } : { email: email.trim() }),
          otp: code,
          ...(name ? { name } : {}),
          ...(phone ? { phone } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
    onSuccess: (data) => {
      if (data.user?.isNewUser && !name) {
        pendingTokenRef.current = data.accessToken;
        setStep('success');
        setTimeout(() => setStep('profile'), 1200);
        return;
      }
      setStep('success');
      setTimeout(() => {
        loginWithData(data.user, data.accessToken);
        closeAuthModal();
      }, 1200);
    },
    onError: (err: any) => {
      setError(err.error || 'Invalid code');
      setOtp(Array(6).fill(''));
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...authHeaders() as Record<string, string> };
      if (pendingTokenRef.current) headers['Authorization'] = `Bearer ${pendingTokenRef.current}`;
      const res = await fetch(`${API}/auth/me`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: (data) => {
      loginWithData({ ...data, id: data._id?.toString() || data.id }, pendingTokenRef.current || '');
      pendingTokenRef.current = '';
      closeAuthModal();
    },
    onError: () => {
      setError('Failed to save. Try again.');
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) { setError('Google sign-in failed'); return; }
    setError('');
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Google sign-in failed'); return; }
      if (data.user?.isNewUser) {
        pendingTokenRef.current = data.accessToken;
        setStep('profile');
        return;
      }
      loginWithData(data.user, data.accessToken);
      closeAuthModal();
    } catch {
      setError('Google sign-in failed. Please try again.');
    }
  }

  function handleSendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (loginMode === 'phone') {
      const digits = phoneInput.trim().replace(/[\s\-().+]/g, '');
      if (!/^(91)?[6-9]\d{9}$/.test(digits)) {
        setError('Enter a valid 10-digit Indian mobile number');
        return;
      }
      setError('');
      sendOtpMutation.mutate({ loginPhone: phoneInput.trim() });
    } else {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Enter a valid email address');
        return;
      }
      setError('');
      sendOtpMutation.mutate({ email });
    }
  }

  function switchMode(mode: LoginMode) {
    setLoginMode(mode);
    setEmail('');
    setPhoneInput('');
    setError('');
  }

  function handleVerifyOtp(code: string) {
    setError('');
    verifyOtpMutation.mutate(code);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (name.trim().length > 100) { setError('Name must be 100 characters or fewer'); return; }
    if (phone.trim()) {
      const digits = phone.trim().replace(/[\s\-().+]/g, '');
      if (!/^(91)?[6-9]\d{9}$/.test(digits)) {
        setError('Enter a valid 10-digit Indian mobile number');
        return;
      }
    }
    setError('');
    saveProfileMutation.mutate();
  }

  if (!authModalOpen) return null;

  const isLoading = sendOtpMutation.isPending || verifyOtpMutation.isPending || saveProfileMutation.isPending;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAuthModal} />

      <div className="absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex justify-end p-4 pb-0">
            <button type="button" onClick={closeAuthModal} aria-label="Close" className="p-1.5 text-zinc-400 hover:text-zinc-900 transition">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="px-6 sm:px-8 pb-8">
            {/* Step 1: Email or Phone */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight text-zinc-900">Welcome</h2>
                  <p className="text-sm text-zinc-500 mt-1">Sign in or create an account</p>
                </div>
                {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}

                {loginMode === 'email' && (
                  <>
                    <div className="flex justify-center mb-4">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google sign-in failed')}
                        width="368"
                        text="continue_with"
                        shape="pill"
                        theme="outline"
                        size="large"
                      />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-zinc-200" />
                      <span className="text-xs text-zinc-400 uppercase tracking-widest">or</span>
                      <div className="flex-1 h-px bg-zinc-200" />
                    </div>
                  </>
                )}

                {loginMode === 'email' ? (
                  <>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">What&apos;s your email?</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" autoFocus required
                      className="w-full border-2 border-zinc-200 rounded-xl px-4 py-3 text-base outline-none focus:border-zinc-900 transition mb-4"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Your mobile number</label>
                    <div className="flex gap-2 mb-4">
                      <span className="flex items-center px-3 border-2 border-zinc-200 rounded-xl text-sm text-zinc-500 font-medium bg-zinc-50 select-none">+91</span>
                      <input
                        type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="98765 43210" autoFocus required maxLength={10}
                        className="flex-1 border-2 border-zinc-200 rounded-xl px-4 py-3 text-base outline-none focus:border-zinc-900 transition"
                      />
                    </div>
                  </>
                )}

                <button type="submit" disabled={isLoading} className="w-full bg-zinc-900 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition disabled:opacity-50 text-sm tracking-wide">
                  {isLoading ? 'Sending code...' : 'Continue'}
                </button>

                <p className="text-center mt-4">
                  {loginMode === 'email' ? (
                    <button type="button" onClick={() => switchMode('phone')} className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition">
                      Login with mobile number instead
                    </button>
                  ) : (
                    <button type="button" onClick={() => switchMode('email')} className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition">
                      Login with email instead
                    </button>
                  )}
                </p>

                {loginMode === 'email' && (
                  <p className="text-[11px] text-zinc-400 text-center mt-2 leading-relaxed">
                    We&apos;ll send a 6-digit code to your email. No passwords needed.
                  </p>
                )}
                {loginMode === 'phone' && (
                  <p className="text-[11px] text-zinc-400 text-center mt-2 leading-relaxed">
                    We&apos;ll send a 6-digit code via WhatsApp or email. No passwords needed.
                  </p>
                )}
              </form>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight text-zinc-900">
                    {loginMode === 'phone' ? 'Check WhatsApp' : 'Check your email'}
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    We sent a code to{' '}
                    <span className="font-semibold text-zinc-700">
                      {loginMode === 'phone' ? `+91 ${phoneInput.trim()}` : email}
                    </span>
                  </p>
                </div>
                {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}
                <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyOtp} />
                {isLoading && <p className="text-sm text-zinc-400 text-center mt-4">Verifying...</p>}
                <div className="flex items-center justify-between mt-6">
                  <button type="button" onClick={() => { setStep('email'); setError(''); }} className="text-xs text-zinc-500 hover:text-zinc-900 transition">
                    {loginMode === 'phone' ? 'Change number' : 'Change email'}
                  </button>
                  {countdown > 0 ? (
                    <span className="text-xs text-zinc-400">Resend in {countdown}s</span>
                  ) : (
                    <button type="button" onClick={() => handleSendOtp()} className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition">Resend code</button>
                  )}
                </div>
              </div>
            )}

            {/* Step: Success tick */}
            {step === 'success' && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative w-20 h-20 mb-5">
                  <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
                    <circle
                      cx="40" cy="40" r="36"
                      stroke="#18181b" strokeWidth="4"
                      strokeDasharray="226" strokeDashoffset="226"
                      className="animate-[dash_0.5s_ease-out_forwards]"
                      style={{ animation: 'dash 0.5s ease-out forwards' }}
                    />
                    <polyline
                      points="24,42 35,53 56,30"
                      stroke="#18181b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="50" strokeDashoffset="50"
                      style={{ animation: 'dash 0.4s ease-out 0.4s forwards' }}
                    />
                  </svg>
                  <style>{`
                    @keyframes dash { to { stroke-dashoffset: 0; } }
                  `}</style>
                </div>
                <p className="text-lg font-black text-zinc-900 tracking-tight">Verified!</p>
                <p className="text-sm text-zinc-400 mt-1">You&apos;re all set</p>
              </div>
            )}

            {/* Step 3: Profile */}
            {step === 'profile' && (
              <form onSubmit={handleSaveProfile}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight text-zinc-900">Almost there</h2>
                  <p className="text-sm text-zinc-500 mt-1">Tell us a bit about yourself</p>
                </div>
                {error && <p className="text-sm text-red-500 text-center mb-4">{error}</p>}
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Your name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus required
                  className="w-full border-2 border-zinc-200 rounded-xl px-4 py-3 text-base outline-none focus:border-zinc-900 transition mb-3" />
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Phone number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210"
                  className="w-full border-2 border-zinc-200 rounded-xl px-4 py-3 text-base outline-none focus:border-zinc-900 transition mb-4" />
                <button type="submit" disabled={isLoading} className="w-full bg-zinc-900 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition disabled:opacity-50 text-sm tracking-wide">
                  {isLoading ? 'Saving...' : 'Get Started'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
