import Link from 'next/link';
import Image from 'next/image';
import type { Blog } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

const TAG_ACCENTS: Record<string, { bg: string; tagBg: string; tagText: string; accent: string; border: string; dot: string; heroGrad: string }> = {
  jordan:        { bg: 'bg-red-50',     tagBg: 'bg-red-100',     tagText: 'text-red-700',     accent: 'text-red-600',     border: 'border-red-200',    dot: 'bg-red-400',    heroGrad: 'from-red-900 to-red-700'      },
  nike:          { bg: 'bg-orange-50',  tagBg: 'bg-orange-100',  tagText: 'text-orange-700',  accent: 'text-orange-600',  border: 'border-orange-200', dot: 'bg-orange-400', heroGrad: 'from-orange-900 to-orange-700' },
  adidas:        { bg: 'bg-blue-50',    tagBg: 'bg-blue-100',    tagText: 'text-blue-700',    accent: 'text-blue-600',    border: 'border-blue-200',   dot: 'bg-blue-400',   heroGrad: 'from-blue-900 to-blue-700'    },
  'new-balance': { bg: 'bg-amber-50',   tagBg: 'bg-amber-100',   tagText: 'text-amber-700',   accent: 'text-amber-600',   border: 'border-amber-200',  dot: 'bg-amber-400',  heroGrad: 'from-amber-900 to-amber-700'  },
  'new balance': { bg: 'bg-amber-50',   tagBg: 'bg-amber-100',   tagText: 'text-amber-700',   accent: 'text-amber-600',   border: 'border-amber-200',  dot: 'bg-amber-400',  heroGrad: 'from-amber-900 to-amber-700'  },
  crocs:         { bg: 'bg-green-50',   tagBg: 'bg-green-100',   tagText: 'text-green-700',   accent: 'text-green-600',   border: 'border-green-200',  dot: 'bg-green-400',  heroGrad: 'from-green-900 to-green-700'  },
  guide:         { bg: 'bg-violet-50',  tagBg: 'bg-violet-100',  tagText: 'text-violet-700',  accent: 'text-violet-600',  border: 'border-violet-200', dot: 'bg-violet-400', heroGrad: 'from-violet-900 to-violet-700' },
  india:         { bg: 'bg-emerald-50', tagBg: 'bg-emerald-100', tagText: 'text-emerald-700', accent: 'text-emerald-600', border: 'border-emerald-200',dot: 'bg-emerald-400',heroGrad: 'from-emerald-900 to-emerald-700'},
  history:       { bg: 'bg-stone-50',   tagBg: 'bg-stone-200',   tagText: 'text-stone-700',   accent: 'text-stone-600',   border: 'border-stone-200',  dot: 'bg-stone-400',  heroGrad: 'from-stone-800 to-stone-700'  },
  trends:        { bg: 'bg-pink-50',    tagBg: 'bg-pink-100',    tagText: 'text-pink-700',    accent: 'text-pink-600',    border: 'border-pink-200',   dot: 'bg-pink-400',   heroGrad: 'from-pink-900 to-pink-700'    },
  releases:      { bg: 'bg-cyan-50',    tagBg: 'bg-cyan-100',    tagText: 'text-cyan-700',    accent: 'text-cyan-600',    border: 'border-cyan-200',   dot: 'bg-cyan-400',   heroGrad: 'from-cyan-900 to-cyan-700'    },
  collaboration: { bg: 'bg-purple-50',  tagBg: 'bg-purple-100',  tagText: 'text-purple-700',  accent: 'text-purple-600',  border: 'border-purple-200', dot: 'bg-purple-400', heroGrad: 'from-purple-900 to-purple-700' },
  'style guide': { bg: 'bg-teal-50',    tagBg: 'bg-teal-100',    tagText: 'text-teal-700',    accent: 'text-teal-600',    border: 'border-teal-200',   dot: 'bg-teal-400',   heroGrad: 'from-teal-900 to-teal-700'    },
  'care guide':  { bg: 'bg-lime-50',    tagBg: 'bg-lime-100',    tagText: 'text-lime-700',    accent: 'text-lime-600',    border: 'border-lime-200',   dot: 'bg-lime-500',   heroGrad: 'from-lime-900 to-lime-700'    },
};

const DEFAULT_ACCENT = {
  bg: 'bg-zinc-50', tagBg: 'bg-zinc-100', tagText: 'text-zinc-600',
  accent: 'text-zinc-600', border: 'border-zinc-200', dot: 'bg-zinc-400',
  heroGrad: 'from-zinc-900 to-zinc-700',
};

function getAccent(tags: string[]) {
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (TAG_ACCENTS[key]) return TAG_ACCENTS[key];
  }
  return DEFAULT_ACCENT;
}

