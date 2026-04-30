import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchSneakerProfiles } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';

export const metadata: Metadata = {
  title: { absolute: 'Sneaker Guide India | All Models & History | SNKRS CART' },
  description: 'Explore the complete sneaker guide — Nike Air Force 1, Jordan 1, Adidas Samba, New Balance 550 & more. History, specs, and where to buy in India.',
  alternates: { canonical: `${SITE_URL}/sneakers` },
  openGraph: {
    title: 'Sneaker Guide India | SNKRS CART',
    description: 'The complete guide to every iconic sneaker model — history, specs, and where to buy in India.',
    url: `${SITE_URL}/sneakers`,
    siteName: 'SNKRS CART',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default async function SneakersIndexPage() {
  let profiles: Awaited<ReturnType<typeof fetchSneakerProfiles>> = [];
  try { profiles = await fetchSneakerProfiles(); } catch { /* empty state */ }

  const byBrand = profiles.reduce<Record<string, typeof profiles>>((acc, p) => {
    (acc[p.brand] = acc[p.brand] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-[10px] text-zinc-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-zinc-900 font-semibold">Sneaker Guide</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 mb-2">Sneaker Guide</h1>
        <p className="text-sm text-zinc-500 max-w-2xl">
          The complete history and buying guide for every iconic sneaker model — from the Nike Air Force 1 to the Adidas Samba. Find specs, origin stories, and buy authentic pairs in India.
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="py-24 text-center border border-zinc-100">
          <p className="text-sm text-zinc-400">Sneaker profiles coming soon.</p>
        </div>
      ) : (
        Object.entries(byBrand).map(([brand, brandProfiles]) => (
          <div key={brand} className="mb-12">
            <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-4">{brand}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {brandProfiles.map((p) => (
                <Link
                  key={p.slug}
                  href={`/sneakers/${p.slug}`}
                  className="group border border-zinc-100 hover:border-zinc-400 transition-all duration-200 overflow-hidden"
                >
                  <div className="relative aspect-square bg-zinc-50">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-zinc-900 leading-snug group-hover:text-zinc-600 transition-colors">{p.name}</p>
                    {p.tagline && <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{p.tagline}</p>}
                    {p.releaseYear && <p className="text-[10px] text-zinc-300 mt-1">{p.releaseYear}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
