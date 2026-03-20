'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'Are all products 100% authentic?',
    a: 'Yes, absolutely. Every sneaker sold on SNKRS CART is 100% authentic and sourced from authorised retailers and verified distributors. We personally inspect each pair before dispatch.',
  },
  {
    q: 'How do I purchase a sneaker?',
    a: 'Click "Want to Purchase? — Enquire Now" on any product page, fill in your details, and submit. Our team will contact you within 24 hours to confirm availability and complete the purchase via WhatsApp or call.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept UPI, bank transfers, and cash on delivery for select locations. Payment details are shared during the order confirmation call/message.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Orders are typically delivered within 3–7 business days across India. Customers in Uttarakhand may receive their orders in 1–3 business days.',
  },
  {
    q: 'Do you ship across India?',
    a: 'Yes, we ship pan-India with free delivery on all orders.',
  },
  {
    q: 'Can I return or exchange my order?',
    a: 'Yes. We accept returns and exchanges within 7 days of delivery, provided the item is unworn and in original condition with all tags and packaging intact. See our Returns & Exchanges page for full details.',
  },
  {
    q: 'What sizes are listed in?',
    a: 'All sizes on SNKRS CART are listed in UK sizing. Visit our Size Guide page to convert to your local size (US, EU, CM).',
  },
  {
    q: 'How do I know if a size is available?',
    a: 'Available sizes are shown on each product page. Greyed-out sizes are currently unavailable. Contact us if you need a size not listed — we may be able to source it.',
  },
  {
    q: 'Where are you based?',
    a: 'SNKRS CART was founded in Pauri Garhwal, Uttarakhand in 2020. We ship across India from our base in the hills.',
  },
  {
    q: 'How can I contact you?',
    a: 'Email us at infosnkrscart@gmail.com or WhatsApp/call us at +91 94109 03791. We typically respond within a few hours.',
  },
];

export default function FAQs() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">FAQs</h1>
      <p className="text-sm text-zinc-500 mb-10">Everything you need to know about shopping at SNKRS CART.</p>

      <div className="divide-y divide-zinc-100 border-t border-zinc-100">
        {faqs.map((faq, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between py-4 text-left gap-4"
            >
              <span className="text-sm font-semibold text-zinc-900">{faq.q}</span>
              <span className="text-zinc-400 shrink-0 text-lg leading-none">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && (
              <p className="text-sm text-zinc-500 leading-relaxed pb-5">{faq.a}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-zinc-100 pt-8 text-center">
        <p className="text-sm text-zinc-500 mb-1">Still have questions?</p>
        <a href="mailto:infosnkrscart@gmail.com" className="text-sm font-bold text-zinc-900 underline">infosnkrscart@gmail.com</a>
      </div>
    </main>
  );
}
