import { fetchProductBySlug, fetchTrendingProducts, fetchProductReviews } from '@/lib/api';
import { notFound } from 'next/navigation';
import ImageGallery from '@/components/product-detail/ImageGallery';
import ProductDetailClient from './ProductDetailClient';
import ProductCard from '@/components/products/ProductCard';
import ProductReviews from '@/components/reviews/ProductReviews';
import ProductRatingDisplay from '@/components/product-detail/ProductRatingDisplay';
import RecentlyViewed from '@/components/product-detail/RecentlyViewed';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

export async function generateMetadata({ params }: PageProps) {
  try {
    const product = await fetchProductBySlug(params.slug);
    const title = `${product.brand} ${product.name}`;
    const description = `${product.description} — ${formatPrice(product.price)} | 100% Authentic | Shop now on SNKRS CART`;
    const url = `${SITE_URL}/products/${params.slug}`;
    const ogImage = product.images?.[0] || '';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: 'SNKRS CART',
        type: 'website',
        ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(ogImage ? { images: [ogImage] } : {}),
      },
    };
  } catch {
    return { title: 'Product Not Found' };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  let product;
  try {
    product = await fetchProductBySlug(params.slug);
  } catch {
    notFound();
  }

  const [related, reviews] = await Promise.all([
    fetchTrendingProducts().then((p) => p.filter((p) => p.id !== product.id && p.brand === product.brand).slice(0, 4)),
    fetchProductReviews(product.slug).catch(() => []),
  ]);

  const productUrl = `${SITE_URL}/products/${product.slug}`;
  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.name}`,
    brand: { '@type': 'Brand', name: product.brand },
    description: product.description,
    image: product.images,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: String(product.price),
      availability: product.soldOut || product.availableSizes.length === 0
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      url: productUrl,
      seller: { '@type': 'Organization', name: 'SNKRS CART' },
    },
    ...(avgRating && reviews.length >= 1 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(avgRating),
        reviewCount: String(reviews.length),
        bestRating: '5',
        worstRating: '1',
      },
    }),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'All Shoes', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: product.brand, item: `${SITE_URL}/brands/${product.brand.toLowerCase().replace(/\s+/g, '-')}` },
      { '@type': 'ListItem', position: 4, name: product.name, item: productUrl },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-8 font-medium tracking-wide">
        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-zinc-900 transition-colors">All Shoes</Link>
        <span>/</span>
        <Link href={`/brands/${product.brand.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-zinc-900 transition-colors">{product.brand}</Link>
        <span>/</span>
        <span className="text-zinc-600">{product.name}</span>
      </nav>

      {/* Main product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image gallery — left col */}
        <ImageGallery images={product.images} productName={`${product.brand} ${product.name}`} />

        {/* Product info — right col */}
        <div className="flex flex-col">
          {/* Brand + name */}
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400">
              {product.brand}
            </p>
            {product.gender && (
              <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 border border-zinc-200 px-1.5 py-0.5">
                {product.gender === 'men' ? "Men's" : product.gender === 'women' ? "Women's" : 'Unisex'}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">
            {product.name}
          </h1>
          <p className="text-sm text-zinc-500 mb-4">{product.colorway}</p>

          {/* Rating */}
          {(() => {
            const count = reviews.length;
            const avg = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
            return <ProductRatingDisplay initialRating={avg} initialCount={count} />;
          })()}

          {/* Size picker + Add to cart + price — client component */}
          <ProductDetailClient product={product} />

          {/* Description */}
          <div className="mt-8 pt-6 border-t border-zinc-100">
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-3">
              About This Shoe
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 border border-zinc-100 text-xs font-medium text-zinc-500 capitalize">
                  {tag}
                </span>
              ))}
            </div>
          )}


        </div>
      </div>

      {/* Reviews */}
      <ProductReviews
        productSlug={product.slug}
        productName={product.name}
        initialReviews={reviews}
      />

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-20 pt-10 border-t border-zinc-100">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">More From</p>
              <h2 className="text-xl font-bold tracking-[0.15em] uppercase text-zinc-900">{product.brand}</h2>
            </div>
            <Link
              href={`/brands/${product.brand.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-xs font-semibold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed — client component, reads/writes localStorage */}
      <RecentlyViewed currentProduct={product} />
    </div>
  );
}
