import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Blog, Product } from '@/types';
// Simple server-safe sanitizer — strips <script> tags, inline event handlers,
// and javascript: URIs without needing jsdom / isomorphic-dompurify.
// Blog content is admin-created via Tiptap so there is no real XSS surface,
// but we keep this as a lightweight safety net.
function serverSanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '');
}
import TableOfContents from './TableOfContents';
import ListenButton from './ListenButton';
import ReadingProgress from './ReadingProgress';
import ShareBar from './ShareBar';
import MobileBar from './MobileBar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

const TAG_ACCENTS: Record<string, {
  bg: string; text: string; border: string;
  tagBg: string; tagText: string;
  linkHover: string; quoteBg: string; quoteBorder: string;
  heroGrad: string; progressColor: string; accentDot: string;
  relCardBg: string; relCardBorder: string;
}> = {
  jordan:        { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',    tagBg: 'bg-red-100',     tagText: 'text-red-700',     linkHover: 'hover:text-red-600',     quoteBg: 'bg-red-50',     quoteBorder: 'border-red-400',   heroGrad: 'from-red-950 via-red-900 to-black',     progressColor: 'bg-red-500',    accentDot: 'bg-red-400',    relCardBg: 'bg-red-50',    relCardBorder: 'border-red-100'    },
  nike:          { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200', tagBg: 'bg-orange-100',  tagText: 'text-orange-700',  linkHover: 'hover:text-orange-600',  quoteBg: 'bg-orange-50',  quoteBorder: 'border-orange-400',heroGrad: 'from-orange-950 via-orange-900 to-black',  progressColor: 'bg-orange-500', accentDot: 'bg-orange-400', relCardBg: 'bg-orange-50', relCardBorder: 'border-orange-100' },
  adidas:        { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',   tagBg: 'bg-blue-100',    tagText: 'text-blue-700',    linkHover: 'hover:text-blue-600',    quoteBg: 'bg-blue-50',    quoteBorder: 'border-blue-400',  heroGrad: 'from-blue-950 via-blue-900 to-black',    progressColor: 'bg-blue-500',   accentDot: 'bg-blue-400',   relCardBg: 'bg-blue-50',   relCardBorder: 'border-blue-100'   },
  'new-balance': { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',  tagBg: 'bg-amber-100',   tagText: 'text-amber-700',   linkHover: 'hover:text-amber-600',   quoteBg: 'bg-amber-50',   quoteBorder: 'border-amber-400', heroGrad: 'from-amber-950 via-amber-900 to-black',   progressColor: 'bg-amber-500',  accentDot: 'bg-amber-400',  relCardBg: 'bg-amber-50',  relCardBorder: 'border-amber-100'  },
  'new balance': { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',  tagBg: 'bg-amber-100',   tagText: 'text-amber-700',   linkHover: 'hover:text-amber-600',   quoteBg: 'bg-amber-50',   quoteBorder: 'border-amber-400', heroGrad: 'from-amber-950 via-amber-900 to-black',   progressColor: 'bg-amber-500',  accentDot: 'bg-amber-400',  relCardBg: 'bg-amber-50',  relCardBorder: 'border-amber-100'  },
  crocs:         { bg: 'bg-green-50',   text: 'text-green-600',   border: 'border-green-200',  tagBg: 'bg-green-100',   tagText: 'text-green-700',   linkHover: 'hover:text-green-600',   quoteBg: 'bg-green-50',   quoteBorder: 'border-green-400', heroGrad: 'from-green-950 via-green-900 to-black',   progressColor: 'bg-green-500',  accentDot: 'bg-green-400',  relCardBg: 'bg-green-50',  relCardBorder: 'border-green-100'  },
  guide:         { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200', tagBg: 'bg-violet-100',  tagText: 'text-violet-700',  linkHover: 'hover:text-violet-600',  quoteBg: 'bg-violet-50',  quoteBorder: 'border-violet-400',heroGrad: 'from-violet-950 via-violet-900 to-black',  progressColor: 'bg-violet-500', accentDot: 'bg-violet-400', relCardBg: 'bg-violet-50', relCardBorder: 'border-violet-100' },
  india:         { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200',tagBg: 'bg-emerald-100', tagText: 'text-emerald-700', linkHover: 'hover:text-emerald-600', quoteBg: 'bg-emerald-50', quoteBorder: 'border-emerald-400',heroGrad:'from-emerald-950 via-emerald-900 to-black',  progressColor: 'bg-emerald-500',accentDot: 'bg-emerald-400',relCardBg: 'bg-emerald-50',relCardBorder: 'border-emerald-100'},
  history:       { bg: 'bg-stone-50',   text: 'text-stone-600',   border: 'border-stone-200',  tagBg: 'bg-stone-200',   tagText: 'text-stone-700',   linkHover: 'hover:text-stone-600',   quoteBg: 'bg-stone-100',  quoteBorder: 'border-stone-400', heroGrad: 'from-stone-950 via-stone-800 to-black',   progressColor: 'bg-stone-500',  accentDot: 'bg-stone-400',  relCardBg: 'bg-stone-50',  relCardBorder: 'border-stone-200'  },
  trends:        { bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200',   tagBg: 'bg-pink-100',    tagText: 'text-pink-700',    linkHover: 'hover:text-pink-600',    quoteBg: 'bg-pink-50',    quoteBorder: 'border-pink-400',  heroGrad: 'from-pink-950 via-pink-900 to-black',    progressColor: 'bg-pink-500',   accentDot: 'bg-pink-400',   relCardBg: 'bg-pink-50',   relCardBorder: 'border-pink-100'   },
  releases:      { bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-200',   tagBg: 'bg-cyan-100',    tagText: 'text-cyan-700',    linkHover: 'hover:text-cyan-600',    quoteBg: 'bg-cyan-50',    quoteBorder: 'border-cyan-400',  heroGrad: 'from-cyan-950 via-cyan-900 to-black',    progressColor: 'bg-cyan-500',   accentDot: 'bg-cyan-400',   relCardBg: 'bg-cyan-50',   relCardBorder: 'border-cyan-100'   },
  collaboration: { bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-200', tagBg: 'bg-purple-100',  tagText: 'text-purple-700',  linkHover: 'hover:text-purple-600',  quoteBg: 'bg-purple-50',  quoteBorder: 'border-purple-400',heroGrad: 'from-purple-950 via-purple-900 to-black',  progressColor: 'bg-purple-500', accentDot: 'bg-purple-400', relCardBg: 'bg-purple-50', relCardBorder: 'border-purple-100' },
  'style guide': { bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-200',   tagBg: 'bg-teal-100',    tagText: 'text-teal-700',    linkHover: 'hover:text-teal-600',    quoteBg: 'bg-teal-50',    quoteBorder: 'border-teal-400',  heroGrad: 'from-teal-950 via-teal-900 to-black',    progressColor: 'bg-teal-500',   accentDot: 'bg-teal-400',   relCardBg: 'bg-teal-50',   relCardBorder: 'border-teal-100'   },
  'care guide':  { bg: 'bg-lime-50',    text: 'text-lime-600',    border: 'border-lime-200',   tagBg: 'bg-lime-100',    tagText: 'text-lime-700',    linkHover: 'hover:text-lime-600',    quoteBg: 'bg-lime-50',    quoteBorder: 'border-lime-400',  heroGrad: 'from-lime-950 via-lime-900 to-black',    progressColor: 'bg-lime-500',   accentDot: 'bg-lime-400',   relCardBg: 'bg-lime-50',   relCardBorder: 'border-lime-100'   },
};

const DEFAULT_ACCENT = {
  bg: 'bg-zinc-50', text: 'text-zinc-600', border: 'border-zinc-200',
  tagBg: 'bg-zinc-100', tagText: 'text-zinc-600', linkHover: 'hover:text-zinc-600',
  quoteBg: 'bg-zinc-100', quoteBorder: 'border-zinc-400',
  heroGrad: 'from-zinc-950 via-zinc-800 to-black',
  progressColor: 'bg-zinc-900', accentDot: 'bg-zinc-400',
  relCardBg: 'bg-zinc-50', relCardBorder: 'border-zinc-100',
};

function getAccent(tags: string[]) {
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (TAG_ACCENTS[key]) return TAG_ACCENTS[key];
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
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function readingTime(html: string): number {
  const words = (html || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function injectHeadingIds(html: string): string {
  if (!html) return '';
  const clean = serverSanitize(html);
  let idx = 0;
  return clean.replace(/<h([23])([^>]*)>/gi, (_m, level, attrs) => `<h${level}${attrs} id="heading-${idx++}">`);
}

const TAG_TO_BRAND: Record<string, string> = {
  jordan: 'Jordan', nike: 'Nike', adidas: 'Adidas',
  'new-balance': 'New Balance', crocs: 'Crocs',
  dunk: 'Nike', 'air-force-1': 'Nike', 'air-max': 'Nike',
  samba: 'Adidas', '550': 'New Balance', 'jordan-4': 'Jordan', 'air-jordan-1': 'Jordan',
};

async function fetchProductsByTags(tags: string[]): Promise<Product[]> {
  try {
    const brands = Array.from(new Set(tags.map((t) => TAG_TO_BRAND[t.toLowerCase()]).filter(Boolean)));
    if (brands.length === 0) return [];
    const res = await fetch(`${API}/products?brand=${brands.join(',')}&limit=4`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const blog = await fetchBlog(params.slug);
  if (!blog) return { title: 'Blog | SNKRS CART' };
  const title = blog.metaTitle || `${blog.title} | SNKRS CART Blog`;
  const description = blog.metaDescription || blog.excerpt || `Read "${blog.title}" on the SNKRS CART blog.`;
  const keywords = blog.metaKeywords || blog.tags.join(', ');
  const url = `${SITE_URL}/blogs/${blog.slug}`;
  return {
    title, description, keywords,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, siteName: 'SNKRS CART', type: 'article',
      publishedTime: blog.createdAt, modifiedTime: blog.updatedAt,
      authors: [blog.author], tags: blog.tags,
      ...(blog.coverImage ? { images: [{ url: blog.coverImage, width: 1200, height: 630, alt: blog.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image', title, description,
      ...(blog.coverImage ? { images: [blog.coverImage] } : {}),
    },
  };
}

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const blog = await fetchBlog(params.slug);
  if (!blog) notFound();

  const safeTags = blog.tags ?? [];
  const safeContent = blog.content ?? '';
  const accent = getAccent(safeTags);
  const contentWithIds = injectHeadingIds(safeContent);
  const minutes = readingTime(safeContent);
  const postUrl = `${SITE_URL}/blogs/${blog.slug}`;

  const [relatedBlogs, tagProducts] = await Promise.all([
    fetchRelatedBlogs(blog.tags, blog.slug),
    fetchProductsByTags(blog.tags),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.metaDescription || blog.excerpt,
    url: postUrl,
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt,
    author: { '@type': 'Person', name: blog.author },
    publisher: {
      '@type': 'Organization',
      name: 'SNKRS CART',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    keywords: blog.metaKeywords || blog.tags.join(', '),
    ...(blog.coverImage ? { image: { '@type': 'ImageObject', url: blog.coverImage } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Reading progress — fixed top bar */}
      <ReadingProgress accentColor={accent.progressColor} />

      {/* ── Cinematic Hero ─────────────────────────────────────────── */}
      <div className="relative min-h-[70vh] sm:min-h-[80vh] flex flex-col justify-end overflow-hidden bg-black">
        {/* Background: cover image OR gradient */}
        {blog.coverImage ? (
          <Image
            src={blog.coverImage}
            alt={blog.title}
            fill
            className="object-cover opacity-60"
            sizes="100vw"
            priority
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${accent.heroGrad}`} />
        )}

        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />

        {/* Content on top of hero */}
        <div className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 pb-10 pt-20">
          {/* Back link */}
          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase text-white/60 hover:text-white transition-colors mb-6"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            SNKRS CART Blog
          </Link>

          {/* Tags */}
          {safeTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {safeTags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${accent.tagBg} ${accent.tagText}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1] mb-5 max-w-3xl drop-shadow-lg">
            {blog.title}
          </h1>

          {/* Excerpt */}
          {blog.excerpt && (
            <p className="text-base sm:text-lg text-white/75 leading-relaxed mb-6 max-w-2xl">
              {blog.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-white/60 mb-6">
            <span className="font-semibold text-white/90">{blog.author}</span>
            <span>&middot;</span>
            <span>{formatDate(blog.createdAt)}</span>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {minutes} min read
            </span>
          </div>

          {/* Share bar in hero */}
          <ShareBar title={blog.title} url={postUrl} accentBg={accent.tagBg} accentText={accent.tagText} />
        </div>
      </div>

      {/* ── Main content layout ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">

          {/* ── Left: Article ───────────────────────────────────────── */}
          <div className="min-w-0">

            {/* Listen + TOC (mobile) */}
            <div className="flex flex-col gap-4 mb-8 lg:hidden">
              <ListenButton html={contentWithIds} />
              <TableOfContents html={contentWithIds} />
            </div>

            {/* Listen button (desktop) */}
            <div className="hidden lg:flex mb-8">
              <ListenButton html={contentWithIds} />
            </div>

            {/* Article prose */}
            <article
              className={`
                prose prose-lg max-w-none
                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-zinc-950
                prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-5
                prose-h2:pb-3 prose-h2:border-b-2 prose-h2:border-zinc-100
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:${accent.text}
                prose-p:text-[16px] prose-p:leading-[1.85] prose-p:text-zinc-800
                prose-a:${accent.text} prose-a:font-semibold prose-a:underline prose-a:decoration-2 prose-a:underline-offset-2 ${accent.linkHover}
                prose-strong:text-zinc-950 prose-strong:font-extrabold
                prose-blockquote:not-italic prose-blockquote:${accent.quoteBg} prose-blockquote:${accent.quoteBorder}
                prose-blockquote:border-l-[5px] prose-blockquote:rounded-r-xl
                prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:text-zinc-800 prose-blockquote:font-semibold prose-blockquote:text-lg
                prose-ul:text-zinc-800 prose-ol:text-zinc-800 prose-li:marker:${accent.text}
                prose-img:rounded-2xl prose-img:w-full prose-img:shadow-xl prose-img:my-8
                prose-code:bg-zinc-100 prose-code:text-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-pre:rounded-2xl
                first-letter:text-6xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none first-letter:${accent.text}
              `}
              dangerouslySetInnerHTML={{ __html: contentWithIds }}
            />

            {/* ── Mid-article WhatsApp CTA ──────────────────────────── */}
            <div className="my-12 rounded-2xl bg-[#075E54] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex-1">
                <p className="text-[11px] font-bold tracking-widest uppercase text-white/60 mb-1">Never Miss a Drop</p>
                <h3 className="text-xl font-black text-white mb-1">Get release alerts on WhatsApp</h3>
                <p className="text-sm text-white/70">India&apos;s sneaker community — latest drops, restocks & deals.</p>
              </div>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919410903791'}?text=${encodeURIComponent('Hey SNKRS CART! I want to get sneaker drop alerts on WhatsApp.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bb5a] transition-colors shadow-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Join on WhatsApp
              </a>
            </div>

            {/* ── Shop These Kicks ─────────────────────────────────── */}
            {tagProducts.length > 0 && (
              <div className={`my-10 pt-8 border-t-2 ${accent.border}`}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-0.5">Featured</p>
                    <h2 className="text-xl font-black tracking-tight text-zinc-950">Shop These Kicks</h2>
                  </div>
                  <Link href="/products" className="text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors">
                    View All &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {tagProducts.map((p) => (
                    <Link
                      key={p.id || p.slug}
                      href={`/products/${p.slug}`}
                      className="group block rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:shadow-xl transition-all overflow-hidden bg-white"
                    >
                      <div className="aspect-square bg-zinc-50 p-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3 border-t border-zinc-50">
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{p.brand}</p>
                        <p className="text-xs font-black text-zinc-900 truncate mt-0.5 leading-snug">{p.name}</p>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-sm font-black text-zinc-900">{'\u20B9'}{p.price.toLocaleString('en-IN')}</span>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <span className="text-[10px] text-zinc-400 line-through">{'\u20B9'}{p.originalPrice.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Author card ──────────────────────────────────────── */}
            <div className={`my-10 rounded-2xl border ${accent.border} ${accent.bg} p-6 flex items-start gap-4`}>
              <div className={`w-12 h-12 rounded-full ${accent.tagBg} flex items-center justify-center shrink-0`}>
                <span className={`text-xl font-black ${accent.tagText}`}>{blog.author.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-0.5">Written by</p>
                <p className="font-black text-zinc-900 text-base">{blog.author}</p>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                  Sneaker writer at SNKRS CART — covering releases, collabs, style guides and everything authentic in Indian sneaker culture.
                </p>
              </div>
            </div>

            {/* ── Tags ─────────────────────────────────────────────── */}
            <div className={`flex flex-wrap gap-2 py-6 border-t border-b ${accent.border} my-6`}>
              <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 self-center mr-1">Tags:</span>
              {safeTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blogs?tag=${encodeURIComponent(tag)}`}
                  className={`text-xs font-bold tracking-wide px-3 py-1.5 rounded-full border transition-all ${accent.border} ${accent.tagText} hover:${accent.tagBg} hover:scale-105`}
                >
                  #{tag}
                </Link>
              ))}
            </div>

            {/* ── Bottom ShareBar ──────────────────────────────────── */}
            <div className="my-8">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-400 mb-3">Share this post</p>
              <ShareBar title={blog.title} url={postUrl} accentBg={accent.tagBg} accentText={accent.tagText} />
            </div>

            {/* ── Footer nav ───────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
              <Link
                href="/blogs"
                className="text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                &larr; All Posts
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-zinc-950 text-white px-6 py-3 rounded-full text-xs font-black tracking-widest uppercase hover:bg-zinc-700 transition-colors"
              >
                Shop Authentic Sneakers
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* ── Right: Sticky sidebar (desktop only) ─────────────── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* TOC */}
              <TableOfContents html={contentWithIds} />

              {/* Shop CTA card */}
              <div className="rounded-2xl bg-zinc-950 p-6 text-center">
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-2">100% Authentic</p>
                <h3 className="text-lg font-black text-white mb-1 leading-tight">India&apos;s Most Trusted Sneaker Store</h3>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">Nike, Jordan, Adidas, New Balance — authenticated, sealed, shipped pan India.</p>
                <Link
                  href="/products"
                  className={`block w-full py-3 rounded-xl text-xs font-black tracking-widest uppercase text-center transition-colors ${accent.tagBg} ${accent.tagText} hover:opacity-90`}
                >
                  Browse Sneakers
                </Link>
              </div>

              {/* WhatsApp mini CTA */}
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919410903791'}?text=${encodeURIComponent('Hey SNKRS CART! I want to get sneaker drop alerts.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-[#075E54] px-5 py-4 hover:bg-[#064d45] transition-colors"
              >
                <svg className="w-6 h-6 shrink-0 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <div>
                  <p className="text-xs font-black text-white">Get Drop Alerts</p>
                  <p className="text-[11px] text-white/60">Join on WhatsApp</p>
                </div>
              </a>
            </div>
          </aside>
        </div>

        {/* ── Related Posts ─────────────────────────────────────────── */}
        {relatedBlogs.length > 0 && (
          <div className="mt-16 pt-10 border-t-2 border-zinc-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-0.5">Keep Reading</p>
                <h2 className="text-2xl font-black tracking-tight text-zinc-950">You Might Also Like</h2>
              </div>
              <Link href="/blogs" className="text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:block">
                All Posts &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedBlogs.map((rb) => {
                const rbA = getAccent(rb.tags);
                return (
                  <Link
                    key={rb._id}
                    href={`/blogs/${rb.slug}`}
                    className={`group block rounded-2xl overflow-hidden border ${rbA.relCardBorder} ${rbA.relCardBg} hover:shadow-xl transition-all hover:-translate-y-1`}
                  >
                    <div className="relative aspect-[16/9] bg-zinc-200 overflow-hidden">
                      {rb.coverImage ? (
                        <Image
                          src={rb.coverImage}
                          alt={rb.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width:640px) 100vw, 33vw"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${rbA.heroGrad} flex items-center justify-center`}>
                          <span className="text-4xl opacity-30">👟</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      {rb.tags.length > 0 && (
                        <span className={`inline-block text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full mb-2 ${rbA.tagBg} ${rbA.tagText}`}>
                          {rb.tags[0]}
                        </span>
                      )}
                      <h3 className="text-sm font-black text-zinc-900 group-hover:text-zinc-600 transition-colors leading-snug line-clamp-2 mb-2">
                        {rb.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${rbA.accentDot}`} />
                        {formatDate(rb.createdAt)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky mobile bottom bar ─────────────────────────────── */}
      <MobileBar title={blog.title} url={postUrl} />
    </>
  );
}
