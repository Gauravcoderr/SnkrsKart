import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchDrops, fetchDropBySlug } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const drop = await fetchDropBySlug(params.slug);
    const url = `${SITE_URL}/drops/${params.slug}`;
    const releaseDate = new Date(drop.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      title: { absolute: `${drop.name} Release Date India | ${releaseDate} | SNKRS CART` },
      description: `${drop.name} releases in India on ${releaseDate}${drop.retailPrice ? ` for ₹${drop.retailPrice.toLocaleString('en-IN')}` : ''}. ${drop.description || `Official ${drop.brand} drop — ${drop.where || 'check official channels'}.`}`,
      alternates: { canonical: url },
      openGraph: {
        title: `${drop.name} | Release ${releaseDate}`,
        description: `${drop.brand} drop releasing ${releaseDate}${drop.retailPrice ? ` — ₹${drop.retailPrice.toLocaleString('en-IN')}` : ''}.`,
        url,
        siteName: 'SNKRS CART',
        type: 'website',
        images: drop.image ? [{ url: drop.image, alt: drop.name }] : [],
      },
    };
  } catch {
    return { title: { absolute: 'Drop | SNKRS CART' } };
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
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default async function DropPage({ params }: Props) {
  let drop;
  try { drop = await fetchDropBySlug(params.slug); }
  catch { notFound(); }

  const url = `${SITE_URL}/drops/${params.slug}`;
  const days = daysUntil(drop.releaseDate);
  const released = days < 0;

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

  const eventJson = {
    '@context': 'https://schema.org',
    '@type': 'SaleEvent',
    name: drop.name,
    startDate: drop.releaseDate,
    endDate: drop.releaseDate,
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'VirtualLocation',
      url: drop.where?.toLowerCase().includes('snkrs') ? 'https://www.nike.com/launch'
        : drop.where?.toLowerCase().includes('adidas') ? 'https://www.adidas.co.in'
        : url,
    },
    description: drop.description || `${drop.name} — official ${drop.brand} release`,
    url,
    organizer: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL },
    performer: { '@type': 'Organization', name: drop.brand },
    offers: drop.retailPrice ? {
      '@type': 'Offer',
      price: drop.retailPrice,
      priceCurrency: 'INR',
      availability: released ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      validFrom: drop.releaseDate,
      url: drop.availableAtStore && drop.productSlug ? `${SITE_URL}/products/${drop.productSlug}` : url,
    } : undefined,
    image: drop.image || undefined,
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
    ['Retail Price', drop.retailPrice ? `₹${drop.retailPrice.toLocaleString('en-IN')}` : 'TBC'],
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

            {/* Status pill */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${urgencyConfig.bar}`} />
              <p className={`text-xs font-bold ${urgencyConfig.text}`}>{urgencyConfig.label}</p>
            </div>

            {/* Price + Date prominent */}
            {drop.retailPrice && (
              <div className="mb-5 p-4 bg-zinc-950 text-white flex items-center justify-between rounded-sm">
                <div>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Retail Price</p>
                  <p className="text-2xl font-black">₹{drop.retailPrice.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 mb-0.5">Release</p>
                  <p className="text-sm font-bold text-zinc-200">{new Date(drop.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
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
          </div>
        </div>

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
