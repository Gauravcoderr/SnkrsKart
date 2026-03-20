import Link from 'next/link';
import Image from 'next/image';
import type { Blog } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

const TAG_ACCENTS: Record<string, { tagBg: string; tagText: string; dot: string; heroGrad: string; stripBg: string }> = {
  jordan:        { tagBg: 'bg-red-500/20',     tagText: 'text-red-300',     dot: 'bg-red-400',    heroGrad: 'from-red-950 via-red-900/60 to-black',      stripBg: 'bg-red-500'     },
  nike:          { tagBg: 'bg-orange-500/20',  tagText: 'text-orange-300',  dot: 'bg-orange-400', heroGrad: 'from-orange-950 via-orange-900/60 to-black', stripBg: 'bg-orange-500'  },
  adidas:        { tagBg: 'bg-blue-500/20',    tagText: 'text-blue-300',    dot: 'bg-blue-400',   heroGrad: 'from-blue-950 via-blue-900/60 to-black',    stripBg: 'bg-blue-500'    },
  'new-balance': { tagBg: 'bg-amber-500/20',   tagText: 'text-amber-300',   dot: 'bg-amber-400',  heroGrad: 'from-amber-950 via-amber-900/60 to-black',  stripBg: 'bg-amber-500'   },
  'new balance': { tagBg: 'bg-amber-500/20',   tagText: 'text-amber-300',   dot: 'bg-amber-400',  heroGrad: 'from-amber-950 via-amber-900/60 to-black',  stripBg: 'bg-amber-500'   },
  crocs:         { tagBg: 'bg-green-500/20',   tagText: 'text-green-300',   dot: 'bg-green-400',  heroGrad: 'from-green-950 via-green-900/60 to-black',  stripBg: 'bg-green-500'   },
  guide:         { tagBg: 'bg-violet-500/20',  tagText: 'text-violet-300',  dot: 'bg-violet-400', heroGrad: 'from-violet-950 via-violet-900/60 to-black',stripBg: 'bg-violet-500'  },
  india:         { tagBg: 'bg-emerald-500/20', tagText: 'text-emerald-300', dot: 'bg-emerald-400',heroGrad: 'from-emerald-950 via-emerald-900/60 to-black',stripBg:'bg-emerald-500' },
  history:       { tagBg: 'bg-stone-500/20',   tagText: 'text-stone-300',   dot: 'bg-stone-400',  heroGrad: 'from-stone-950 via-stone-800/60 to-black',  stripBg: 'bg-stone-500'   },
  trends:        { tagBg: 'bg-pink-500/20',    tagText: 'text-pink-300',    dot: 'bg-pink-400',   heroGrad: 'from-pink-950 via-pink-900/60 to-black',    stripBg: 'bg-pink-500'    },
  releases:      { tagBg: 'bg-cyan-500/20',    tagText: 'text-cyan-300',    dot: 'bg-cyan-400',   heroGrad: 'from-cyan-950 via-cyan-900/60 to-black',    stripBg: 'bg-cyan-500'    },
  collaboration: { tagBg: 'bg-purple-500/20',  tagText: 'text-purple-300',  dot: 'bg-purple-400', heroGrad: 'from-purple-950 via-purple-900/60 to-black',stripBg: 'bg-purple-500'  },
  'style guide': { tagBg: 'bg-teal-500/20',    tagText: 'text-teal-300',    dot: 'bg-teal-400',   heroGrad: 'from-teal-950 via-teal-900/60 to-black',    stripBg: 'bg-teal-500'    },
  'care guide':  { tagBg: 'bg-lime-500/20',    tagText: 'text-lime-300',    dot: 'bg-lime-400',   heroGrad: 'from-lime-950 via-lime-900/60 to-black',    stripBg: 'bg-lime-500'    },
};

