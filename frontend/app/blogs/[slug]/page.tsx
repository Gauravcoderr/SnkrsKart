import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: string;
  updatedAt: string;
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      {/* Back */}
      <Link
        href="/blogs"
        className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-zinc-400 hover:text-zinc-900 transition-colors mb-10"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Blog
      </Link>

      {/* Tags */}
      {blog.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {blog.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-bold tracking-widest uppercase bg-zinc-100 text-zinc-500 px-2.5 py-1">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 leading-tight mb-4">
        {blog.title}
      </h1>

      {/* Meta */}
      <p className="text-sm text-zinc-400 mb-8">
        {formatDate(blog.createdAt)} · By {blog.author}
      </p>

      {/* Cover image */}
      {blog.coverImage && (
        <div className="relative aspect-[16/9] w-full bg-zinc-100 overflow-hidden mb-10">
          <Image
            src={blog.coverImage}
            alt={blog.title}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-zinc max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-zinc-900 prose-a:underline prose-img:rounded-none prose-img:w-full"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Footer */}
      <div className="mt-14 pt-8 border-t border-zinc-100 flex items-center justify-between">
        <Link
          href="/blogs"
          className="text-xs font-bold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← All Posts
        </Link>
        <Link
          href="/products"
          className="inline-block border border-zinc-900 px-5 py-2.5 text-xs font-bold tracking-widest uppercase text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors"
        >
          Shop Sneakers
        </Link>
      </div>
      </div>
    </>
  );
}
