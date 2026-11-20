import Link from 'next/link';
import type { SneakerMarketPair } from '@/types';
import { formatPrice } from '@/lib/utils';
import { validMpn } from '@/lib/merchantFacts';

interface Props {
  modelName: string;
  pairs: SneakerMarketPair[];
  totalPairs: number;
}

export default function SneakerPairsTable({ modelName, pairs, totalPairs }: Props) {
  if (pairs.length === 0) return null;
  return (
    <div className="border-t border-zinc-100 pt-10 mb-16">
      <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-500 mb-1">Prices by pair</h2>
      <p className="text-xl font-bold tracking-tight text-zinc-900 mb-6">{modelName} pairs in stock at SNKRS CART</p>
      <div className="overflow-x-auto border border-zinc-100">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-zinc-50 text-[10px] font-bold tracking-widest uppercase text-zinc-600">
            <tr>
              <th scope="col" className="px-4 py-3">
                Pair
              </th>
              <th scope="col" className="px-4 py-3">
                Style code
              </th>
              <th scope="col" className="px-4 py-3">
                Price from
              </th>
              <th scope="col" className="px-4 py-3">
                UK sizes in stock
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pairs.map((pair) => (
              <tr key={pair.slug}>
                <th scope="row" className="px-4 py-3 font-semibold text-zinc-900">
                  <Link href={`/products/${pair.slug}`} className="underline underline-offset-2 hover:text-zinc-600">
                    {pair.name}
                  </Link>
                  {pair.colorway && <span className="block text-xs font-normal text-zinc-500">{pair.colorway}</span>}
                </th>
                <td className="px-4 py-3 text-zinc-600">{validMpn(pair.sku) ?? 'Not listed'}</td>
                <td className="px-4 py-3 font-semibold text-zinc-900">{formatPrice(pair.priceFrom)}</td>
                <td className="px-4 py-3 text-zinc-600">{pair.sizes.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPairs > pairs.length && (
        <p className="mt-3 text-xs text-zinc-500">
          Showing the {pairs.length} lowest-priced pairs of {totalPairs}.
        </p>
      )}
    </div>
  );
}
