import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchSneakerProfiles, fetchSneakerProfileBySlug, fetchProducts } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/products/ProductCard';
import RestockNotify from '@/components/product-detail/RestockNotify';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const profile = await fetchSneakerProfileBySlug(params.slug);
    const url = `${SITE_URL}/sneakers/${params.slug}`;
    return {
      title: { absolute: `${profile.name} Price India | Buy ${profile.brand} ${profile.name} Online | SNKRS CART` },
      description: `Buy ${profile.name} sneakers in India. ${profile.tagline ? profile.tagline + '. ' : ''}Authentic pairs, free pan-India shipping. ${profile.originalRetailPrice ? `Original retail: $${profile.originalRetailPrice}.` : ''} Shop at SNKRS CART.`,
      alternates: { canonical: url },
      openGraph: {
        title: `${profile.name} | SNKRS CART`,
        description: `Buy authentic ${profile.name} in India.`,
        url,
        siteName: 'SNKRS CART',
        type: 'website',
        images: profile.image ? [{ url: profile.image, alt: profile.name }] : [],
      },
    };
  } catch {
    return { title: { absolute: 'Sneaker | SNKRS CART' } };
  }
}

export async function generateStaticParams() {
  try {
    const profiles = await fetchSneakerProfiles();
    return profiles.map((p) => ({ slug: p.slug }));
  } catch { return []; }
}

export const revalidate = 3600;

export default async function SneakerHubPage({ params }: Props) {
  let profile;
  try { profile = await fetchSneakerProfileBySlug(params.slug); }
  catch { notFound(); }

  // Fetch matching products using searchTags or brand+name
  const searchQuery = profile.searchTags.length > 0 ? profile.searchTags[0] : profile.name;
  let matchingProducts: Awaited<ReturnType<typeof fetchProducts>>['products'] = [];
  try {
    const res = await fetchProducts({ search: searchQuery, brands: [profile.brand], limit: 8 });
    matchingProducts = Array.isArray(res) ? res : res.products ?? [];
  } catch { /* no products */ }

  // Fetch related profiles
  let relatedProfiles: Awaited<ReturnType<typeof fetchSneakerProfiles>> = [];
  if (profile.relatedSlugs.length > 0) {
    try {
      const all = await fetchSneakerProfiles();
      relatedProfiles = all.filter((p) => profile.relatedSlugs.includes(p.slug)).slice(0, 4);
    } catch { /* skip */ }
  }

  const url = `${SITE_URL}/sneakers/${params.slug}`;

  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Sneaker Guide', item: `${SITE_URL}/sneakers` },
      { '@type': 'ListItem', position: 3, name: profile.name, item: url },
    ],
  };

  const itemListJson = matchingProducts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${profile.name} available at SNKRS CART`,
    url,
    numberOfItems: matchingProducts.length,
    itemListElement: matchingProducts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        url: `${SITE_URL}/products/${p.slug}`,
        image: p.images?.[0],
        offers: { '@type': 'Offer', price: p.price, priceCurrency: 'INR', availability: p.soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' },
      },
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }} />
      {itemListJson && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJson) }} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-[10px] text-zinc-400 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/sneakers" className="hover:text-zinc-900 transition-colors">Sneaker Guide</Link>
          <span>/</span>
          <span className="text-zinc-900 font-semibold">{profile.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 mb-16">
          {/* Left — image */}
          <div className="relative aspect-square bg-zinc-50 border border-zinc-100 overflow-hidden">
            {profile.image ? (
              <Image src={profile.image} alt={profile.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-zinc-300 text-xs">No image</p>
              </div>
            )}
          </div>

          {/* Right — content */}
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1">{profile.brand}</p>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 mb-2">{profile.name}</h1>
            {profile.tagline && <p className="text-sm text-zinc-500 italic mb-5">{profile.tagline}</p>}

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                ['Year Released', profile.releaseYear],
                ['Designer', profile.designer],
                ['Silhouette', profile.silhouette ? profile.silhouette.charAt(0).toUpperCase() + profile.silhouette.slice(1) : null],
                ['Category', profile.category ? profile.category.charAt(0).toUpperCase() + profile.category.slice(1) : null],
                ['Original Retail', profile.originalRetailPrice ? `$${profile.originalRetailPrice}` : null],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string} className="p-3 bg-zinc-50 border border-zinc-100">
                  <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-zinc-900">{value as string}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {profile.description && (
              <div className="mb-6">
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-2">About</p>
                <p className="text-sm text-zinc-600 leading-relaxed">{profile.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Available at SNKRS CART */}
        <div className="border-t border-zinc-100 pt-10 mb-16">
          <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">
            {matchingProducts.length > 0 ? 'Available at SNKRS CART' : 'Not In Stock Right Now'}
          </h2>
          <p className="text-xl font-bold tracking-tight text-zinc-900 mb-6">
            {matchingProducts.length > 0 ? `Shop ${profile.name}` : 'Be the first to know when we stock this model'}
          </p>

          {matchingProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {matchingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="max-w-md">
              <RestockNotify productSlug={params.slug} />
            </div>
          )}
        </div>

        {/* Related models */}
        {relatedProfiles.length > 0 && (
          <div className="border-t border-zinc-100 pt-10">
            <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Related Models</h2>
            <p className="text-xl font-bold tracking-tight text-zinc-900 mb-6">You Might Also Like</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProfiles.map((p) => (
                <Link key={p.slug} href={`/sneakers/${p.slug}`} className="group border border-zinc-100 hover:border-zinc-400 transition-all overflow-hidden">
                  <div className="relative aspect-square bg-zinc-50">
                    {p.image && <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="25vw" />}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-zinc-900">{p.name}</p>
                    <p className="text-[10px] text-zinc-400">{p.brand}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
