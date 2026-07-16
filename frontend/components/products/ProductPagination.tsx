import Link from 'next/link';
import { FilterState } from '@/types';
import { buildProductQueryString } from '@/lib/productFilters';

interface Props {
  filters: FilterState;
  page: number;
  totalPages: number;
}

export default function ProductPagination({ filters, page, totalPages }: Props) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const qs = buildProductQueryString(filters, p);
    return qs ? `/products?${qs}` : '/products';
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <Link
        href={hrefFor(page - 1)}
        aria-disabled={page === 1}
        className={`px-4 py-2 text-sm font-semibold border border-zinc-200 text-zinc-700 hover:border-zinc-900 transition-colors ${page === 1 ? 'pointer-events-none opacity-30' : ''}`}
      >
        Prev
      </Link>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={`w-10 h-10 flex items-center justify-center text-sm font-semibold border transition-colors ${
            p === page ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-700 hover:border-zinc-900'
          }`}
        >
          {p}
        </Link>
      ))}
      <Link
        href={hrefFor(page + 1)}
        aria-disabled={page === totalPages}
        className={`px-4 py-2 text-sm font-semibold border border-zinc-200 text-zinc-700 hover:border-zinc-900 transition-colors ${page === totalPages ? 'pointer-events-none opacity-30' : ''}`}
      >
        Next
      </Link>
    </div>
  );
}
