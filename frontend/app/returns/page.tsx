import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface SiteContent {
  metaTitle?: string; metaDescription?: string;
  ogTitle?: string; ogDescription?: string; htmlContent?: string;
}

async function getPageContent(): Promise<SiteContent | null> {
  try {
    const res = await fetch(`${API}/site-content/returns`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent();
  const title = content?.metaTitle || 'Return & Refund Policy | Snkrs Cart';
  const description = content?.metaDescription || 'SNKRS CART return policy — damaged or incorrect items eligible for replacement or full refund within 48 hours of delivery.';
  const ogTitle = content?.ogTitle || title;
  const ogDescription = content?.ogDescription || description;
  return {
    title: { absolute: title }, description,
    alternates: { canonical: `${SITE_URL}/returns` },
    openGraph: { title: ogTitle, description: ogDescription, url: `${SITE_URL}/returns`, siteName: 'Snkrs Cart', type: 'website' },
  };
}

const returnPolicySchema = {
  '@context': 'https://schema.org',
  '@type': 'MerchantReturnPolicy',
  name: 'SNKRS CART Return & Refund Policy',
  url: `${SITE_URL}/returns`,
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 2,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/FreeReturn',
  refundType: 'https://schema.org/FullRefund',
  applicableCountry: 'IN',
};


export default async function Returns() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(returnPolicySchema) }} />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Return & Refund Policy</h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated: May 2026 · Applies to all orders on snkrscart.com</p>

        <div className="bg-zinc-900 text-white p-6 mb-10">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-2">100% Authentic — Our Promise</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Every sneaker at SNKRS CART is personally verified for authenticity before dispatch. We photograph the exact pair you will receive and share it with you before confirming your order.
          </p>
        </div>

        <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">

          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Return Window</h2>
            <p className="mb-2">Return requests must be raised within <strong className="text-zinc-900">48 hours of delivery</strong>. After 48 hours, we are unable to accept return requests.</p>
            <p className="text-xs text-zinc-500">To raise a request: WhatsApp or email us with your order details and clear photos of the issue within 48 hours of receiving the item.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Eligibility for Returns & Refunds</h2>
            <p className="mb-3">We accept return requests in the following situations:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-zinc-900">Wrong item received</strong> — item differs from what was confirmed before purchase</li>
              <li><strong className="text-zinc-900">Item arrived damaged</strong> — visible damage caused during shipping</li>
              <li><strong className="text-zinc-900">Authenticity concern</strong> — if you have any doubt about authenticity (all items are verified, but we will resolve any concern)</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">Item must be unused, unworn, and in original condition with all tags and packaging intact to be eligible for return.</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Non-Eligible Returns</h2>
            <p className="mb-2">The following are not eligible for return:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Change of mind after purchase</li>
              <li>Incorrect size selected by the customer (please confirm your size before purchasing)</li>
              <li>Items that have been worn, used, or had their tags removed</li>
              <li>Requests raised after 48 hours of delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Refund Process</h2>
            <p>Once your return request is approved:</p>
            <ol className="list-decimal list-inside space-y-2 mt-2">
              <li>We arrange <strong className="text-zinc-900">free return pickup</strong> from your delivery address — no return shipping cost to you</li>
              <li>Item is inspected within 2 business days of receipt</li>
              <li>Full refund processed within <strong className="text-zinc-900">5–7 business days</strong> via the original payment method</li>
            </ol>
            <p className="mt-3 text-xs text-zinc-500">Return address: House No. 4, Lingwal Bhawan, Circuit House Road, Pauri Garhwal – 246001, Uttarakhand, India</p>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Before You Purchase</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>We share real photos of the actual pair before finalising your order</li>
              <li>Confirm your size carefully using our <a href="/size-guide" className="underline text-zinc-900">size guide</a></li>
              <li>Ask us any questions — we are available on WhatsApp and email</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Contact Us</h2>
            <p className="mb-3">To raise a return request or for any query, contact us within 48 hours of delivery:</p>
            <div className="space-y-2">
              <a href="mailto:infosnkrscart@gmail.com" className="block text-zinc-900 font-semibold underline">infosnkrscart@gmail.com</a>
              <a href="tel:+919410903791" className="block text-zinc-900 font-semibold underline">+91 94109 03791 (WhatsApp / Call)</a>
              <p className="text-xs text-zinc-500 mt-1">Available Mon–Sat, 10am–7pm IST</p>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
