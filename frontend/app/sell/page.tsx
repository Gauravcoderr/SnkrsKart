'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const STORE_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '919410903791';
const STORE_EMAIL = process.env.NEXT_PUBLIC_STORE_EMAIL || 'infosnkrscart@gmail.com';

const PAIR_OPTIONS = ['1–5 pairs', '6–20 pairs', '21–50 pairs', '50+ pairs'];

export default function BecomeASellerPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', brandsSell: '', pairsCount: '', message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    if (!emailValid) { setError('Please enter a valid email address.'); return; }

    const phoneValid = /^[+\d][\d\s\-().]{7,}$/.test(form.phone.trim());
    if (!phoneValid) { setError('Please enter a valid phone number.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/seller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="max-w-2xl mb-14">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Partner With Us</p>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-4">Become a Seller</h1>
        <p className="text-base text-zinc-500 leading-relaxed">
          Got heat sitting in your collection? List your sneakers on SNKRS CART and reach serious buyers across India.
          We handle the platform — you just bring the kicks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">

        {/* Left — form */}
        <div>
          {submitted ? (
            <div className="border border-zinc-100 p-8 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900 mb-2">Application Received!</h2>
              <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                Thanks for reaching out. We'll get back to you within 24–48 hours to discuss next steps.
              </p>
              <Link
                href="/products"
                className="inline-block border border-zinc-900 px-6 py-2.5 text-xs font-bold tracking-widest uppercase text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                Browse Sneakers
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-2">Tell us about yourself</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Your name"
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">Brands you carry</label>
                <input
                  type="text"
                  value={form.brandsSell}
                  onChange={(e) => set('brandsSell', e.target.value)}
                  placeholder="e.g. Nike, Jordan, New Balance, Adidas"
                  className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">Pairs per month</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAIR_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set('pairsCount', opt)}
                      className={`py-2 text-xs font-semibold border transition-colors ${
                        form.pairsCount === opt
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500 mb-1.5">Anything else?</label>
                <textarea
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  placeholder="Tell us about your inventory, pricing expectations, or any questions..."
                  rows={4}
                  className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 disabled:bg-zinc-400 transition-colors"
              >
                {loading ? 'Sending...' : 'Submit Application'}
              </button>
            </form>
          )}
        </div>

        {/* Right — contact options + perks */}
        <div className="space-y-8">
          {/* Direct contact */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-4">Prefer to reach out directly?</p>
            <div className="space-y-3">
              <a
                href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent('Hi! I want to become a seller on SNKRS CART.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 border border-zinc-100 hover:border-zinc-300 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-[#25D366]/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 group-hover:text-zinc-700 transition-colors">WhatsApp Us</p>
                  <p className="text-xs text-zinc-400">Quick replies, usually within the hour</p>
                </div>
                <svg className="w-4 h-4 text-zinc-300 ml-auto group-hover:text-zinc-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>

              <a
                href={`mailto:${STORE_EMAIL}?subject=Seller%20Inquiry%20%E2%80%94%20SNKRS%20CART`}
                className="flex items-center gap-4 p-4 border border-zinc-100 hover:border-zinc-300 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 bg-zinc-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 group-hover:text-zinc-700 transition-colors">Email Us</p>
                  <p className="text-xs text-zinc-400">{STORE_EMAIL}</p>
                </div>
                <svg className="w-4 h-4 text-zinc-300 ml-auto group-hover:text-zinc-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Why sell with us */}
          <div className="border-t border-zinc-100 pt-8">
            <p className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-5">Why sell with SNKRS CART?</p>
            <div className="space-y-4">
              {[
                { icon: '🛡️', title: 'Verified Platform', desc: 'Your inventory listed on a trusted, growing sneaker platform in India.' },
                { icon: '📦', title: 'We Handle Logistics', desc: 'Focus on sourcing — we handle buyer communication and shipping.' },
                { icon: '💸', title: 'Fair Payouts', desc: 'Competitive consignment rates with fast settlements after each sale.' },
                { icon: '📈', title: 'Real Audience', desc: 'Reach serious sneaker buyers who actually want what you have.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="text-xl mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{item.title}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
