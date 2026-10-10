import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export const metadata: Metadata = {
  title: { absolute: 'Data Deletion | Snkrs Cart' },
  description: 'How to ask SNKRS CART to delete your personal data, and what our Instagram publishing app stores.',
  alternates: { canonical: `${SITE_URL}/data-deletion` },
  robots: { index: true, follow: true },
};

export default function DataDeletion() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">Legal</p>
      <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-8">Data Deletion</h1>

      <p className="text-sm text-zinc-500 mb-8">SNKRS CART is operated by Ashutosh Lingwal (sole proprietor), who is responsible for the data described here.</p>

      <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Ask us to delete your data</h2>
          <p>
            Email <a href="mailto:info@snkrscart.com?subject=Data%20deletion%20request" className="text-zinc-900 underline">info@snkrscart.com</a> with
            the subject &quot;Data deletion request&quot;, from the email address or phone number you used with us. Tell us what you want deleted
            (your account, order details, newsletter subscription, chat messages or reviews). We may ask you to confirm the request
            before we act on it, and we will confirm by email once it is done.
          </p>
          <p className="mt-2">
            Some records have to be kept by law even after a deletion request, for example invoices and payment records needed for
            tax. We keep only those, and only for as long as the law requires.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">Our Instagram publishing app</h2>
          <p>
            SNKRS CART uses Meta&apos;s Instagram API only to publish posts to our own Instagram account, @snkrs_cart. The app does not
            log anyone in and does not collect information about other Instagram users. It stores only our own account&apos;s access
            token (encrypted) and the IDs and links of the posts we publish.
          </p>
          <p className="mt-2">
            If you have interacted with @snkrs_cart on Instagram and want a comment or message removed, write to the same email
            address and we will remove it where Instagram lets us.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold uppercase tracking-wider text-zinc-900 mb-3">More</h2>
          <p>
            Our <a href="/privacy" className="text-zinc-900 underline">Privacy Policy</a> explains what we collect and why. Questions:
            {' '}<a href="mailto:info@snkrscart.com" className="text-zinc-900 underline">info@snkrscart.com</a> or{' '}
            <a href="tel:+919410903791" className="text-zinc-900 underline">+91 94109 03791</a>.
          </p>
        </section>

        <p className="text-xs text-zinc-400 pt-4 border-t border-zinc-100">Last updated: October 2026</p>
      </div>
    </main>
  );
}
