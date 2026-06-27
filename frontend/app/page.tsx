import { fetchNewArrivals, fetchTrendingProducts, fetchBrands, fetchBanners, fetchRecentReviews, fetchComingSoonProducts } from '@/lib/api';
import { Product, Brand, BannerSlide, Review } from '@/types';
import HeroBanner from '@/components/home/HeroBanner';
import MarqueeStrip from '@/components/home/MarqueeStrip';
import TrendingNow from '@/components/home/TrendingNow';
import NewArrivals from '@/components/home/NewArrivals';
import BrandGrid from '@/components/home/BrandGrid';
import HomeReviews from '@/components/home/HomeReviews';
import ComingSoon from '@/components/home/ComingSoon';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import NewsletterBar from '@/components/home/NewsletterBar';

import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Buy Authentic Sneakers Online in India | SNKRS CART',
  description: 'Shop Nike, Adidas, Air Jordan, New Balance & Crocs at the best prices in India. 100% authentic sneakers, fast delivery, new arrivals every week.',
  alternates: { canonical: 'https://www.snkrscart.com' },
};

const SITE_URL = 'https://www.snkrscart.com';

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'SNKRS CART',
  alternateName: 'SNKRS CART',
  url: SITE_URL,
  description: 'Buy 100% authentic Nike, Adidas, Jordan, New Balance & Crocs sneakers online in India.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/products?search={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};
const SHOWN_BRANDS = ['nike', 'adidas', 'new-balance', 'jordan', 'crocs'];

function buildItemList(name: string, url: string, products: Product[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: `${p.brand} ${p.name}`,
        brand: { '@type': 'Brand', name: p.brand },
        url: `${SITE_URL}/products/${p.slug}`,
        image: p.images?.[0] ?? '',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: String(p.price),
          availability: p.soldOut || (p.availableSizes?.length ?? 0) === 0
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          url: `${SITE_URL}/products/${p.slug}`,
          seller: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL },
        },
      },
    })),
  };
}

export default async function HomePage() {
  const [trendingResult, newArrivalsResult, brandsResult, bannersResult, reviewsResult, comingSoonResult] = await Promise.allSettled([
    fetchTrendingProducts(),
    fetchNewArrivals(),
    fetchBrands(),
    fetchBanners(),
    fetchRecentReviews(),
    fetchComingSoonProducts(),
  ]);

  const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : [] as Product[];
  const newArrivals = newArrivalsResult.status === 'fulfilled' ? newArrivalsResult.value : [] as Product[];
  const allBrands = brandsResult.status === 'fulfilled' ? brandsResult.value : [] as Brand[];
  const brands = allBrands.filter(b => SHOWN_BRANDS.includes(b.slug));
  const banners = bannersResult.status === 'fulfilled' ? bannersResult.value : [] as BannerSlide[];
  const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value : [] as Review[];
  const comingSoon = comingSoonResult.status === 'fulfilled' ? comingSoonResult.value : [] as Product[];

  const trendingSchema = trending.length > 0
    ? buildItemList('Trending Sneakers at SNKRS CART', `${SITE_URL}/products`, trending)
    : null;
  const newArrivalsSchema = newArrivals.length > 0
    ? buildItemList('New Arrival Sneakers at SNKRS CART', `${SITE_URL}/products`, newArrivals)
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      {trendingSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trendingSchema) }} />
      )}
      {newArrivalsSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newArrivalsSchema) }} />
      )}
      <MarqueeStrip />
      <HeroBanner slides={banners} />
      <NewArrivals products={newArrivals} />
      <HomeReviews reviews={reviews} />
      <BrandGrid brands={brands} />
      <TrendingNow products={trending} />
      <WhyChooseUs />
      <ComingSoon products={comingSoon} />
      <NewsletterBar />
    </>
  );
}
