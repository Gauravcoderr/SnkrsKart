import { Review } from '@/types';
import Link from 'next/link';

interface HomeReviewsProps {
  reviews: Review[];
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'text-zinc-900' : 'text-zinc-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function HomeReviews({ reviews }: HomeReviewsProps) {
  if (reviews.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-zinc-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">Verified Buyers</p>
            <h2 className="text-2xl font-black tracking-[0.1em] uppercase text-zinc-900">What Customers Say</h2>
          </div>
        </div>

        {/* Review cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review) => (
            <Link
              key={review.id}
              href={`/products/${review.productSlug}`}
              className="group block bg-white border border-zinc-100 p-5 hover:border-zinc-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-zinc-900">{review.name}</p>
                  <StarDisplay rating={review.rating} />
                </div>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 border border-zinc-100 px-2 py-0.5">
                  {review.rating === 5 ? 'Excellent' : review.rating === 4 ? 'Great' : review.rating === 3 ? 'Good' : review.rating === 2 ? 'Fair' : 'Poor'}
                </span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3 mb-3">"{review.comment}"</p>
              <p className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-zinc-700 transition-colors">
                {review.productName} →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
