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
  components/seller/        SellerShell (auth guard + nav: logo sidebar collapsible to icon rail w/ tooltips, persisted in localStorage seller_sidebar_collapsed; mobile = hamburger drawer + bottom tab bar), AddListingModal, RequestProductModal, VerificationCapture
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
  scripts/refreshBlogs.ts   show | backup | apply <updates.json> for live blog refreshes (always backs up to content-ml/data/backups/ first, pings IndexNow); used for Search Console refresh-queue work
  scripts/exportContentCorpus.ts  exports blogs/drops/profiles (with published flag) to content-ml/data/ours.jsonl and a fact catalog (product SKUs + INR prices incl. seller list prices, scraped INR prices, drop dates) to content-ml/data/catalog.jsonl; writes via .tmp + rename
  lib/emailLayout.ts        shared email chrome: transactionalShell(body, reason) + emailFooterRows (blog-style footer: socials, Connect With Us, brand line) + EMAIL_REASON per audience; every transactional + marketing email goes through it
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
| `GET /sneaker-profiles/:slug` | profile + computed `market: {inrMin, inrMax, listings, productSlugs}` or null (brand + whole-word model prefix match on store products incl. seller offers and scraped prices; kids/coming-soon excluded; no store names; cached 5 min per slug) |
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
- `Drop` has optional `styleCode` (trimmed, upper-cased) and `launchTimeIST` (`HH:MM` 24h or empty, validated in admin create/update). Drop detail page shows both, passes `launchTimeIST` to `Countdown` (targets `day T HH:MM +05:30`, else midnight UTC), renders a per-size INR offers table from the linked product's `offers` (only when the product is fetched, not coming soon and has buyable sizes), and a visible FAQ + FAQPage JSON-LD built only from stored fields (3 to 5 questions, hidden below 3).
- `SneakerProfile` has optional `indiaRetailPrice` (INR MRP or null) and `sizeNotes`. Profile page shows India retail, "Current price in India" from `market` (shop link only when our own products matched), sizing, and a FAQ + FAQPage JSON-LD from stored fields. Never show other stores' names or links.
- Drop detail hero is `components/drops/DropGallery.tsx` (client): 4:3 stage, `object-contain` (never crop), slides = `[image, ...images]` deduped. Slider chrome (thumbs, arrows, counter, swipe, arrow keys, lightbox) only when 2+ images. `Drop.images: string[]` optional; admin form has multi-upload + reorder.

