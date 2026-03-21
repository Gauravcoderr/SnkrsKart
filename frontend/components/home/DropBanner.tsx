import Image from 'next/image';
import Link from 'next/link';

export default function DropBanner() {
  return (
    <section className="bg-zinc-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center min-h-[420px]">
          {/* Product image */}
          <div className="relative w-full md:w-5/12 h-72 md:h-auto flex items-center justify-center py-8 md:py-0">
            <div className="relative w-64 h-64 md:w-80 md:h-80 rotate-[-8deg] hover:rotate-0 transition-transform duration-500">
              <Image
                src="https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=90"
                alt="Featured drop — Adidas Samba OG"
                fill
                className="object-contain drop-shadow-2xl"
                sizes="320px"
              />
            </div>
          </div>

          {/* Text content */}
          <div className="w-full md:w-7/12 py-12 md:py-16 md:pl-16">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.4em] uppercase text-emerald-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Now Available
            </span>
            <h2 className="font-display text-6xl md:text-7xl lg:text-8xl text-white leading-none tracking-tight mb-4">
              SAMBA
              <br />
              <span className="text-zinc-500">OG</span>
            </h2>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed mb-3">
              The shoe that started it all. Back in the game since 1950 — the Adidas Samba OG has
              never been more relevant.
            </p>
            <p className="text-zinc-400 text-sm mb-8">
              <span className="text-white font-bold text-xl">₹9,995</span>
              <span className="ml-2 text-zinc-500">· Cloud White / Core Black</span>
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products/adidas-samba-og-white-black"
                className="inline-flex items-center gap-2 bg-white text-zinc-900 px-8 py-3.5 text-sm font-bold tracking-widest uppercase hover:bg-zinc-100 transition-colors"
              >
                Shop Now
              </Link>
              <Link
                href="/brands/adidas"
                className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-400 px-8 py-3.5 text-sm font-bold tracking-widest uppercase hover:border-zinc-500 hover:text-white transition-colors"
              >
                All Adidas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
