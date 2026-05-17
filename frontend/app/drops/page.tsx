import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchDrops } from '@/lib/api';
import DropsClient from './DropsClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export const metadata: Metadata = {
  title: { absolute: 'Sneaker Release Dates India 2026 | Upcoming Drops | SNKRS CART' },
  description: 'Upcoming sneaker release dates in India 2026 — Nike, Jordan, Adidas & more. Official drop dates, retail prices, and where to buy. Never miss a release.',
  alternates: { canonical: `${SITE_URL}/drops` },
  openGraph: {
    title: 'Sneaker Release Dates India 2026 | SNKRS CART',
    description: 'Upcoming sneaker drops — official release dates, prices, and where to cop in India.',
    url: `${SITE_URL}/drops`,
    siteName: 'SNKRS CART',
    type: 'website',
  },
};

export const revalidate = 300;

export default async function DropsPage() {
  let drops: Awaited<ReturnType<typeof fetchDrops>> = [];
  try { drops = await fetchDrops(); } catch { /* empty state */ }

  const now = new Date();
  const upcoming = drops
    .filter((d) => new Date(d.releaseDate) >= now)
    .sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
  const recent = drops
    .filter((d) => new Date(d.releaseDate) < now)
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-[10px] text-zinc-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-zinc-900 font-semibold">Drop Calendar</span>
      </nav>

      <div className="mb-8">
        <div className="flex items-baseline gap-4 mb-2">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Drop Calendar</h1>
          {upcoming.length > 0 && (
            <span className="text-xs font-bold text-zinc-400 tracking-widest uppercase">
              {upcoming.length} upcoming
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500 max-w-2xl">
          Upcoming sneaker release dates in India — sourced from official brand announcements only. All dates from Nike SNKRS, adidas.com, and verified brand releases.
        </p>
      </div>

      {drops.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-zinc-200">
          <p className="text-sm text-zinc-400">No upcoming drops added yet.</p>
        </div>
      ) : (
        <DropsClient upcoming={upcoming} recent={recent} />
      )}
    </div>
  );
}
