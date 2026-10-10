import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { Product } from '@/types';
import Link from 'next/link';
import { Suspense } from 'react';
import { fetchBrandBySlug, fetchProducts, NotFoundError } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { BRANDS } from '@/lib/constants';
import ProductCard from '@/components/products/ProductCard';
import BrandSortSelect from './BrandSortSelect';
import { fullProductName } from '@/lib/productTitle';
import { brandSeo, isShoe } from '@/lib/brandSeo';
import { isLive, lowestLivePrice } from '@/lib/productMatch';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  try {
    const slug = decodeURIComponent(params.slug).toLowerCase().replace(/\s+/g, '-');
    const brand = await fetchBrandBySlug(slug);
    const meta = BRANDS.find((b) => b.slug === slug);
    const url = `${SITE_URL}/brands/${slug}`;
    const products = await fetchProducts({ brands: [meta?.label ?? brand.name], limit: 48 }).catch(() => []);
    const productList = (Array.isArray(products) ? products : (products as { products?: Product[] }).products ?? []) as Product[];
    const seo = brandSeo(brand.name, slug, productList);

    return {
      title: { absolute: seo.title },
      description: seo.description,
      alternates: { canonical: url },
      openGraph: {
        title: seo.title,
        description: seo.description,
        url,
        siteName: 'Snkrs Cart',
        type: 'website',
        images: meta?.cardImage ? [{ url: meta.cardImage, alt: `${brand.name} sneakers` }] : [],
      },
    };
  } catch {
    return { title: { absolute: 'Brand | Snkrs Cart' } };
  }
}

export const revalidate = 60;

export default async function BrandPage(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const rawSlug = decodeURIComponent(params.slug);
  const slug = rawSlug.toLowerCase().replace(/\s+/g, '-');

  // Redirect /brands/Jordan → /brands/jordan (canonical lowercase URL)
  if (rawSlug !== slug) permanentRedirect(`/brands/${slug}`);

  const meta = BRANDS.find((b) => b.slug === slug);
  if (!meta) {
    const other = await fetchBrandBySlug(slug).catch((e) => { if (e instanceof NotFoundError) return null; throw e; });
    if (other?.name) permanentRedirect(`/products?brand=${encodeURIComponent(other.name)}`);
    notFound();
  }

  const [brandResult, productsResult] = await Promise.allSettled([
    fetchBrandBySlug(slug),
    fetchProducts({ brands: [meta.label], limit: 48 }),
  ]);

  const brand = brandResult.status === 'fulfilled'
    ? brandResult.value
    : { name: meta.label, description: '' };
  const products = productsResult.status === 'fulfilled'
    ? (productsResult.value.products ?? productsResult.value)
    : [];

  const sort = searchParams.sort || 'popular';
  const shoePrices = Array.isArray(products) ? products.filter(isShoe).map((p) => p.price) : [];
  const lowestPrice = shoePrices.length > 0 ? Math.min(...shoePrices) : null;
  const sortedProducts = Array.isArray(products) ? [...products].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    if (sort === 'discount') return ((b.originalPrice ?? b.price) - b.price) - ((a.originalPrice ?? a.price) - a.price);
    return 0; // popular — keep server order
  }) : [];

  const accent = meta.accent;
  const brandUrl = `${SITE_URL}/brands/${slug}`;

  const brandSchema = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    url: brandUrl,
    description: brand.description || `Shop 100% authentic ${brand.name} sneakers in India.`,
    ...(meta.cardImage ? { logo: { '@type': 'ImageObject', url: meta.cardImage } } : {}),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'All Products', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: brand.name, item: brandUrl },
    ],
  };

  const itemListSchema = sortedProducts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${brand.name} Sneakers`,
    url: brandUrl,
    numberOfItems: sortedProducts.length,
    itemListElement: sortedProducts.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: fullProductName(p.brand, p.name),
        url: `${SITE_URL}/products/${p.slug}`,
        image: p.images?.length ? p.images.slice(0, 3) : p.hoverImage,
        description: `${fullProductName(p.brand, p.name)}${p.colorway ? ` in ${p.colorway}` : ''}. 100% authentic, free pan-India shipping.`,
        sku: p.sku,
        brand: { '@type': 'Brand', name: p.brand },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: String(lowestLivePrice(p)),
          availability: isLive(p) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: `${SITE_URL}/products/${p.slug}`,
          seller: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL },
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'INR' },
            shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN', name: 'India' },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
              transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 7, unitCode: 'DAY' },
            },
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'IN',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 2,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn',
            itemCondition: 'https://schema.org/DamagedCondition',
          },
        },
      },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {itemListSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />}

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
          <Link href="/products" className="hover:text-zinc-700 transition-colors">All Products</Link>
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
          <Suspense fallback={null}>
            <BrandSortSelect />
          </Suspense>
        </div>

        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {sortedProducts.map((product, i) => (
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
            {lowestPrice && ` — Starting from ${formatPrice(lowestPrice)}`}
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Looking for affordable {brand.name} shoes in India? SNKRS CART offers the complete{' '}
            {brand.name} collection{lowestPrice ? ` starting from ${formatPrice(lowestPrice)}` : ''} —
            all 100% authentic, sourced from authorised channels. Whether you&apos;re searching for the
            cheapest {brand.name} sneakers or the latest drops, every pair ships free across India
            with secure packaging. No fakes, no compromise.
          </p>
        </div>
      </section>
    </div>
  );
}
