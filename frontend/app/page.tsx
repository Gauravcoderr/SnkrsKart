import { fetchNewArrivals, fetchTrendingProducts, fetchBrands, fetchBanners, fetchProducts } from '@/lib/api';
import { Product, Brand, BannerSlide } from '@/types';
import HeroBanner from '@/components/home/HeroBanner';
import MarqueeStrip from '@/components/home/MarqueeStrip';
import TrendingNow from '@/components/home/TrendingNow';
import NewArrivals from '@/components/home/NewArrivals';
import BrandGrid from '@/components/home/BrandGrid';

export const dynamic = 'force-dynamic';

const SHOWN_BRANDS = ['nike', 'adidas', 'new-balance', 'jordan', 'crocs'];

async function fetchBrandImages(): Promise<Record<string, string>> {
  const results = await Promise.allSettled(
    SHOWN_BRANDS.map((slug) =>
      fetchProducts({ brands: [slug], limit: 1 }, 3600)
    )
  );
  const images: Record<string, string> = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value.products.length > 0) {
      images[SHOWN_BRANDS[i]] = r.value.products[0].images[0];
    }
  });
  return images;
}

export default async function HomePage() {
  const [trendingResult, newArrivalsResult, brandsResult, bannersResult, brandImages] = await Promise.all([
    fetchTrendingProducts().catch(() => [] as Product[]),
    fetchNewArrivals().catch(() => [] as Product[]),
    fetchBrands().catch(() => [] as Brand[]),
    fetchBanners().catch(() => [] as BannerSlide[]),
    fetchBrandImages().catch(() => ({} as Record<string, string>)),
  ]);

  const trending = Array.isArray(trendingResult) ? trendingResult : [] as Product[];
  const newArrivals = Array.isArray(newArrivalsResult) ? newArrivalsResult : [] as Product[];
  const allBrands = Array.isArray(brandsResult) ? brandsResult : [] as Brand[];
  const brands = allBrands.filter(b => SHOWN_BRANDS.includes(b.slug));
  const banners = Array.isArray(bannersResult) ? bannersResult : [] as BannerSlide[];

  return (
    <>
      <MarqueeStrip />
      <HeroBanner slides={banners} />
      <NewArrivals products={newArrivals} />
      <BrandGrid brands={brands} brandImages={brandImages} />
      <TrendingNow products={trending} />
    </>
  );
}
