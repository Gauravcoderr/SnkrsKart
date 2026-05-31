'use client';

import { useState } from 'react';
import { faqs as staticFaqs } from './faqs-data';

interface FaqItem { q: string; a: string; }

export default function FAQsAccordion({ items }: { items?: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = items && items.length > 0 ? items : staticFaqs;

  return (
    <div className="divide-y divide-zinc-100 border-t border-zinc-100">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            type="button"
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
  );
}
