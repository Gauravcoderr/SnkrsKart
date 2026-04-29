import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchDrops } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';

export const metadata: Metadata = {
  title: 'Sneaker Release Dates India 2025 | Upcoming Drops | SNKRS CART',
  description: 'Upcoming sneaker release dates in India 2025 — Nike, Jordan, Adidas & more. Official drop dates, retail prices, and where to buy. Never miss a release.',
  alternates: { canonical: `${SITE_URL}/drops` },
  openGraph: {
    title: 'Sneaker Release Dates India 2025 | SNKRS CART',
    description: 'Upcoming sneaker drops — official release dates, prices, and where to cop in India.',
    url: `${SITE_URL}/drops`,
    siteName: 'SNKRS CART',
    type: 'website',
  },
};

export const revalidate = 300;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default async function DropsPage() {
  let drops: Awaited<ReturnType<typeof fetchDrops>> = [];
  try { drops = await fetchDrops(); } catch { /* empty state */ }

  const now = new Date();
  const upcoming = drops.filter((d) => new Date(d.releaseDate) >= now);
  const recent = drops.filter((d) => new Date(d.releaseDate) < now);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-[10px] text-zinc-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-zinc-900 font-semibold">Drop Calendar</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 mb-2">Drop Calendar</h1>
        <p className="text-sm text-zinc-500">
          Upcoming sneaker release dates in India — sourced from official brand announcements. All dates are from Nike SNKRS, adidas.com, and verified brand releases.
        </p>
      </div>

      {drops.length === 0 ? (
        <div className="py-24 text-center border border-zinc-100">
          <p className="text-sm text-zinc-400">No upcoming drops added yet.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-16">
              <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-6">Upcoming Releases</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {upcoming.map((drop) => {
                  const days = daysUntil(drop.releaseDate);
                  return (
                    <Link key={drop._id} href={`/drops/${drop.slug}`} className="group border border-zinc-100 hover:border-zinc-400 transition-all duration-200 overflow-hidden">
                      <div className="relative aspect-[4/3] bg-zinc-50 overflow-hidden">
                        {drop.image ? (
                          <Image src={drop.image} alt={drop.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                            <p className="text-xs text-zinc-400">{drop.brand}</p>
                          </div>
                        )}
                        {drop.availableAtStore && (
                          <div className="absolute top-2 left-2 bg-zinc-900 text-white text-[9px] font-bold tracking-widest uppercase px-2 py-1">
                            In Store
                          </div>
                        )}
                        <div className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-1 ${days <= 3 ? 'bg-red-500 text-white' : days <= 7 ? 'bg-amber-400 text-zinc-900' : 'bg-white/90 text-zinc-700'}`}>
                          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-0.5">{drop.brand}</p>
                        <p className="text-sm font-bold text-zinc-900 leading-snug mb-1 group-hover:text-zinc-600 transition-colors">{drop.name}</p>
                        {drop.colorway && <p className="text-[10px] text-zinc-400 mb-2">{drop.colorway}</p>}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-zinc-500">{formatDate(drop.releaseDate)}</p>
                          {drop.retailPrice && <p className="text-xs font-bold text-zinc-900">₹{drop.retailPrice.toLocaleString('en-IN')}</p>}
                        </div>
                        {drop.where && <p className="text-[10px] text-zinc-400 mt-1">via {drop.where}</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section>
              <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-6">Recently Released</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 opacity-60">
                {recent.map((drop) => (
                  <Link key={drop._id} href={`/drops/${drop.slug}`} className="group border border-zinc-100 hover:border-zinc-300 transition-all overflow-hidden">
                    <div className="relative aspect-[4/3] bg-zinc-50 overflow-hidden">
                      {drop.image && <Image src={drop.image} alt={drop.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 25vw" />}
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-0.5">{drop.brand}</p>
                      <p className="text-sm font-bold text-zinc-900">{drop.name}</p>
                      <p className="text-xs text-zinc-400 mt-1">{formatDate(drop.releaseDate)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
