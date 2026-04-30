import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Blog } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrscart.com';

const TAG_ACCENTS: Record<string, { bg: string; tagBg: string; tagText: string; border: string; dot: string; heroGrad: string }> = {
  jordan:        { bg: 'bg-red-50',     tagBg: 'bg-red-100',     tagText: 'text-red-700',     border: 'border-red-200',    dot: 'bg-red-400',    heroGrad: 'from-red-900 to-red-700'      },
  nike:          { bg: 'bg-orange-50',  tagBg: 'bg-orange-100',  tagText: 'text-orange-700',  border: 'border-orange-200', dot: 'bg-orange-400', heroGrad: 'from-orange-900 to-orange-700' },
  adidas:        { bg: 'bg-blue-50',    tagBg: 'bg-blue-100',    tagText: 'text-blue-700',    border: 'border-blue-200',   dot: 'bg-blue-400',   heroGrad: 'from-blue-900 to-blue-700'    },
  'new-balance': { bg: 'bg-amber-50',   tagBg: 'bg-amber-100',   tagText: 'text-amber-700',   border: 'border-amber-200',  dot: 'bg-amber-400',  heroGrad: 'from-amber-900 to-amber-700'  },
  crocs:         { bg: 'bg-green-50',   tagBg: 'bg-green-100',   tagText: 'text-green-700',   border: 'border-green-200',  dot: 'bg-green-400',  heroGrad: 'from-green-900 to-green-700'  },
  guide:         { bg: 'bg-violet-50',  tagBg: 'bg-violet-100',  tagText: 'text-violet-700',  border: 'border-violet-200', dot: 'bg-violet-400', heroGrad: 'from-violet-900 to-violet-700' },
  india:         { bg: 'bg-emerald-50', tagBg: 'bg-emerald-100', tagText: 'text-emerald-700', border: 'border-emerald-200',dot: 'bg-emerald-400',heroGrad: 'from-emerald-900 to-emerald-700'},
  history:       { bg: 'bg-stone-50',   tagBg: 'bg-stone-200',   tagText: 'text-stone-700',   border: 'border-stone-200',  dot: 'bg-stone-400',  heroGrad: 'from-stone-800 to-stone-700'  },
  trends:        { bg: 'bg-pink-50',    tagBg: 'bg-pink-100',    tagText: 'text-pink-700',    border: 'border-pink-200',   dot: 'bg-pink-400',   heroGrad: 'from-pink-900 to-pink-700'    },
  releases:      { bg: 'bg-cyan-50',    tagBg: 'bg-cyan-100',    tagText: 'text-cyan-700',    border: 'border-cyan-200',   dot: 'bg-cyan-400',   heroGrad: 'from-cyan-900 to-cyan-700'    },
  collaboration: { bg: 'bg-purple-50',  tagBg: 'bg-purple-100',  tagText: 'text-purple-700',  border: 'border-purple-200', dot: 'bg-purple-400', heroGrad: 'from-purple-900 to-purple-700' },
  'style guide': { bg: 'bg-teal-50',    tagBg: 'bg-teal-100',    tagText: 'text-teal-700',    border: 'border-teal-200',   dot: 'bg-teal-400',   heroGrad: 'from-teal-900 to-teal-700'    },
  'care guide':  { bg: 'bg-lime-50',    tagBg: 'bg-lime-100',    tagText: 'text-lime-700',    border: 'border-lime-200',   dot: 'bg-lime-500',   heroGrad: 'from-lime-900 to-lime-700'    },
};
const DEFAULT_ACCENT = { bg: 'bg-zinc-50', tagBg: 'bg-zinc-100', tagText: 'text-zinc-600', border: 'border-zinc-200', dot: 'bg-zinc-400', heroGrad: 'from-zinc-900 to-zinc-700' };

function getAccent(tag: string) {
  return TAG_ACCENTS[tag.toLowerCase()] ?? DEFAULT_ACCENT;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function readingTime(content: string) {
  return Math.max(1, Math.ceil((content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length / 200));
}
function isNew(d: string) {
  return Date.now() - new Date(d).getTime() < 7 * 24 * 60 * 60 * 1000;
}

async function fetchByTag(tag: string): Promise<Blog[]> {
  try {
    const res = await fetch(`${API}/blogs?tag=${encodeURIComponent(tag)}&limit=50`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag);
  const label = tag.replace(/-/g, ' ');
  const title = `${label.charAt(0).toUpperCase() + label.slice(1)} Sneaker Blog | SNKRS CART`;
  const description = `Browse all SNKRS CART blog posts tagged "${label}" — release guides, news, and style tips.`;
  const url = `${SITE_URL}/blogs/tag/${params.tag}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'SNKRS CART', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function TagPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag);
  const blogs = await fetchByTag(tag);

  if (blogs.length === 0) notFound();

  const a = getAccent(tag);
  const label = tag.replace(/-/g, ' ');
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${displayLabel} — SNKRS CART Blog`,
    url: `${SITE_URL}/blogs/tag/${params.tag}`,
    description: `All SNKRS CART blog posts tagged "${label}".`,
    hasPart: blogs.map((b) => ({
      '@type': 'BlogPosting',
      headline: b.title,
      url: `${SITE_URL}/blogs/${b.slug}`,
      datePublished: b.createdAt,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/blogs" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors mb-4 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All posts
          </Link>
          <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1.5">Tag</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900">{displayLabel}</h1>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${a.tagBg} ${a.tagText}`}>
              {blogs.length} post{blogs.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {blogs.map((blog) => {
            const ca = getAccent(blog.tags?.[0] ?? '');
            return (
              <Link
                key={blog._id}
                href={`/blogs/${blog.slug}`}
                className={`group block rounded-2xl overflow-hidden border ${ca.border} ${ca.bg} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
              >
                <div className="relative aspect-[16/9] bg-zinc-100 overflow-hidden">
                  {blog.coverImage ? (
                    <Image
                      src={blog.coverImage}
                      alt={blog.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${ca.heroGrad} flex items-center justify-center`}>
                      <span className="text-4xl opacity-20">👟</span>
                    </div>
                  )}
                  {isNew(blog.createdAt) && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-zinc-900 text-white text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full shadow">NEW</span>
                    </div>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  {blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {blog.tags.slice(0, 2).map((t) => (
                        <span key={t} className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${ca.tagBg} ${ca.tagText}`}>{t}</span>
                      ))}
                    </div>
                  )}
                  <h2 className="text-sm font-black tracking-tight text-zinc-950 group-hover:text-zinc-600 transition-colors leading-snug mb-2 line-clamp-2">
                    {blog.title}
                  </h2>
                  {blog.excerpt && (
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-4">{blog.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ca.dot}`} />
                      <span>{formatDate(blog.createdAt)}</span>
                      <span>&middot;</span>
                      <span>{readingTime(blog.content)} min read</span>
                    </div>
                    <svg className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
