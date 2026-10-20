const KEEP_UPPER = new Set([
  'OG', 'SB', 'GS', 'PS', 'TD', 'AJ', 'QS', 'SE', 'PRM', 'NRG', 'LX', 'GTX', 'UNC', 'NYC', 'LA', 'USA', 'UK', 'US', 'EU', 'JP',
  'DMP', 'ACG', 'SP', 'TS', 'WMNS', 'ID', 'DNA', 'XS', 'XL', 'XXL', 'BB', 'BG', 'PE', 'EP', 'KD', 'PG', 'AF', 'AM', 'TN', 'DS',
  'CDG', 'NB', 'NBA', 'MLB', 'NFL', 'ATL', 'DC', 'SF', 'CNY', 'FW', 'SS', 'GR', 'LTD', 'MJ', 'LV', 'EQT', 'NMD', 'ZX', 'UB',
  'ADV', 'OW', 'FOG', 'MMW', 'LDN', 'PRO', 'CL', 'PF', 'TX', 'RX', 'UV', 'VNDS', 'VNTG', 'XX', 'XXX', 'MVP', 'ASW', 'EXP', 'AMG',
]);

const LOWER = new Set(['x', 'and', 'of', 'the', 'for', 'in', 'on', 'at', 'by', 'with', 'vs']);

const ROMAN = /^(?=[IVXLC]{2,})M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

export function isShouting(name: string): boolean {
  const letters = name.replace(/[^A-Za-z]/g, '');
  if (letters.length < 4) return false;
  const upper = letters.replace(/[^A-Z]/g, '').length;
  return upper / letters.length >= 0.8;
}

export function titleCaseName(name: string): string {
  let first = true;
  return name.replace(/[A-Za-z0-9][A-Za-z0-9']*/g, (tok) => {
    const up = tok.toUpperCase();
    const isFirst = first;
    first = false;
    if (/\d/.test(up)) {
      if (/^\d+V\d+$/.test(up)) return up.toLowerCase();
      if (/^\d+(ST|ND|RD|TH)$/.test(up)) return up.toLowerCase();
      return up;
    }
    if (KEEP_UPPER.has(up)) return up;
    if (ROMAN.test(up)) return up;
    const lower = up.toLowerCase();
    if (!isFirst && LOWER.has(lower)) return lower;
    return up[0] + lower.slice(1);
  });
}

const LEADING_BRAND_DUP = /^([a-z]+)\s*(?:[|\-:]\s*)?(?=(?:air\s+)?\1\b)/i;

const NICKNAME_TAIL = /\s(?=\(|\d{4}\b|(?:GS|PS|TD)\b|-\s)/;

export function balanceQuotes(name: string): string {
  let out = name.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  for (const q of ["'", '"']) {
    const open = new RegExp(`(^|[\\s(])${q}(?=[A-Za-z0-9])`, 'g');
    const close = new RegExp(`(?<=[A-Za-z0-9!?.)])${q}(?=$|[\\s),.:;-])`, 'g');
    const opens = [...out.matchAll(open)].filter((m) => !(q === "'" && /^'\d{2}\b/.test(out.slice(m.index! + m[1].length))));
    const closes = out.match(close)?.length ?? 0;
    if (opens.length !== closes + 1) continue;
    const start = opens[opens.length - 1].index! + opens[opens.length - 1][1].length + 1;
    const tail = out.slice(start).search(NICKNAME_TAIL);
    const end = tail === -1 ? out.length : start + tail;
    out = `${out.slice(0, end).trimEnd()}${q}${out.slice(end)}`;
  }
  return out.replace(/(^|[\s(])(['"])([a-z])/g, (_, pre, q, c) => `${pre}${q}${c.toUpperCase()}`);
}

export function normalizeProductName(name: string): string {
  const trimmed = balanceQuotes(String(name ?? '').replace(/\s+/g, ' ').trim().replace(LEADING_BRAND_DUP, ''));
  return isShouting(trimmed) ? titleCaseName(trimmed) : trimmed;
}

export function normalizeColorway(colorway: string): string {
  const c = String(colorway ?? '')
    .replace(/["“”‘’]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s|/,-]+|[\s|/,-]+$/g, '');
  const lowerWord = c.split(/[\s|/-]+/).some((w) => /^[a-z]/.test(w) && !LOWER.has(w));
  return isShouting(c) || lowerWord ? titleCaseName(c) : c;
}

export function fullProductName(brand: string, name: string): string {
  const b = (brand ?? '').trim();
  const n = (name ?? '').trim();
  if (!b) return n;
  if (!n) return b;
  return n.toLowerCase().includes(b.toLowerCase()) ? n : `${b} ${n}`;
}
