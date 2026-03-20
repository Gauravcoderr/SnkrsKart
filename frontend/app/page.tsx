import { fetchNewArrivals, fetchTrendingProducts, fetchBrands, fetchBanners, fetchRecentReviews } from '@/lib/api';
import { Product, Brand, BannerSlide, Review } from '@/types';
import HeroBanner from '@/components/home/HeroBanner';
import MarqueeStrip from '@/components/home/MarqueeStrip';
import TrendingNow from '@/components/home/TrendingNow';
import NewArrivals from '@/components/home/NewArrivals';
import BrandGrid from '@/components/home/BrandGrid';
import HomeReviews from '@/components/home/HomeReviews';

export const dynamic = 'force-dynamic';

const SHOWN_BRANDS = ['nike', 'adidas', 'new-balance', 'jordan', 'crocs'];

export default async function HomePage() {
  const [trendingResult, newArrivalsResult, brandsResult, bannersResult, reviewsResult] = await Promise.allSettled([
    fetchTrendingProducts(),
    fetchNewArrivals(),
    fetchBrands(),
    fetchBanners(),
    fetchRecentReviews(),
  ]);

  const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : [] as Product[];
  const newArrivals = newArrivalsResult.status === 'fulfilled' ? newArrivalsResult.value : [] as Product[];
  const allBrands = brandsResult.status === 'fulfilled' ? brandsResult.value : [] as Brand[];
  const brands = allBrands.filter(b => SHOWN_BRANDS.includes(b.slug));
  const banners = bannersResult.status === 'fulfilled' ? bannersResult.value : [] as BannerSlide[];
  const reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value : [] as Review[];

  return (
    <>
      <MarqueeStrip />
      <HeroBanner slides={banners} />
      <NewArrivals products={newArrivals} />
      <HomeReviews reviews={reviews} />
      <BrandGrid brands={brands} />
      <TrendingNow products={trending} />
    </>
  );
}
