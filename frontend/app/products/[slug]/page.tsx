import { fetchProductBySlug, fetchTrendingProducts } from '@/lib/api';
import { notFound } from 'next/navigation';
import ImageGallery from '@/components/product-detail/ImageGallery';
import ProductDetailClient from './ProductDetailClient';
import ProductCard from '@/components/products/ProductCard';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const product = await fetchProductBySlug(params.slug);
    return {
      title: `${product.brand} ${product.name} — SNKRS CART`,
      description: product.description,
    };
  } catch {
    return { title: 'Product Not Found' };
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  let product;
  try {
    product = await fetchProductBySlug(params.slug);
  } catch {
    notFound();
  }

  const related = (await fetchTrendingProducts())
    .filter((p) => p.id !== product.id && p.brand === product.brand)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-8 font-medium tracking-wide">
        <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-zinc-900 transition-colors">All Shoes</Link>
        <span>/</span>
        <Link href={`/products?brand=${product.brand}`} className="hover:text-zinc-900 transition-colors">{product.brand}</Link>
        <span>/</span>
        <span className="text-zinc-600">{product.name}</span>
      </nav>

      {/* Main product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image gallery — left col */}
        <ImageGallery images={product.images} productName={`${product.brand} ${product.name}`} />

        {/* Product info — right col */}
        <div className="flex flex-col">
          {/* Brand + name */}
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">
            {product.brand}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">
            {product.name}
          </h1>
          <p className="text-sm text-zinc-500 mb-4">{product.colorway}</p>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'text-zinc-900' : 'text-zinc-200'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs font-semibold text-zinc-700">{product.rating}</span>
            <span className="text-xs text-zinc-400">({product.reviewCount.toLocaleString()} reviews)</span>
          </div>

          {/* Size picker + Add to cart + price — client component */}
          <ProductDetailClient product={product} />

          {/* Description */}
          <div className="mt-8 pt-6 border-t border-zinc-100">
            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-3">
              About This Shoe
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 border border-zinc-100 text-xs font-medium text-zinc-500 capitalize">
                  {tag}
                </span>
              ))}
            </div>
          )}


        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-20 pt-10 border-t border-zinc-100">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">More From</p>
              <h2 className="text-xl font-bold tracking-[0.15em] uppercase text-zinc-900">{product.brand}</h2>
            </div>
            <Link
              href={`/products?brand=${product.brand}`}
              className="text-xs font-semibold tracking-widest uppercase text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
