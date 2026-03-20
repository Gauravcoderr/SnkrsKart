'use client';

import { useState } from 'react';
import { Review } from '@/types';
import StarRating from './StarRating';

interface ProductReviewsProps {
  productSlug: string;
  productName: string;
  initialReviews: Review[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`;
}

export default function ProductReviews({ productSlug, productName, initialReviews }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, productName, name: name.trim(), rating, comment: comment.trim() }),
      });
      if (!res.ok) throw new Error();
      const newReview: Review = await res.json();
      const updatedReviews = [newReview, ...reviews];
      setReviews(updatedReviews);
      setSubmitted(true);
      const newCount = updatedReviews.length;
      const newRating = Math.round((updatedReviews.reduce((s, r) => s + r.rating, 0) / newCount) * 10) / 10;
      window.dispatchEvent(new CustomEvent('snkrs:review-added', { detail: { newRating, newCount } }));
      setName(''); setComment(''); setRating(0);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-16 pt-10 border-t border-zinc-100">
      <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Customer Reviews</h2>
      <p className="text-xl font-bold tracking-tight text-zinc-900 mb-8">What People Are Saying</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left — summary + form */}
        <div>
          {/* Rating summary */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-6 mb-8 p-5 bg-zinc-50 border border-zinc-100">
              <div className="text-center">
                <p className="text-4xl font-black text-zinc-900">{avgRating.toFixed(1)}</p>
                <StarRating value={Math.round(avgRating)} size="sm" />
                <p className="text-xs text-zinc-400 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {ratingCounts.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500 w-4 text-right">{star}</span>
                    <svg className="w-3 h-3 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-zinc-400 w-4">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Write a review */}
          {submitted ? (
            <div className="p-5 border border-zinc-100 bg-zinc-50 text-center">
              <p className="text-sm font-bold text-zinc-900 mb-1">Thank you for your review!</p>
              <p className="text-xs text-zinc-500">Your review has been posted.</p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-3 text-xs underline text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Write another review
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs font-bold tracking-widest uppercase text-zinc-900">Write a Review</p>

              {/* Star picker */}
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-2">Your Rating *</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <svg
                        className={`w-7 h-7 transition-colors ${star <= (hoverRating || rating) ? 'text-amber-400' : 'text-zinc-200'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                  {(hoverRating || rating) > 0 && (
                    <span className="ml-2 text-xs text-zinc-500 self-center">
                      {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][hoverRating || rating]}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul S."
                  className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">Your Review *</label>
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this shoe..."
                  rows={4}
                  className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 disabled:bg-zinc-400 transition-colors"
              >
                {loading ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          )}
        </div>

        {/* Right — reviews list */}
        <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-sm font-semibold text-zinc-900 mb-1">No reviews yet</p>
              <p className="text-xs text-zinc-400">Be the first to review this shoe.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="p-4 border border-zinc-100 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{review.name}</p>
                    <StarRating value={review.rating} size="sm" />
                  </div>
                  <span className="text-[11px] text-zinc-400">{timeAgo(review.createdAt)}</span>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