## Content ML (`content-ml/`)
- Free, local pre-publish model that the /blog, /drop and /sneaker skills run in their "Content ML Loop" step (repo copies of the skills live in `.claude/commands/`, mirrored in `~/.claude/commands/`; keep them identical). Python 3.9 venv at `content-ml/.venv`; `data/`, `models/` and `secrets/` are git-ignored.
- `src/enhance.py <draft.json>` (exit 0 pass, 2 revise): blocking checks are facts (prices/dates/style codes vs `data/catalog.jsonl`, or a source link / draft `sources`) and near-duplicates (TF-IDF vs all posts of the same kind incl. unpublished and other drafts). Advisory: style score, stock words, Google India autocomplete + Search Console queries. Safe swaps (no global re-capitalisation, quotes and blockquotes untouched). Paragraph rewrites use the LoRA rewriter behind `factlock.py` placeholders and one shared gate `accept()`.
- Style scorer: LightGBM on 30 style features + TF-IDF LR, trained only on matched pairs (pre-Nov-2022 human sneaker articles vs local Qwen rewrites vs Claude blog-voice rewrites of the same paragraphs); thresholds from human out-of-fold scores, frozen per version.
- Rewriter: Qwen2.5-1.5B-Instruct-4bit + MLX LoRA. `train.sh rewriter` trains a candidate, `promote.py` picks the lowest-val checkpoint and promotes only if it beats the live adapter by 5+ accepted paragraphs on the frozen `models/eval_ours.jsonl` (100 of our own paragraphs). `train.sh retrain-if-due` runs at the end of `scripts/auto-content.sh` under `caffeinate` (needs 30 new published flywheel pairs).
- Search Console: `src/gsc.py pull|queue|queries <slug>` (service account key in `content-ml/secrets/gsc.json`, setup in `content-ml/GSC_SETUP.md`) writes `data/gsc_pages.json` and `data/refresh_queue.json` (position 8 to 20, 50+ impressions). Live since 2026-10-09 with service account `snkrs-cart@snkrs-cart.iam.gserviceaccount.com` (Restricted) in GCP project `snkrs-cart`; `auto-content.sh` pulls it on every scheduled run. The EMB work org blocks service-account keys, so GSC keys must come from the personal-account project.
- Growth analysis: `content-ml/commands/growth.sh` pulls 16 months of Search Console history (`src/gsc_history.py`), the Merchant Center state and reports (`src/merchant.py`, Merchant API v1 only; v1beta is dead) and the live feed, then `src/growth.py` writes `data/growth/growth_report.json` (trend, isotonic CTR curve, CTR gap and rank lift per page and query, TF-IDF + KMeans query clusters, momentum, cannibalisation, `#heading-N` fragment leaks, commercial queries without a shop page, product coverage, Merchant demand coverage, ranked actions). Findings of 2026-10-10 are in `reports/Growth from Search Console and Merchant Center 2026-10.md`: Merchant account suspended for misrepresentation (review requested 2026-10-09) and capped so 390 of 398 feed items are rejected; India is 30 percent of impressions; product pages got 354 impressions in 90 days against 5,220 for one blog post; TOC anchors split 46 percent of the festival post's impressions.
- `content-ml/commands/*.sh` are owner-runnable wrappers (status, check-draft, check-post with `--no-log`, keywords, export-content, gsc-pull, train-scorer, train-rewriter, promote, retrain, make-pairs, stop, setup, run-auto-content); heavy ones refuse under 30W unless `FORCE=1`. Keep `commands/README.md` in sync when changing them.
- Hardware: the M1 8 GB cannot run MLX training on a weak charger; run heavy jobs alone and check `pmset -g batt` first.
- `scripts/com.snkrscart.autocontent.plist` runs Mon/Wed/Fri 13:30 (`StartCalendarInterval`, fires on next wake if asleep). `auto-content.sh` refuses to start on a dirty working tree.

## Content to product linking (2026-10-10)
- `frontend/lib/productMatch.ts` `matchProducts(text, products, limit)`: token match of a blog or drop title against the catalogue (brand + name minus colourway and colour words; every model number in the product must appear in the text, at least 2 shared tokens and 60 percent of the model tokens, one of them not the brand; results within 0.75 score of the best only). `isLive()` and `lowestLivePrice()` read per-size `offers`. Catalogue comes from `lib/catalog.ts` `fetchAllProducts({ revalidate: 3600 })` (now typed with `offers` and `updatedAt`).
- Blog page: matched products render first in "Shop the pair in this post" (falls back to brand-tag products) and go into the article JSON-LD as `mentions` (Product + Offer). Heading ids are stable slugs of the heading text (`app/blogs/[slug]/headings.ts`: `extractHeadings`, `injectHeadingIds`, duplicates get `-2`, empty headings `section-N`); `TableOfContents` takes `headings`, not html. Search Console rows for `#id` URLs are Google jump links, keep the anchors.
- Drop page: when `productSlug` is empty the matcher picks the best catalogue product; `storeHref` (set when the admin flagged `availableAtStore` or the matched product has live offers) drives the Shop Now button, the Event offer URL and whether the "how to buy" steps show.
- Model landing pages: `lib/categoryFilters.ts` entries with `search` (backend `GET /products?search=` AND-of-words) and `namePattern` (regex applied after the fetch): `/category/air-jordan-1`, `/category/air-jordan-4`, `/category/nike-dunk-low`, each with copy and FAQs in `app/category/[slug]/page.tsx`. The sitemap lists a category only when the API reports stock; the page sets noindex when empty.
- Sitemap: product `lastmod` comes from `updatedAt` (backend `GET /products/slugs` now returns it), brand pages and categories were already listed.

