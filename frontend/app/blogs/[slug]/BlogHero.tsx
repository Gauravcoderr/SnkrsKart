import Image from 'next/image';
import Link from 'next/link';
import type { Blog, BlogTemplate } from '@/types';
import ShareBar from './ShareBar';

interface HeroAccent {
  bg: string;
  border: string;
  tagBg: string;
  tagText: string;
  heroGrad: string;
}

interface BlogHeroProps {
  blog: Blog;
  template: BlogTemplate;
  accent: HeroAccent;
  dateLabel: string;
  minutes: number;
  postUrl: string;
}

function tagHref(tag: string) {
  return `/blogs/tag/${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`;
}

function BackIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function HeroV1({ blog, accent, dateLabel, minutes, postUrl }: Omit<BlogHeroProps, 'template'>) {
  const safeTags = blog.tags ?? [];
  return (
    <div className="relative min-h-[70vh] sm:min-h-[80vh] flex flex-col justify-end overflow-hidden bg-black">
      {blog.coverImage ? (
        <Image
          src={blog.coverImage}
          alt={blog.title}
          fill
          unoptimized
          className="object-cover opacity-60"
          sizes="100vw"
          priority
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${accent.heroGrad}`} />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />

      <div className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 pb-10 pt-20">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase text-white/60 hover:text-white transition-colors mb-6"
        >
          <BackIcon />
          SNKRS CART Blog
        </Link>

        {safeTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {safeTags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={tagHref(tag)}
                className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${accent.tagBg} ${accent.tagText} hover:opacity-75 transition-opacity`}
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1] mb-5 max-w-3xl drop-shadow-lg">
          {blog.title}
        </h1>

        {blog.excerpt && (
          <p className="blog-excerpt text-base sm:text-lg text-white/75 leading-relaxed mb-6 max-w-2xl">
            {blog.excerpt}
          </p>
        )}

        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-white/60 mb-6">
          <span className="font-semibold text-white/90">{blog.author}</span>
          <span>&middot;</span>
          <time dateTime={blog.createdAt}>{dateLabel}</time>
          <span>&middot;</span>
          <span className="flex items-center gap-1">
            <ClockIcon />
            {minutes} min read
          </span>
        </div>

        <ShareBar title={blog.title} url={postUrl} accentBg={accent.tagBg} accentText={accent.tagText} />
      </div>
    </div>
  );
}

function HeroMeta({ blog, accent, dateLabel, minutes, postUrl, titleClass, excerptClass = '', showShare = true }: Omit<BlogHeroProps, 'template'> & { titleClass: string; excerptClass?: string; showShare?: boolean }) {
  const safeTags = blog.tags ?? [];
  return (
    <>
      <Link
        href="/blogs"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-600 hover:text-zinc-900 transition-colors mb-5"
      >
        <BackIcon />
        SNKRS CART Blog
      </Link>

      {safeTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {safeTags.slice(0, 4).map((tag) => (
            <Link
              key={tag}
              href={tagHref(tag)}
              className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${accent.tagBg} ${accent.tagText} hover:opacity-75 transition-opacity`}
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      <h1 className={`font-black tracking-tight text-zinc-950 leading-[1.1] mb-4 ${titleClass}`}>
        {blog.title}
      </h1>

      {blog.excerpt && (
        <p className={`blog-excerpt text-base sm:text-lg text-zinc-700 leading-relaxed mb-5 max-w-2xl ${excerptClass}`}>
          {blog.excerpt}
        </p>
      )}

      <div className={`flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-600 ${showShare ? 'mb-5' : ''}`}>
        <span className={`w-8 h-8 rounded-full ${accent.tagBg} ${accent.tagText} flex items-center justify-center text-xs font-black`}>
          {blog.author.charAt(0).toUpperCase()}
        </span>
        <span className="font-semibold text-zinc-900">{blog.author}</span>
        <span>&middot;</span>
        <time dateTime={blog.createdAt}>{dateLabel}</time>
        <span>&middot;</span>
        <span className="flex items-center gap-1">
          <ClockIcon />
          {minutes} min read
        </span>
      </div>

      {showShare && <ShareBar title={blog.title} url={postUrl} accentBg={accent.tagBg} accentText={accent.tagText} labelClass="text-zinc-600" />}
    </>
  );
}

function Cover({ blog, accent, aspect, sizes }: { blog: Blog; accent: HeroAccent; aspect: string; sizes: string }) {
  return (
    <div className={`relative w-full ${aspect} overflow-hidden rounded-2xl sm:rounded-3xl bg-white border ${accent.border}`}>
      {blog.coverImage ? (
        <>
          <Image
            src={blog.coverImage}
            alt=""
            aria-hidden
            fill
            sizes="64px"
            className="object-cover scale-110 blur-2xl opacity-60"
          />
          <Image
            src={blog.coverImage}
            alt={blog.title}
            fill
            priority
            sizes={sizes}
            className="object-contain"
          />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${accent.heroGrad}`} />
      )}
    </div>
  );
}

function HeroV2(props: Omit<BlogHeroProps, 'template'>) {
  return (
    <header className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-6">
        <HeroMeta {...props} titleClass="text-3xl sm:text-4xl lg:text-5xl max-w-4xl" excerptClass="line-clamp-3 sm:line-clamp-none" showShare={false} />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Cover blog={props.blog} accent={props.accent} aspect="aspect-[16/9] lg:aspect-[21/9]" sizes="(max-width: 1152px) calc(100vw - 32px), 1104px" />
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5">
        <ShareBar title={props.blog.title} url={props.postUrl} accentBg={props.accent.tagBg} accentText={props.accent.tagText} labelClass="text-zinc-600" />
      </div>
    </header>
  );
}

function HeroV3(props: Omit<BlogHeroProps, 'template'>) {
  return (
    <header className={`${props.accent.bg} border-b ${props.accent.border}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:py-14 grid gap-6 lg:gap-12 lg:grid-cols-2 lg:items-center">
        <div className="lg:order-2">
          <Cover blog={props.blog} accent={props.accent} aspect="aspect-[16/9] lg:aspect-[4/3]" sizes="(max-width: 1024px) calc(100vw - 32px), 528px" />
        </div>
        <div className="lg:order-1 min-w-0">
          <HeroMeta {...props} titleClass="text-3xl sm:text-4xl lg:text-5xl" />
        </div>
      </div>
    </header>
  );
}

export default function BlogHero({ template, ...props }: BlogHeroProps) {
  if (template === 'v2') return <HeroV2 {...props} />;
  if (template === 'v3') return <HeroV3 {...props} />;
  return <HeroV1 {...props} />;
}
