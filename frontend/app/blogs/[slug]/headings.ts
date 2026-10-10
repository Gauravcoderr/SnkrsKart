export interface Heading {
  id: string;
  text: string;
  level: number;
}

const HEADING_RE = /<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/gi;

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/&[a-z]+;|&#\d+;/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

export function extractHeadings(html: string): Heading[] {
  const out: Heading[] = [];
  const used = new Set<string>();
  let idx = 0;
  for (const m of html.matchAll(HEADING_RE)) {
    const text = decodeEntities(m[3].replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
    const base = slugifyHeading(text) || `section-${idx + 1}`;
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    out.push({ id, text, level: parseInt(m[1], 10) });
    idx++;
  }
  return out;
}

export function injectHeadingIds(html: string, headings: Heading[]): string {
  let i = 0;
  return html.replace(HEADING_RE, (_m, level: string, attrs: string, inner: string) => {
    const id = headings[i++]?.id;
    const cleaned = attrs.replace(/\s+id\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, '');
    return id ? `<h${level}${cleaned} id="${id}">${inner}</h${level}>` : `<h${level}${attrs}>${inner}</h${level}>`;
  });
}
