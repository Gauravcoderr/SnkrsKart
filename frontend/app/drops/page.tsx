import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchDrops } from '@/lib/api';
import { dateKey } from '@/lib/calendar';
import DropsClient from './DropsClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export const metadata: Metadata = {
  title: { absolute: 'Sneaker Release Dates India 2026 | Drop Calendar | Snkrs Cart' },
  description: 'Sneaker release calendar for India — every upcoming Nike, Jordan, Adidas, New Balance and Crocs drop by date, with retail prices and where to buy. Add releases to your calendar so you never miss one.',
  alternates: { canonical: `${SITE_URL}/drops` },
  openGraph: {
    title: 'Sneaker Release Dates India 2026 | Snkrs Cart',
    description: 'Upcoming sneaker drops by date — official release dates, prices, and where to cop in India.',
    url: `${SITE_URL}/drops`,
    siteName: 'Snkrs Cart',
    type: 'website',
  },
};

// Fully server-rendered on every request; filter state comes from the URL so
// /drops?brand=Nike&view=calendar renders complete HTML. Drop data itself is cached 5 min.
export const dynamic = 'force-dynamic';

interface Props {
  searchParams?: { brand?: string; q?: string; view?: string; range?: string };
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Where do these sneaker release dates come from?',
    a: 'Every date on this calendar comes from an official brand announcement — Nike SNKRS, Jordan Brand, adidas, New Balance or Crocs — or a verified Indian retailer listing. We do not list rumoured dates. If a brand moves a release, we update the calendar.',
  },
  {
    q: 'What time do sneakers drop in India?',
    a: 'Most Indian launches go live in the morning IST, but the exact time varies by brand and release. Nike SNKRS shows the launch time inside the app once the release is confirmed. Open the drop page here for the retailer, then check their app or site the evening before.',
  },
  {
    q: 'Can I buy these drops on SNKRS CART?',
    a: 'Drops marked “In Store” are stocked at SNKRS CART and link straight to the product page. For everything else, we point you to the official retailer so you can buy at retail price on release day.',
  },
  {
    q: 'How do I get reminded about a release?',
    a: 'Use the Calendar button on any drop to add it to Google Calendar, or download an .ics file for Apple Calendar and Outlook. The event includes a reminder the day before the drop.',
  },
  {
    q: 'Do sneakers release on the same day in India as the US?',
    a: 'Often, but not always. Some global releases reach India days or weeks later, and some never launch here officially. We list the India date wherever a brand has announced one, and note the global date otherwise.',
  },
];

export default async function DropsPage({ searchParams = {} }: Props) {
  let drops: Awaited<ReturnType<typeof fetchDrops>> = [];
  try { drops = await fetchDrops(30); } catch { /* empty state */ }

  const initial = {
    brand: typeof searchParams.brand === 'string' ? searchParams.brand : 'All',
    q: typeof searchParams.q === 'string' ? searchParams.q.slice(0, 80) : '',
    view: searchParams.view === 'calendar' ? 'calendar' as const : 'list' as const,
    range: typeof searchParams.range === 'string' && /^(all|week|\d{4}-\d{2}(-\d{2})?)$/.test(searchParams.range) ? searchParams.range : 'all',
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = drops
    .filter((d) => dateKey(d.releaseDate) >= today)
    .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
  const recent = drops
    .filter((d) => dateKey(d.releaseDate) < today)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  const brandCount = new Set(upcoming.map((d) => d.brand)).size;

  const itemListJson = upcoming.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Upcoming sneaker releases in India',
    url: `${SITE_URL}/drops`,
    numberOfItems: upcoming.length,
    itemListElement: upcoming.slice(0, 50).map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/drops/${d.slug}`,
      name: d.name,
      item: {
        '@type': 'Event',
        name: d.name,
        startDate: dateKey(d.releaseDate),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        location: { '@type': 'VirtualLocation', url: `${SITE_URL}/drops/${d.slug}` },
        url: `${SITE_URL}/drops/${d.slug}`,
        ...(d.image ? { image: d.image } : {}),
        organizer: { '@type': 'Organization', name: d.brand },
      },
    })),
  } : null;

  const faqJson = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Drop Calendar', item: `${SITE_URL}/drops` },
    ],
  };

  return (
    <>
      {itemListJson && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJson) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-[10px] text-zinc-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-zinc-900 font-semibold">Drop Calendar</span>
        </nav>

        <div className="mb-8">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">Sneaker Release Dates</h1>
            {upcoming.length > 0 && (
              <span className="text-xs font-bold text-zinc-400 tracking-widest uppercase">
                {upcoming.length} upcoming · {brandCount} brand{brandCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 max-w-2xl">
            Every confirmed sneaker drop in India, by date. Official release dates, retail prices and where to buy — from Nike SNKRS, Jordan, adidas, New Balance and Crocs. Add any release to your calendar in one tap.
          </p>
        </div>

        {drops.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-zinc-200">
            <p className="text-sm text-zinc-400">No upcoming drops added yet. Check back soon.</p>
          </div>
        ) : (
          <DropsClient upcoming={upcoming} recent={recent} initial={initial} />
        )}

        {/* ── SEO copy + FAQ ── */}
        <section className="mt-20 pt-12 border-t border-zinc-100 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16">
          <div>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-3">About this calendar</p>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 mb-4 leading-tight">How sneaker releases work in India</h2>
            <div className="space-y-3 text-sm text-zinc-600 leading-relaxed">
              <p>
                Limited sneakers in India release through a handful of channels: the Nike SNKRS app and nike.com/in for Nike and Jordan, adidas.co.in for adidas, newbalance.co.in and partner boutiques for New Balance, and crocs.in for collaborations. Most hyped pairs sell out within minutes, so knowing the date is half the battle.
              </p>
              <p>
                This calendar tracks every confirmed drop so you can plan ahead. Filter by brand, jump to a month, or switch to the calendar view to see the whole month at a glance. Each drop page lists the retail price, colorway and retailer, plus a live countdown.
              </p>
              <p>
                Missed a release? Recently released pairs stay on the calendar for 30 days, and anything marked <span className="font-semibold text-zinc-900">In Store</span> is available to buy right now at SNKRS CART with free pan-India shipping.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/products?sort=newest" className="inline-flex items-center px-5 py-2.5 bg-zinc-900 text-white text-[11px] font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors rounded-sm">
                Shop new arrivals
              </Link>
              <Link href="/sneakers" className="inline-flex items-center px-5 py-2.5 border border-zinc-200 text-zinc-700 text-[11px] font-bold tracking-widest uppercase hover:border-zinc-900 hover:text-zinc-900 transition-colors rounded-sm">
                Sneaker guide
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-3">FAQ</p>
            <div className="divide-y divide-zinc-100 border-y border-zinc-100">
              {FAQS.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex items-start justify-between gap-4 cursor-pointer list-none text-sm font-bold text-zinc-900 [&::-webkit-details-marker]:hidden">
                    <span>{f.q}</span>
                    <span className="shrink-0 mt-0.5 text-zinc-400 group-open:rotate-45 transition-transform duration-200" aria-hidden>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-zinc-500 leading-relaxed pr-8">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
