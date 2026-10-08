import type { Product } from '@/types';

const MODEL_RULES: Record<string, { re: RegExp; label: (m: RegExpMatchArray) => string }[]> = {
  'new-balance': [{ re: /\b(\d{3,4}[A-Z]?)\b/, label: (m) => m[1] }],
  jordan: [{ re: /\bAir Jordan (\d{1,2})\b/i, label: (m) => `Air Jordan ${m[1]}` }],
  nike: [
    { re: /\bSB Dunk\b|\bDunk (Low|High)\b/i, label: (m) => (m[1] ? `Dunk ${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()}` : 'SB Dunk') },
    { re: /\bAir Force 1\b/i, label: () => 'Air Force 1' },
    { re: /\bAir Max (\d+|Plus|DN)\b/i, label: (m) => `Air Max ${m[1]}` },
    { re: /\bVomero (\d+)\b/i, label: (m) => `Vomero ${m[1]}` },
  ],
  adidas: [{ re: /\b(Samba|Gazelle|Campus|Handball Spezial|Spezial|Superstar|Stan Smith|Forum|Taekwondo|SL 72)\b/i, label: (m) => m[1].replace(/\b\w/g, (c) => c.toUpperCase()) }],
  crocs: [{ re: /\b(Classic Clog|Echo Clog|Crush Clog|Classic Slide)\b/i, label: (m) => m[1].replace(/\b\w/g, (c) => c.toUpperCase()) }],
};

export function isShoe(p: Product): boolean {
  return (p.productType ?? 'shoes') === 'shoes' && !p.comingSoon && p.price > 0;
}

export function topModels(slug: string, products: Product[], limit = 3): string[] {
  const rules = MODEL_RULES[slug] ?? [];
  const groups = new Map<string, Map<string, number>>();
  for (const p of products.filter(isShoe)) {
    for (const r of rules) {
      const m = p.name.match(r.re);
      if (m) {
        const label = r.label(m);
        const key = slug === 'new-balance' ? label.replace(/[A-Z]$/, '') : label;
        const g = groups.get(key) ?? new Map<string, number>();
        g.set(label, (g.get(label) ?? 0) + 1);
        groups.set(key, g);
        break;
      }
    }
  }
  return Array.from(groups.values())
    .map((g) => ({ total: Array.from(g.values()).reduce((a, b) => a + b, 0), label: Array.from(g.entries()).sort((a, b) => b[1] - a[1])[0][0] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((x) => x.label);
}

function joinModels(models: string[]): string {
  if (models.length <= 1) return models.join('');
  const prefix = models[0].replace(/\s*\S+$/, '');
  const shared = prefix && models.every((m) => m.startsWith(`${prefix} `));
  const parts = shared ? [models[0], ...models.slice(1).map((m) => m.slice(prefix.length + 1))] : models;
  return `${parts.slice(0, -1).join(', ')} & ${parts[parts.length - 1]}`;
}

export function brandSeo(brandName: string, slug: string, products: Product[]) {
  const shoes = products.filter(isShoe);
  const prices = shoes.map((p) => p.price);
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;
  const models = topModels(slug, products);
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  let titleModels = models;
  const modelTitle = (ms: string[]) => `${brandName} India: ${joinModels(ms)} Prices | SNKRS CART`;
  while (titleModels.length > 2 && modelTitle(titleModels).length > 60) titleModels = titleModels.slice(0, -1);
  const title = titleModels.length >= 2 && modelTitle(titleModels).length <= 65
    ? modelTitle(titleModels)
    : `${brandName} Shoes India${min ? `: Prices from ${inr(min)}` : ''} | SNKRS CART`;
  const range = min && max ? (min === max ? `at ${inr(min)}` : `from ${inr(min)} to ${inr(max)}`) : '';
  const styles = shoes.length ? `${shoes.length} ${shoes.length === 1 ? 'style' : 'styles'}` : 'the latest styles';
  const description = `Authentic ${brandName} shoes in India: ${styles}${models.length ? ` including ${joinModels(models)}` : ''}${range ? `, ${range}` : ''}. Per-size prices, 100% authentic, free pan-India shipping.`;
  return { title, description, lowestShoePrice: min, models };
}
