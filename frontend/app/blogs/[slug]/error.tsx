'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function BlogError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Blog page error]', error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3">Something went wrong</p>
      <h1 className="text-2xl font-black text-zinc-900 mb-3">Couldn&apos;t load this post</h1>
      <p className="text-sm text-zinc-500 mb-8">
        The article failed to load. Try refreshing the page or come back in a moment.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-6 py-2.5 bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase hover:bg-zinc-700 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/blogs"
          className="px-6 py-2.5 border border-zinc-300 text-xs font-bold tracking-widest uppercase text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-colors"
        >
          All Posts
        </Link>
      </div>
    </div>
  );
}
