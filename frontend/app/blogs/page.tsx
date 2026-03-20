import Link from 'next/link';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  tags: string[];
  createdAt: string;
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
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://snkrs-kart.vercel.app';

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Header */}
      <div className="max-w-xl mb-12">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-2">SNKRS CART</p>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-3">Sneaker Blog</h1>
        <p className="text-base text-zinc-500 leading-relaxed">
          Release guides, style tips, brand history, and everything sneakers.
        </p>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-24 text-zinc-400">
          <p className="text-lg font-semibold">No posts yet.</p>
          <p className="text-sm mt-1">Check back soon for sneaker content.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <Link key={blog._id} href={`/blogs/${blog.slug}`} className="group block">
              {/* Cover image */}
              <div className="relative aspect-[16/9] bg-zinc-100 overflow-hidden mb-4">
                {blog.coverImage ? (
                  <Image
                    src={blog.coverImage}
                    alt={blog.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-zinc-200 flex items-center justify-center">
                    <span className="text-4xl">👟</span>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div>
                {blog.tags.length > 0 && (
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                    {blog.tags[0]}
                  </p>
                )}
                <h2 className="text-base font-black tracking-tight text-zinc-900 group-hover:text-zinc-600 transition-colors leading-snug mb-2">
                  {blog.title}
                </h2>
                {blog.excerpt && (
                  <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2 mb-3">
                    {blog.excerpt}
                  </p>
                )}
                <p className="text-xs text-zinc-400">
                  {formatDate(blog.createdAt)} · {blog.author}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
