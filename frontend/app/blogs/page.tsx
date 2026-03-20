import Link from 'next/link';
import Image from 'next/image';
import type { Blog } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

// Mirror of the accent map in the detail page
const TAG_ACCENTS: Record<string, { bg: string; tagBg: string; tagText: string; accent: string; border: string; dot: string }> = {
  jordan:        { bg: 'bg-red-50',     tagBg: 'bg-red-100',     tagText: 'text-red-700',     accent: 'text-red-600',     border: 'border-red-200',    dot: 'bg-red-400' },
  nike:          { bg: 'bg-orange-50',  tagBg: 'bg-orange-100',  tagText: 'text-orange-700',  accent: 'text-orange-600',  border: 'border-orange-200', dot: 'bg-orange-400' },
  adidas:        { bg: 'bg-blue-50',    tagBg: 'bg-blue-100',    tagText: 'text-blue-700',    accent: 'text-blue-600',    border: 'border-blue-200',   dot: 'bg-blue-400' },
  'new-balance': { bg: 'bg-amber-50',   tagBg: 'bg-amber-100',   tagText: 'text-amber-700',   accent: 'text-amber-600',   border: 'border-amber-200',  dot: 'bg-amber-400' },
  'new balance': { bg: 'bg-amber-50',   tagBg: 'bg-amber-100',   tagText: 'text-amber-700',   accent: 'text-amber-600',   border: 'border-amber-200',  dot: 'bg-amber-400' },
  crocs:         { bg: 'bg-green-50',   tagBg: 'bg-green-100',   tagText: 'text-green-700',   accent: 'text-green-600',   border: 'border-green-200',  dot: 'bg-green-400' },
  guide:         { bg: 'bg-violet-50',  tagBg: 'bg-violet-100',  tagText: 'text-violet-700',  accent: 'text-violet-600',  border: 'border-violet-200', dot: 'bg-violet-400' },
  india:         { bg: 'bg-emerald-50', tagBg: 'bg-emerald-100', tagText: 'text-emerald-700', accent: 'text-emerald-600', border: 'border-emerald-200',dot: 'bg-emerald-400' },
  history:       { bg: 'bg-stone-50',   tagBg: 'bg-stone-200',   tagText: 'text-stone-700',   accent: 'text-stone-600',   border: 'border-stone-200',  dot: 'bg-stone-400' },
  trends:        { bg: 'bg-pink-50',    tagBg: 'bg-pink-100',    tagText: 'text-pink-700',    accent: 'text-pink-600',    border: 'border-pink-200',   dot: 'bg-pink-400' },
  releases:      { bg: 'bg-cyan-50',    tagBg: 'bg-cyan-100',    tagText: 'text-cyan-700',    accent: 'text-cyan-600',    border: 'border-cyan-200',   dot: 'bg-cyan-400' },
  collaboration: { bg: 'bg-purple-50',  tagBg: 'bg-purple-100',  tagText: 'text-purple-700',  accent: 'text-purple-600',  border: 'border-purple-200', dot: 'bg-purple-400' },
  'style guide': { bg: 'bg-teal-50',    tagBg: 'bg-teal-100',    tagText: 'text-teal-700',    accent: 'text-teal-600',    border: 'border-teal-200',   dot: 'bg-teal-400' },
  'care guide':  { bg: 'bg-lime-50',    tagBg: 'bg-lime-100',    tagText: 'text-lime-700',    accent: 'text-lime-600',    border: 'border-lime-200',   dot: 'bg-lime-500' },
};

const DEFAULT_ACCENT = { bg: 'bg-zinc-50', tagBg: 'bg-zinc-100', tagText: 'text-zinc-600', accent: 'text-zinc-600', border: 'border-zinc-200', dot: 'bg-zinc-400' };

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
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function readingTime(content: string): number {
  const text = (content || '').replace(/<[^>]*>/g, '');
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
}

