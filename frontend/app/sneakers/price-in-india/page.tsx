import type { Metadata } from 'next';
import { safeJsonLd } from '@/lib/jsonLd';
import Link from 'next/link';
import { fetchSneakerPrices } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { latestPriceDate, listingCount, marketRange, monthLabel, sortPriceRows, trackedCount } from '@/lib/sneakerPrice';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';
const PAGE_URL = `${SITE_URL}/sneakers/price-in-india`;

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const rows = await fetchSneakerPrices();
  const tracked = trackedCount(rows);
  const asOf = monthLabel(latestPriceDate(rows, new Date()));
  return {
    title: { absolute: `Sneaker Prices in India (${asOf}): ${tracked} Models | SNKRS CART` },
    description: `India prices for ${tracked} sneaker models: price range in rupees, number of listings and official MRP where known. Prices as of ${asOf}.`,
    alternates: { canonical: PAGE_URL },
    ...(tracked === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function SneakerPricesPage() {
  const rows = sortPriceRows(await fetchSneakerPrices());
  const tracked = trackedCount(rows);
  const mrpOnly = rows.length - tracked;
  const asOf = monthLabel(latestPriceDate(rows, new Date()));
  const mrpNote = mrpOnly > 0 ? ` ${mrpOnly === 1 ? '1 more model has' : `${mrpOnly} more models have`} an official MRP only.` : '';

  const breadcrumbJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Sneaker Guide', item: `${SITE_URL}/sneakers` },
      { '@type': 'ListItem', position: 3, name: 'Prices in India', item: PAGE_URL },
    ],
  };

  const itemListJson = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Sneaker prices in India, ${asOf}`,
    url: PAGE_URL,
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${row.name} price in India`,
      url: `${SITE_URL}/sneakers/${row.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJson) }} />
      {rows.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJson) }} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="text-[10px] text-zinc-500 mb-6 flex items-center gap-1.5">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/sneakers" className="hover:text-zinc-900 transition-colors">
            Sneaker Guide
          </Link>
          <span>/</span>
          <span className="text-zinc-900 font-semibold">Prices in India</span>
        </nav>

        <h1 className="text-3xl font-black tracking-tight text-zinc-900 mb-2">Sneaker prices in India</h1>
        <p className="text-sm text-zinc-500 max-w-2xl mb-8">
          {rows.length === 0
            ? 'No India prices are tracked right now.'
            : `As of ${asOf}, we track India prices for ${tracked} sneaker models.${mrpNote} Each range runs from the lowest to the highest listing we track, in rupees. Open a model for its sizes, history and the pairs we stock.`}
        </p>

        {rows.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-zinc-200">
            <p className="text-sm text-zinc-500 mb-3">Prices will show here once listings are tracked.</p>
            <Link href="/sneakers" className="text-xs font-bold underline underline-offset-2 text-zinc-900 hover:text-zinc-600">
              Browse the Sneaker Guide
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-100">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Sneaker prices in India, {asOf}</caption>
              <thead className="bg-zinc-50 text-[10px] font-bold tracking-widest uppercase text-zinc-600">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Model
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Brand
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Price in India
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Listings
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Official MRP
                  </th>
                  <th scope="col" className="px-4 py-3">
                    At SNKRS CART
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((row) => (
                  <tr key={row.slug}>
                    <th scope="row" className="px-4 py-3 font-semibold text-zinc-900">
                      <Link href={`/sneakers/${row.slug}`} className="underline underline-offset-2 hover:text-zinc-600">
                        {row.name}
                      </Link>
                    </th>
                    <td className="px-4 py-3 text-zinc-600">{row.brand}</td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">{row.market ? marketRange(row.market, formatPrice) : 'Not tracked'}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.market ? listingCount(row.market.listings) : 'None'}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.indiaRetailPrice ? formatPrice(row.indiaRetailPrice) : 'Not listed'}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.market && row.market.ownPairs > 0 ? `${row.market.ownPairs} in stock` : 'Not in stock'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
