'use client';

import { useState, useRef, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface UrlMeta {
  title?: string;
  siteName?: string;
  favicon?: string;
  ogImage?: string;
}

interface DealVerifyModalProps {
  productId: string;
  productSlug: string;
  productName: string;
  onClose: () => void;
}

type Step = 'form' | 'otp' | 'submitting' | 'success' | 'done';

export default function DealVerifyModal({ productId, productSlug, productName, onClose }: DealVerifyModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [url, setUrl] = useState('');
  const [urlMeta, setUrlMeta] = useState<UrlMeta | null>(null);
  const [urlFetching, setUrlFetching] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUrlMeta = useCallback(async (rawUrl: string) => {
    if (!rawUrl) { setUrlMeta(null); return; }
    try {
      new URL(rawUrl);
    } catch {
      setUrlMeta(null); return;
    }
    setUrlFetching(true);
    try {
      const res = await fetch('/api/fetch-url-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
      });
      if (res.ok) setUrlMeta(await res.json());
    } catch {
      // silent — OG preview is best-effort
    } finally {
      setUrlFetching(false);
    }
  }, []);

  const handleUrlBlur = () => {
    if (url) fetchUrlMeta(url);
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted) setTimeout(() => fetchUrlMeta(pasted), 50);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError('Screenshot must be under 10MB'); return; }
    setScreenshotFile(f);
    setScreenshotPreview(URL.createObjectURL(f));
    setError('');
  };

  const startCooldown = () => {
    setOtpCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    setError('');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!url) { setError('Please enter the deal URL first'); return; }
    if (!screenshotFile) { setError('Please upload a screenshot first'); return; }

    setOtpSending(true);
    try {
      const res = await fetch(`${API}/deals/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send code'); return; }
      setStep('otp');
      startCooldown();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!otp.trim()) { setError('Please enter your verification code'); return; }

    setStep('submitting');
    try {
      // Upload screenshot first
      const formData = new FormData();
      formData.append('file', screenshotFile!);
      const uploadRes = await fetch('/api/deal-verify/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const d = await uploadRes.json();
        setError(d.error || 'Screenshot upload failed');
        setStep('otp');
        return;
      }
      const { url: screenshotUrl } = await uploadRes.json();

      // Submit deal
      const submitRes = await fetch(`${API}/deals/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: otp.trim(),
          productId,
          productSlug,
          productName,
          submittedUrl: url,
          urlMeta: urlMeta ?? {},
          screenshotUrl,
        }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        setError(submitData.error || 'Submission failed');
        setStep('otp');
        return;
      }
      setStep('success');
      setTimeout(() => setStep('done'), 1300);
    } catch {
      setError('Network error. Please try again.');
      setStep('otp');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Shared header (hidden on done/submitting for cleaner look) ── */}
        {step !== 'done' && step !== 'submitting' && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            {step === 'otp' ? (
              <button
                type="button"
                onClick={() => { setStep('form'); setOtp(''); setError(''); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            ) : (
              <div>
                <p className="text-sm font-black tracking-tight text-zinc-900">Found it cheaper?</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Submit proof — we'll verify it for you</p>
              </div>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Screen: FORM ── */}
        {step === 'form' && (
          <div className="px-5 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <p className="text-xs text-zinc-500">
              For: <span className="font-semibold text-zinc-700">{productName}</span>
            </p>

            {/* URL input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">Deal URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setUrlMeta(null); }}
                onBlur={handleUrlBlur}
                onPaste={handleUrlPaste}
                placeholder="https://www.flipkart.com/..."
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
              {urlFetching && (
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-3 h-3 border border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                  Fetching page info...
                </div>
              )}
              {urlMeta && !urlFetching && (
                <div className="mt-2 flex items-center gap-2.5 p-2.5 bg-zinc-50 border border-zinc-100 rounded-lg">
                  {urlMeta.favicon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urlMeta.favicon} alt="" className="w-4 h-4 rounded-sm shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-700 truncate">{urlMeta.siteName || 'Unknown site'}</p>
                    {urlMeta.title && <p className="text-[11px] text-zinc-400 truncate">{urlMeta.title}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Screenshot upload */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">Screenshot / Photo Proof</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {screenshotPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshotPreview} alt="Screenshot preview" className="w-full max-h-40 object-cover rounded-lg border border-zinc-200" />
                  <button
                    type="button"
                    onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-zinc-600 hover:text-red-500"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-zinc-200 rounded-lg py-6 flex flex-col items-center gap-2 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-xs font-medium">Upload screenshot (max 10MB)</span>
                </button>
              )}
            </div>

            {/* Email input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">Your Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="button"
              onClick={sendOtp}
              disabled={otpSending}
              className="w-full py-3.5 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors rounded disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {otpSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending Code...
                </>
              ) : 'Get Verification Code'}
            </button>

            <p className="text-[10px] text-zinc-400 text-center pb-1">
              Indian retail sites only. Verification within 24 hours.
            </p>
          </div>
        )}

        {/* ── Screen: OTP ── */}
        {step === 'otp' && (
          <div className="px-6 py-8 flex flex-col items-center text-center gap-5">
            {/* Icon */}
            <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>

            {/* Heading */}
            <div>
              <p className="text-base font-black text-zinc-900 mb-1">Check your email</p>
              <p className="text-sm text-zinc-500">
                We sent a 6-digit code to
              </p>
              <p className="text-sm font-semibold text-zinc-900 mt-0.5 break-all">{email}</p>
            </div>

            {/* OTP input */}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              className="w-full border-2 border-zinc-200 rounded-xl px-4 py-4 text-2xl text-center tracking-[0.5em] font-mono focus:outline-none focus:border-zinc-900 transition-colors"
            />

            {error && (
              <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg w-full">{error}</p>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3.5 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors rounded-lg"
            >
              Submit Deal for Verification
            </button>

            {/* Resend */}
            <button
              type="button"
              onClick={sendOtp}
              disabled={otpCooldown > 0 || otpSending}
              className="text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : otpSending ? 'Sending...' : 'Resend code'}
            </button>
          </div>
        )}

        {/* ── Screen: SUBMITTING ── */}
        {step === 'submitting' && (
          <div className="px-5 py-14 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-zinc-700">Submitting your deal...</p>
          </div>
        )}

        {/* ── Screen: SUCCESS (tick animation before done) ── */}
        {step === 'success' && (
          <div className="px-5 py-16 flex flex-col items-center gap-4">
            <div
              className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center"
              style={{ animation: 'scale-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
            >
              <svg
                className="w-10 h-10 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path
                  d="M5 13l4 4L19 7"
                  style={{
                    strokeDasharray: 40,
                    strokeDashoffset: 40,
                    animation: 'tick-draw 0.4s ease-out 0.25s forwards',
                  }}
                />
              </svg>
            </div>
            <p className="text-sm font-bold text-zinc-700">Deal submitted!</p>
          </div>
        )}

        {/* ── Screen: DONE ── */}
        {step === 'done' && (
          <div className="px-5 py-10 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-bold text-zinc-900 mb-1">Submitted!</p>
            <p className="text-sm text-zinc-500 mb-6">We'll review your deal and email you the verdict within 24 hours.</p>
            <button type="button" onClick={onClose} className="w-full py-3 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors rounded">
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