## Brand pages (`/brands/[slug]`)
- `<title>` and meta description come from `frontend/lib/brandSeo.ts` `brandSeo()`: top 2 to 3 stocked models per brand (NB variants grouped, shared prefixes compressed, title kept to 60 chars), footwear-only price range (`productType` shoes, not coming soon). The on-page "starting from" price is also footwear-only. Added 2026-10-09 because `/brands/new-balance` had 3,378 impressions at position 8 and 1 click for "new balance india".

## Homepage section order
MarqueeStrip → HeroBanner → NewArrivals → HomeReviews → BrandGrid → TrendingNow → WhyChooseUs → ComingSoon → NewsletterBar

## Seller portal (`/sellers`)
- Separate auth: `POST /api/v1/seller-portal/auth/login` (email + password, bcrypt, 10 tries/15 min) or email OTP (`POST /auth/send-otp` → 6-digit code, sha256 hash in `Seller.loginOtp*` (select:false), 5 min TTL, 60 s resend cooldown, 5 attempts; `POST /auth/verify-otp` → same token/seller payload as password login; only `status: active` sellers can request a code, same limiter as login). Both → JWT `{type:'seller'}` 7d in `localStorage` as `seller_token` (`lib/sellerApi.ts`). Login page defaults to the Email code tab. First login: `mustChangePassword` makes `SellerShell` redirect every route to `/sellers/settings?reset=1`, where the seller must request `POST /auth/send-verify-otp` (sellerAuth, same OTP fields) and submit `POST /auth/change-password { otp, newPassword }`; while `mustChangePassword` is true the route requires the OTP instead of `currentPassword` and stamps `Seller.emailVerifiedAt`. Normal password changes still need `currentPassword`. `middleware/sellerAuth.ts` re-checks `Seller.status === 'active'` on every request. Mounted at `/seller-portal` (not `/seller`) so the 100 POST/day limiter on the public application form does not apply.
- Admin creates accounts: `POST /admin/sellers` (new) or `POST /admin/sellers/:id/activate` (from a `/sell` application). Both generate a temp password, email it (`lib/sellerEmails.ts`) and return it once; `mustChangePassword` forces a reset on first login. `reset-password` and `PUT status: suspended` (pauses all listings) also exist.
- `SellerListing` = (seller, product, size) unique. Seller enters `sellerPrice`; public `listPrice = ceil((sellerPrice * 1.10) / 10) * 10` (`computeListPrice`, mirrored in `frontend/lib/availability.ts`). Availability: `instant` (ships 24h) / `inhand` (3 days) / `eta` (~20 days). Sellers can list any standard UK size (1 to 16, half steps) on an existing shoe even if the product does not carry it yet (the offers merge adds it to the size grid); clothing is limited to the product's `stringSizes`. Listing responses (GET/POST/PUT `/seller-portal/listings`) carry `competition`: `{lowest:true}` when the seller's listing is the best offer for that size per `buildOffers()` (store stock counts), `{lowest:false, beat, by:'store'|'seller', tie}` when beaten (`beat` = highest seller price that would win), `null` for paused/sold-out. Portal listings page shows a green Lowest tag or a Not lowest tag plus hint. New products go through `ProductRequest` (name, brand, sizes, supporting URLs) which admin approves by picking the catalog product they created.
- `lib/sellerOffers.ts` `attachSellerOffers()` runs on every public product response: merges store stock (treated as `inhand`) with active listings of active sellers into `product.offers[]` (one best offer per size: lowest price, tie → faster). When a seller offer exists it also rewrites `sizes/availableSizes/variants/price` and clears `soldOut`. Frontend uses `offers` for per-size price + availability; `CartItem` carries `listingId` + `availability` and checkout sends them.
- Order creation validates listing price/qty, reserves stock atomically (`qty` decrement, `sold_out` at 0, released on any later failure), stamps items with `listingId/sellerId/sellerName/sellerPrice/availability`, then `createSellerOrders()` writes one `SellerOrder` per seller (no customer PII: only `deliveryCity/State`). Seller-portal order responses go through `forSeller()` which strips `items[].listPrice`, so sellers only ever see their own payout (`sellerPrice`, `sellerTotal`), never what the customer paid. `syncSellerOrdersWithOrder()` is called on confirm (webhook / Razorpay verify / admin PUT), cancel (restores stock unless shipped) and deliver.
- Fulfilment flow: `SellerOrder.status confirmed` → seller uploads live-camera photos (`VERIFICATION_ANGLES`, 6 required) → admin approves/rejects (`PUT /admin/seller-orders/:id/verification`, seller emailed) → seller requests the customer's address over WhatsApp (store number) → seller adds courier + tracking **once** (`trackingLockedAt`; only admin can change via `PUT /admin/seller-orders/:id/tracking`). `applySellerTrackingToOrder()` copies tracking onto the matching `Order.items[]`, sets order-level tracking/`shipped` when the whole order is one seller shipment, and emails the customer.
- Fulfilment timeline: on payment confirmation `SellerOrder.confirmedAt` is set and `shipBy = confirmedAt + max(AVAILABILITY_SHIP_DAYS of items)` (instant 1d / inhand 3d / eta 20d). Shown in the seller new-order + approval emails, portal order list/detail, dashboard (`orders.overdue`) and admin seller-orders pills (Ship by / Overdue / Shipped late). Late penalty is **info only** (`LATE_PENALTY_TEXT`, override with `SELLER_LATE_PENALTY_TEXT` env); nothing is deducted automatically.
- Payouts: `SellerOrder.payout` {status pending/due/paid, amount, dueAt, paidAt, screenshotUrl, reference, note}. Parent order `delivered` → `syncSellerOrdersWithOrder` sets `due` with `dueAt = deliveredAt + 7 days` (`PAYOUT_DELAY_DAYS`). Admin `/admin/payouts` (GET `/admin/payouts`) marks paid via `PUT /admin/seller-orders/:id/payout` (screenshot URL required, uploaded with `uploadImage(file, 'payouts')`), seller gets a payout email with amount, UTR and screenshot link. Seller dashboard/orders show Payout due / Paid out; admin pays manually to the seller's UPI ID.
- Seller profile stores the seller's own shipping address (`addressLine/city/state/pincode`, editable in portal settings and admin). Dashboard nags until address + pincode are filled; admin seller-order detail shows it as "Ships from".
- Seller dashboard (`GET /seller-portal/dashboard`) adds `profile` (fulfilment `score` 0-5 = 50% on-time + 30% low cancellations + 20% photos approved first try, null until 3 shipped orders; `rank` = position among sellers with confirmed sales this month, `ranked` count, never total seller count), `health` (avg ship days per availability vs `AVAILABILITY_SHIP_DAYS` target, `onTimeRate`, `cancellationRate`, `photoApprovalRate`, `lowestOffers` share via `buildOffers`), `inventory` (active listing value = sum sellerPrice*qty) and `sales` (all time / 7d / 30d / avg). UI: dark hero + `components/seller/DashboardWidgets.tsx` segmented scale bars (red to green, marker at value, reversed axis for lower-is-better).

