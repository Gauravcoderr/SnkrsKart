import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { CartItem } from '@/types';

interface CartSummaryProps {
  items: CartItem[];
  subtotal: number;
}

export default function CartSummary({ items, subtotal }: CartSummaryProps) {
  const totalSavings = items.reduce((acc, item) => {
    if (item.product.originalPrice) {
      return acc + (item.product.originalPrice - item.product.price) * item.quantity;
    }
    return acc;
  }, 0);

  return (
    <div className="bg-zinc-50 p-6 space-y-4">
      <h3 className="text-sm font-bold tracking-widest uppercase text-zinc-900">Order Summary</h3>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600">
            Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)
          </span>
          <span className="font-semibold text-zinc-900">{formatPrice(subtotal)}</span>
        </div>
        {totalSavings > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600 font-medium">You&apos;re saving</span>
            <span className="text-emerald-600 font-semibold">−{formatPrice(totalSavings)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600">Shipping</span>
          <span className={subtotal >= 3000 ? 'text-emerald-600 font-medium' : 'text-zinc-600'}>
            {subtotal >= 3000 ? 'FREE' : formatPrice(299)}
          </span>
        </div>
        {subtotal < 3000 && (
          <p className="text-xs text-zinc-400">
            Add {formatPrice(3000 - subtotal)} more for free shipping
          </p>
        )}
      </div>

      <div className="border-t border-zinc-200 pt-4">
        <div className="flex justify-between">
          <span className="font-bold text-zinc-900">Total</span>
          <span className="font-bold text-xl text-zinc-900">
            {formatPrice(subtotal + (subtotal >= 3000 ? 0 : 299))}
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">Including all taxes</p>
      </div>

      <Link
        href="/checkout"
        className="block w-full py-4 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase text-center hover:bg-zinc-700 transition-colors"
      >
        Proceed to Checkout →
      </Link>

      <p className="text-center text-xs text-zinc-400">
        Pay via UPI · Delivery in 3–7 business days
      </p>
    </div>
  );
}
