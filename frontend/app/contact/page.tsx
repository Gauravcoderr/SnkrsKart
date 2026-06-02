import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export const metadata: Metadata = {
  title: { absolute: 'Contact Us | SNKRS CART' },
  description: 'Get in touch with SNKRS CART. Email, phone/WhatsApp, or visit us in Pauri Garhwal, Uttarakhand. Mon–Sat 10am–7pm IST.',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: 'Contact Us | SNKRS CART',
    description: 'Reach SNKRS CART by email or WhatsApp. We reply within a few hours on business days.',
    url: `${SITE_URL}/contact`,
    siteName: 'SNKRS CART',
    type: 'website',
  },
};

const contactPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact SNKRS CART',
  url: `${SITE_URL}/contact`,
  mainEntity: {
    '@type': 'LocalBusiness',
    name: 'SNKRS CART',
    url: SITE_URL,
    telephone: '+91-94109-03791',
    email: 'infosnkrscart@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Circuit House',
      addressLocality: 'Pauri Garhwal',
      addressRegion: 'Uttarakhand',
      postalCode: '246001',
      addressCountry: 'IN',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '10:00',
      closes: '19:00',
    },
  },
};

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }} />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Support</p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Contact Us</h1>
        <p className="text-sm text-zinc-500 mb-10">
          Questions about an order, a product, or anything else? We&apos;re here to help.
          Available Monday–Saturday, 10am–7pm IST.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <a
            href="mailto:infosnkrscart@gmail.com"
            className="group flex items-start gap-4 border border-zinc-200 p-6 hover:border-zinc-400 transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Email</p>
              <p className="text-sm font-semibold text-zinc-900">infosnkrscart@gmail.com</p>
              <p className="text-xs text-zinc-500 mt-1">We reply within a few hours on business days</p>
            </div>
          </a>

          <a
            href="tel:+919410903791"
            className="group flex items-start gap-4 border border-zinc-200 p-6 hover:border-zinc-400 transition-colors"
          >
            <svg className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900 transition-colors mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Phone / WhatsApp</p>
              <p className="text-sm font-semibold text-zinc-900">+91 94109 03791</p>
              <p className="text-xs text-zinc-500 mt-1">Mon–Sat, 10am–7pm IST</p>
            </div>
          </a>

          <div className="flex items-start gap-4 border border-zinc-200 p-6 sm:col-span-2">
            <svg className="w-5 h-5 text-zinc-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Address</p>
              <p className="text-sm font-semibold text-zinc-900">Circuit House, Pauri Garhwal – 246001, Uttarakhand, India</p>
              <p className="text-xs text-zinc-500 mt-1">Shipping across India · Orders dispatched within 1–2 business days</p>
            </div>
          </div>
        </div>

        <div className="border border-zinc-100 p-6 space-y-2 text-sm text-zinc-600">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-3">Business Details</p>
          <p><span className="font-semibold text-zinc-900">Business Name:</span> SNKRS CART</p>
          <p><span className="font-semibold text-zinc-900">Operated By:</span> Ashutosh Lingwal (Sole Proprietor)</p>
          <p><span className="font-semibold text-zinc-900">Registration:</span> Sole Proprietorship — operating below GST threshold (not GST registered)</p>
          <p><span className="font-semibold text-zinc-900">Return Address:</span> Circuit House, Pauri Garhwal – 246001, Uttarakhand, India</p>
        </div>

        <div className="mt-8 text-sm text-zinc-500 space-y-1">
          <p>For order tracking, visit <a href="/track-order" className="text-zinc-900 underline">Track My Order</a>.</p>
          <p>For returns and refunds, see our <a href="/returns" className="text-zinc-900 underline">Return Policy</a>.</p>
          <p>For shipping queries, see <a href="/shipping" className="text-zinc-900 underline">Shipping Info</a>.</p>
        </div>
      </main>
    </>
  );
}
