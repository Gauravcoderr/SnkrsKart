// ─── Site identity ───────────────────────────────────────────────────────────
export const SITE_NAME = 'SNKRS CART';
export const SITE_TAGLINE = 'Premium sneakers. Zero compromise.';
export const CONTACT_EMAIL = 'info@snkrscart.com';
export const CONTACT_PHONE_DISPLAY = '+91 94109 03791';
export const CONTACT_PHONE_TEL = '+919410903791';
export const INSTAGRAM_URL = 'https://www.instagram.com/snkrs_cart/';
// Google Business Profile "write a review" short link (public). Opens the rating dialog directly.
export const GOOGLE_REVIEW_URL = 'https://g.page/r/CQyHw6Rl_xHBECE/review';
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
      'https://res.cloudinary.com/dadulg5bs/image/upload/f_auto,q_auto,w_800/v1792175826/site-images/brand-card-jordan.webp',
  },
  {
    slug: 'nike',
    label: 'Nike',
    navAccent: '#111111',
    accent: '#ea580c',
    cardBg: '#111',
    cardImage:
      'https://res.cloudinary.com/dadulg5bs/image/upload/f_auto,q_auto,w_800/v1792175828/site-images/brand-card-nike.webp',
  },
  {
    slug: 'adidas',
    label: 'Adidas',
    navAccent: '#0052CC',
    accent: '#2563eb',
    cardBg: '#111',
    cardImage:
      'https://res.cloudinary.com/dadulg5bs/image/upload/f_auto,q_auto,w_800/v1792175831/site-images/brand-card-adidas.webp',
  },
  {
    slug: 'new-balance',
    label: 'New Balance',
    navAccent: '#E47911',
    accent: '#059669',
    cardBg: '#111',
    cardImage:
      'https://res.cloudinary.com/dadulg5bs/image/upload/f_auto,q_auto,w_800/v1792175833/site-images/brand-card-new-balance.webp',
  },
  {
    slug: 'crocs',
    label: 'Crocs',
    navAccent: '#179A3A',
    accent: '#d97706',
    cardBg: '#111',
    cardImage:
      'https://res.cloudinary.com/dadulg5bs/image/upload/f_auto,q_auto,w_800/v1792175836/site-images/brand-card-crocs.webp',
  },
] as const;

// ─── India states & UTs ───────────────────────────────────────────────────────
export const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;

// ─── Product filter options ───────────────────────────────────────────────────
export const SHOE_SIZES = [4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12];
export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;
export const ACCESSORY_SIZES = ['One Size', 'S/M', 'M/L'] as const;
export const PRODUCT_TYPES = ['shoes', 'clothing', 'accessories'] as const;
export const CATEGORIES_BY_TYPE = {
  shoes: ['lifestyle', 'basketball', 'running', 'skateboarding', 'casual', 'training'],
  clothing: ['t-shirts', 'hoodies', 'sweatshirts', 'jackets', 'pants', 'joggers', 'shorts', 'tracksuits', 'polos', 'shirts', 'jerseys', 'sweaters', 'tights & leggings', 'sports bras', 'skirts & dresses'],
  accessories: ['caps', 'bags', 'socks', 'keychains', 'other'],
} as const;
export const GENDERS = ['men', 'women', 'unisex'] as const;

export const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const;

// ─── Footer navigation ────────────────────────────────────────────────────────
export const FOOTER_SHOP_LINKS = [
  { label: 'New Arrivals', href: '/products?sort=newest' },
  { label: 'Trending', href: '/products?sort=popular' },
  { label: 'Men', href: '/category/men' },
  { label: 'Women', href: '/category/women' },
  { label: 'Kids', href: '/category/kids' },
  { label: 'Sale', href: '/category/sale' },
  { label: 'Upcoming Drops', href: '/drops' },
  { label: 'Sneaker Guide', href: '/sneakers' },
];

export const FOOTER_HELP_LINKS = [
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Shipping Info', href: '/shipping' },
  { label: 'Cancellation & Refund', href: '/returns' },
  { label: 'Track My Order', href: '/track-order' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Free Legit Check', href: 'https://legitcheck.snkrscart.com/' },
];

export const FOOTER_ABOUT_LINKS = [
  { label: 'Our Story', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Become a Seller', href: '/sell' },
  { label: 'SNKRS Blog', href: '/blogs' },
];