const DEFAULT_ACCENT = {
  tagBg: 'bg-white/10', tagText: 'text-white/80', dot: 'bg-zinc-400',
  heroGrad: 'from-zinc-950 via-zinc-800/60 to-black', stripBg: 'bg-zinc-500',
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
    publisher: { '@type': 'Organization', name: 'SNKRS CART', url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.jpg` } },
    blogPost: blogs.map((b) => ({
      '@type': 'BlogPosting', headline: b.title,
      url: `${SITE_URL}/blogs/${b.slug}`, datePublished: b.createdAt,
      author: { '@type': 'Person', name: b.author },
      ...(b.coverImage ? { image: b.coverImage } : {}),
    })),
  };

const WA = process.env.NEXT_PUBLIC_WHATSAPP || '919410903791';

  const [hero, second, ...rest] = blogs;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Cinematic page header — same dark feel as detail page ── */}
      <div className="relative bg-zinc-950 overflow-hidden">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[image:repeating-linear-gradient(0deg,#fff_0,#fff_1px,transparent_1px,transparent_40px),repeating-linear-gradient(90deg,#fff_0,#fff_1px,transparent_1px,transparent_40px)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <p className="text-[11px] font-bold tracking-[0.35em] uppercase text-zinc-500 mb-3">SNKRS CART</p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-none mb-4">
            Sneaker<br />
            <span className="text-zinc-500">Blog.</span>
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-lg leading-relaxed">
            Releases, collabs, style guides &amp; brand deep-dives — written for India&apos;s sneaker community.
          </p>
          {/* Trust signals */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-xs text-zinc-600">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Updated weekly
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Original content only
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Drop alerts via WhatsApp
            </span>
          </div>
        </div>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-24 text-zinc-400 max-w-7xl mx-auto px-4">
          <p className="text-lg font-semibold">No posts yet.</p>
          <p className="text-sm mt-1">Check back soon for sneaker content.</p>
        </div>
      ) : (
        <>
          {/* ── Hero post — full-bleed cinematic, same as detail page ── */}
          {hero && (() => {
            const a = getAccent(hero.tags);
            return (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                <Link
                  href={`/blogs/${hero.slug}`}
                  className="group relative block rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_32px_80px_rgba(0,0,0,0.35)] transition-shadow duration-500 min-h-[520px]"
                >
                  {/* Full-bleed background */}
                  <div className="absolute inset-0 bg-zinc-900">
                    {hero.coverImage ? (
                      <Image
                        src={hero.coverImage}
                        alt={hero.title}
                        fill
                        className="object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                        sizes="100vw"
                        priority
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${a.heroGrad}`} />
                    )}
                  </div>

                  {/* Dark gradient overlay — text comes from bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />

                  {/* Top badges */}
                  <div className="absolute top-5 left-5 flex items-center gap-2 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Featured
                    </span>
                    {isNew(hero.createdAt) && (
                      <span className="bg-white text-zinc-900 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full">
                        NEW
                      </span>
                    )}
                  </div>

                  {/* Content overlaid at bottom */}
                  <div className="relative z-10 flex flex-col justify-end min-h-[520px] p-8 sm:p-10 lg:p-12">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hero.tags.slice(0, 3).map((t) => (
                        <span key={t} className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full backdrop-blur-sm ${a.tagBg} ${a.tagText} border border-white/10`}>
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight text-white leading-[1.1] mb-4 max-w-3xl drop-shadow-lg">
                      {hero.title}
                    </h2>

                    {/* Excerpt */}
                    {hero.excerpt && (
                      <p className="text-sm sm:text-base text-white/70 leading-relaxed line-clamp-2 mb-5 max-w-2xl">
                        {hero.excerpt}
                      </p>
                    )}

                    {/* Meta + CTA */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-xs text-white/60">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${a.dot}`} />
                        <span className="font-semibold text-white/80">{hero.author}</span>
                        <span>&middot;</span>
                        <span>{formatDate(hero.createdAt)}</span>
                        <span>&middot;</span>
                        <span>{readingTime(hero.content)} min read</span>
                      </div>
                      <span className={`inline-flex items-center gap-2 ${a.tagBg} ${a.tagText} backdrop-blur-sm border border-white/10 px-5 py-2.5 rounded-full text-xs font-black tracking-widest uppercase group-hover:scale-105 transition-transform`}>
                        Read Article
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })()}

          {/* ── Second post — wide horizontal card ───────────────────── */}
          {second && (() => {
            const a = getAccent(second.tags);
            return (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
                <Link
                  href={`/blogs/${second.slug}`}
                  className="group relative block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500 min-h-[260px]"
                >
                  <div className="absolute inset-0 bg-zinc-900">
                    {second.coverImage ? (
                      <Image
                        src={second.coverImage}
                        alt={second.title}
                        fill
                        className="object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700"
                        sizes="100vw"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${a.heroGrad}`} />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20" />

                  {isNew(second.createdAt) && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-white text-zinc-900 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full">NEW</span>
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col justify-center min-h-[260px] p-7 sm:p-9 max-w-2xl">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {second.tags.slice(0, 2).map((t) => (
                        <span key={t} className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full backdrop-blur-sm ${a.tagBg} ${a.tagText} border border-white/10`}>{t}</span>
                      ))}
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight mb-3">
                      {second.title}
                    </h2>
                    {second.excerpt && (
                      <p className="text-sm text-white/60 line-clamp-1 mb-4">{second.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.dot}`} />
                      <span className="font-medium text-white/70">{second.author}</span>
                      <span>&middot;</span>
                      <span>{formatDate(second.createdAt)}</span>
                      <span>&middot;</span>
                      <span>{readingTime(second.content)} min read</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })()}

          {/* ── Remaining posts — cinematic overlay cards ─────────── */}
          {rest.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-10">
              {/* Section label */}
              <div className="flex items-center gap-3 mb-5">
                <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-400">More Stories</p>
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="text-[11px] text-zinc-400">{rest.length} article{rest.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map((blog) => {
                  const a = getAccent(blog.tags);
                  return (
                    <Link
                      key={blog._id}
                      href={`/blogs/${blog.slug}`}
                      className="group relative block rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 bg-zinc-900 min-h-[320px]"
                    >
                      {/* Full-bleed image */}
                      <div className="absolute inset-0">
                        {blog.coverImage ? (
                          <Image
                            src={blog.coverImage}
                            alt={blog.title}
                            fill
                            className="object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
                            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${a.heroGrad}`} />
                        )}
                      </div>

                      {/* Gradient overlay — content at bottom */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />

                      {/* Accent top strip */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 ${a.stripBg} opacity-80`} />

                      {/* NEW badge */}
                      {isNew(blog.createdAt) && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-white text-zinc-900 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full shadow">NEW</span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="relative z-10 flex flex-col justify-end min-h-[320px] p-5">
                        {/* Tags */}
                        {blog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {blog.tags.slice(0, 2).map((t) => (
                              <span key={t} className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full backdrop-blur-sm ${a.tagBg} ${a.tagText} border border-white/10`}>{t}</span>
                            ))}
                          </div>
                        )}

                        <h2 className="text-sm sm:text-base font-black tracking-tight text-white leading-snug mb-2.5 line-clamp-2 drop-shadow">
                          {blog.title}
                        </h2>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.dot}`} />
                            <span>{formatDate(blog.createdAt)}</span>
                            <span>&middot;</span>
                            <span>{readingTime(blog.content)} min</span>
                          </div>
                          <svg
                            className="w-4 h-4 text-white/30 group-hover:text-white/80 group-hover:translate-x-1 transition-all"
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
            </div>
          )}

          {/* ── WhatsApp CTA banner ─────────────────────────────────── */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
            <div className="relative rounded-3xl bg-[#075E54] overflow-hidden">
              {/* Subtle pattern */}
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_20%_50%,white_1px,transparent_1px),radial-gradient(circle_at_80%_20%,white_1px,transparent_1px)] bg-[length:60px_60px]" />
              <div className="relative px-8 py-10 sm:px-12 sm:py-14 flex flex-col sm:flex-row items-start sm:items-center gap-8">
                <div className="flex-1">
                  <p className="text-[11px] font-bold tracking-widest uppercase text-white/40 mb-2">Never Miss a Drop</p>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight">
                    Get Release Alerts<br />on WhatsApp
                  </h2>
                  <p className="text-sm text-white/60 max-w-sm leading-relaxed">
                    India&apos;s most active sneaker community — drops, restocks &amp; exclusive deals direct to your phone.
                  </p>
                </div>
                <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <a
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919410903791'}?text=${encodeURIComponent('Hey SNKRS CART! I want to get sneaker drop alerts on WhatsApp.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full bg-[#25D366] text-white font-black text-sm hover:bg-[#20bb5a] transition-colors shadow-lg shadow-black/30"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Join on WhatsApp
                  </a>
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-colors border border-white/20"
                  >
                    Shop Sneakers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
