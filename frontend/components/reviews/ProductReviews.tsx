'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Review, FitSummary } from '@/types';
import StarRating from './StarRating';
import FitIndicator from '@/components/product-detail/FitIndicator';

interface ProductReviewsProps {
  productSlug: string;
  productName: string;
  initialReviews: Review[];
  initialFitSummary?: FitSummary | null;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dadulg5bs';
const CLOUDINARY_PRESET = 'reviews_upload';

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

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', 'reviews');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  return data.secure_url as string;
}

function updateFitSummary(current: FitSummary | null, fitRating: 'small' | 'true' | 'large' | null): FitSummary {
  const base = current ?? { small: 0, true: 0, large: 0, total: 0 };
  if (!fitRating) return base;
  return { ...base, [fitRating]: base[fitRating] + 1, total: base.total + 1 };
}

export default function ProductReviews({ productSlug, productName, initialReviews, initialFitSummary }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [fitSummary, setFitSummary] = useState<FitSummary | null>(initialFitSummary ?? null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [fitRating, setFitRating] = useState<'small' | 'true' | 'large' | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star, count: reviews.filter((r) => r.rating === star).length,
  }));

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (photoFiles.length + files.length > 3) {
      setError('Maximum 3 photos allowed'); return;
    }
    const newFiles = [...photoFiles, ...files].slice(0, 3);
    setPhotoFiles(newFiles);
    setPhotoPreviews(newFiles.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  }

  function removePhoto(i: number) {
    const files = photoFiles.filter((_, idx) => idx !== i);
    setPhotoFiles(files);
    setPhotoPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setError('');
    setLoading(true);
    try {
      // Upload photos to Cloudinary first
      let uploadedUrls: string[] = [];
      if (photoFiles.length > 0) {
        setPhotoUploading(true);
        uploadedUrls = await Promise.all(photoFiles.map(uploadToCloudinary));
        setPhotoUploading(false);
      }

      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productSlug, productName,
          name: name.trim(), rating, comment: comment.trim(),
          photos: uploadedUrls,
          fitRating,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed'); }
      const newReview: Review = await res.json();
      const updatedReviews = [newReview, ...reviews];
      setReviews(updatedReviews);
      setFitSummary(updateFitSummary(fitSummary, fitRating));
      setSubmitted(true);
      const newCount = updatedReviews.length;
      const newRating = Math.round((updatedReviews.reduce((s, r) => s + r.rating, 0) / newCount) * 10) / 10;
      window.dispatchEvent(new CustomEvent('snkrs:review-added', { detail: { newRating, newCount } }));
      setName(''); setComment(''); setRating(0); setFitRating(null);
      setPhotoFiles([]); setPhotoPreviews([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setPhotoUploading(false);
    }
  };

  return (
    <section className="mt-16 pt-10 border-t border-zinc-100">
      <h2 className="text-xs font-bold tracking-[0.3em] uppercase text-zinc-400 mb-1">Customer Reviews</h2>
      <p className="text-xl font-bold tracking-tight text-zinc-900 mb-8">What People Are Saying</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left — summary + form */}
        <div>
          {reviews.length > 0 && (
            <div className="flex items-center gap-6 mb-6 p-5 bg-zinc-50 border border-zinc-100">
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
                      {/* dynamic width — inline style required for runtime calculation */}
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-zinc-400 w-4">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fit indicator */}
          {fitSummary && <FitIndicator fitSummary={fitSummary} />}

          {/* Write a review */}
          <div className="mt-6">
            {submitted ? (
              <div className="p-5 border border-zinc-100 bg-zinc-50 text-center">
                <p className="text-sm font-bold text-zinc-900 mb-1">Thank you for your review!</p>
                <p className="text-xs text-zinc-500">Your review has been posted.</p>
                <button type="button" onClick={() => setSubmitted(false)} className="mt-3 text-xs underline text-zinc-500 hover:text-zinc-900 transition-colors">
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
                      <button key={star} type="button" onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(star)} className="focus:outline-none" aria-label={`${star} star${star > 1 ? 's' : ''}`}>
                        <svg className={`w-7 h-7 transition-colors ${star <= (hoverRating || rating) ? 'text-amber-400' : 'text-zinc-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                    {(hoverRating || rating) > 0 && (
                      <span className="ml-2 text-xs text-zinc-500 self-center">{['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][hoverRating || rating]}</span>
                    )}
                  </div>
                </div>

                {/* Fit picker */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-2">How Did It Fit? <span className="text-zinc-400 normal-case font-normal">(optional)</span></label>
                  <div className="flex gap-2">
                    {(['small', 'true', 'large'] as const).map((fit) => (
                      <button
                        key={fit}
                        type="button"
                        onClick={() => setFitRating(fitRating === fit ? null : fit)}
                        className={`flex-1 py-2 text-xs font-bold border transition-all ${
                          fitRating === fit
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-500'
                        }`}
                      >
                        {fit === 'small' ? 'Runs Small' : fit === 'true' ? 'True to Size' : 'Runs Large'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">Your Name *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul S." className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors" />
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-1">Your Review *</label>
                  <textarea required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience with this shoe..." rows={4} className="w-full border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors resize-none" />
                </div>

                {/* Photo upload */}
                <div>
                  <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 block mb-2">
                    Add Photos <span className="text-zinc-400 normal-case font-normal">(optional, max 3)</span>
                  </label>
                  {photoPreviews.length > 0 && (
                    <div className="flex gap-2 mb-2">
                      {photoPreviews.map((src, i) => (
                        <div key={i} className="relative w-16 h-16 border border-zinc-200 overflow-hidden group">
                          <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="64px" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute inset-0 bg-black/50 text-white hidden group-hover:flex items-center justify-center"
                            aria-label="Remove photo"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {photoFiles.length < 3 && (
                    <>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} aria-label="Upload review photos" title="Upload review photos" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 border border-dashed border-zinc-300 px-4 py-2 text-xs text-zinc-500 hover:border-zinc-600 hover:text-zinc-800 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        {photoPreviews.length === 0 ? 'Add Photos' : `Add More (${3 - photoFiles.length} left)`}
                      </button>
                    </>
                  )}
                </div>

                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                <button type="submit" disabled={loading} className="w-full py-3 bg-zinc-900 text-white text-sm font-bold tracking-widest uppercase hover:bg-zinc-700 disabled:bg-zinc-400 transition-colors">
                  {photoUploading ? 'Uploading Photos...' : loading ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right — reviews list */}
        <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
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
                    <div className="flex items-center gap-2">
                      <StarRating value={review.rating} size="sm" />
                      {review.fitRating && (
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          review.fitRating === 'small' ? 'bg-amber-100 text-amber-700' :
                          review.fitRating === 'large' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {review.fitRating === 'small' ? 'Runs Small' : review.fitRating === 'true' ? 'True to Size' : 'Runs Large'}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-400">{timeAgo(review.createdAt)}</span>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed mb-3">{review.comment}</p>
                {review.photos && review.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {review.photos.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxSrc(src)}
                        className="relative w-16 h-16 border border-zinc-200 overflow-hidden hover:opacity-80 transition-opacity"
                        aria-label={`View photo ${i + 1}`}
                      >
                        <Image src={src} alt={`Review photo ${i + 1}`} fill className="object-cover" sizes="64px" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Photo lightbox */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxSrc(null)}>
          <div className="relative max-w-2xl w-full max-h-[85vh] aspect-square">
            <Image src={lightboxSrc} alt="Review photo" fill className="object-contain" sizes="(max-width: 768px) 100vw, 672px" />
          </div>
          <button type="button" onClick={() => setLightboxSrc(null)} className="absolute top-4 right-4 text-white/70 hover:text-white p-2" aria-label="Close">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
