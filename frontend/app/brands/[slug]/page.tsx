import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchBrandBySlug, fetchProducts } from '@/lib/api';
import { BRANDS } from '@/lib/constants';
import ProductCard from '@/components/products/ProductCard';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const brand = await fetchBrandBySlug(params.slug);
    const meta = BRANDS.find((b) => b.slug === params.slug);
    return {
      title: `${brand.name} Sneakers India | Buy ${brand.name} Shoes Online | SNKRS CART`,
      description: `Shop 100% authentic ${brand.name} sneakers in India. ${brand.description || `Explore the full ${brand.name} collection — exclusive drops, classics & more.`} Free pan-India shipping.`,
      openGraph: {
        title: `${brand.name} Sneakers | SNKRS CART`,
        description: `Shop authentic ${brand.name} shoes in India.`,
        images: meta?.cardImage ? [{ url: meta.cardImage }] : [],
      },
    };
  } catch {
    return { title: 'Brand | SNKRS CART' };
  }
}

export const dynamic = 'force-dynamic';

export default async function BrandPage({ params }: Props) {
  const meta = BRANDS.find((b) => b.slug === params.slug);
  if (!meta) notFound();

  const [brandResult, productsResult] = await Promise.allSettled([
    fetchBrandBySlug(params.slug),
    fetchProducts({ brands: [meta.label], limit: 48 }),
  ]);

  if (brandResult.status === 'rejected') notFound();

  const brand = brandResult.value;
  const products = productsResult.status === 'fulfilled'
    ? (productsResult.value.products ?? productsResult.value)
    : [];

  const accent = meta.accent;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-zinc-950">
        {/* accent glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse 60% 60% at 70% 50%, ${accent}, transparent)`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col md:flex-row items-center gap-10">
          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: accent }}>
              Brand Collection
            </p>
            <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight text-white leading-none mb-4">
              {brand.name}
            </h1>
            {brand.description && (
              <p className="text-zinc-400 text-base max-w-md mb-6 leading-relaxed">
                {brand.description}
              </p>
            )}
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-white"
                style={{ backgroundColor: accent }}
              >
                {Array.isArray(products) ? products.length : 0}+ Styles
              </span>
              <span className="text-zinc-500 text-sm">100% Authentic</span>
            </div>
          </div>

          {/* Hero image */}
          <div className="w-64 h-64 sm:w-80 sm:h-80 relative flex-shrink-0">
            <img
              src={meta.cardImage}
              alt={`${brand.name} sneakers`}
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: accent, opacity: 0.4 }} />
      </section>

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-700 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-zinc-700 transition-colors">Sneakers</Link>
          <span>/</span>
          <span className="text-zinc-900 font-medium">{brand.name}</span>
        </div>
      </div>

      {/* ── Products ────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black uppercase tracking-widest text-zinc-900">
            {Array.isArray(products) ? products.length : 0} Styles
          </h2>
          <Link
            href={`/products?brand=${meta.label}`}
            className="text-xs font-bold tracking-widest uppercase text-zinc-400 hover:text-zinc-900 transition-colors border-b border-zinc-200 hover:border-zinc-900 pb-0.5"
          >
            Filter & Sort →
          </Link>
        </div>

        {Array.isArray(products) && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="text-zinc-400 text-sm">No products found for {brand.name} yet.</p>
            <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-zinc-900 underline underline-offset-4">
              Browse all sneakers
            </Link>
          </div>
        )}
      </section>

      {/* ── SEO footer text ─────────────────────────────────────────────────── */}
      <section className="bg-zinc-50 border-t border-zinc-100 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-base font-bold text-zinc-900 mb-3">
            Buy {brand.name} Sneakers Online in India
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Shop the complete {brand.name} collection at SNKRS CART — India's most trusted sneaker store.
            Every pair is 100% authentic, sourced directly from authorised channels.
            Free pan-India shipping, secure packaging, and easy returns on all {brand.name} shoes.
          </p>
        </div>
      </section>
    </div>
  );
}