## Shipment tracking (AfterShip)
- Links: `frontend/lib/tracking.ts` `getTrackingUrl()` → native deep link for Shiprocket/Blue Dart/FedEx/DHL, else public `https://www.aftership.com/track/{slug}/{awb}` (free, no key). Slugs: delhivery, dtdc, bluedart, ekart, xpressbees, shadowfax, ecom-express, india-post, fedex, dhl.
- API: `backend/src/services/aftership.ts` (header `as-api-key`, base `https://api.aftership.com/tracking/{AFTERSHIP_API_VERSION, default 2025-07}`). Env: `AFTERSHIP_API_KEY`, `AFTERSHIP_WEBHOOK_SECRET`, `AFTERSHIP_API_VERSION`. Key is server-side only.
- Registration: `applySellerTrackingToOrder()` → `registerSellerShipment()` (mirrors to `Order.shipment` when the order is a single seller shipment); admin `PUT /admin/orders/:id` with new tracking on a store-only order → `registerOrderShipment()`. Result stored in `shipment` sub-doc (`models/Shipment.ts`: aftershipId, tag, subtag, lastCheckpoint, checkpoints[≤15], expectedDelivery) on both `Order` and `SellerOrder`.
- Updates: webhook `POST /api/v1/tracking/aftership/webhook` (raw body, HMAC-SHA256 base64 in `aftership-hmac-sha256`; rejected with 503 if secret unset) + `jobs/aftershipSyncJob.ts` poll every 3h (`syncOpenShipments`, also registers shipped orders that have no aftershipId). Admin `POST /admin/seller-orders/:id/sync-tracking` forces a refresh.
- `tag === 'Delivered'` → seller order delivered + payout due; parent order delivered (review email) when every non-cancelled seller order is delivered and there are no store items, or when the store shipment itself is delivered. Coins still flow through `processPendingCoins` off `deliveredAt`.
- UI: live status card on customer `/account/orders`, seller order detail, admin orders and admin seller-orders.

