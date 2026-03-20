import { fetchNewArrivals, fetchTrendingProducts, fetchBrands, fetchBanners } from '@/lib/api';
import { Product, Brand, BannerSlide } from '@/types';
import HeroBanner from '@/components/home/HeroBanner';
import MarqueeStrip from '@/components/home/MarqueeStrip';
import TrendingNow from '@/components/home/TrendingNow';
import NewArrivals from '@/components/home/NewArrivals';
import BrandGrid from '@/components/home/BrandGrid';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [trendingResult, newArrivalsResult, brandsResult, bannersResult] = await Promise.allSettled([
    fetchTrendingProducts(),
    fetchNewArrivals(),
    fetchBrands(),
    fetchBanners(),
  ]);

  const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : [] as Product[];
  const newArrivals = newArrivalsResult.status === 'fulfilled' ? newArrivalsResult.value : [] as Product[];
  const SHOWN_BRANDS = ['nike', 'adidas', 'new-balance', 'jordan', 'crocs'];
  const allBrands = brandsResult.status === 'fulfilled' ? brandsResult.value : [] as Brand[];
  const brands = allBrands.filter(b => SHOWN_BRANDS.includes(b.slug));
  const banners = bannersResult.status === 'fulfilled' ? bannersResult.value : [] as BannerSlide[];

  return (
    <>
      <MarqueeStrip />
      <HeroBanner slides={banners} />
      <NewArrivals products={newArrivals} />
      <BrandGrid brands={brands} />
<TrendingNow products={trending} />
    </>
  );
}
