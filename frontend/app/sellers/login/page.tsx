'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sellerApi, getSellerToken, setSellerToken } from '@/lib/sellerApi';
import { WHATSAPP_NUMBER, inputClass, labelClass, btnPrimary } from '@/components/seller/SellerShell';

const HELP_TEXT = encodeURIComponent('Hi SNKRS CART, I need help logging in to the seller portal.');

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getSellerToken()) router.replace('/sellers');
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, seller } = await sellerApi.login(email.trim(), password);
      setSellerToken(token);
      router.replace(seller.mustChangePassword ? '/sellers/settings?reset=1' : '/sellers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-2xl font-black tracking-tight text-zinc-900 leading-none">SNKRS CART</p>
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mt-2">Seller Portal</p>
        </div>

        <div className="bg-white border border-zinc-200 p-6 sm:p-8">
          <h1 className="text-lg font-black tracking-tight text-zinc-900 mb-1">Log in</h1>
          <p className="text-sm text-zinc-500 mb-6">Use the email and password SNKRS CART shared with you.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="seller-email" className={labelClass}>Email</label>
              <input
                id="seller-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="seller-password" className={labelClass}>Password</label>
              <div className="relative">
                <input
                  id="seller-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={`${inputClass} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 h-full px-3 text-[10px] font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-zinc-500">
            Want to sell with us?{' '}
            <Link href="/sell" className="font-bold text-zinc-900 underline underline-offset-4 hover:text-zinc-600">
              Apply here
            </Link>
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${HELP_TEXT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 min-h-[40px]"
          >
            <svg className="w-4 h-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Need help? WhatsApp us
          </a>
        </div>
      </div>
    </div>
  );
}
