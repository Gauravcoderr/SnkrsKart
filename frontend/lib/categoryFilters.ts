export interface CategoryFilter {
  category?: string;
  gender?: string[];
  minPrice?: number;
}

export const CATEGORY_FILTERS: Record<string, CategoryFilter> = {
  running:    { category: 'running' },
  basketball: { category: 'basketball' },
  lifestyle:  { category: 'lifestyle' },
  training:   { category: 'training' },
  men:        { gender: ['men', 'unisex'] },
  women:      { gender: ['women', 'unisex'] },
  kids:       { gender: ['kids'] },
  sale:       { minPrice: 1 },
};

export function categoryQuery(slug: string, limit = 48): string {
  const f = CATEGORY_FILTERS[slug];
  const p = new URLSearchParams();
  if (!f) return '';
  if (f.category) p.set('category', f.category);
  if (f.gender?.length) p.set('gender', f.gender.join(','));
  if (f.minPrice) p.set('minPrice', String(f.minPrice));
  p.set('limit', String(limit));
  return p.toString();
}
