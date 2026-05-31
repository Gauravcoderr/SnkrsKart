import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface SiteContent {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  htmlContent?: string;
}

async function getPageContent(): Promise<SiteContent | null> {
  try {
    const res = await fetch(`${API}/site-content/terms`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent();
  const title = content?.metaTitle || 'Terms of Service | SNKRS CART';
  const description = content?.metaDescription ||
    "Terms of Service for SNKRS CART — India's authentic sneaker store. Read about our inquiry-based purchase process, return policy, and product authenticity guarantee.";
  const ogTitle = content?.ogTitle || title;
  const ogDescription = content?.ogDescription || description;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${SITE_URL}/terms` },
    robots: { index: true, follow: true },
    openGraph: { title: ogTitle, description: ogDescription, url: `${SITE_URL}/terms`, siteName: 'SNKRS CART', type: 'website' },
    twitter: { card: 'summary', title: ogTitle, description: ogDescription },
  };
}

export default async function TermsOfService() {
  const content = await getPageContent();

  if (content?.htmlContent) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Legal</p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-8">Terms of Service</h1>
        <div
          className="prose prose-zinc prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content.htmlContent }}
        />
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Legal</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-8">Terms of Service</h1>

      <p className="text-sm text-zinc-500 mb-8">SNKRS CART is owned and operated by Ashutosh Lingwal, a sole proprietor.</p>

      <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Acceptance of Terms</h2>
          <p>By accessing and using SNKRS CART, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.</p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Purchase Process</h2>
          <p>SNKRS CART operates on an inquiry-based model. Submitting an inquiry does not constitute a confirmed purchase. Our team will contact you within 24 hours to confirm availability, pricing, and complete the transaction.</p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Product Authenticity</h2>
          <p>All products sold by SNKRS CART are 100% authentic. We source our inventory from authorised retailers and verified distributors. Every sneaker is inspected before dispatch.</p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Pricing</h2>
          <p>Prices displayed on the website are indicative and may vary based on size availability and market conditions. The final price will be confirmed by our team before completing your purchase.</p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Returns & Cancellations</h2>
          <p>Please review our <a href="/returns" className="text-zinc-900 underline">Returns & Exchanges</a> policy for full details on cancellations and returns.</p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Limitation of Liability</h2>
          <p>SNKRS CART shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products purchased through us.</p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Contact</h2>
          <p>Questions about these Terms? Reach us at <a href="mailto:infosnkrscart@gmail.com" className="text-zinc-900 underline">infosnkrscart@gmail.com</a>.</p>
        </section>

        <p className="text-xs text-zinc-400 pt-4 border-t border-zinc-100">Last updated: March 2025</p>
      </div>
    </main>
  );
}
