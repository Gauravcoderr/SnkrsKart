import { fetchNewArrivals, fetchTrendingProducts, fetchBrands, fetchBanners, fetchRecentReviews, fetchComingSoonProducts } from '@/lib/api';
import { Product, Brand, BannerSlide, Review } from '@/types';
import HeroBanner from '@/components/home/HeroBanner';
import MarqueeStrip from '@/components/home/MarqueeStrip';
import TrendingNow from '@/components/home/TrendingNow';
import NewArrivals from '@/components/home/NewArrivals';
import BrandGrid from '@/components/home/BrandGrid';
import HomeReviews from '@/components/home/HomeReviews';
import ComingSoon from '@/components/home/ComingSoon';
import GenderSplit from '@/components/home/GenderSplit';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import NewsletterBar from '@/components/home/NewsletterBar';

export const dynamic = 'force-dynamic';

const SHOWN_BRANDS = ['nike', 'adidas', 'new-balance', 'jordan', 'crocs'];

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

  return (
    <>
      <MarqueeStrip />
      <HeroBanner slides={banners} />
      <NewArrivals products={newArrivals} />
      <HomeReviews reviews={reviews} />
      <BrandGrid brands={brands} />
      <TrendingNow products={trending} />
      <WhyChooseUs />
      <ComingSoon products={comingSoon} />
      <GenderSplit />
      <NewsletterBar />
    </>
  );
}
