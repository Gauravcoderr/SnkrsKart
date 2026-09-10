import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchDrops, fetchDropBySlug } from '@/lib/api';
import { cloudinaryOgImage, formatDropPrice } from '@/lib/utils';
import { dateKey, daysUntil, formatDropDate } from '@/lib/calendar';
import Countdown from '@/components/drops/Countdown';
import AddToCalendar from '@/components/drops/AddToCalendar';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const drop = await fetchDropBySlug(params.slug);
    const url = `${SITE_URL}/drops/${params.slug}`;
    const releaseDate = formatDropDate(drop.releaseDate, { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      title: { absolute: `${drop.name} Release Date India | ${releaseDate} | Snkrs Cart` },
      description: `${drop.name} releases in India on ${releaseDate}${drop.retailPrice ? ` for ${formatDropPrice(drop.retailPrice, drop.currency)}` : ''}. ${drop.description || `Official ${drop.brand} drop — ${drop.where || 'check official channels'}.`}`,
      alternates: { canonical: url },
      openGraph: {
        title: `${drop.name} | Release ${releaseDate}`,
        description: `${drop.brand} drop releasing ${releaseDate}${drop.retailPrice ? ` — ${formatDropPrice(drop.retailPrice, drop.currency)}` : ''}.`,
        url,
        siteName: 'Snkrs Cart',
        type: 'website',
        ...(drop.image ? { images: [{ url: cloudinaryOgImage(drop.image), width: 1200, height: 630, alt: drop.name }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${drop.name} | Release ${releaseDate}`,
        description: `${drop.brand} drop releasing ${releaseDate}${drop.retailPrice ? ` — ${formatDropPrice(drop.retailPrice, drop.currency)}` : ''}.`,
        ...(drop.image ? { images: [cloudinaryOgImage(drop.image)] } : {}),
      },
    };
  } catch {
    return { title: { absolute: 'Drop | Snkrs Cart' } };
  }
}

export async function generateStaticParams() {
  try {
    const drops = await fetchDrops();
    return drops.map((d) => ({ slug: d.slug }));
  } catch { return []; }
}

export const revalidate = 300;

function formatDate(dateStr: string) {
  return formatDropDate(dateStr, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// Retailer-specific "how to buy" steps, derived from the free-text `where` field
function copSteps(where: string): { title: string; steps: string[] } {
  const w = where.toLowerCase();
  if (w.includes('snkrs') || w.includes('nike') || w.includes('jordan')) {
    return {
      title: 'How to buy on Nike SNKRS',
      steps: [
        'Download the Nike SNKRS app and sign in with your Nike Member account.',
        'Save your shipping address and payment method in advance so checkout is one tap.',
        'The launch time appears in the app the day before. Set a notification on the product.',
        'At launch, enter the draw or tap Buy the moment it goes live. Check nike.com/in as a backup.',
      ],
    };
  }
  if (w.includes('adidas') || w.includes('confirmed')) {
    return {
      title: 'How to buy on adidas.co.in',
      steps: [
        'Create or sign in to your adidas India account before release day.',
        'Save shipping and payment details so you can check out fast.',
        'Refresh the product page at launch, select your size and check out immediately.',
        'Follow adidas India on Instagram for raffle or in-store announcements.',
      ],
    };
  }
  if (w.includes('new balance')) {
    return {
      title: 'How to buy New Balance in India',
      steps: [
        'Sign in to newbalance.co.in and save your details ahead of time.',
        'Limited pairs also release at partner boutiques. Check their Instagram for raffles.',
        'Be online a few minutes before launch and check out as soon as your size appears.',
      ],
    };
  }
  return {
    title: 'How to buy this release',
    steps: [
      `Follow ${where || 'the retailer'} for the exact launch time and any raffle details.`,
      'Create an account and save payment and shipping details in advance.',
      'Be online a few minutes before launch and check out fast. Sizes go quickly.',
    ],
  };
}

export default async function DropPage({ params }: Props) {
  let drop;
  try { drop = await fetchDropBySlug(params.slug); }
  catch { notFound(); }

  const url = `${SITE_URL}/drops/${params.slug}`;
  const days = daysUntil(drop.releaseDate);
  const released = days < 0;

  // Related: other upcoming drops, same brand first
  let related: Awaited<ReturnType<typeof fetchDrops>> = [];
  try {
    const all = (await fetchDrops()).filter((d) => d.slug !== drop.slug && daysUntil(d.releaseDate) >= 0);
    const same = all.filter((d) => d.brand === drop.brand);
    const other = all.filter((d) => d.brand !== drop.brand);
    related = [...same, ...other].slice(0, 4);
  } catch { /* skip */ }

  const howTo = drop.availableAtStore && drop.productSlug ? null : copSteps(drop.where);

  const urgency = !released && days === 0 ? 'today'
    : !released && days === 1 ? 'tomorrow'
    : !released && days <= 7 ? 'soon'
    : released ? 'released'
    : 'upcoming';

  const urgencyConfig = {
    today:    { bar: 'bg-red-500',   text: 'text-red-600',   label: 'Dropping Today' },
    tomorrow: { bar: 'bg-orange-500', text: 'text-orange-600', label: 'Dropping Tomorrow' },
    soon:     { bar: 'bg-amber-400', text: 'text-amber-700', label: `${days} days to drop` },
    upcoming: { bar: 'bg-zinc-200',  text: 'text-zinc-600',  label: `Releasing in ${days} days` },
    released: { bar: 'bg-zinc-100',  text: 'text-zinc-500',  label: `Released — ${formatDate(drop.releaseDate)}` },
  }[urgency];

  // ISO date-only string (YYYY-MM-DD) — required format for Google Event rich results
  const isoDate = dateKey(drop.releaseDate);

  const locationUrl = drop.where?.toLowerCase()?.includes('snkrs') || drop.where?.toLowerCase()?.includes('jordan')
    ? 'https://www.nike.com/launch'
    : drop.where?.toLowerCase()?.includes('adidas') ? 'https://www.adidas.co.in'
    : url;

  const eventJson = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: drop.name,
    startDate: isoDate,
    endDate: isoDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: locationUrl,
    },
    description: drop.description || `${drop.name} — official ${drop.brand} release`,
    url,
    image: drop.image || undefined,
    organizer: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL },
    offers: drop.retailPrice ? {
      '@type': 'Offer',
      price: drop.retailPrice,
      priceCurrency: drop.currency,
      availability: released ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      validFrom: isoDate,
      url: drop.availableAtStore && drop.productSlug ? `${SITE_URL}/products/${drop.productSlug}` : locationUrl,
      seller: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL },
    } : undefined,
  };

  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Drop Calendar', item: `${SITE_URL}/drops` },
      { '@type': 'ListItem', position: 3, name: drop.name, item: url },
    ],
  };

  const specs = [
    ['Brand', drop.brand],
    ['Release Date', formatDate(drop.releaseDate)],
    ['Retail Price', drop.retailPrice ? formatDropPrice(drop.retailPrice, drop.currency) : 'TBC'],
    ['Colorway', drop.colorway || null],
    ['Where to Buy', drop.where || null],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJson) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-[10px] text-zinc-400 mb-8 flex items-center gap-1.5">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/drops" className="hover:text-zinc-900 transition-colors">Drop Calendar</Link>
          <span>/</span>
          <span className="text-zinc-900 font-semibold truncate max-w-[200px]">{drop.name}</span>
        </nav>

        {/* Urgency bar */}
        <div className={`h-1 w-full mb-8 rounded-full ${urgencyConfig.bar}`} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          {/* ── Image ── */}
          <div className="relative aspect-square bg-zinc-50 border border-zinc-100 overflow-hidden rounded-sm">
            {drop.image ? (
              <Image
                src={drop.image}
                alt={drop.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-zinc-300 text-xs font-bold tracking-widest uppercase">{drop.brand}</p>
              </div>
            )}

            {/* Countdown overlay */}
            {!released && (
              <div className="absolute top-3 right-3">
                <div className={`px-3 py-1.5 rounded-sm font-black text-[11px] tracking-widest uppercase shadow-lg ${
                  urgency === 'today' ? 'bg-red-500 text-white' :
                  urgency === 'tomorrow' ? 'bg-orange-500 text-white' :
                  urgency === 'soon' ? 'bg-amber-400 text-zinc-900' :
                  'bg-zinc-900/80 backdrop-blur text-white'
                }`}>
                  {urgency === 'today' ? 'TODAY' : urgency === 'tomorrow' ? 'TOMORROW' : `${days}D`}
                </div>
              </div>
            )}

            {drop.availableAtStore && (
              <div className="absolute top-3 left-3 bg-zinc-900 text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-sm">
                In Store
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div className="flex flex-col">
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-400 mb-1">{drop.brand}</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 mb-1 leading-tight">{drop.name}</h1>
            {drop.colorway && <p className="text-sm text-zinc-400 mb-5">{drop.colorway}</p>}

            {/* Status pill + live countdown */}
            <div className="inline-flex items-center gap-2 mb-3">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${urgencyConfig.bar}`} />
              <p className={`text-xs font-bold ${urgencyConfig.text}`}>{urgencyConfig.label}</p>
            </div>
            {!released && (
              <div className="mb-6 text-zinc-900">
                <Countdown releaseDate={drop.releaseDate} size="lg" />
              </div>
            )}

            {/* Price + Date prominent */}
            {drop.retailPrice && (
              <div className="mb-5 p-4 bg-zinc-950 text-white flex items-center justify-between rounded-sm">
                <div>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Retail Price</p>
                  <p className="text-2xl font-black">{formatDropPrice(drop.retailPrice, drop.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Release</p>
                  <p className="text-sm font-bold text-zinc-200">{formatDropDate(drop.releaseDate, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            )}

            {/* Specs table */}
            <div className="grid grid-cols-1 gap-2 mb-5">
              {specs.map(([label, value]) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-zinc-100 last:border-0">
                  <p className="text-[9px] font-black tracking-widest uppercase text-zinc-400 w-24 shrink-0 mt-0.5">{label}</p>
                  <p className="text-sm font-semibold text-zinc-800 leading-snug">{value}</p>
                </div>
              ))}
            </div>

            {drop.description && (
              <p className="text-sm text-zinc-500 leading-relaxed mb-5 flex-1">{drop.description}</p>
            )}

            {/* CTA */}
            <div className="space-y-3">
              {drop.availableAtStore && drop.productSlug ? (
                <Link
                  href={`/products/${drop.productSlug}`}
                  className="block w-full py-4 bg-zinc-900 text-white text-sm font-black tracking-widest uppercase text-center hover:bg-zinc-700 transition-colors rounded-sm"
                >
                  Shop Now at SNKRS CART
                </Link>
              ) : (
                <div className="border border-zinc-100 rounded-sm p-4 text-center bg-zinc-50">
                  <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mb-1">Where to Buy</p>
                  <p className="text-sm font-bold text-zinc-700">{drop.where || 'Official brand site'}</p>
                </div>
              )}
              {!released && <AddToCalendar drop={drop} variant="button" />}
            </div>
          </div>
        </div>

        {/* How to cop */}
        {howTo && !released && (
          <section className="mb-10 border border-zinc-100 rounded-sm p-5 sm:p-6 bg-zinc-50/60">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Game plan</p>
            <h2 className="text-lg font-black tracking-tight text-zinc-900 mb-4">{howTo.title}</h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {howTo.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-600 leading-relaxed">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-900 text-white text-[10px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Related drops */}
        {related.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black tracking-[0.3em] uppercase text-zinc-900">More upcoming drops</h2>
              <Link href="/drops" className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 hover:text-zinc-900 transition-colors">Full calendar →</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map((r) => {
                const rd = daysUntil(r.releaseDate);
                return (
                  <Link key={r._id} href={`/drops/${r.slug}`} className="group border border-zinc-100 hover:border-zinc-300 hover:shadow-md transition-all overflow-hidden bg-white">
                    <div className="relative aspect-[4/3] bg-zinc-50 overflow-hidden">
                      {r.image && <Image src={r.image} alt={r.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 1024px) 50vw, 25vw" />}
                      <span className={`absolute top-2 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-sm ${rd === 0 ? 'bg-red-500 text-white' : rd === 1 ? 'bg-orange-500 text-white' : rd <= 7 ? 'bg-amber-400 text-zinc-900' : 'bg-zinc-900/70 text-white'}`}>
                        {rd === 0 ? 'Today' : rd === 1 ? 'Tomorrow' : `${rd}D`}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-[9px] font-black tracking-[0.2em] uppercase text-zinc-400 mb-0.5">{r.brand}</p>
                      <p className="text-xs font-bold text-zinc-900 leading-snug line-clamp-2 group-hover:text-zinc-600 transition-colors">{r.name}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">{formatDropDate(r.releaseDate, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer nav */}
        <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
          <Link href="/drops" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors font-semibold">
            ← Drop Calendar
          </Link>
          <Link href="/products" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors font-semibold">
            Shop All Sneakers →
          </Link>
        </div>
      </div>
    </>
  );
}
