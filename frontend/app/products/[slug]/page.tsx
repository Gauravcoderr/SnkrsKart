import { fetchProductBySlug, fetchTrendingProducts, fetchProductReviews } from '@/lib/api';
import { notFound } from 'next/navigation';
import ImageGallery from '@/components/product-detail/ImageGallery';
import ProductDetailClient from './ProductDetailClient';
import ProductCard from '@/components/products/ProductCard';
import ProductReviews from '@/components/reviews/ProductReviews';
import ProductRatingDisplay from '@/components/product-detail/ProductRatingDisplay';
import RecentlyViewed from '@/components/product-detail/RecentlyViewed';
import Link from 'next/link';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const BRAND_TAG: Record<string, string> = {
  'Nike': 'nike', 'Jordan': 'jordan', 'Adidas': 'adidas',
  'New Balance': 'new-balance', 'Crocs': 'crocs',
};

interface BlogSnippet { _id: string; title: string; slug: string; excerpt: string; coverImage: string; createdAt: string }

async function fetchBlogsByBrand(brand: string): Promise<BlogSnippet[]> {
  const tag = BRAND_TAG[brand];
  if (!tag) return [];
  try {
    const res = await fetch(`${API}/blogs?tag=${tag}&limit=3`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

export async function generateMetadata({ params }: PageProps) {
  try {
    const product = await fetchProductBySlug(params.slug);
    const title = `${product.brand} ${product.name} — ₹${product.price.toLocaleString('en-IN')} | Buy in India`;
    const origPrice = product.originalPrice ?? 0;
    const hasDiscount = origPrice > product.price;
    const discountNote = hasDiscount
      ? `${Math.round(((origPrice - product.price) / origPrice) * 100)}% off`
      : 'best price guaranteed';
    const description = `Buy ${product.brand} ${product.name} for ₹${product.price.toLocaleString('en-IN')} (${discountNote}). 100% authentic ${product.brand} shoes in India — pan-India shipping. | SNKRS CART`;
    const url = `${SITE_URL}/products/${params.slug}`;
    const ogImage = product.images?.[0] || '';

    return {
      title,
      description,
      alternates: { canonical: url },
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

  const [related, reviews, relatedBlogs] = await Promise.all([
    fetchTrendingProducts().then((p) => p.filter((p) => p.id !== product.id && p.brand === product.brand).slice(0, 4)),
    fetchProductReviews(product.slug).catch(() => []),
    fetchBlogsByBrand(product.brand),
  ]);

  const productUrl = `${SITE_URL}/products/${product.slug}`;
  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  // Map gender → schema.org audience age group
  const ageGroup = product.gender === 'kids' ? 'kids' : 'adult';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.name}`,
    brand: { '@type': 'Brand', name: product.brand },
    description: product.description,
    image: product.images,
    sku: product.sku,
    category: 'Sneakers',
    itemCondition: 'https://schema.org/NewCondition',
    datePublished: product.createdAt,
    color: product.colorway || (product.colors?.[0] ?? ''),
    audience: {
      '@type': 'PeopleAudience',
      suggestedGender: product.gender === 'men' ? 'male' : product.gender === 'women' ? 'female' : 'unisex',
      suggestedAge: ageGroup === 'kids'
        ? { '@type': 'QuantitativeValue', minValue: 0, maxValue: 12 }
        : { '@type': 'QuantitativeValue', minValue: 13, maxValue: 99 },
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: String(product.price),
      ...(product.originalPrice ? { highPrice: String(product.originalPrice), lowPrice: String(product.price) } : {}),
      availability: product.soldOut || product.availableSizes.length === 0
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      url: productUrl,
      seller: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL },
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'INR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN',
          name: 'India',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY',
          },
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
    ...(avgRating && reviews.length >= 1 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(avgRating),
        reviewCount: String(reviews.length),
        bestRating: '5',
        worstRating: '1',
      },
      review: reviews.slice(0, 5).map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.name || 'Verified Buyer' },
        reviewRating: { '@type': 'Rating', ratingValue: String(r.rating), bestRating: '5', worstRating: '1' },
        reviewBody: r.comment || '',
        datePublished: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : undefined,
      })),
    }),
  };

  const faqSchema = product.faqs?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: product.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer.replace(/<[^>]*>/g, ''),
      },
    })),
  } : null;

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-400 mb-6 sm:mb-8 font-medium tracking-wide flex-wrap">
        <Link href="/" className="hover:text-zinc-900 transition-colors shrink-0">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-zinc-900 transition-colors shrink-0">All Shoes</Link>
        <span>/</span>
        <Link href={`/brands/${product.brand.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-zinc-900 transition-colors shrink-0">{product.brand}</Link>
        <span>/</span>
        <span className="text-zinc-600 truncate max-w-[140px] sm:max-w-none">{product.name}</span>
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
            <div
              className="text-sm text-zinc-600 leading-relaxed prose prose-sm prose-zinc max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
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

      {/* Related blog posts */}
      {relatedBlogs.length > 0 && (
        <section className="mt-16 pt-10 border-t border-zinc-100">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">From the Blog</p>
              <h2 className="text-xl font-bold tracking-[0.15em] uppercase text-zinc-900">{product.brand} Reads</h2>
            </div>
            <Link
              href={`/blogs/tag/${BRAND_TAG[product.brand] ?? product.brand.toLowerCase()}`}
              className="text-xs font-semibold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              All Articles →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {relatedBlogs.map((b) => (
              <Link
                key={b._id}
                href={`/blogs/${b.slug}`}
                className="group block rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative aspect-[16/9] bg-zinc-100 overflow-hidden">
                  {b.coverImage ? (
                    <Image
                      src={b.coverImage}
                      alt={b.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width:640px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-zinc-200 flex items-center justify-center">
                      <span className="text-3xl opacity-30">👟</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs font-black tracking-tight text-zinc-900 group-hover:text-zinc-600 transition-colors leading-snug line-clamp-2 mb-1">
                    {b.title}
                  </p>
                  {b.excerpt && (
                    <p className="text-[11px] text-zinc-500 line-clamp-2">{b.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed — client component, reads/writes localStorage */}
      <RecentlyViewed currentProduct={product} />

      {/* FAQs */}
      {product.faqs && product.faqs.length > 0 && (
        <section className="mt-16 pt-10 border-t border-zinc-100">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">Got Questions?</p>
            <h2 className="text-xl font-bold tracking-[0.15em] uppercase text-zinc-900">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {product.faqs.map((faq, i) => (
              <details key={i} {...(i === 0 ? { open: true } : {})} className="group rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors">
                  {faq.question}
                  <svg className="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div
                  className="px-5 pb-5 pt-1 text-sm text-zinc-600 leading-relaxed prose prose-sm prose-zinc max-w-none"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
