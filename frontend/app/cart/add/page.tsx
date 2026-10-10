import type { Metadata } from 'next';
import { fetchProductBySlug, NotFoundError } from '@/lib/api';
import { fullProductName } from '@/lib/productTitle';
import { buyableSize, cartEntry, parseCartItems } from '@/lib/cartLink';
import CartAddClient, { type CartAddLine, type CartAddProblem } from './CartAddClient';

export const metadata: Metadata = {
  title: { absolute: 'Adding to your bag | Snkrs Cart' },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ items?: string | string[] }>;
}

export default async function CartAddPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const wanted = parseCartItems(searchParams.items);
  const results = await Promise.all(wanted.map(async (w): Promise<CartAddLine | CartAddProblem> => {
    try {
      const product = await fetchProductBySlug(w.slug);
      const size = buyableSize(product, w.size);
      const name = fullProductName(product.brand, product.name);
      if (size === undefined) {
        return { problem: `${name} is not available in size ${w.size} right now.`, href: `/products/${product.slug}` };
      }
      return { ...cartEntry(product, size), size, quantity: w.quantity };
    } catch (e) {
      if (e instanceof NotFoundError) return { problem: `We could not find "${w.slug}".`, href: '/products' };
      return { problem: `Could not load "${w.slug}". Please try again.`, href: `/products/${w.slug}` };
    }
  }));

  const lines = results.filter((r): r is CartAddLine => !('problem' in r));
  const problems = results.filter((r): r is CartAddProblem => 'problem' in r);
  if (wanted.length === 0) problems.push({ problem: 'This bag link is empty or malformed.', href: '/products' });

  return <CartAddClient lines={lines} problems={problems} />;
}
