import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Blog } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

// Tag-based accent colours for visual variety
const TAG_ACCENTS: Record<string, { bg: string; text: string; border: string; tagBg: string; tagText: string; linkHover: string; quoteBg: string; quoteBorder: string }> = {
  jordan:    { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    tagBg: 'bg-red-100',    tagText: 'text-red-700',    linkHover: 'hover:text-red-600',    quoteBg: 'bg-red-50',    quoteBorder: 'border-red-400' },
  nike:      { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', tagBg: 'bg-orange-100', tagText: 'text-orange-700', linkHover: 'hover:text-orange-600', quoteBg: 'bg-orange-50', quoteBorder: 'border-orange-400' },
  adidas:    { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',   tagBg: 'bg-blue-100',   tagText: 'text-blue-700',   linkHover: 'hover:text-blue-600',   quoteBg: 'bg-blue-50',   quoteBorder: 'border-blue-400' },
  'new-balance': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', tagBg: 'bg-amber-100', tagText: 'text-amber-700', linkHover: 'hover:text-amber-600', quoteBg: 'bg-amber-50', quoteBorder: 'border-amber-400' },
  crocs:     { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200',  tagBg: 'bg-green-100',  tagText: 'text-green-700',  linkHover: 'hover:text-green-600',  quoteBg: 'bg-green-50',  quoteBorder: 'border-green-400' },
  guide:     { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', tagBg: 'bg-violet-100', tagText: 'text-violet-700', linkHover: 'hover:text-violet-600', quoteBg: 'bg-violet-50', quoteBorder: 'border-violet-400' },
  india:     { bg: 'bg-emerald-50',text: 'text-emerald-600',border: 'border-emerald-200',tagBg: 'bg-emerald-100',tagText: 'text-emerald-700',linkHover: 'hover:text-emerald-600',quoteBg: 'bg-emerald-50',quoteBorder: 'border-emerald-400' },
  history:   { bg: 'bg-stone-50',  text: 'text-stone-600',  border: 'border-stone-200',  tagBg: 'bg-stone-200',  tagText: 'text-stone-700',  linkHover: 'hover:text-stone-600',  quoteBg: 'bg-stone-100', quoteBorder: 'border-stone-400' },
  trends:    { bg: 'bg-pink-50',   text: 'text-pink-600',   border: 'border-pink-200',   tagBg: 'bg-pink-100',   tagText: 'text-pink-700',   linkHover: 'hover:text-pink-600',   quoteBg: 'bg-pink-50',   quoteBorder: 'border-pink-400' },
  releases:  { bg: 'bg-cyan-50',   text: 'text-cyan-600',   border: 'border-cyan-200',   tagBg: 'bg-cyan-100',   tagText: 'text-cyan-700',   linkHover: 'hover:text-cyan-600',   quoteBg: 'bg-cyan-50',   quoteBorder: 'border-cyan-400' },
};

const DEFAULT_ACCENT = { bg: 'bg-zinc-50', text: 'text-zinc-600', border: 'border-zinc-200', tagBg: 'bg-zinc-100', tagText: 'text-zinc-600', linkHover: 'hover:text-zinc-600', quoteBg: 'bg-zinc-50', quoteBorder: 'border-zinc-400' };

function getAccent(tags: string[]) {
  for (const tag of tags) {
    if (TAG_ACCENTS[tag]) return TAG_ACCENTS[tag];
  }
  return DEFAULT_ACCENT;
}

async function fetchBlog(slug: string): Promise<Blog | null> {
  try {
    const res = await fetch(`${API}/blogs/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchRelatedBlogs(tags: string[], currentSlug: string): Promise<Blog[]> {
  try {
    const allRelated: Blog[] = [];
    const seen = new Set<string>([currentSlug]);

    for (const tag of tags) {
      if (allRelated.length >= 6) break;
      const res = await fetch(`${API}/blogs?tag=${encodeURIComponent(tag)}&limit=4`, { next: { revalidate: 60 } });
      if (!res.ok) continue;
      const blogs: Blog[] = await res.json();
      for (const b of blogs) {
        if (!seen.has(b.slug) && allRelated.length < 6) {
          seen.add(b.slug);
          allRelated.push(b);
        }
      }
    }

    return allRelated.slice(0, 3);
  } catch {
    return [];
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function readingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const blog = await fetchBlog(params.slug);
  if (!blog) return { title: 'Blog | SNKRS CART' };

  const title = blog.metaTitle || `${blog.title} | SNKRS CART Blog`;
  const description = blog.metaDescription || blog.excerpt || `Read "${blog.title}" on the SNKRS CART blog.`;
  const keywords = blog.metaKeywords || blog.tags.join(', ');
  const url = `${SITE_URL}/blogs/${blog.slug}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'SNKRS CART',
      type: 'article',
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt,
      authors: [blog.author],
      tags: blog.tags,
      ...(blog.coverImage ? { images: [{ url: blog.coverImage, width: 1200, height: 630, alt: blog.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(blog.coverImage ? { images: [blog.coverImage] } : {}),
    },
  };
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const blog = await fetchBlog(params.slug);
  if (!blog) notFound();

  const accent = getAccent(blog.tags);
  const minutes = readingTime(blog.content);
  const relatedBlogs = await fetchRelatedBlogs(blog.tags, blog.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.metaDescription || blog.excerpt,
    url: `${SITE_URL}/blogs/${blog.slug}`,
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt,
    author: { '@type': 'Person', name: blog.author },
    publisher: {
      '@type': 'Organization',
      name: 'SNKRS CART',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.jpg` },
    },
    keywords: blog.metaKeywords || blog.tags.join(', '),
    ...(blog.coverImage ? { image: { '@type': 'ImageObject', url: blog.coverImage } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero section with accent-coloured background */}
      <div className={`${accent.bg} border-b ${accent.border}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-8">
          {/* Back link */}
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-zinc-400 hover:text-zinc-900 transition-colors mb-8"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All Posts
          </Link>

          {/* Tags */}
          {blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {blog.tags.map((tag) => (
                <span key={tag} className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${accent.tagBg} ${accent.tagText}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black tracking-tight text-zinc-900 leading-[1.15] mb-4">
            {blog.title}
          </h1>

          {/* Excerpt */}
          {blog.excerpt && (
            <p className="text-base sm:text-lg text-zinc-500 leading-relaxed mb-5 max-w-2xl">
              {blog.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="font-medium text-zinc-600">{blog.author}</span>
            <span>&middot;</span>
            <span>{formatDate(blog.createdAt)}</span>
            <span>&middot;</span>
            <span>{minutes} min read</span>
          </div>
        </div>
      </div>

      {/* Cover image — full bleed */}
      {blog.coverImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-0">
          <div className="relative aspect-[2/1] sm:aspect-[16/7] w-full bg-zinc-100 overflow-hidden rounded-xl shadow-lg mt-0 sm:-mt-2">
            <Image
              src={blog.coverImage}
              alt={blog.title}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 900px"
              priority
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <article
          className={`
            prose prose-zinc max-w-none
            prose-headings:font-black prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-zinc-100 prose-h2:pb-2
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-h3:${accent.text}
            prose-p:text-[15px] prose-p:leading-[1.8] prose-p:text-zinc-700
            prose-a:${accent.text} prose-a:font-semibold prose-a:underline prose-a:decoration-1 prose-a:underline-offset-2 ${accent.linkHover}
            prose-strong:text-zinc-900 prose-strong:font-bold
            prose-blockquote:not-italic prose-blockquote:${accent.quoteBg} prose-blockquote:${accent.quoteBorder} prose-blockquote:border-l-4 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:text-zinc-700 prose-blockquote:font-medium
            prose-ul:text-zinc-700 prose-li:marker:${accent.text}
            prose-img:rounded-xl prose-img:w-full prose-img:shadow-md
            first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:leading-none first-letter:${accent.text}
          `}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Share / tags bar */}
        <div className={`mt-12 pt-6 border-t ${accent.border}`}>
          <div className="flex flex-wrap gap-2 mb-6">
            {blog.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blogs?tag=${tag}`}
                className={`text-xs font-semibold tracking-wide px-3 py-1.5 rounded-full border transition-colors ${accent.border} ${accent.tagText} hover:${accent.tagBg}`}
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <div className="mt-10 pt-8 border-t border-zinc-100">
            <h2 className="text-lg font-black tracking-tight text-zinc-900 mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedBlogs.map((rb) => {
                const rbAccent = getAccent(rb.tags);
                return (
                  <Link key={rb._id} href={`/blogs/${rb.slug}`} className="group block">
                    <div className="relative aspect-[16/9] bg-zinc-100 overflow-hidden rounded-lg mb-3">
                      {rb.coverImage ? (
                        <Image
                          src={rb.coverImage}
                          alt={rb.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width:640px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-zinc-200 flex items-center justify-center">
                          <span className="text-2xl">👟</span>
                        </div>
                      )}
                    </div>
                    {rb.tags.length > 0 && (
                      <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${rbAccent.tagBg} ${rbAccent.tagText}`}>
                        {rb.tags[0]}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors leading-snug mt-1.5 line-clamp-2">
                      {rb.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">{formatDate(rb.createdAt)}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between pt-6 mt-8 border-t border-zinc-100">
          <Link
            href="/blogs"
            className="text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            &larr; All Posts
          </Link>
          <Link
            href="/products"
            className={`inline-block border-2 border-zinc-900 px-6 py-2.5 text-xs font-bold tracking-widest uppercase text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors`}
          >
            Shop Sneakers
          </Link>
        </div>
      </div>
    </>
  );
}
