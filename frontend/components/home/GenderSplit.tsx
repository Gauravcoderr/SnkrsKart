import GenderSplitClient, { GenderPanel } from './GenderSplitClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://snkrskart.onrender.com/api/v1';

const PANEL_CONFIG: Omit<GenderPanel, 'image'>[] = [
  {
    id: 'men',
    heading: 'MEN',
    sub: 'Nike · Jordan · Adidas · New Balance',
    count: '100+ Styles',
    href: '/products?gender=men',
    accent: '#38bdf8',
    accentClass: 'text-sky-400',
    align: 'left',
  },
  {
    id: 'women',
    heading: 'WOMEN',
    sub: 'Nike · Jordan · Adidas · Crocs',
    count: '80+ Styles',
    href: '/products?gender=women',
    accent: '#fb7185',
    accentClass: 'text-rose-400',
    align: 'right',
  },
];

const FALLBACKS = {
  men:   'https://res.cloudinary.com/dadulg5bs/image/upload/v1777395734/product-images/air-jordan-3-retro-black-cement-2024-mens-img-0.webp',
  women: 'https://static.nike.com/a/images/w_1280,q_auto,f_auto/d4413d66-0de9-486c-8f43-530963dc2905/fecha-de-lanzamiento-de-los-air-jordan-1-high-og-satin-shadow-fd4810-010.jpg',
};

async function fetchImage(gender: 'men' | 'women'): Promise<string> {
  try {
    const res = await fetch(`${API}/products?gender=${gender}&limit=1`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return FALLBACKS[gender];
    const data = await res.json();
    return data.products?.[0]?.images?.[0] ?? FALLBACKS[gender];
  } catch {
    return FALLBACKS[gender];
  }
}

export default async function GenderSplit() {
  const [menImage, womenImage] = await Promise.all([
    fetchImage('men'),
    fetchImage('women'),
  ]);

  const panels: GenderPanel[] = [
    { ...PANEL_CONFIG[0], image: menImage },
    { ...PANEL_CONFIG[1], image: womenImage },
  ];

  return <GenderSplitClient panels={panels} />;
}
