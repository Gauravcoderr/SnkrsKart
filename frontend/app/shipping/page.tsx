import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface SiteContent {
  metaTitle?: string; metaDescription?: string;
  ogTitle?: string; ogDescription?: string; htmlContent?: string;
}

async function getPageContent(): Promise<SiteContent | null> {
  try {
    const res = await fetch(`${API}/site-content/shipping`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPageContent();
  const title = content?.metaTitle || 'Shipping Info | Free Pan-India Delivery | Snkrs Cart';
  const description = content?.metaDescription || 'SNKRS CART ships all orders free across India in 3–7 business days. Faster delivery in Uttarakhand. Track your order anytime.';
  const ogTitle = content?.ogTitle || 'Shipping Info | Snkrs Cart';
  const ogDescription = content?.ogDescription || 'Free pan-India shipping on all sneaker orders. 3–7 business days delivery.';
  return {
    title: { absolute: title }, description,
    alternates: { canonical: `${SITE_URL}/shipping` },
    openGraph: { title: ogTitle, description: ogDescription, url: `${SITE_URL}/shipping`, siteName: 'Snkrs Cart', type: 'website' },
    twitter: { card: 'summary', title: ogTitle, description: ogDescription },
  };
}

const shippingInfo = [
  { region: 'Pan-India (All States)', time: '3–7 Business Days', cost: 'Free on all orders', note: 'Delivery via Delhivery, DTDC, and other trusted courier partners' },
  { region: 'Uttarakhand (Local)', time: '1–3 Business Days', cost: 'Free', note: 'Faster delivery to Pauri Garhwal and nearby areas' },
];

export default async function ShippingInfo() {
  const content = await getPageContent();

  if (content?.htmlContent) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Shipping Info</h1>
        <div className="prose prose-zinc prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content.htmlContent }} />
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Help</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Shipping Info</h1>
      <p className="text-sm text-zinc-500 mb-10">We ship all orders across India with free delivery. Here&apos;s what to expect.</p>

      <div className="space-y-4 mb-10">
        {shippingInfo.map((s) => (
          <div key={s.region} className="border border-zinc-100 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 mb-1">{s.region}</h2>
                <p className="text-xs text-zinc-500">{s.note}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-zinc-900">{s.time}</p>
                <p className="text-xs text-emerald-600 font-semibold">{s.cost}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6 text-sm text-zinc-600 leading-relaxed">
        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">How Shipping Works</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Add your item to cart and complete checkout on snkrscart.com</li>
            <li>Your order is confirmed immediately upon successful payment</li>
            <li>We dispatch within 1–2 business days in secure tamper-proof packaging</li>
            <li>You receive a tracking number via email/WhatsApp once shipped</li>
          </ol>
        </section>
        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Important Notes</h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>We currently ship <strong>within India only</strong> — no international shipping</li>
            <li>All orders are shipped in secure, tamper-proof packaging</li>
            <li>Delivery times are estimates and may vary during peak seasons or remote areas</li>
            <li>We are not responsible for delays caused by courier partners or natural events</li>
            <li>Signature may be required upon delivery</li>
            <li>Shipping cost is always <strong>₹0</strong> — no hidden charges at checkout</li>
          </ul>
        </section>
        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Questions?</h2>
          <p>Contact us at <a href="mailto:infosnkrscart@gmail.com" className="text-zinc-900 underline">infosnkrscart@gmail.com</a> or WhatsApp us at <a href="tel:+919410903791" className="text-zinc-900 underline">+91 94109 03791</a>.</p>
        </section>
      </div>
    </main>
  );
}
