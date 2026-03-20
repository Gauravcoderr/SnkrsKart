import Link from 'next/link';

export default function EmptyCart({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold tracking-wider uppercase text-zinc-900 mb-2">Your bag is empty</h3>
      <p className="text-sm text-zinc-500 mb-8 max-w-xs">
        Looks like you haven&apos;t added anything yet. Start shopping to fill it up.
      </p>
      <Link
        href="/products"
        onClick={onClose}
        className="inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-3.5 text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors"
      >
        Shop Now
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  );
}
