export const TAG_ACCENTS: Record<string, { bg: string; tagBg: string; tagText: string; accent: string; border: string; dot: string; heroGrad: string }> = {
  jordan:        { bg: 'bg-red-50',     tagBg: 'bg-red-100',     tagText: 'text-red-700',     accent: 'text-red-600',     border: 'border-red-200',    dot: 'bg-red-400',    heroGrad: 'from-red-900 to-red-700'      },
  nike:          { bg: 'bg-orange-50',  tagBg: 'bg-orange-100',  tagText: 'text-orange-700',  accent: 'text-orange-600',  border: 'border-orange-200', dot: 'bg-orange-400', heroGrad: 'from-orange-900 to-orange-700' },
  adidas:        { bg: 'bg-blue-50',    tagBg: 'bg-blue-100',    tagText: 'text-blue-700',    accent: 'text-blue-600',    border: 'border-blue-200',   dot: 'bg-blue-400',   heroGrad: 'from-blue-900 to-blue-700'    },
  'new-balance': { bg: 'bg-amber-50',   tagBg: 'bg-amber-100',   tagText: 'text-amber-700',   accent: 'text-amber-600',   border: 'border-amber-200',  dot: 'bg-amber-400',  heroGrad: 'from-amber-900 to-amber-700'  },
  'new balance': { bg: 'bg-amber-50',   tagBg: 'bg-amber-100',   tagText: 'text-amber-700',   accent: 'text-amber-600',   border: 'border-amber-200',  dot: 'bg-amber-400',  heroGrad: 'from-amber-900 to-amber-700'  },
  crocs:         { bg: 'bg-green-50',   tagBg: 'bg-green-100',   tagText: 'text-green-700',   accent: 'text-green-600',   border: 'border-green-200',  dot: 'bg-green-400',  heroGrad: 'from-green-900 to-green-700'  },
  guide:         { bg: 'bg-violet-50',  tagBg: 'bg-violet-100',  tagText: 'text-violet-700',  accent: 'text-violet-600',  border: 'border-violet-200', dot: 'bg-violet-400', heroGrad: 'from-violet-900 to-violet-700' },
  india:         { bg: 'bg-emerald-50', tagBg: 'bg-emerald-100', tagText: 'text-emerald-700', accent: 'text-emerald-600', border: 'border-emerald-200',dot: 'bg-emerald-400',heroGrad: 'from-emerald-900 to-emerald-700'},
  history:       { bg: 'bg-stone-50',   tagBg: 'bg-stone-200',   tagText: 'text-stone-700',   accent: 'text-stone-600',   border: 'border-stone-200',  dot: 'bg-stone-400',  heroGrad: 'from-stone-800 to-stone-700'  },
  trends:        { bg: 'bg-pink-50',    tagBg: 'bg-pink-100',    tagText: 'text-pink-700',    accent: 'text-pink-600',    border: 'border-pink-200',   dot: 'bg-pink-400',   heroGrad: 'from-pink-900 to-pink-700'    },
  releases:      { bg: 'bg-cyan-50',    tagBg: 'bg-cyan-100',    tagText: 'text-cyan-700',    accent: 'text-cyan-600',    border: 'border-cyan-200',   dot: 'bg-cyan-400',   heroGrad: 'from-cyan-900 to-cyan-700'    },
  collaboration: { bg: 'bg-purple-50',  tagBg: 'bg-purple-100',  tagText: 'text-purple-700',  accent: 'text-purple-600',  border: 'border-purple-200', dot: 'bg-purple-400', heroGrad: 'from-purple-900 to-purple-700' },
  'style guide': { bg: 'bg-teal-50',    tagBg: 'bg-teal-100',    tagText: 'text-teal-700',    accent: 'text-teal-600',    border: 'border-teal-200',   dot: 'bg-teal-400',   heroGrad: 'from-teal-900 to-teal-700'    },
  'care guide':  { bg: 'bg-lime-50',    tagBg: 'bg-lime-100',    tagText: 'text-lime-700',    accent: 'text-lime-600',    border: 'border-lime-200',   dot: 'bg-lime-500',   heroGrad: 'from-lime-900 to-lime-700'    },
};

export const DEFAULT_ACCENT = {
  bg: 'bg-zinc-50', tagBg: 'bg-zinc-100', tagText: 'text-zinc-600',
  accent: 'text-zinc-600', border: 'border-zinc-200', dot: 'bg-zinc-400',
  heroGrad: 'from-zinc-900 to-zinc-700',
};

export function getAccent(tags: string[]) {
  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (TAG_ACCENTS[key]) return TAG_ACCENTS[key];
  }
  return DEFAULT_ACCENT;
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function readingTime(content: string): number {
  const text = (content || '').replace(/<[^>]*>/g, '');
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
}

export function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export const PAGE_SIZE = 30;
