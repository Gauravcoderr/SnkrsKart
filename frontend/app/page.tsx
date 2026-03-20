import { fetchNewArrivals, fetchTrendingProducts, fetchBrands } from '@/lib/api';
import { Product, Brand } from '@/types';
import HeroBanner from '@/components/home/HeroBanner';
import MarqueeStrip from '@/components/home/MarqueeStrip';
import TrendingNow from '@/components/home/TrendingNow';
import NewArrivals from '@/components/home/NewArrivals';
import BrandGrid from '@/components/home/BrandGrid';
import DropBanner from '@/components/home/DropBanner';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [trendingResult, newArrivalsResult, brandsResult] = await Promise.allSettled([
    fetchTrendingProducts(),
    fetchNewArrivals(),
    fetchBrands(),
  ]);

  const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : [] as Product[];
  const newArrivals = newArrivalsResult.status === 'fulfilled' ? newArrivalsResult.value : [] as Product[];
  const brands = brandsResult.status === 'fulfilled' ? brandsResult.value : [] as Brand[];

  return (
    <>
      <MarqueeStrip />
      <HeroBanner />
      <NewArrivals products={newArrivals} />
      <BrandGrid brands={brands} />
      <DropBanner />
      <TrendingNow products={trending} />
    </>
  );
}
