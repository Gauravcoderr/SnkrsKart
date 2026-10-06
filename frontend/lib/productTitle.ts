export function fullProductName(brand: string | undefined, name: string | undefined): string {
  const b = (brand ?? '').trim();
  const n = (name ?? '').trim();
  if (!b) return n;
  if (!n) return b;
  return n.toLowerCase().includes(b.toLowerCase()) ? n : `${b} ${n}`;
}