## Google Merchant Center (account 5750742430)
- Data source "PRODUCTS SOURCE 1" (id 10624791824) must fetch `https://www.snkrscart.com/google-merchant-feed.xml`, country IN only (we ship to India only, INR). Website autofeed stays off so the crawl never adds a second copy of the catalogue.
- Feed (`frontend/app/google-merchant-feed.xml/route.ts`): one item per size. Price + availability per size come from `offers` (backend `GET /products/feed` runs `attachSellerOffers`), `eta` sizes go out as `backorder` with `availability_date` and handling 15 to 20 days, other in-stock sizes carry `min/max_handling_time`. Title = `fullProductName(canonicalBrand, name)` + colors, colors `/`-joined (max 3), `mpn` only when `sku` looks like a real style code (no `identifier_exists` otherwise), description falls back to a generated one when the stored text is under 60 chars.
- Policy text must agree everywhere Google can read it (shipping, returns, terms, FAQ, contact, about, checkout confirmation, llms-full, MC shipping + return settings): dispatch within 3 business days, delivery 3 to 7 business days, Pre-order sizes about 20 days; returns only for damaged/wrong/authenticity issues within 48 h. Admin CMS `site-content` (`shipping`, `terms`, `privacy`) overrides the page code whenever `htmlContent` is set, so edit both.
- Merchant API: GCP project `snkrs-cart` is registered (2026-10-09). Owner OAuth refresh token in `content-ml/secrets/merchant_token.json` (web client `merchant_oauth_client.json`, redirect `https://snkrs-kart.vercel.app`, code pasted back from the address bar). Service accounts cannot call `registerGcp`. Set request timeouts, some calls hang.

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

## Admin panel mobile patterns
- `app/admin/layout.tsx`: desktop sidebar is `hidden md:flex`; below `md` a sticky top bar with a hamburger opens a slide-in drawer (same NAV, Escape + backdrop + route change close, body scroll lock).
- Tables: every admin `<table>` has `className="admin-table"` and each non-title cell carries `data-label="..."`. `app/globals.css` stacks rows into labelled cards below `md` (thead hidden, `td[data-label]` becomes a 2-col grid with the label on the left). First cell = card title (no label), last cell without a label = actions (right-aligned). Wrap tables in `overflow-x-auto` for tablet widths.
- List + detail pages (orders, seller-orders) wrap the detail panel in `_components/DetailPane.tsx`: inline grid column at `xl`, right slide-over sheet with backdrop below `xl`.
- Form grids use `grid-cols-1 sm:grid-cols-N`; tall modals need `max-h-[90vh] overflow-y-auto`.

## Product slugs
- `backend/src/lib/productSlug.ts` `buildProductSlug(text, brand?, sku?)` is the only way product slugs are made (admin create/edit, scraper publish). It takes the last path segment if a URL was pasted, drops leading `snkrscart-com-products-` style tokens, removes style codes anywhere (`HQ6998-600`, `KT3851`, `553558-045`, `1203B302-100`) and the product `sku`, strips a duplicated brand prefix and collapses repeated runs. Model numbers like `U9060`, `1906R`, `Mind 001` are left alone.
- Renaming a slug (admin PUT or `scripts/fixProductSlugs.ts`) pushes the old slug into `Product.previousSlugs` and cascades to reviews/orders/inquiries/drops/restocks; `GET /products/:slug` falls back to `previousSlugs`, and the product page issues a `permanentRedirect` when the returned slug differs, so old URLs 301.
- Audit/migrate: `npx ts-node --transpile-only scripts/fixProductSlugs.ts --dry` (drop `--dry` to apply). Ran 2026-10-06: 7 slugs cleaned, `air-jordan-1-retro-low-og-chicago-2025` kept as an alias of `air-jordan-1-low-og-chicago-2025` because 8 blogs linked to it.

