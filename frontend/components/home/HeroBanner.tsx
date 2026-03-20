import Image from 'next/image';
import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section className="relative w-full min-h-[calc(100vh-112px)] flex flex-col md:flex-row">
      {/* Left: Dark text side */}
      <div className="flex flex-col justify-center bg-zinc-950 text-white px-8 sm:px-12 lg:px-20 py-16 md:py-0 md:w-1/2 z-10">
        <p className="text-xs font-semibold tracking-[0.4em] uppercase text-zinc-400 mb-6">
          New Season Drop
        </p>
        <h1 className="font-display text-7xl sm:text-8xl lg:text-9xl leading-none tracking-tight mb-6">
          FIND
          <br />
          YOUR
          <br />
          <span className="text-zinc-400">SOLE.</span>
        </h1>
        <p className="text-base text-zinc-400 max-w-xs mb-10 leading-relaxed">
          Premium sneakers from the world&apos;s most iconic brands. Curated for those who care.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-zinc-900 px-8 py-3.5 text-sm font-bold tracking-widest uppercase hover:bg-zinc-100 transition-colors"
          >
            Shop Now
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/products?sort=newest"
            className="inline-flex items-center gap-2 border border-zinc-600 text-white px-8 py-3.5 text-sm font-bold tracking-widest uppercase hover:border-white transition-colors"
          >
            New Arrivals
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-10 mt-16 pt-10 border-t border-zinc-800">
          {[
            { value: '30+', label: 'Styles' },
            { value: '6', label: 'Top Brands' },
            { value: '100%', label: 'Authentic' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-3xl text-white">{stat.value}</p>
              <p className="text-xs text-zinc-500 tracking-widest uppercase mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Hero image */}
      <div className="relative md:w-1/2 h-72 md:h-auto min-h-[320px] bg-zinc-100">
        <Image
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=90"
          alt="Featured sneaker drop"
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Subtle dark gradient on left edge to blend with text panel */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950/30 to-transparent md:hidden" />

        {/* Floating product tag */}
        <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm p-4 shadow-lg max-w-[200px]">
          <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-0.5">
            Featured Drop
          </p>
          <p className="text-sm font-bold text-zinc-900">Nike Air Max 90</p>
          <p className="text-xs text-zinc-500">White / Black / Grey</p>
          <p className="text-sm font-bold text-zinc-900 mt-1">₹12,995</p>
        </div>
      </div>
    </section>
  );
}
