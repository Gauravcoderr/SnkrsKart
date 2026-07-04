import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchSneakerProfiles } from '@/lib/api';
import SneakersClient from './SneakersClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export const metadata: Metadata = {
  title: { absolute: 'Sneaker Guide India | All Models & History | Snkrs Cart' },
  description: 'Explore the complete sneaker guide — Nike Air Force 1, Jordan 1, Adidas Samba, New Balance 550 & more. History, specs, and where to buy in India.',
  alternates: { canonical: `${SITE_URL}/sneakers` },
  openGraph: {
    title: 'Sneaker Guide India | Snkrs Cart',
    description: 'The complete guide to every iconic sneaker model — history, specs, and where to buy in India.',
    url: `${SITE_URL}/sneakers`,
    siteName: 'Snkrs Cart',
    type: 'website',
  },
};

export const revalidate = 3600;

export default async function SneakersIndexPage() {
  let profiles: Awaited<ReturnType<typeof fetchSneakerProfiles>> = [];
  try { profiles = await fetchSneakerProfiles(); } catch { /* empty state */ }

  const totalBrands = new Set(profiles.map((p) => p.brand)).size;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-[10px] text-zinc-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-zinc-900 font-semibold">Sneaker Guide</span>
      </nav>

      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-baseline gap-4 mb-2">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Sneaker Guide</h1>
          {profiles.length > 0 && (
            <span className="text-xs font-bold text-zinc-400 tracking-widest uppercase">
              {profiles.length} models · {totalBrands} brands
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500 max-w-2xl">
          The complete history and buying guide for every iconic sneaker model. Find specs, origin stories, and shop authentic pairs in India.
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-zinc-200">
          <p className="text-sm text-zinc-400">Sneaker profiles coming soon.</p>
        </div>
      ) : (
        <SneakersClient profiles={profiles} />
      )}
    </div>
  );
}
