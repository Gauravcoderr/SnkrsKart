/**
 * Shareable cart links: /cart/add?items=<slug>:<size>[:<qty>],...
 * AI agents (MCP build_cart_link), JSON-LD variant URLs and shared links hand a buyer a
 * filled bag; the buyer still checks out themselves (OTP + payment).
 */

import type { Offer, Product } from '@/types';
import type { CartItemMeta } from '@/context/CartContext';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export const MAX_CART_LINK_ITEMS = 10;
const MAX_QTY = 5;

export interface CartLinkItem {
  slug: string;
  size: string;
  quantity: number;
}

export function parseCartItems(raw: string | string[] | undefined): CartLinkItem[] {
  const value = Array.isArray(raw) ? raw.join(',') : raw ?? '';
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, MAX_CART_LINK_ITEMS)
    .flatMap((part) => {
      const [slug, size, qty] = part.split(':').map((s) => decodeURIComponent(s ?? '').trim());
      if (!slug || !size || !/^[a-z0-9-]{1,160}$/.test(slug)) return [];
      const quantity = Math.min(MAX_QTY, Math.max(1, Number.parseInt(qty ?? '1', 10) || 1));
      return [{ slug, size: size.slice(0, 20), quantity }];
    });
}

export function cartLink(items: CartLinkItem[]): string {
  const value = items
    .slice(0, MAX_CART_LINK_ITEMS)
    .map((i) => [i.slug, encodeURIComponent(i.size), ...(i.quantity > 1 ? [String(i.quantity)] : [])].join(':'))
    .join(',');
  return `${SITE_URL}/cart/add?items=${value}`;
}

/** The size value as the product stores it (number for UK shoe sizes), only when buyable now. */
export function buyableSize(product: Pick<Product, 'productType' | 'availableSizes' | 'availableStringSizes' | 'offers' | 'soldOut' | 'comingSoon'>, wanted: string): number | string | undefined {
  if (product.soldOut || product.comingSoon) return undefined;
  const offers = product.offers ?? [];
  const buyable: Array<number | string> = offers.length > 0
    ? offers.map((o) => o.size)
    : product.productType === 'shoes' ? product.availableSizes : product.availableStringSizes ?? [];
  const w = wanted.trim().toLowerCase().replace(/^uk\s*/, '');
  return buyable.find((s) => String(s).toLowerCase() === w);
}

/** Product + meta exactly as AddToCartButton puts them in the bag for this size. */
export function cartEntry(product: Product, size: number | string): { product: Product; meta?: CartItemMeta } {
  const offer: Offer | undefined = product.offers?.find((o) => String(o.size) === String(size));
  if (offer) {
    return {
      product: { ...product, price: offer.price, originalPrice: offer.originalPrice },
      meta: { listingId: offer.listingId, availability: offer.availability },
    };
  }
  const variant = product.variants?.find((v) => String(v.size) === String(size));
  return { product: variant ? { ...product, price: variant.price, originalPrice: variant.originalPrice } : product };
}
