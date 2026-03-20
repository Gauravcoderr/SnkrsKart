'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

interface PurchaseModalProps {
  product: Product;
  selectedSize: number | null;
  currentPrice: number;
  onClose: () => void;
}

type Step = 'form' | 'success';

export default function PurchaseModal({ product, selectedSize, currentPrice, onClose }: PurchaseModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          productSlug: product.slug,
          productName: product.name,
          productBrand: product.brand,
          selectedSize,
          price: currentPrice,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setStep('success');
    } catch {
      setError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] focus:outline-none max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <div>
              <Dialog.Title asChild>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">
                  {step === 'form' ? 'Purchase Inquiry' : 'Request Received'}
                </p>
              </Dialog.Title>
              <Dialog.Description asChild>
                <p className="text-sm font-bold text-zinc-900 mt-0.5 leading-tight">
                  {product.brand} {product.name}
                </p>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {step === 'form' ? (
            <>
              {/* Product summary */}
              <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  {selectedSize ? `Size UK ${selectedSize}` : 'Size not selected'}
                </span>
                <span className="font-bold text-zinc-900">{formatPrice(currentPrice)}</span>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name"
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">Phone / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">Delivery Address *</label>
                  <textarea
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Full delivery address with pincode"
                    rows={3}
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors resize-none"
                  />
                </div>

                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 disabled:bg-zinc-400 transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
                <p className="text-[11px] text-zinc-400 text-center">
                  We'll contact you within 24 hours to complete your purchase.
                </p>
              </form>
            </>
          ) : (
            <div className="px-6 py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 mb-2">Thank You!</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-1">We've received your request for</p>
              <p className="text-sm font-bold text-zinc-900 mb-4">{product.brand} {product.name}</p>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                We will reach out to you shortly on your email & phone to complete the purchase.
              </p>
              <p className="text-xs text-zinc-400 mb-6">
                A confirmation has been sent to <strong>{form.email}</strong>
              </p>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="w-full py-3 border border-zinc-900 text-sm font-bold tracking-widest uppercase text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors"
                >
                  Continue Shopping
                </button>
              </Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
