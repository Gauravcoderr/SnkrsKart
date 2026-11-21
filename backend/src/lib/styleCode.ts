const STYLE_CODE = /^(?:[A-Z]{2}\d{4}-\d{3}|\d{6}-\d{2,3}|\d{6}-\d{2}[A-Z]|\d{6}-\d[A-Z]{2}|[A-Z]{2}\d{4}|\d{4}[A-Z]\d{3}-\d{3}|[MUW]\d{3,4}[A-Z]{2,4}\d?|\d[A-Z]{2}\d{8})$/i;
const ADIDAS_SHAPE = /^[A-Z]{2}\d{4}$/;
const NEW_BALANCE_SHAPE = /^[MUW]\d{3,4}[A-Z]{2,4}\d?$/;
const NOT_A_CODE = /^(?:(?:SS|FW|AW|SU|HO|FA|SP)(?:19|20)\d{2}|ZX\d{4})$/;

export function styleCode(sku?: string): string {
  const s = (sku ?? '').trim();
  return STYLE_CODE.test(s) ? s.toUpperCase() : '';
}

function fitsBrand(code: string, brand: string): boolean {
  if (code.includes('-')) return true;
  if (ADIDAS_SHAPE.test(code)) return /adidas/i.test(brand) && !NOT_A_CODE.test(code);
  if (NEW_BALANCE_SHAPE.test(code)) return /new\s*balance/i.test(brand);
  return false;
}

function codeInText(text: string, brand: string): string {
  const parts = text
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const pair = i + 1 < parts.length ? styleCode(`${parts[i]}-${parts[i + 1]}`) : '';
    if (pair && fitsBrand(pair, brand)) return pair;
    const single = styleCode(parts[i]);
    if (single && fitsBrand(single, brand)) return single;
  }
  return '';
}

export function findStyleCode(brand: string, texts: Array<string | null | undefined>): string {
  for (const text of texts) {
    if (typeof text !== 'string' || !text) continue;
    const code = codeInText(text, brand);
    if (code) return code;
  }
  return '';
}
