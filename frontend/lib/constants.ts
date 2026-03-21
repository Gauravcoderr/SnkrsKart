// ─── Site identity ───────────────────────────────────────────────────────────
export const SITE_NAME = 'SNKRS CART';
export const SITE_TAGLINE = 'Premium sneakers. Zero compromise.';
export const CONTACT_EMAIL = 'infosnkrscart@gmail.com';
export const CONTACT_PHONE_DISPLAY = '+91 94109 03791';
export const CONTACT_PHONE_TEL = '+919410903791';
export const INSTAGRAM_URL = 'https://www.instagram.com/snkrs_cart/';
export const MARQUEE_TEXT =
  'SNKRS CART: 100% AUTHENTIC SNEAKERS • TRUSTED SELLER • SECURE PACKAGING • PAN INDIA SHIPPING • NO FAKES • NO COMPROMISE • ';

// ─── Brands — single source of truth ─────────────────────────────────────────
// Used by: Navbar (navAccent), Footer (slug/label), FilterSidebar (label),
//          BrandGrid (accent, cardBg, cardImage)
export const BRANDS = [
  {
    slug: 'jordan',
    label: 'Jordan',
    navAccent: '#C8102E',
    accent: '#e11d48',
    cardBg: '#111',
    cardImage:
      'https://images.vegnonveg.com/resized/800X800/14383/jordan-air-jordan-1-mid-se-summit-whiteblue-chill-black-6915be658c878.jpg?format=webp',
  },
  {
    slug: 'nike',
    label: 'Nike',
    navAccent: '#111111',
    accent: '#ea580c',
    cardBg: '#111',
    cardImage:
      'https://images.vegnonveg.com/resized/800X800/14783/nike-dunk-low-retro-sailfir-6985d59229395.jpg?format=webp',
  },
  {
    slug: 'adidas',
    label: 'Adidas',
    navAccent: '#0052CC',
    accent: '#2563eb',
    cardBg: '#111',
    cardImage:
      'https://images.vegnonveg.com/resized/800X800/14808/adidas-originals-adizero-evo-sl-whitecore-black-6985cf7dc9358.jpg?format=webp',
  },
  {
    slug: 'new-balance',
    label: 'New Balance',
    navAccent: '#E47911',
    accent: '#059669',
    cardBg: '#111',
    cardImage:
      'https://images.vegnonveg.com/resized/800X800/13828/new-balance-9060-new-spruce-68a83ec87633b.jpg?format=webp',
  },
  {
    slug: 'crocs',
    label: 'Crocs',
    navAccent: '#179A3A',
    accent: '#d97706',
    cardBg: '#111',
    cardImage:
      'https://images.vegnonveg.com/resized/800X800/14886/crocs-crush-clog-lunar-dusk-69a57b7789d80.jpg?format=webp',
  },
] as const;

// ─── Product filter options ───────────────────────────────────────────────────
export const SHOE_SIZES = [5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12];
export const GENDERS = ['men', 'women', 'unisex'] as const;

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const;

// ─── Footer navigation ────────────────────────────────────────────────────────
export const FOOTER_SHOP_LINKS = [
  { label: 'New Arrivals', href: '/products' },
  { label: 'Trending', href: '/products' },
  { label: 'Sale', href: '/products' },
  { label: 'All Sneakers', href: '/products' },
];

export const FOOTER_HELP_LINKS = [
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Shipping Info', href: '/shipping' },
  { label: 'Returns & Exchanges', href: '/returns' },
  { label: 'Track My Order', href: '/track-order' },
  { label: 'FAQs', href: '/faqs' },
];

export const FOOTER_ABOUT_LINKS = [
  { label: 'Our Story', href: '/about' },
  { label: 'Contact Us', href: '/about' },
  { label: 'Become a Seller', href: '/sell' },
  { label: 'SNKRS Blog', href: '/blogs' },
];
