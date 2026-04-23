import FAQsAccordion from './FAQsAccordion';
import { faqs } from './faqs-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';

export const metadata = {
  title: 'FAQs | SNKRS CART',
  description: 'Got questions? Find answers about authenticity, ordering, payment, shipping, returns, sizing, and more at SNKRS CART — India\'s trusted sneaker store.',
  alternates: { canonical: `${SITE_URL}/faqs` },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a,
    },
  })),
};

export default function FAQs() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">FAQs</h1>
        <p className="text-sm text-zinc-500 mb-10">Everything you need to know about shopping at SNKRS CART.</p>

        <FAQsAccordion />

        <div className="mt-12 border-t border-zinc-100 pt-8 text-center">
          <p className="text-sm text-zinc-500 mb-1">Still have questions?</p>
          <a href="mailto:infosnkrscart@gmail.com" className="text-sm font-bold text-zinc-900 underline">infosnkrscart@gmail.com</a>
        </div>
      </main>
    </>
  );
}
