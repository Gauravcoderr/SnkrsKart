export function fullProductName(brand: string | undefined, name: string | undefined): string {
  const b = (brand ?? '').trim();
  const n = (name ?? '').trim();
  if (!b) return n;
  if (!n) return b;
  return n.toLowerCase().includes(b.toLowerCase()) ? n : `${b} ${n}`;
}

export function priceInIndiaTitle(brand: string | undefined, name: string | undefined): string {
  return `${fullProductName(brand, name)} Price in India | Snkrs Cart`;
}

export function sneakerGuideTitle(brand: string | undefined, name: string | undefined): string {
  return `${fullProductName(brand, name)} Guide: History and Specs | Snkrs Cart`;
}

export function profileTitle(brand: string | undefined, name: string | undefined, hasIndiaPrice: boolean): string {
  if (hasIndiaPrice) return priceInIndiaTitle(brand, name);
  return sneakerGuideTitle(brand, name);
}
