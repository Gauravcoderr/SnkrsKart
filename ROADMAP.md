# SNKRS CART — Growth & Conversion Roadmap

## Context

The site does product discovery very well but drops off at purchase intent. Checkout was disabled, no user accounts, no wishlist, no email capture, no order management. This roadmap addresses all four areas: quick wins, checkout flow, user accounts, and trust/engagement signals.

---

## Implementation Phases

---

### Phase 1 — Quick Wins

#### 1a. Newsletter Signup
- `backend/src/models/Newsletter.ts` — fields: `email`, `createdAt`
- `POST /api/v1/newsletter` — validate email, upsert to prevent duplicates, send confirmation email via Resend
- `frontend/components/home/NewsletterBar.tsx` — dark strip with email input + "Get drop alerts" CTA on homepage
- Compact email field in `frontend/components/layout/Footer.tsx`

#### 1b. Wishlist (localStorage)
- `frontend/context/WishlistContext.tsx` — stores product IDs in localStorage
- Heart button on `ProductCard` and product detail page
- `frontend/app/wishlist/page.tsx` — shows saved products with Remove + Add to Bag
- "Wishlist" link in header nav

#### 1c. Urgency & Scarcity Signals
- "Low Stock" badge on ProductCard when any size has <= 3 units
- "Only X left" near size selector on product detail page
- "X Sold" badge on homepage sections

#### 1d. SEO Schema Markup
- `Product` + `AggregateRating` JSON-LD on product detail pages
- `FAQPage` JSON-LD on `/faqs`
- `BreadcrumbList` JSON-LD on product pages

---

### Phase 2 — Checkout + UPI Payment Flow

**Payment Strategy**: UPI QR code — free, instant, no business registration needed. Works via PhonePe/GPay/Paytm. When Razorpay/payment gateway KYC completes, swap in the real gateway without changing anything else.

**Flow**:
1. Customer fills checkout form (name, address, phone)
2. Order saved to DB with status `pending`
3. Confirmation page shows store UPI ID + exact amount to pay
4. Customer pays via any UPI app and shares screenshot on WhatsApp
5. Admin confirms payment in admin panel → status changes to `confirmed`

#### Backend
- `backend/src/models/Order.ts` — full order schema with status enum
- `POST /api/v1/orders` — create order, send store notification + customer confirmation email
- `GET /api/v1/orders/:id` — fetch order for confirmation page
- Admin: `GET /admin/orders`, `PUT /admin/orders/:id` (status + tracking update)

#### Frontend
- `frontend/app/checkout/page.tsx` — 3-step form: Contact → Address → Review
- `frontend/app/checkout/confirmation/page.tsx` — UPI ID, amount, WhatsApp link
- Enable checkout button in CartDrawer and `/cart` page
- `frontend/app/admin/orders/page.tsx` — order table with status update

---

### Phase 3 — User Accounts + Order History

#### Backend
- `backend/src/models/User.ts` — name, email, passwordHash, phone, addresses
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- Link orders to users via optional `userId` field on Order model
- `GET /api/v1/users/me/orders`

#### Frontend
- `frontend/context/AuthContext.tsx` — JWT in localStorage, exposes user/login/logout/register
- `frontend/app/account/login/page.tsx`, `register/page.tsx`
- `frontend/app/account/page.tsx` — dashboard with name, email, links
- `frontend/app/account/orders/page.tsx` — past orders with status + tracking
- Header: "Sign In" when logged out, account dropdown when logged in
- Sync localStorage wishlist to backend on login
- Pre-fill address from saved addresses on checkout

---

### Phase 4 — Engagement & Trust

#### Verified Buyer Badge
- Check if reviewer email has completed order containing that product
- Add `verified: Boolean` to Review model
- Show "Verified Buyer" badge on review cards

#### Real-time Stock Levels
- Live stock on size buttons from API
- Sold-out sizes: grey + strikethrough

#### WhatsApp Restock Alerts
- "Notify me when back in stock" button on sold-out products
- `Restock` model: email, phone, productId, size
- Send WhatsApp/email to subscribers when product is restocked

#### Social Proof
- Aggregate stats on HomeReviews: "4.9/5 from X reviews · 100% Authentic"
- Star rating + review count on product cards
- "X+ happy customers" counter on About page
- Footer trust badge strip: Secure · Authentic · Fast Shipping · Easy Returns

---

## Status

| Phase | Status |
|-------|--------|
| Phase 1 — Quick Wins | In Progress |
| Phase 2 — Checkout + UPI | In Progress |
| Phase 3 — User Accounts | Pending |
| Phase 4 — Engagement & Trust | Pending |

## Key Files

| File | Description |
|------|-------------|
| `backend/src/models/Order.ts` | Order schema |
| `backend/src/models/Newsletter.ts` | Newsletter subscriber schema |
| `backend/src/routes/orders.ts` | Order create + fetch endpoints |
| `backend/src/routes/newsletter.ts` | Newsletter subscribe endpoint |
| `frontend/app/checkout/page.tsx` | 3-step checkout form |
| `frontend/app/checkout/confirmation/page.tsx` | UPI payment instructions |
| `frontend/app/admin/orders/page.tsx` | Admin order management |
| `frontend/context/WishlistContext.tsx` | localStorage wishlist |
| `frontend/app/wishlist/page.tsx` | Saved products page |
| `frontend/components/home/NewsletterBar.tsx` | Homepage newsletter strip |