export const metadata = {
  title: 'Sneaker Blog | SNKRS CART',
  description: 'Latest sneaker news, release guides, style tips, and brand stories from SNKRS CART — India\'s trusted sneaker platform.',
  alternates: { canonical: `${SITE_URL}/blogs` },
  openGraph: {
    title: 'Sneaker Blog | SNKRS CART',
    description: 'Latest sneaker news, release guides, and style tips from SNKRS CART.',
    url: `${SITE_URL}/blogs`,
    siteName: 'SNKRS CART',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sneaker Blog | SNKRS CART',
    description: 'Latest sneaker content from SNKRS CART.',
  },
};

export default async function BlogsPage() {
  const blogs = await fetchBlogs();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'SNKRS CART Blog',
    description: 'Sneaker news, release guides, and style content from SNKRS CART.',
    url: `${SITE_URL}/blogs`,
    publisher: {
      '@type': 'Organization',
      name: 'SNKRS CART',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.jpg` },
    },
    blogPost: blogs.map((b) => ({
      '@type': 'BlogPosting',
      headline: b.title,
      url: `${SITE_URL}/blogs/${b.slug}`,
      datePublished: b.createdAt,
      author: { '@type': 'Person', name: b.author },
      ...(b.coverImage ? { image: b.coverImage } : {}),
    })),
  };

  // First blog is the featured hero
  const [hero, ...rest] = blogs;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">SNKRS CART</p>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Sneaker Blog</h1>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-24 text-zinc-400">
            <p className="text-lg font-semibold">No posts yet.</p>
            <p className="text-sm mt-1">Check back soon for sneaker content.</p>
          </div>
        ) : (
          <>
            {/* ── Hero card (first post) ────────────────────────────── */}
            {hero && (() => {
              const a = getAccent(hero.tags);
              return (
                <Link href={`/blogs/${hero.slug}`} className={`group block rounded-2xl overflow-hidden border ${a.border} ${a.bg} mb-10 transition-shadow hover:shadow-xl`}>
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[320px] bg-zinc-100 overflow-hidden">
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
                        <div className="absolute inset-0 flex items-center justify-center text-6xl">👟</div>
                      )}
                    </div>
                    <div className="p-8 lg:p-10 flex flex-col justify-center">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hero.tags.slice(0, 3).map((t) => (
                          <span key={t} className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${a.tagBg} ${a.tagText}`}>{t}</span>
                        ))}
                      </div>
                      <h2 className={`text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 group-hover:${a.accent} transition-colors leading-tight mb-3`}>
                        {hero.title}
                      </h2>
                      {hero.excerpt && (
                        <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3 mb-5">{hero.excerpt}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                        <span>{hero.author}</span>
                        <span>·</span>
                        <span>{formatDate(hero.createdAt)}</span>
                        <span>·</span>
                        <span>{readingTime(hero.content)} min read</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })()}

            {/* ── Grid of remaining posts ───────────────────────────── */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((blog) => {
                  const a = getAccent(blog.tags);
                  return (
                    <Link
                      key={blog._id}
                      href={`/blogs/${blog.slug}`}
                      className={`group block rounded-xl overflow-hidden border ${a.border} ${a.bg} transition-all hover:shadow-lg hover:-translate-y-0.5`}
                    >
                      {/* Cover */}
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
                          <div className="absolute inset-0 flex items-center justify-center text-4xl">👟</div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-5">
                        {/* Tags */}
                        {blog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {blog.tags.slice(0, 2).map((t) => (
                              <span key={t} className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${a.tagBg} ${a.tagText}`}>{t}</span>
                            ))}
                          </div>
                        )}

                        <h2 className="text-sm font-black tracking-tight text-zinc-900 group-hover:text-zinc-600 transition-colors leading-snug mb-2 line-clamp-2">
                          {blog.title}
                        </h2>

                        {blog.excerpt && (
                          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-4">
                            {blog.excerpt}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.dot}`} />
                          <span>{formatDate(blog.createdAt)}</span>
                          <span>·</span>
                          <span>{readingTime(blog.content)} min read</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
