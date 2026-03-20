'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const STORE_WA = process.env.NEXT_PUBLIC_WHATSAPP || '919410903791';
const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'snkrscart@upi';

function ConfirmationContent() {
  const params = useSearchParams();
  const orderId = params.get('id') || '';
  const orderNumber = params.get('order') || '';
  const totalRaw = params.get('total') || '0';
  const total = parseInt(totalRaw, 10);

  const waText = encodeURIComponent(`Hi! I've paid for order ${orderNumber}. Here's my payment screenshot.`);
  const waUrl = `https://wa.me/${STORE_WA}?text=${waText}`;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* Success icon */}
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <p className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Order Placed</p>
      <h1 className="text-2xl font-black tracking-tight text-zinc-900 mb-1">You're almost done!</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Order <span className="font-bold text-zinc-900">{orderNumber}</span> has been received.
        Complete the UPI payment below to confirm your order.
      </p>

      {/* UPI payment box */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6 text-left">
        <p className="text-xs font-bold tracking-widest uppercase text-emerald-800 mb-4 text-center">Complete Your Payment</p>
        <div className="text-center mb-4">
          <p className="text-4xl font-black text-zinc-900">₹{total.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-emerald-100 rounded-lg p-4 text-center mb-4">
          <p className="text-xs text-zinc-500 mb-1">Pay to UPI ID</p>
          <p className="text-lg font-black text-zinc-900 tracking-wider">{UPI_ID}</p>
          <p className="text-xs text-zinc-400 mt-1">PhonePe · Google Pay · Paytm · any UPI app</p>
        </div>
        <ol className="text-xs text-emerald-800 space-y-2 list-none">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
            <span>Open PhonePe / Google Pay / Paytm on your phone</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
            <span>Pay <strong>₹{total.toLocaleString('en-IN')}</strong> to UPI ID: <strong>{UPI_ID}</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
            <span>Take a screenshot of the payment confirmation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
            <span>Send the screenshot on WhatsApp with your order number <strong>{orderNumber}</strong></span>
          </li>
        </ol>
      </div>

      {/* WhatsApp CTA */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-white font-bold text-sm tracking-wide rounded-lg hover:bg-[#20bf5b] transition-colors mb-4"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Send Payment Screenshot on WhatsApp
      </a>

      <p className="text-xs text-zinc-400 mb-8">
        We'll confirm your order within 1 hour of receiving payment.
        A confirmation email has been sent to your inbox.
      </p>

      <div className="flex gap-3">
        <Link
          href="/products"
          className="flex-1 py-3 border border-zinc-200 text-xs font-bold tracking-widest uppercase text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 transition-colors text-center"
        >
          Continue Shopping
        </Link>
        {orderId && (
          <Link
            href={`/account/orders`}
            className="flex-1 py-3 bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors text-center"
          >
            View Orders
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-zinc-400 text-sm">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
