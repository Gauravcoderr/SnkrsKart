import type { CartItem } from '@/types';
import { variantId } from '@/lib/merchantFacts';

type Gtag = (...args: unknown[]) => void;

export const GOOGLE_ADS_PURCHASE = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE ?? '';
export const GOOGLE_ADS_ID = GOOGLE_ADS_PURCHASE.split('/')[0];

export function trackPurchase(orderNumber: string, value: number, items: CartItem[]) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (!gtag || !orderNumber) return;
  const key = `purchase_tracked_${orderNumber}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {}
  gtag('event', 'purchase', {
    transaction_id: orderNumber,
    value,
    currency: 'INR',
    shipping: 0,
    items: items.map((item) => ({
      item_id: variantId(item.product.slug, {
        size: String(item.size),
        isShoe: (item.product.productType ?? 'shoes') === 'shoes',
      }),
      item_name: item.product.name,
      item_brand: item.product.brand,
      item_variant: String(item.size),
      price: item.product.price,
      quantity: item.quantity,
    })),
  });
  if (GOOGLE_ADS_PURCHASE) {
    gtag('event', 'conversion', {
      send_to: GOOGLE_ADS_PURCHASE,
      value,
      currency: 'INR',
      transaction_id: orderNumber,
    });
  }
}
