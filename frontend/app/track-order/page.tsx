import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface SiteContent {
  metaTitle?: string; metaDescription?: string;
  ogTitle?: string; ogDescription?: string; htmlContent?: string;
}

async function getPageContent(): Promise<SiteContent | null> {
  try {
    const res = await fetch(`${API}/site-content/track-order`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent();
  const title = content?.metaTitle || 'Track My Order | Snkrs Cart';
  const description = content?.metaDescription || 'Track your SNKRS CART sneaker order. Get real-time updates on your delivery status via WhatsApp and email. Typical delivery: 3–7 business days across India.';
  const ogTitle = content?.ogTitle || title;
  const ogDescription = content?.ogDescription || description;
  return {
    title: { absolute: title }, description,
    alternates: { canonical: `${SITE_URL}/track-order` },
    robots: { index: true, follow: true },
    openGraph: { title: ogTitle, description: ogDescription, url: `${SITE_URL}/track-order`, siteName: 'Snkrs Cart', type: 'website' },
    twitter: { card: 'summary', title: ogTitle, description: ogDescription },
  };
}

export default async function TrackOrder() {
  const content = await getPageContent();

  if (content?.htmlContent) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Track My Order</h1>
        <div className="prose prose-zinc prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.htmlContent }} />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Track My Order</h1>
      <p className="text-sm text-zinc-500 mb-10">Once your order is shipped, you&apos;ll receive a tracking number via WhatsApp and email.</p>

      <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
        <div className="border border-zinc-100 p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">How to Track Your Order</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>After dispatch, we&apos;ll send your tracking number via WhatsApp/email</li>
            <li>Use the tracking number on the courier partner&apos;s website to check status</li>
            <li>Typical delivery: 3–7 business days after dispatch</li>
          </ol>
        </div>

        <div className="bg-zinc-50 border border-zinc-100 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 mb-3">Haven&apos;t received your tracking number?</h2>
          <p className="mb-4">If it&apos;s been more than 24 hours since your order was confirmed and you haven&apos;t received a tracking update, reach out to us directly:</p>
          <div className="flex flex-col gap-2">
            <a href="mailto:infosnkrscart@gmail.com" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 underline">
              infosnkrscart@gmail.com
            </a>
            <a href="tel:+919410903791" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 underline">
              +91 94109 03791 (WhatsApp / Call)
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