## Product names + page titles
- `backend/src/lib/productName.ts` `normalizeProductName()` runs on admin create/update and scraper publish: collapses whitespace, strips a leading duplicated brand (`Jordan Air Jordan 1` / `Jordan | Air Jordan 1` → `Air Jordan 1`), and title-cases names that are 80%+ caps (keeps OG/SB/GS/TD/AMG etc., roman numerals, lowercases `x`/`of`/`the`, `990V6` → `990v6`). Mixed-case names are left alone. Google rewrote all-caps titles to lowercase, which is why this exists.
- Backfill: `npx ts-node --transpile-only scripts/fixProductNames.ts --dry` (drop `--dry` to apply, pings IndexNow). Ran 2026-10-06: 42 names fixed.
- Product page `<title>`, description, JSON-LD name, gallery alt and details line use `frontend/lib/productTitle.ts` `fullProductName(brand, name)`: brand is only prefixed when the name does not already contain it, so no more `Jordan Air Jordan 1 ...` titles.
- Storefront shows names in caps via the Tailwind `uppercase` class (product H1, ProductCard, wishlist, cart, sticky bar, header search, coming-soon + purchase modals). Data stays Title Case; CSS gives the look without feeding Google a shouting title.

## Product grid ordering (`GET /products`)
- Order is always: coming soon → in stock → sold out, then the user sort (`newest` = createdAt desc, `price_asc/desc`, `popular` = reviewCount desc), then `_id`. "In stock" means the product has at least one purchasable size after `attachSellerOffers()` (store sizes or active seller listings), so a product with `soldOut: false` but no available sizes still ranks with sold-out items.
- Implemented in `backend/src/lib/productSort.ts` (`compareForGrid`) and applied in memory in `getAllProducts` while the filtered catalogue is ≤ 1000 products; above that it falls back to the Mongo `comingSoon:-1, soldOut:1` sort. `ProductCard` mirrors the rule and shows "Sold Out" whenever a non-coming-soon product has zero quick sizes.
- Legacy docs missing `comingSoon` were backfilled to `false` on 2026-10-06 (a missing field sorted them after the sold-out block).

## Important decisions / gotchas
- Render free tier sleeps after 15 min inactivity → UptimeRobot pings `/health` every 5 min
- `trust proxy 1` set on Express for correct IP in rate-limiter behind Render/Vercel
- Backend is reachable on both `snkrskart.onrender.com` and `api.snkrscart.com` (Hostinger CNAME → Render custom domain). `sameSiteFor()` in `routes/auth.ts` picks `SameSite=Lax` only when request host AND Origin are under `snkrscart.com` (Safari/iOS keep the refresh cookie), else `SameSite=None` (old host, localhost dev). `COOKIE_SAMESITE` env overrides. Frontend must use `NEXT_PUBLIC_API_URL=https://api.snkrscart.com/api/v1` for first-party cookies. `http://localhost:3000` is always CORS-allowed.
- Search boxes: input binds the raw value, filtering/fetching uses `useDebouncedSearch(value, delay)` from `frontend/lib/hooks/useDebouncedValue.ts` (trims, clears instantly). `SEARCH_DEBOUNCE_MS` 400 for API-backed search, `LOCAL_SEARCH_DEBOUNCE_MS` 250 for in-memory filters. API-backed ones also drop stale responses with a `useRef` sequence counter. Submit-only boxes (Navbar, order tracking) need neither.
- Brand grid uses `brand.slug` (NOT `brand.id`) for brandMeta lookup
- Next.js Image: allowed domains in `next.config.mjs` include Supabase + Cloudinary
- Admin token stored in `localStorage` (not httpOnly cookie) — separate from customer auth
- `NEXT_PUBLIC_API_URL` in `.env.local` points to localhost for dev; Vercel env points to Render
