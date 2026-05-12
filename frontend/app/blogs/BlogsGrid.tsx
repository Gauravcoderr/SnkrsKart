'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Blog } from '@/types';
import { fetchPaginated } from '@/lib/pagination';
import { getAccent, formatDate, readingTime, isNew, PAGE_SIZE } from './blogUtils';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Props {
  initialBlogs: Blog[];
  initialPage: number;
  totalPages: number;
}

export default function BlogsGrid({ initialBlogs, initialPage, totalPages }: Props) {
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPage < totalPages);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const { blogs: more, pages } = await fetchPaginated<Blog>(
        `${API}/blogs?page=${nextPage}&limit=${PAGE_SIZE}`,
      );
      setBlogs((prev) => [...prev, ...more]);
      setPage(nextPage);
      if (nextPage >= pages) setHasMore(false);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      {/* ── Section divider ────────────────────────────────── */}
      {blogs.length > 0 && (
        <div className="flex items-center gap-3 mb-8">
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-zinc-400">Latest Posts</p>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────── */}
      {blogs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 mb-12">
          {blogs.map((blog) => {
            const a = getAccent(blog.tags);
            return (
              <div
                key={blog._id}
                className={`group relative rounded-2xl overflow-hidden border ${a.border} ${a.bg} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
              >
                <Link href={`/blogs/${blog.slug}`} className="absolute inset-0 z-10" aria-label={blog.title} />
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
                    <div className={`absolute inset-0 bg-gradient-to-br ${a.heroGrad} flex items-center justify-center`}>
                      <span className="text-4xl opacity-20">👟</span>
                    </div>
                  )}
                  {isNew(blog.createdAt) && (
                    <div className="absolute top-3 right-3 z-20 pointer-events-none">
                      <span className="bg-zinc-900 text-white text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full shadow">NEW</span>
                    </div>
                  )}
                </div>

                <div className="relative p-5 sm:p-6 pointer-events-none">
                  {blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {blog.tags.slice(0, 2).map((t) => (
                        <Link key={t} href={`/blogs/tag/${encodeURIComponent(t.toLowerCase())}`} className={`relative z-20 pointer-events-auto text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${a.tagBg} ${a.tagText} hover:opacity-75 transition-opacity`}>{t}</Link>
                      ))}
                    </div>
                  )}
                  <h2 className="text-sm font-black tracking-tight text-zinc-950 group-hover:text-zinc-600 transition-colors leading-snug mb-2 line-clamp-2">
                    {blog.title}
                  </h2>
                  {blog.excerpt && (
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-4">
                      {blog.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.dot}`} />
                      <span>{formatDate(blog.createdAt)}</span>
                      <span>&middot;</span>
                      <span>{readingTime(blog.content)} min read</span>
                    </div>
                    <svg
                      className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-0.5 transition-all"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sentinel + loader ─────────────────────────────── */}
      <div ref={sentinelRef} className="h-1" />
      {loading && (
        <div className="flex justify-center py-10">
          <div className="flex items-center gap-3 text-zinc-400 text-sm">
            <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            Loading more articles…
          </div>
        </div>
      )}
      {!hasMore && blogs.length > 0 && (
        <p className="text-center text-xs text-zinc-400 tracking-widest uppercase py-6">
          You&apos;ve seen all articles
        </p>
      )}
    </>
  );
}
