# SNKRS CART — Project Structure

## Overview
Full-stack sneaker e-commerce app. Backend on port 4000, frontend on port 3000.

---

## Backend (`/backend`)
**Stack:** Express + TypeScript, in-memory JSON data (no DB)

```
backend/
├── src/
│   ├── index.ts                  # Express app, CORS (allows localhost:3000), port 4000
│   ├── data/
│   │   ├── products.json         # 30 products across 6 brands
│   │   └── brands.json           # 6 brand entries
│   ├── controllers/
│   │   ├── productController.ts  # Filter/sort/paginate logic
│   │   └── brandController.ts
│   └── routes/
│       ├── products.ts           # /api/v1/products
│       └── brands.ts             # /api/v1/brands
```

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/products` | All products (filter, sort, paginate) |
| GET | `/api/v1/products/featured` | Featured products (up to 6) |
| GET | `/api/v1/products/new-arrivals` | New arrivals (up to 8) |
| GET | `/api/v1/products/trending` | Trending products (up to 8) |
| GET | `/api/v1/products/:slug` | Single product by slug |
| GET | `/api/v1/brands` | All brands |

### Query Params (GET /products)
`brand`, `size`, `color`, `gender`, `minPrice`, `maxPrice`, `search`, `sort` (popular/newest/price_asc/price_desc), `page`, `limit`

### Brands
Nike, Adidas, New Balance, Asics, Puma, Vans

---

## Frontend (`/frontend`)
**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + React Query

```
frontend/
├── app/
│   ├── layout.tsx                # Root layout: QueryProvider → CartProvider → Header + CartDrawer + Footer
│   ├── page.tsx                  # Home: MarqueeStrip + HeroBanner + NewArrivals + BrandGrid + DropBanner + TrendingNow
│   ├── icon.svg                  # Favicon (SVG cart icon)
│   ├── products/
│   │   ├── page.tsx              # Products listing (Suspense wrapper)
│   │   └── ProductsClient.tsx    # Client component: filters + grid + pagination
│   ├── products/[slug]/
│   │   ├── page.tsx              # Product detail (server component, fetches product + related)
│   │   └── ProductDetailClient.tsx  # Size selector + Add to Cart (client)
│   └── cart/
│       ├── page.tsx              # Cart page
│       └── CartPageClient.tsx    # Cart items + summary (client)
├── components/
│   ├── layout/
│   │   ├── Header.tsx            # Sticky nav: logo (logo.jpg), nav links, brands dropdown, mobile menu, cart icon
│   │   ├── Footer.tsx            # Dark footer with brand/shop/help links
│   │   ├── CartDrawer.tsx        # Slide-in cart drawer (right), free shipping bar
│   │   ├── QueryProvider.tsx     # TanStack React Query client provider
│   │   └── Navbar.tsx            # (legacy, not used — Header is active)
│   ├── home/
│   │   ├── HeroBanner.tsx        # Full-height split hero (dark left / image right)
│   │   ├── MarqueeStrip.tsx      # Scrolling announcement ticker
│   │   ├── TrendingNow.tsx       # 4-col trending grid + CTA
│   │   ├── NewArrivals.tsx       # Horizontal scroll on mobile, grid on desktop
│   │   ├── BrandGrid.tsx         # 6-col brand tiles (dark backgrounds)
│   │   └── DropBanner.tsx        # Featured drop (Samba OG) dark banner
│   ├── products/
│   │   ├── ProductCard.tsx       # Card with hover image swap, quick-add size panel
│   │   ├── ProductGrid.tsx       # Responsive grid, skeleton loading, empty state
│   │   ├── FilterSidebar.tsx     # Brand/gender/size/price filters (collapsible sections)
│   │   ├── SortDropdown.tsx      # Sort select + product count
│   │   └── ActiveFilterTags.tsx  # Removable active filter chips
│   ├── product-detail/
│   │   ├── ImageGallery.tsx      # Thumbnail strip + main image + zoom lightbox + mobile swipe dots
│   │   ├── SizeSelector.tsx      # UK size grid, unavailable sizes crossed out, error highlight
│   │   └── AddToCartButton.tsx   # Animated add-to-cart (idle → adding → added → drawer opens)
│   ├── cart/
│   │   ├── CartItem.tsx          # Cart item row with qty controls
│   │   ├── CartSummary.tsx       # Subtotal + checkout CTA
│   │   └── EmptyCart.tsx         # Empty state UI
│   └── ui/
│       ├── Badge.tsx             # new / sale / soldout / discount badges
│       ├── Button.tsx            # primary / outline / ghost variants
│       └── Skeleton.tsx          # Pulse skeleton + ProductCardSkeleton
├── context/
│   └── CartContext.tsx           # Cart state (useReducer), localStorage persistence, Escape key closes drawer
├── hooks/
│   └── useProductFilters.ts      # Filter state + useQuery for products, URL sync
├── lib/
│   ├── api.ts                    # All fetch helpers (server + client variants)
│   └── utils.ts                  # cn(), formatPrice() (₹ INR), slugify(), getDiscountPercent()
├── types/
│   └── index.ts                  # Product, Brand, CartItem, FilterState, ProductsResponse, SortOption
└── public/
    ├── logo.jpg                  # SNKRS CART logo (user-provided, used in Header + favicon)
    └── logo.svg                  # SVG version of logo (backup)
```

---

## Key Decisions
- **Prices in paise-like integers** — e.g. `12995` = ₹12,995, formatted with `formatPrice()`
- **No database** — all data is in `/backend/src/data/*.json`
- **Cart persisted to localStorage** — key: `snkrs-cart`
- **React Query** (`@tanstack/react-query` v5) used in `useProductFilters` for client-side product fetching with caching/deduplication
- **Home page is a Server Component** — fetches trending/new-arrivals/brands server-side with ISR (`revalidate: 60`)
- **Product detail page is a Server Component** — fetches by slug server-side
- **Products page is a Client Component** — filter interactions require client state
- **Fonts:** Inter (sans body) + Bebas Neue (display/headings) via `next/font/google`
- **Logo:** `/public/logo.jpg` used in Header `<Image>` and favicon metadata

## Run Commands
```bash
# Backend
cd backend && npm run dev        # ts-node-dev, hot reload

# Frontend
cd frontend && npm run dev       # Next.js dev server
```
