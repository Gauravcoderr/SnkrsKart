import { permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Blog } from '@/types';
import NewsletterSignup from '@/components/blog/NewsletterSignup';
import BlogsGrid from './BlogsGrid';
import { getAccent, formatDate, readingTime, isNew, PAGE_SIZE } from './blogUtils';
import { fetchPaginated } from '@/lib/pagination';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snkrscart.com';

export const metadata = {
  title: { absolute: 'Sneaker Blog | SNKRS CART' },
  description: "Latest sneaker news, release guides, style tips, and brand stories from SNKRS CART — India's trusted sneaker platform.",
  alternates: { canonical: `${SITE_URL}/blogs` },
  openGraph: {
    title: 'Sneaker Blog | SNKRS CART',
    description: 'Latest sneaker news, release guides, and style tips from SNKRS CART.',
    url: `${SITE_URL}/blogs`, siteName: 'SNKRS CART', type: 'website',
    images: [{ url: `${SITE_URL}/logo.png`, width: 512, height: 512, alt: 'SNKRS CART Sneaker Blog' }],
  },
  twitter: { card: 'summary_large_image', title: 'Sneaker Blog | SNKRS CART', description: 'Latest sneaker content from SNKRS CART.', images: [`${SITE_URL}/logo.png`] },
};

export default async function BlogsPage({ searchParams }: { searchParams?: { tag?: string } }) {
  if (searchParams?.tag) {
    permanentRedirect(`/blogs/tag/${encodeURIComponent(searchParams.tag)}`);
  }

  const { blogs: firstPage, total, pages } = await fetchPaginated<Blog>(
    `${API}/blogs?page=1&limit=${PAGE_SIZE}`,
    { cache: 'no-store' },
  );

  const [hero, ...gridBlogs] = firstPage;

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Blog',
    name: 'SNKRS CART Blog',
    description: 'Sneaker news, release guides, and style content from SNKRS CART.',
    url: `${SITE_URL}/blogs`,
    publisher: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
    blogPost: firstPage.map((b: Blog) => ({
      '@type': 'BlogPosting', headline: b.title,
      url: `${SITE_URL}/blogs/${b.slug}`,
      datePublished: b.createdAt,
      dateModified: b.updatedAt || b.createdAt,
      author: { '@type': 'Person', name: b.author, url: SITE_URL, image: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
      ...(b.coverImage ? { image: { '@type': 'ImageObject', url: b.coverImage, width: 1200, height: 630 } } : {}),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1.5">SNKRS CART</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900">Sneaker Blog</h1>
          <p className="text-zinc-500 text-sm mt-2">
            Release guides, brand stories &amp; style tips — for India&apos;s sneaker community.
          </p>
        </div>

        {firstPage.length === 0 ? (
          <div className="text-center py-24 text-zinc-400">
            <p className="text-lg font-semibold">No posts yet.</p>
            <p className="text-sm mt-1">Check back soon for sneaker content.</p>
          </div>
        ) : (
          <>
            {/* ── Hero card (first post, SSR) ───────────────────── */}
            {hero && (() => {
              const a = getAccent(hero.tags);
              return (
                <div className={`group relative rounded-2xl overflow-hidden border ${a.border} ${a.bg} mb-12 transition-shadow hover:shadow-xl`}>
                  <Link href={`/blogs/${hero.slug}`} className="absolute inset-0 z-10" aria-label={hero.title} />
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Image */}
                    <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[340px] bg-zinc-100 overflow-hidden">
                      {hero.coverImage ? (
                        <Image
                          src={hero.coverImage}
                          alt={hero.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width:1024px) 100vw, 50vw"
                          priority
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${a.heroGrad} flex items-center justify-center`}>
                          <span className="text-6xl opacity-20">👟</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 z-20 pointer-events-none">
                        <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-zinc-800 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Featured
                        </span>
                      </div>
                      {isNew(hero.createdAt) && (
                        <div className="absolute top-4 right-4 z-20 pointer-events-none">
                          <span className="bg-zinc-900 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full">NEW</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="relative p-8 lg:p-10 xl:p-12 flex flex-col justify-center pointer-events-none">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hero.tags.slice(0, 3).map((t) => (
                          <Link key={t} href={`/blogs/tag/${encodeURIComponent(t.toLowerCase().replace(/\s+/g, '-'))}`} className={`relative z-20 pointer-events-auto text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${a.tagBg} ${a.tagText} hover:opacity-75 transition-opacity`}>{t}</Link>
                        ))}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 leading-[1.15] mb-3">
                        {hero.title}
                      </h2>
                      {hero.excerpt && (
                        <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3 mb-6">{hero.excerpt}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${a.dot}`} />
                        <span className="font-semibold text-zinc-600">{hero.author}</span>
                        <span>&middot;</span>
                        <span>{formatDate(hero.createdAt)}</span>
                        <span>&middot;</span>
                        <span>{readingTime(hero.content)} min read</span>
                      </div>
                      <span className={`inline-flex items-center gap-2 ${a.tagBg} ${a.tagText} px-5 py-2.5 rounded-full text-xs font-black tracking-widest uppercase w-fit group-hover:scale-105 transition-transform`}>
                        Read Article
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Infinite-scroll grid (client component) ───────── */}
            <BlogsGrid
              initialBlogs={gridBlogs}
              initialPage={1}
              totalPages={pages}
              total={total}
            />

            {/* ── Newsletter ───────────────────────────────────── */}
            <NewsletterSignup />

            {/* ── WhatsApp CTA ─────────────────────────────────── */}
            <div className="rounded-2xl bg-[#075E54] px-8 py-10 sm:px-12 sm:py-12 flex flex-col sm:flex-row items-start sm:items-center gap-7 mb-4">
              <div className="flex-1">
                <p className="text-[11px] font-bold tracking-widest uppercase text-white/40 mb-2">Never Miss a Drop</p>
                <h2 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight">Get Sneaker Alerts on WhatsApp</h2>
                <p className="text-sm text-white/60 max-w-sm leading-relaxed">
                  Latest drops, restocks &amp; exclusive deals — straight to your phone.
                </p>
              </div>
              <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919410903791'}?text=${encodeURIComponent('Hey SNKRS CART! I want to get sneaker drop alerts on WhatsApp.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white font-black text-sm hover:bg-[#20bb5a] transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Join on WhatsApp
                </a>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors border border-white/20"
                >
                  Shop Sneakers
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
