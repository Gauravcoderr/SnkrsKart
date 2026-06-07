'use client';

import { useState } from 'react';
import { Review } from '@/types';
import Link from 'next/link';
import StarRating from '@/components/reviews/StarRating';
import { INDIA_STATES } from '@/lib/constants';

const FALLBACK_REVIEWS: Review[] = [
  {
    id: 'f1',
    name: 'Aryan M.',
    rating: 5,
    comment: 'Absolutely love my Jordan 1s. Shipped fast, packaging was clean, and the kicks are 100% legit. Will definitely order again.',
    productName: 'Air Jordan 1 Retro High OG',
    productSlug: 'products',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'f2',
    name: 'Priya S.',
    rating: 5,
    comment: 'Got the New Balance 9060 and honestly blown away by the comfort. The team was super helpful with size queries too.',
    productName: 'New Balance 9060',
    productSlug: 'products',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'f3',
    name: 'Rohan K.',
    rating: 5,
    comment: 'Snagged a pair of Dunks at retail. Site was smooth, checkout was fast, delivered in 2 days. This is my go-to spot now.',
    productName: 'Nike Dunk Low Retro',
    productSlug: 'products',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

interface HomeReviewsProps {
  reviews: Review[];
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function HomeReviews({ reviews: initialReviews }: HomeReviewsProps) {
  const [liveReviews, setLiveReviews] = useState<Review[]>(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [productName, setProductName] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const displayed = liveReviews.length > 0 ? liveReviews : FALLBACK_REVIEWS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) { setError('Please enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug: 'general',
          productName: productName.trim() || 'General Review',
          name: name.trim(),
          email: email.trim(),
          location: location || null,
          rating,
          comment: comment.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      const newReview: Review = await res.json();
      setLiveReviews([newReview, ...liveReviews]);
      setSubmitted(true);
      setName(''); setEmail(''); setLocation(''); setProductName(''); setComment(''); setRating(0);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-zinc-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-400 mb-1">Verified Buyers</p>
            <h2 className="text-xl sm:text-2xl font-black tracking-[0.1em] uppercase text-zinc-900">What Customers Say</h2>
          </div>
          {!showForm && !submitted && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="self-start sm:self-auto text-xs font-bold tracking-widest uppercase border border-zinc-900 px-4 py-2 text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Inline review form */}
        {showForm && (
          <div className="mb-10 bg-white border border-zinc-200 p-6">
            {submitted ? (
              <div className="text-center py-4">
                <p className="text-sm font-bold text-zinc-900 mb-1">Thank you for your review!</p>
                <p className="text-xs text-zinc-500 mb-3">Your review has been posted.</p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setShowForm(false); }}
                  className="text-xs underline text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <p className="text-xs font-bold tracking-widest uppercase text-zinc-900 mb-4">Share Your Experience</p>
                  {/* Star picker */}
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-2">Your Rating *</label>
                  <div className="flex items-center gap-1">
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
                          className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating) ? 'text-amber-400' : 'text-zinc-200'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                    {(hoverRating || rating) > 0 && (
                      <span className="ml-2 text-sm font-semibold text-zinc-600">{LABELS[hoverRating || rating]}</span>
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
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@example.com"
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Not shown publicly</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">State <span className="normal-case font-normal">(optional)</span></label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    title="Select your state"
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors bg-white appearance-none"
                  >
                    <option value="">Select your state</option>
                    {INDIA_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">What did you buy? <span className="normal-case font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Air Jordan 1 Low Chicago"
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">Your Review *</label>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    rows={3}
                    className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors resize-none"
                  />
                </div>

                {error && <p className="sm:col-span-2 text-xs text-red-500 font-medium">{error}</p>}

                <div className="sm:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase hover:bg-zinc-700 disabled:bg-zinc-400 transition-colors"
                  >
                    {loading ? 'Posting...' : 'Post Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 border border-zinc-200 text-xs font-bold tracking-widest uppercase text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Review cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((review) => {
            const isGeneral = review.productSlug === 'general' || review.productSlug === 'products';
            const Wrapper = isGeneral ? 'div' : Link;
            const wrapperProps = isGeneral ? {} : { href: `/products/${review.productSlug}` };
            return (
              // @ts-ignore
              <Wrapper
                key={review.id}
                {...wrapperProps}
                className="group block bg-white border border-zinc-100 p-5 hover:border-zinc-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-zinc-900">{review.name}{review.location && <span className="ml-1.5 text-xs font-normal text-zinc-400">· {review.location}</span>}</p>
                    <StarRating value={review.rating} size="sm" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 border border-zinc-100 px-2 py-0.5">
                    {review.rating === 5 ? 'Excellent' : review.rating === 4 ? 'Great' : review.rating === 3 ? 'Good' : review.rating === 2 ? 'Fair' : 'Poor'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed line-clamp-3 mb-3">"{review.comment}"</p>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-zinc-700 transition-colors">
                  {review.productName}
                </p>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
