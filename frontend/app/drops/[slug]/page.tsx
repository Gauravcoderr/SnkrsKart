import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchDrops, fetchDropBySlug } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const drop = await fetchDropBySlug(params.slug);
    const url = `${SITE_URL}/drops/${params.slug}`;
    const releaseDate = new Date(drop.releaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      title: `${drop.name} Release Date India | ${releaseDate} | SNKRS CART`,
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
    return { title: 'Drop | SNKRS CART' };
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

  const eventJson = {
    '@context': 'https://schema.org',
    '@type': 'SaleEvent',
    name: drop.name,
    startDate: drop.releaseDate,
    description: drop.description || `${drop.name} — official ${drop.brand} release`,
    url,
    organizer: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL },
    offers: drop.retailPrice ? {
      '@type': 'Offer',
      price: drop.retailPrice,
      priceCurrency: 'INR',
      availability: released ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJson) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-[10px] text-zinc-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/drops" className="hover:text-zinc-900 transition-colors">Drop Calendar</Link>
          <span>/</span>
          <span className="text-zinc-900 font-semibold">{drop.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-10">
          {/* Image */}
          <div className="relative aspect-square bg-zinc-50 border border-zinc-100 overflow-hidden">
            {drop.image ? (
              <Image src={drop.image} alt={drop.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-zinc-300 text-xs">{drop.brand}</p>
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1">{drop.brand}</p>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 mb-1">{drop.name}</h1>
            {drop.colorway && <p className="text-sm text-zinc-400 mb-5">{drop.colorway}</p>}

            {/* Release status banner */}
            <div className={`px-4 py-3 mb-5 ${released ? 'bg-zinc-100 border border-zinc-200' : days <= 3 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
              <p className={`text-xs font-bold ${released ? 'text-zinc-600' : days <= 3 ? 'text-red-700' : 'text-amber-800'}`}>
                {released ? `Released — ${formatDate(drop.releaseDate)}` : days === 0 ? 'Dropping Today' : days === 1 ? 'Dropping Tomorrow' : `Releasing in ${days} days — ${formatDate(drop.releaseDate)}`}
              </p>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                ['Release Date', formatDate(drop.releaseDate)],
                ['Retail Price', drop.retailPrice ? `₹${drop.retailPrice.toLocaleString('en-IN')}` : 'TBC'],
                ['Where', drop.where || '—'],
              ].map(([label, value]) => (
                <div key={label} className="p-3 bg-zinc-50 border border-zinc-100">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-zinc-900">{value}</p>
                </div>
              ))}
            </div>

            {drop.description && (
              <p className="text-sm text-zinc-500 leading-relaxed mb-5">{drop.description}</p>
            )}

            {/* CTA */}
            {drop.availableAtStore && drop.productSlug ? (
              <Link href={`/products/${drop.productSlug}`} className="block w-full py-3.5 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase text-center hover:bg-zinc-700 transition-colors">
                Shop Now at SNKRS KART
              </Link>
            ) : (
              <div className="p-4 bg-zinc-50 border border-zinc-100 text-center">
                <p className="text-xs text-zinc-500 mb-2">Not available at SNKRS KART. Check official channels:</p>
                <p className="text-sm font-semibold text-zinc-700">{drop.where || 'Official brand site'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100">
          <Link href="/drops" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">← Back to Drop Calendar</Link>
        </div>
      </div>
    </>
  );
}