async function fetchBlogs(): Promise<Blog[]> {
  try {
    const res = await fetch(`${API}/blogs`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function readingTime(content: string): number {
  const text = (content || '').replace(/<[^>]*>/g, '');
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
}

function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export const metadata = {
  title: 'Sneaker Blog | SNKRS CART',
  description: "Latest sneaker news, release guides, style tips, and brand stories from SNKRS CART — India's trusted sneaker platform.",
  alternates: { canonical: `${SITE_URL}/blogs` },
  openGraph: {
    title: 'Sneaker Blog | SNKRS CART',
    description: 'Latest sneaker news, release guides, and style tips from SNKRS CART.',
    url: `${SITE_URL}/blogs`, siteName: 'SNKRS CART', type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Sneaker Blog | SNKRS CART', description: 'Latest sneaker content from SNKRS CART.' },
};

export default async function BlogsPage() {
  const blogs = await fetchBlogs();

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Blog',
    name: 'SNKRS CART Blog',
    description: 'Sneaker news, release guides, and style content from SNKRS CART.',
    url: `${SITE_URL}/blogs`,
    publisher: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } },
    blogPost: blogs.map((b) => ({
      '@type': 'BlogPosting', headline: b.title,
      url: `${SITE_URL}/blogs/${b.slug}`, datePublished: b.createdAt,
      author: { '@type': 'Person', name: b.author },
      ...(b.coverImage ? { image: b.coverImage } : {}),
    })),
  };

  const [hero, ...rest] = blogs;

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

        {blogs.length === 0 ? (
          <div className="text-center py-24 text-zinc-400">
            <p className="text-lg font-semibold">No posts yet.</p>
            <p className="text-sm mt-1">Check back soon for sneaker content.</p>
          </div>
        ) : (
          <>
            {/* ── Hero card (first post) ─────────────────────────── */}
            {hero && (() => {
              const a = getAccent(hero.tags);
              return (
                <Link
                  href={`/blogs/${hero.slug}`}
                  className={`group block rounded-2xl overflow-hidden border ${a.border} ${a.bg} mb-12 transition-shadow hover:shadow-xl`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Image */}
                    <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[340px] bg-zinc-100 overflow-hidden">
                      {hero.coverImage ? (
                        <Image
                          src={hero.coverImage}
                          alt={hero.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width:1024px) 100vw, 50vw"
                          priority
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${a.heroGrad} flex items-center justify-center`}>
                          <span className="text-6xl opacity-20">👟</span>
                        </div>
                      )}
                      {/* Featured badge */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-zinc-800 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Featured
                        </span>
                      </div>
                      {isNew(hero.createdAt) && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-zinc-900 text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full">NEW</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-8 lg:p-10 xl:p-12 flex flex-col justify-center">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hero.tags.slice(0, 3).map((t) => (
                          <Link key={t} href={`/blogs/tag/${encodeURIComponent(t.toLowerCase())}`} onClick={(e) => e.stopPropagation()} className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${a.tagBg} ${a.tagText} hover:opacity-75 transition-opacity`}>{t}</Link>
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
                </Link>
              );
            })()}

            {/* ── Section divider ────────────────────────────────── */}
            {rest.length > 0 && (
              <div className="flex items-center gap-3 mb-8">
                <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-400">Latest Posts</p>
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="text-[11px] text-zinc-400">{rest.length} article{rest.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* ── Grid ──────────────────────────────────────────── */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 mb-16">
                {rest.map((blog) => {
                  const a = getAccent(blog.tags);
                  return (
                    <Link
                      key={blog._id}
                      href={`/blogs/${blog.slug}`}
                      className={`group block rounded-2xl overflow-hidden border ${a.border} ${a.bg} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                    >
                      {/* Cover image */}
                      <div className="relative aspect-[16/9] bg-zinc-100 overflow-hidden">
                        {blog.coverImage ? (
                          <Image
                            src={blog.coverImage}
                            alt={blog.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${a.heroGrad} flex items-center justify-center`}>
                            <span className="text-4xl opacity-20">👟</span>
                          </div>
                        )}
                        {isNew(blog.createdAt) && (
                          <div className="absolute top-3 right-3">
                            <span className="bg-zinc-900 text-white text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full shadow">NEW</span>
                          </div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-5 sm:p-6">
                        {blog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {blog.tags.slice(0, 2).map((t) => (
                              <Link key={t} href={`/blogs/tag/${encodeURIComponent(t.toLowerCase())}`} onClick={(e) => e.stopPropagation()} className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${a.tagBg} ${a.tagText} hover:opacity-75 transition-opacity`}>{t}</Link>
                            ))}
                          </div>
                        )}
                        <h2 className="text-sm font-black tracking-tight text-zinc-950 group-hover:text-zinc-600 transition-colors leading-snug mb-2 line-clamp-2">
                          {blog.title}
                        </h2>
                        {blog.excerpt && (
                          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-4">
                            {blog.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.dot}`} />
                            <span>{formatDate(blog.createdAt)}</span>
                            <span>&middot;</span>
                            <span>{readingTime(blog.content)} min read</span>
                          </div>
                          <svg
                            className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

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
