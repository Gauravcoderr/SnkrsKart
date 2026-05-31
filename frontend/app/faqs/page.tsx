import { Metadata } from 'next';
import FAQsAccordion from './FAQsAccordion';
import { faqs as staticFaqs } from './faqs-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface FaqItem { q: string; a: string; }

interface SiteContent {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  faqItems?: FaqItem[];
}

async function getPageContent(): Promise<SiteContent | null> {
  try {
    const res = await fetch(`${API}/site-content/faq`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent();
  const title = content?.metaTitle || 'FAQs | SNKRS CART';
  const description = content?.metaDescription ||
    "Got questions? Find answers about authenticity, ordering, payment, shipping, returns, sizing, and more at SNKRS CART — India's trusted sneaker store.";
  const ogTitle = content?.ogTitle || title;
  const ogDescription = content?.ogDescription || description;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${SITE_URL}/faqs` },
    openGraph: { title: ogTitle, description: ogDescription, url: `${SITE_URL}/faqs`, siteName: 'SNKRS CART', type: 'website' },
    twitter: { card: 'summary', title: ogTitle, description: ogDescription },
  };
}

export default async function FAQs() {
  const content = await getPageContent();
  const faqItems = content?.faqItems && content.faqItems.length > 0 ? content.faqItems : staticFaqs;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };

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

        <FAQsAccordion items={faqItems} />

        <div className="mt-12 border-t border-zinc-100 pt-8 text-center">
          <p className="text-sm text-zinc-500 mb-1">Still have questions?</p>
          <a href="mailto:infosnkrscart@gmail.com" className="text-sm font-bold text-zinc-900 underline">infosnkrscart@gmail.com</a>
        </div>
      </main>
    </>
  );
}
