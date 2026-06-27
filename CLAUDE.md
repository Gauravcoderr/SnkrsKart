# SNKRS CART — Claude Context

## Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS → Vercel at `https://snkrs-kart.vercel.app`
- **Backend**: Express + TypeScript + MongoDB (Mongoose) → Render at `https://snkrskart.onrender.com`
- **AI Chatbot**: Gemini 2.0 Flash (primary) → Groq llama-3.3-70b (fallback)
- **Auth**: OTP via email, JWT access/refresh tokens in httpOnly cookies
- **Admin auth**: username/password → JWT in `localStorage` as `admin_token`
- **Images**: Cloudinary (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dadulg5bs`)
- **No PostgreSQL** — everything is MongoDB. Supabase keys exist in .env but are unused for main data.

## Key env vars (frontend)
```
NEXT_PUBLIC_API_URL        → backend base (e.g. https://snkrskart.onrender.com/api/v1)
NEXT_PUBLIC_SUPABASE_URL   → exists but NOT used for core data
GEMINI_API_KEY / GROQ_API_KEY → chatbot AI keys (server-side only)
BLOB_READ_WRITE_TOKEN      → Vercel Blob — required for deal screenshot uploads
```

## Key env vars (backend)
```
ADMIN_NOTIFICATION_EMAIL   → email to notify on new deal submission (optional, falls back to EMAIL_FROM)
```

## Directory structure
```
frontend/
  app/                        Next.js App Router pages
    api/chat/route.ts         KickBot chatbot API (Gemini → Groq fallback)
    api/feed/route.ts         Google Shopping RSS feed (60s timeout for Render cold start)
    admin/                    Admin panel pages
      layout.tsx              Sidebar nav + auth guard
      dashboard/              Products CRUD
      orders/                 Order list + detail
      users/                  User list + detail
      inquiries/              Inquiry list + detail
      reviews/                Reviews list
      banners/                Banners CRUD
      sellers/                Sellers list
      blogs/                  Blogs CRUD
      chat-leads/page.tsx     Chat leads from KickBot
    deal-verifications/page.tsx  Deal verification submissions + verdict UI
  components/
    layout/
      ChatBot.tsx             KickBot chat widget (full implementation)
      CartDrawer.tsx
      Header.tsx / Footer.tsx / Navbar.tsx
    home/                     Homepage sections
    products/                 Product grid + filters
    product-detail/           Images, sizes, add to cart, reviews
      DealVerifyModal.tsx     "Found it cheaper?" submission modal
  lib/api.ts                  All fetch helpers (BASE_URL from NEXT_PUBLIC_API_URL)
  types/index.ts              Shared TypeScript interfaces
  app/api/
    fetch-url-meta/route.ts   Server-side OG scraper for deal URL preview
    deal-verify/upload/route.ts  Vercel Blob screenshot upload

backend/src/
  routes/
    products.ts / brands.ts / banners.ts / blogs.ts
    orders.ts / auth.ts / reviews.ts / inquiries.ts
    newsletter.ts / seller.ts / restock.ts
    chatLeads.ts              POST /api/v1/chat/lead (save KickBot leads)
    dealVerifications.ts      POST /api/v1/deals/send-otp + /submit (in-memory OTP, no User created)
    admin.ts                  All /api/v1/admin/* routes (adminAuth protected)
  models/
    User / Product / Brand / Order / Review / Inquiry
    Banner / Seller / Blog / Newsletter / Restock / ChatLead
    DealVerification          deal submissions with status pending/real/fake/inconclusive
  config/database.ts          MongoDB connect (MONGODB_URI → dbName: snkrs-cart)
  index.ts                    Express app entry, all routes registered, /health endpoint
```

## API routes (backend)
All prefixed `/api/v1/`. Admin routes require `Authorization: Bearer <admin_token>`.

| Route | Notes |
|-------|-------|
| `GET /products` | supports `search`, `brand`, `gender`, `limit`, `page` query params |
| `GET /products/:slug` | single product |
| `POST /api/v1/chat/lead` | save KickBot lead (name, email, phone, interests[]) |
| `GET /admin/chat-leads` | admin: list chat leads |
| `DELETE /admin/chat-leads/:id` | admin: delete chat lead |
| `GET /admin/orders` | admin: all orders |
| `PUT /admin/orders/:id` | admin: update status/tracking/notes |
| `GET /admin/users` | admin: users with orderCount + totalSpend |
| `GET /admin/newsletter` | admin: newsletter subscribers |
| `POST /api/v1/deals/send-otp` | send OTP to deal submitter email (in-memory, 5 min TTL) |
| `POST /api/v1/deals/submit` | verify OTP + create DealVerification + notify admin |
| `GET /admin/deal-verifications` | admin: list all deal submissions |
| `PUT /admin/deal-verifications/:id` | admin: set verdict + note → emails user result |
| `/health` | keep-alive ping (UptimeRobot pings every 5 min) |

## KickBot (ChatBot.tsx) — key behaviours
- Greeting shown on mount, not counted as a user message
- After **5 user messages** → `LeadCaptureCard` appears inline
- Lead saved to MongoDB via `POST /api/v1/chat/lead` (email unique — duplicates silently skipped)
- Interests auto-collected from product suggestions shown during chat
- After **2.5 min** on page with chat closed → nudge bubble appears ("Need help finding the perfect sneaker?")
- Blog URLs: `/blogs/{slug}` — NOT `/products/{slug}` (fixed in system prompt)
- Product suggestions: `[SUGGESTIONS:{"slugs":[...]}]` tag in LLM response
- Blog suggestions: `[BLOG_SUGGESTIONS:{"slugs":[...]}]` tag in LLM response
- Rate limit: 5 requests/IP/minute

## Admin sidebar nav order
Orders → Users → Products → Inquiries → Reviews → Banners → Sellers → Blogs → Chat Leads → Deal Checks

## Brands available in store
Nike, Jordan (Air Jordan), Adidas, New Balance, Crocs

## Homepage section order
MarqueeStrip → HeroBanner → NewArrivals → HomeReviews → BrandGrid → TrendingNow → WhyChooseUs → ComingSoon → NewsletterBar

## Deal Verification feature

- "Found it cheaper? Verify the deal" button on product detail page (non-comingSoon products only)
- Modal: URL input → server-side OG fetch preview, screenshot upload (Vercel Blob), email + OTP verify
- OTP stored in-memory (Map) on backend — does NOT create User accounts
- Admin receives email on new submission, emails user verdict when marked real/fake/inconclusive
- Screenshot path: `deal-screenshots/{timestamp}-{random}.{ext}` in Vercel Blob

## Important decisions / gotchas
- Render free tier sleeps after 15 min inactivity → UptimeRobot pings `/health` every 5 min
- `trust proxy 1` set on Express for correct IP in rate-limiter behind Render/Vercel
- Brand grid uses `brand.slug` (NOT `brand.id`) for brandMeta lookup
- Next.js Image: allowed domains in `next.config.mjs` include Supabase + Cloudinary
- Admin token stored in `localStorage` (not httpOnly cookie) — separate from customer auth
- `NEXT_PUBLIC_API_URL` in `.env.local` points to localhost for dev; Vercel env points to Render
