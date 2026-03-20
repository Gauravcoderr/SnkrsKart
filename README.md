# SNKRS CART

Premium sneaker e-commerce website — inspired by vegnonveg.com, Nike, and leading 2025 streetwear stores.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS — Full SSR/ISR
- **Backend**: Node.js + Express + TypeScript

## Getting Started

### 1. Start the Backend API (Terminal 1)
```bash
cd backend
npm install
npm run dev
# API runs on http://localhost:4000
```

### 2. Start the Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

## Features
- **Homepage**: Marquee ticker, split hero, new arrivals carousel, 6-brand grid, editorial drop banner, trending grid
- **Product Listing**: Filter by brand / size / gender / price, sort, active filter tags, pagination
- **Product Detail**: Full SSR, image gallery with zoom, size selector, Add to Cart with micro-interaction
- **Cart Drawer**: Glassmorphism slide-in, free shipping progress bar, qty controls
- **Cart Page**: Full bag view with order summary

## API Endpoints
```
GET /api/v1/products          # All products (supports ?brand=nike&size=9&sort=newest)
GET /api/v1/products/featured # Featured products
GET /api/v1/products/new-arrivals
GET /api/v1/products/trending
GET /api/v1/products/:slug    # Single product
GET /api/v1/brands            # All 6 brands
GET /health                   # Health check
```

## SSR Architecture
- **Homepage**: Server Component with ISR (60s revalidate) — all sections fetched server-side
- **Product Detail**: Server Component with ISR (60s revalidate) + `generateMetadata`
- **Product Listing**: Server Component shell + Client Component for filter interactivity
- **Cart**: Client Component (reads from localStorage, no server state)
