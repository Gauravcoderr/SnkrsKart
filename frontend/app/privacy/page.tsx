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
    const res = await fetch(`${API}/site-content/privacy`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent();
  const title = content?.metaTitle || 'Privacy Policy | Snkrs Cart';
  const description = content?.metaDescription ||
    'Read the SNKRS CART privacy policy. We collect only what is needed to process your order and never sell your personal information to third parties.';
  const ogTitle = content?.ogTitle || title;
  const ogDescription = content?.ogDescription || description;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${SITE_URL}/privacy` },
    robots: { index: true, follow: true },
    openGraph: { title: ogTitle, description: ogDescription, url: `${SITE_URL}/privacy`, siteName: 'Snkrs Cart', type: 'website' },
    twitter: { card: 'summary', title: ogTitle, description: ogDescription },
  };
}

export default async function PrivacyPolicy() {
  const content = await getPageContent();

  if (content?.htmlContent) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Legal</p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-8">Privacy Policy</h1>
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
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-8">Privacy Policy</h1>

      <p className="text-sm text-zinc-500 mb-8">This policy is maintained by SNKRS CART, operated by Ashutosh Lingwal (sole proprietor), as the data controller.</p>

      <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Information We Collect</h2>
          <p>When you create an account, place an order, or interact with SNKRS CART, we may collect your name, email address, phone number, delivery address, and payment details. We also collect browsing data (pages visited, items viewed) to improve your experience. We use this information solely to process your orders and provide customer support.</p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>To process orders, payments, and arrange delivery</li>
            <li>To send order confirmation, shipping updates, and support communication</li>
            <li>To maintain your account and order history</li>
            <li>To improve our website, products, and services</li>
            <li>We do not sell, trade, or rent your personal information to third parties</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information. Your data is stored securely and accessed only by authorised personnel.</p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Cookies</h2>
          <p>Our website may use cookies to enhance your browsing experience. These are used to remember your preferences and understand how visitors use our site. You can disable cookies through your browser settings.</p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:infosnkrscart@gmail.com" className="text-zinc-900 underline">infosnkrscart@gmail.com</a> or call <a href="tel:+919410903791" className="text-zinc-900 underline">+91 94109 03791</a>.</p>
        </section>

        <p className="text-xs text-zinc-400 pt-4 border-t border-zinc-100">Last updated: May 2026</p>
      </div>
    </main>
  );
}
