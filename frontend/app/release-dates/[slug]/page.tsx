import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Drop } from '@/types';
import { fetchDropsSince } from '@/lib/api';
import { formatDropDate, todayKey } from '@/lib/calendar';
import { dropItemListJsonLd } from '@/lib/dropJsonLd';
import { RELEASE_CALENDARS, calendarDrops, findCalendar } from '@/lib/releaseCalendars';
import { calendarSummary, retailPriceText } from '@/lib/releaseCalendarCopy';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ slug: string }> }

async function loadCalendar(slug: string) {
  const cal = findCalendar(slug);
  if (!cal) notFound();
  const today = todayKey();
  const year = Number(today.slice(0, 4));
  const drops = await fetchDropsSince(`${year}-01-01`);
  return { cal, year, ...calendarDrops(cal, drops, today) };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const { cal, year, upcoming, released } = await loadCalendar(slug);
  const url = `${SITE_URL}/release-dates/${cal.slug}`;
  const title = cal.title(year);
  const description = `${cal.label} release dates for ${year}: ${upcoming.length} upcoming and ${released.length} released, with colourways and retail prices where announced. Updated as brands confirm drops.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: { index: upcoming.length + released.length > 0, follow: true },
    openGraph: { title, description, url, siteName: 'Snkrs Cart', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

function DropTable({ drops, caption }: { drops: Drop[]; caption: string }) {
  const showCode = drops.some((d) => d.styleCode);
  return (
    <div className="overflow-x-auto border border-zinc-200 rounded-sm">
      <table className="w-full min-w-[640px] text-sm text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-zinc-50 text-[10px] font-bold tracking-widest uppercase text-zinc-500">
          <tr>
            <th scope="col" className="px-4 py-3">Release date</th>
            <th scope="col" className="px-4 py-3">Sneaker</th>
            <th scope="col" className="px-4 py-3">Colourway</th>
            {showCode && <th scope="col" className="px-4 py-3">Style code</th>}
            <th scope="col" className="px-4 py-3">Retail price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {drops.map((d) => (
            <tr key={d.slug}>
              <td className="px-4 py-3 whitespace-nowrap text-zinc-700">{formatDropDate(d.releaseDate, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              <td className="px-4 py-3 font-semibold text-zinc-900">
                <Link href={`/drops/${d.slug}`} className="hover:underline">{d.name}</Link>
              </td>
              <td className="px-4 py-3 text-zinc-600">{d.colorway || 'Not announced'}</td>
              {showCode && <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{d.styleCode || 'Not announced'}</td>}
              <td className="px-4 py-3 text-zinc-900 whitespace-nowrap">{retailPriceText(d)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ReleaseCalendarPage(props: Props) {
  const { slug } = await props.params;
  const { cal, year, upcoming, released } = await loadCalendar(slug);
  const url = `${SITE_URL}/release-dates/${cal.slug}`;
  const heading = `${cal.heading} ${year}`;
  const itemListJson = dropItemListJsonLd(upcoming, `Upcoming ${cal.label} releases`, url);
  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Drop Calendar', item: `${SITE_URL}/drops` },
      { '@type': 'ListItem', position: 3, name: heading, item: url },
    ],
  };
  const hasUsd = [...upcoming, ...released].some((d) => d.retailPrice && d.currency === 'USD');

  return (
    <>
      {itemListJson && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJson) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="text-[10px] text-zinc-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/drops" className="hover:text-zinc-900 transition-colors">Drop Calendar</Link>
          <span>/</span>
          <span className="text-zinc-900 font-semibold">{cal.label}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 mb-3">{heading}</h1>
        <p className="text-sm text-zinc-600 max-w-3xl leading-relaxed mb-10">{calendarSummary(cal, upcoming, released, year)}</p>

        <section className="mb-12">
          <h2 className="text-xl font-black tracking-tight text-zinc-900 mb-4">Upcoming {cal.label} releases</h2>
          {upcoming.length > 0
            ? <DropTable drops={upcoming} caption={`Upcoming ${cal.label} releases`} />
            : <p className="text-sm text-zinc-500">No upcoming release is confirmed yet.</p>}
        </section>

        {released.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-black tracking-tight text-zinc-900 mb-4">{cal.label} releases in {year} so far</h2>
            <DropTable drops={released} caption={`${cal.label} releases in ${year}`} />
          </section>
        )}

        <div className="text-xs text-zinc-500 max-w-3xl leading-relaxed space-y-2 mb-10">
          <p>Dates come from official brand announcements. Open any sneaker for the retailer, launch time and a calendar reminder.</p>
          {hasUsd && <p>Prices marked US retail are the announced US price, not an India price.</p>}
        </div>

        <nav aria-label="Other release calendars" className="flex flex-wrap items-center gap-2">
          <Link href="/drops" className="text-xs font-semibold text-zinc-700 border border-zinc-200 rounded-full px-3 py-1 hover:border-zinc-900 hover:text-zinc-900 transition-colors">All brands</Link>
          {RELEASE_CALENDARS.filter((c) => c.slug !== cal.slug).map((c) => (
            <Link key={c.slug} href={`/release-dates/${c.slug}`} className="text-xs font-semibold text-zinc-700 border border-zinc-200 rounded-full px-3 py-1 hover:border-zinc-900 hover:text-zinc-900 transition-colors">
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
