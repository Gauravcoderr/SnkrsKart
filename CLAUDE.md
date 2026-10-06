# SNKRS CART — Claude Context

## Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS → Vercel at `https://snkrs-kart.vercel.app`
- **Backend**: Express + TypeScript + MongoDB (Mongoose) → Render at `https://snkrskart.onrender.com`
- **AI Chatbot**: Gemini 2.0 Flash (primary) → Groq llama-3.3-70b (fallback)
- **Auth**: OTP via email/phone or Google, JWT access (15m) + refresh (30d) in httpOnly cookies. Refresh tokens are per-device: `User.refreshTokens[]` (sha256 hashes, max 10, legacy `refreshToken` still honoured on first refresh). Frontend session restore is cookie-first (`lib/session.ts` single shared refresh lock, `fetchWithAuth` retries once). Only a 401 from `/auth/refresh` logs out; network/5xx keep the session and retry.
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
AFTERSHIP_API_KEY          → AfterShip tracking API (server-side only); AFTERSHIP_WEBHOOK_SECRET verifies webhooks
ADMIN_CC_EMAILS            → comma list CC'd on every mail whose TO is info@snkrscart.com or ADMIN_NOTIFICATION_EMAIL (default infosnkrscart@gmail.com,gauravrauthan12112@gmail.com); customer + batch/blog mails never CC'd
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
      sellers/                Seller accounts + applications (activate, reset password, suspend); [id] detail
    seller-orders/          Seller fulfilment: verification photos review, tracking override
    product-requests/       Approve/reject seller product requests
    payouts/                Due/paid seller payouts, mark paid with UPI screenshot
      blogs/                  Blogs CRUD
      chat-leads/page.tsx     Chat leads from KickBot
    deal-verifications/page.tsx  Deal verification submissions + verdict UI
  app/sellers/              Seller portal (login, dashboard, listings, orders/[id], requests, settings)
  components/seller/        SellerShell (auth guard + nav), AddListingModal, RequestProductModal, VerificationCapture
  lib/sellerApi.ts          Seller portal client (seller_token)
  lib/availability.ts       Availability labels, delivery windows, computeListPrice
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
    sellerPortal.ts           /api/v1/seller-portal/* (seller auth, listings, orders, verification, tracking, requests)
    dealVerifications.ts      POST /api/v1/deals/send-otp + /submit (in-memory OTP, no User created)
    admin.ts                  All /api/v1/admin/* routes (adminAuth protected)
  models/
    User / Product / Brand / Order / Review / Inquiry
    Banner / Seller / Blog / Newsletter / Restock / ChatLead
    DealVerification          deal submissions with status pending/real/fake/inconclusive
    SellerListing / SellerOrder / ProductRequest   seller portal (see "Seller portal" section)
  lib/sellerOffers.ts       attachSellerOffers(): merge store stock + seller listings into product.offers
  lib/sellerOrders.ts       createSellerOrders / syncSellerOrdersWithOrder / applySellerTrackingToOrder
  lib/sellerEmails.ts       seller + admin + customer-shipped email templates
  config/database.ts          MongoDB connect (MONGODB_URI → dbName: snkrs-cart)
  index.ts                    Express app entry, all routes registered, /health endpoint
```

## API routes (backend)
All prefixed `/api/v1/`. Admin routes require `Authorization: Bearer <admin_token>`.

| Route | Notes |
|-------|-------|
| `GET /products` | supports `search`, `brand`, `gender`, `limit`, `page` query params |
| `GET /products/:slug` | single product |
| `GET /drops?days=N` | published drops: upcoming + released in last N days (default 7, max 90) |
| `GET /sneaker-profiles` | list select includes `releaseYear originalRetailPrice designer` for cards |
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
| `POST /seller-portal/auth/login` | seller login → JWT (type seller) |
| `GET/POST/PUT/DELETE /seller-portal/listings` | seller's own listings (sizes must exist on the product) |
| `GET /seller-portal/catalog?search=` + `/catalog/:id` | catalog search + current best offer per size with `beat` price hints |
| `GET /seller-portal/orders`, `POST /orders/:id/verification`, `POST /orders/:id/tracking` | seller orders (no customer PII), photo verification, one-time tracking |
| `GET/POST /seller-portal/requests` | new-product requests |
| `GET/POST /admin/sellers`, `POST /admin/sellers/:id/activate|reset-password`, `PUT /admin/sellers/:id` | seller account management |
| `GET /admin/seller-orders`, `PUT /admin/seller-orders/:id/verification|tracking` | review photos, override tracking |
| `GET/PUT /admin/product-requests` | approve (needs `productId`) / reject requests |
| `GET /admin/payouts`, `PUT /admin/seller-orders/:id/payout` | delivered seller orders; mark paid (screenshotUrl required) → seller emailed |
| `POST /tracking/aftership/webhook` | AfterShip tracking updates (HMAC verified) |
| `POST /admin/seller-orders/:id/sync-tracking` | pull latest AfterShip status for one seller order |
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
Orders → Users → Products → Inquiries → Reviews → Banners → Sellers → Seller Orders → Product Requests → Payouts → Blogs → Chat Leads → Deal Checks

## Brands available in store
Nike, Jordan (Air Jordan), Adidas, New Balance, Crocs

## Drop calendar + Sneaker guide (SSR)
- `/drops` and `/sneakers` are `force-dynamic`: filter/sort/view state read from `searchParams` and passed as `initial` to the client component, which mirrors state back to the URL with `history.replaceState` (no refetch). Data fetches cached 5 min.
- `/drops` UI: next-drop strip with live `Countdown`, search, brand chips, date-range chips, list view grouped by date (sticky day headers) or month calendar view, recently released (30 days), SEO copy + FAQ (FAQPage + ItemList JSON-LD).
- `AddToCalendar` (Google URL + .ics download) lives in `components/drops/`; date helpers in `lib/calendar.ts` (all UTC-date based, matching stored midnight-UTC release dates).
- Header nav has a `Drops` link.
- Drop detail hero is `components/drops/DropGallery.tsx` (client): 4:3 stage, `object-contain` (never crop), slides = `[image, ...images]` deduped. Slider chrome (thumbs, arrows, counter, swipe, arrow keys, lightbox) only when 2+ images. `Drop.images: string[]` optional; admin form has multi-upload + reorder.

## Homepage section order
MarqueeStrip → HeroBanner → NewArrivals → HomeReviews → BrandGrid → TrendingNow → WhyChooseUs → ComingSoon → NewsletterBar

## Seller portal (`/sellers`)
- Separate auth: `POST /api/v1/seller-portal/auth/login` (email + password, bcrypt, 10 tries/15 min) → JWT `{type:'seller'}` 7d in `localStorage` as `seller_token` (`lib/sellerApi.ts`). `middleware/sellerAuth.ts` re-checks `Seller.status === 'active'` on every request. Mounted at `/seller-portal` (not `/seller`) so the 100 POST/day limiter on the public application form does not apply.
- Admin creates accounts: `POST /admin/sellers` (new) or `POST /admin/sellers/:id/activate` (from a `/sell` application). Both generate a temp password, email it (`lib/sellerEmails.ts`) and return it once; `mustChangePassword` forces a reset on first login. `reset-password` and `PUT status: suspended` (pauses all listings) also exist.
- `SellerListing` = (seller, product, size) unique. Seller enters `sellerPrice`; public `listPrice = ceil((sellerPrice * 1.10) / 10) * 10` (`computeListPrice`, mirrored in `frontend/lib/availability.ts`). Availability: `instant` (ships 24h) / `inhand` (3 days) / `eta` (~20 days). Sellers can list any standard UK size (1 to 16, half steps) on an existing shoe even if the product does not carry it yet (the offers merge adds it to the size grid); clothing is limited to the product's `stringSizes`. New products go through `ProductRequest` (name, brand, sizes, supporting URLs) which admin approves by picking the catalog product they created.
- `lib/sellerOffers.ts` `attachSellerOffers()` runs on every public product response: merges store stock (treated as `inhand`) with active listings of active sellers into `product.offers[]` (one best offer per size: lowest price, tie → faster). When a seller offer exists it also rewrites `sizes/availableSizes/variants/price` and clears `soldOut`. Frontend uses `offers` for per-size price + availability; `CartItem` carries `listingId` + `availability` and checkout sends them.
- Order creation validates listing price/qty, reserves stock atomically (`qty` decrement, `sold_out` at 0, released on any later failure), stamps items with `listingId/sellerId/sellerName/sellerPrice/availability`, then `createSellerOrders()` writes one `SellerOrder` per seller (no customer PII: only `deliveryCity/State`). Seller-portal order responses go through `forSeller()` which strips `items[].listPrice`, so sellers only ever see their own payout (`sellerPrice`, `sellerTotal`), never what the customer paid. `syncSellerOrdersWithOrder()` is called on confirm (webhook / Razorpay verify / admin PUT), cancel (restores stock unless shipped) and deliver.
- Fulfilment flow: `SellerOrder.status confirmed` → seller uploads live-camera photos (`VERIFICATION_ANGLES`, 6 required) → admin approves/rejects (`PUT /admin/seller-orders/:id/verification`, seller emailed) → seller requests the customer's address over WhatsApp (store number) → seller adds courier + tracking **once** (`trackingLockedAt`; only admin can change via `PUT /admin/seller-orders/:id/tracking`). `applySellerTrackingToOrder()` copies tracking onto the matching `Order.items[]`, sets order-level tracking/`shipped` when the whole order is one seller shipment, and emails the customer.
- Fulfilment timeline: on payment confirmation `SellerOrder.confirmedAt` is set and `shipBy = confirmedAt + max(AVAILABILITY_SHIP_DAYS of items)` (instant 1d / inhand 3d / eta 20d). Shown in the seller new-order + approval emails, portal order list/detail, dashboard (`orders.overdue`) and admin seller-orders pills (Ship by / Overdue / Shipped late). Late penalty is **info only** (`LATE_PENALTY_TEXT`, override with `SELLER_LATE_PENALTY_TEXT` env); nothing is deducted automatically.
- Payouts: `SellerOrder.payout` {status pending/due/paid, amount, dueAt, paidAt, screenshotUrl, reference, note}. Parent order `delivered` → `syncSellerOrdersWithOrder` sets `due` with `dueAt = deliveredAt + 7 days` (`PAYOUT_DELAY_DAYS`). Admin `/admin/payouts` (GET `/admin/payouts`) marks paid via `PUT /admin/seller-orders/:id/payout` (screenshot URL required, uploaded with `uploadImage(file, 'payouts')`), seller gets a payout email with amount, UTR and screenshot link. Seller dashboard/orders show Payout due / Paid out; admin pays manually to the seller's UPI ID.
- Seller profile stores the seller's own shipping address (`addressLine/city/state/pincode`, editable in portal settings and admin). Dashboard nags until address + pincode are filled; admin seller-order detail shows it as "Ships from".

## Shipment tracking (AfterShip)
- Links: `frontend/lib/tracking.ts` `getTrackingUrl()` → native deep link for Shiprocket/Blue Dart/FedEx/DHL, else public `https://www.aftership.com/track/{slug}/{awb}` (free, no key). Slugs: delhivery, dtdc, bluedart, ekart, xpressbees, shadowfax, ecom-express, india-post, fedex, dhl.
- API: `backend/src/services/aftership.ts` (header `as-api-key`, base `https://api.aftership.com/tracking/{AFTERSHIP_API_VERSION, default 2025-07}`). Env: `AFTERSHIP_API_KEY`, `AFTERSHIP_WEBHOOK_SECRET`, `AFTERSHIP_API_VERSION`. Key is server-side only.
- Registration: `applySellerTrackingToOrder()` → `registerSellerShipment()` (mirrors to `Order.shipment` when the order is a single seller shipment); admin `PUT /admin/orders/:id` with new tracking on a store-only order → `registerOrderShipment()`. Result stored in `shipment` sub-doc (`models/Shipment.ts`: aftershipId, tag, subtag, lastCheckpoint, checkpoints[≤15], expectedDelivery) on both `Order` and `SellerOrder`.
- Updates: webhook `POST /api/v1/tracking/aftership/webhook` (raw body, HMAC-SHA256 base64 in `aftership-hmac-sha256`; rejected with 503 if secret unset) + `jobs/aftershipSyncJob.ts` poll every 3h (`syncOpenShipments`, also registers shipped orders that have no aftershipId). Admin `POST /admin/seller-orders/:id/sync-tracking` forces a refresh.
- `tag === 'Delivered'` → seller order delivered + payout due; parent order delivered (review email) when every non-cancelled seller order is delivered and there are no store items, or when the store shipment itself is delivered. Coins still flow through `processPendingCoins` off `deliveredAt`.
- UI: live status card on customer `/account/orders`, seller order detail, admin orders and admin seller-orders.

## Deal Verification feature

- "Found it cheaper? Verify the deal" button on product detail page (non-comingSoon products only)
- Modal: URL input → server-side OG fetch preview, screenshot upload (Vercel Blob), email + OTP verify
- OTP stored in-memory (Map) on backend — does NOT create User accounts
- Admin receives email on new submission, emails user verdict when marked real/fake/inconclusive
- Screenshot path: `deal-screenshots/{timestamp}-{random}.{ext}` in Vercel Blob

## Product scraper
- Two runners, same schedule (01:17 + 04:43 IST): Render cron (`backend/src/services/scraper/shopify.ts`, LimitedEdt + Superkicks JSON) and GitHub Actions (`.github/scripts/scraper/run.ts`) → `POST /api/v1/scraper/ingest` (Bearer `SCRAPER_SECRET`, batched 40/request because `express.json()` caps bodies at 100kb)
- Brands: Nike, Jordan, Adidas, New Balance, Crocs (`SCRAPED_BRANDS` in `models/ScrapedProduct.ts`). Sites: myntra, footlocker, vegnonveg, limitededt, superkicks, nike, tatacliq, tatacliqluxury, ajio (`SCRAPED_SITES`)
- Transport: `http.ts` `stealthGet` = got-scraping (real Chrome TLS/HTTP2 fingerprint + generated headers, per-host cookie jar) → backoff retries → per-host circuit breaker after 3 blocks → ScrapingAnt fallback (1 credit raw, serialised). Optional `SCRAPER_PROXY_URL` secret routes direct requests through a proxy
- Tata CLiQ: `searchbff.tatacliq.com/products/mpl/search` (plain fetch; do NOT send a `mode` header, it returns 0 results). Luxury: search API broken, scrape SSR `window.initialData` on brand category pages (`?page=N` paginates, 24/page); Jordan comes from the Nike category; no Crocs on Luxury
- Footwear only, no sandals/flip-flops/chappals/floaters (`isExcludedStyle`, name-based and clog names always kept, since AJIO/Myntra file Crocs clogs under "Sandals"). Slides + clogs stay
- AJIO: Akamai; `/api/search` via got-scraping works, fallback = stealth Puppeteer on ajio.com then in-page `fetch`. Use `relevance` sort for Nike/Adidas/Jordan (newest sort is mostly socks/bags)
- Footlocker: SSR `__PRELOADED_STATE__.listingV2.products` first (0 credits), then ScrapingAnt JS render, then Puppeteer. Akamai flags an IP after heavy probing (403 on everything for a while)

## Important decisions / gotchas
- Render free tier sleeps after 15 min inactivity → UptimeRobot pings `/health` every 5 min
- `trust proxy 1` set on Express for correct IP in rate-limiter behind Render/Vercel
- Backend is reachable on both `snkrskart.onrender.com` and `api.snkrscart.com` (Hostinger CNAME → Render custom domain). `sameSiteFor()` in `routes/auth.ts` picks `SameSite=Lax` only when request host AND Origin are under `snkrscart.com` (Safari/iOS keep the refresh cookie), else `SameSite=None` (old host, localhost dev). `COOKIE_SAMESITE` env overrides. Frontend must use `NEXT_PUBLIC_API_URL=https://api.snkrscart.com/api/v1` for first-party cookies. `http://localhost:3000` is always CORS-allowed.
- Brand grid uses `brand.slug` (NOT `brand.id`) for brandMeta lookup
- Next.js Image: allowed domains in `next.config.mjs` include Supabase + Cloudinary
- Admin token stored in `localStorage` (not httpOnly cookie) — separate from customer auth
- `NEXT_PUBLIC_API_URL` in `.env.local` points to localhost for dev; Vercel env points to Render
