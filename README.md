# SNKRS CART

Premium sneaker e-commerce website for the Indian market — inspired by vegnonveg.com, Nike, and leading 2025 streetwear stores.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS → Vercel
- **Backend**: Express + TypeScript + MongoDB (Mongoose) → Render
- **AI Chatbot**: Gemini 2.0 Flash (primary) → Groq llama-3.3-70b (fallback)
- **Auth**: OTP via email + JWT (httpOnly cookies for customers, localStorage for admin)
- **Images**: Cloudinary + Vercel Blob (deal screenshots)

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

- **Homepage**: Marquee ticker, hero banner, new arrivals, reviews, brand grid, trending, coming soon drops, newsletter
- **Product Listing**: Filter by brand / size / gender / price, sort, pagination
- **Product Detail**: SSR, image gallery, size selector, add to cart, deal verification CTA
- **Deal Verification**: "Found it cheaper?" — users submit URL + screenshot, admin verifies real/fake/inconclusive and emails verdict
- **Cart**: Slide-in drawer + full cart page, free shipping progress bar
- **Checkout**: Cashfree payment integration
- **KickBot**: AI chat widget (Gemini/Groq), lead capture after 5 messages
- **Drops Calendar**: Upcoming sneaker release dates
- **Blogs**: SEO-optimised sneaker content
- **Sneaker Profiles**: Brand/model reference pages
- **Admin Panel**: Full CRUD — products, orders, users, reviews, blogs, drops, deals, coupons, banners

## API Endpoints

All prefixed `/api/v1/`.

```text
GET  /products                     list (search, brand, gender, limit, page)
GET  /products/:slug               single product
POST /deals/send-otp               send OTP for deal submission
POST /deals/submit                 verify OTP + save deal verification
GET  /admin/deal-verifications     admin: list all deal submissions
PUT  /admin/deal-verifications/:id admin: set verdict + notify user
GET  /health                       keep-alive (UptimeRobot)
```

## Required Env Vars

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
GEMINI_API_KEY=...
GROQ_API_KEY=...
```

### Backend (`.env`)

```env
MONGODB_URI=...
JWT_SECRET=...
BREVO_API_KEY=...
EMAIL_FROM=SNKRS CART <infosnkrscart@gmail.com>
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
ADMIN_NOTIFICATION_EMAIL=...
```
