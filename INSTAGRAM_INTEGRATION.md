# Instagram automation

SNKRS CART posts to @snkrs_cart on its own: the content pipelines make the
posts, the owner approves them in the admin panel, and the backend publishes
them on time through Meta's official Instagram API. Nothing is posted without
a human approval, and nothing uses browser automation (that breaks
Instagram's terms and gets accounts blocked).

Research behind every decision here, with Meta doc links:
`research_notes/instagram-graph-api-2026-10.md`.

## How it flows

```
/drop, /blog, /sneaker  ──►  igDraft.ts starter   (facts from Mongo)
                              caption written with /ig-caption + /ig-human
                              igDraft.ts render     (preview JPEGs)
                              igDraft.ts create     (upload to Cloudinary, save as draft)
                                      │
                                      ▼
                         /admin/instagram   ── Approve (now or at an IST time)
                                      │
                                      ▼
        backend job every 5 min  (+ hourly GitHub Actions backup)
                                      │
                                      ▼
            Instagram Graph API: container ► status ► media_publish
                                      │
                                      ▼
                       status "published" + permalink in admin
```

## One-time setup (owner, about 30 minutes)

1. **Professional account.** In the Instagram app: Profile > menu > Settings
   and activity > Account type and tools > Switch to professional account >
   category "Shopping & retail" > **Business**.
2. **Meta app.** Go to https://developers.facebook.com/apps/creation/ and
   create an app: name without "Instagram" or "Facebook" in it, use case
   **Manage messaging and content on Instagram**, "I don't want to connect a
   business portfolio yet", app type **Business** if asked.
3. **Permissions.** Dashboard > Customize the use case > **API setup with
   Instagram Login** > Add all required permissions. Check that
   `instagram_business_basic` and `instagram_business_content_publish` are
   listed.
4. **Connect @snkrs_cart.** Under Generate access tokens > **Add account** and
   log in. If it does not show up: App roles > Roles > Add People > Instagram
   Tester, then accept the invite in Instagram (Settings > Apps and websites >
   Tester invites).
5. **Token.** Click **Generate token** next to the account and copy it (valid
   60 days; the backend refreshes it after that on its own).
6. **Account id.**
   `curl "https://graph.instagram.com/v25.0/me?fields=user_id,username&access_token=TOKEN"`
   and copy `user_id`.
7. **Go Live (important).** App settings > Basic: add the app icon, category,
   Privacy Policy URL `https://www.snkrscart.com/privacy` and a data deletion
   URL, then click **Publish**. While the app is in Development mode, posts it
   makes are visible only to people with a role on the app. No App Review is
   needed for our own account (Standard Access).
8. **Render env vars** (backend service, never in git):

   | Variable | Value |
   | --- | --- |
   | `IG_USER_ID` | the `user_id` from step 6 |
   | `IG_ACCESS_TOKEN` | the token from step 5 (seed; refreshed copies are kept encrypted in Mongo) |
   | `IG_TOKEN_KEY` | any long random string, used to encrypt the refreshed token |
   | `IG_API_VERSION` | `v25.0` (default) |
   | `IG_CRON_SECRET` | any long random string |
   | `IG_DRY_RUN` | `true` to try the whole flow without posting; remove to go live |

9. **GitHub secret** `IG_CRON_SECRET` (same value) for the hourly backup
   workflow `.github/workflows/instagram.yml`. `BACKEND_URL` already exists
   for the scraper.
10. **Test.** Set `IG_DRY_RUN=true`, approve a draft, watch it turn
    "published (dry run)". Then remove `IG_DRY_RUN`, publish one real post,
    and open it while signed out to confirm it is public.

If the token ever dies (not refreshed for 60 days), repeat step 5 and paste
the new token into `IG_ACCESS_TOKEN`; the stored copy is replaced
automatically. The admin page shows days left.

## Daily use

- Run `/drop`, `/blog` or `/sneaker` as usual. At the end the skill asks
  "Make the Instagram post for this?". Say yes and it builds the carousel and
  caption and saves a draft. The unattended Mon/Wed/Fri run always makes the
  draft without asking.
- Open `/admin/instagram`: check the slides and caption (the box shows what
  the feed shows before "... more"), edit if needed, then **Approve** with a
  time or **Publish now**.
- Several drops in one week: pass all slugs to the starter for a roundup
  carousel (calendar cover with the shoes, one launch card per pair).

## Products in stock

Product posts sell, so they get their own path:

- **`/ig-products`** with one or more product slugs, or none for new arrivals
  (pairs added in the last 7 days, in stock, never posted). Claude writes the
  caption in the brand voice and saves a draft.
- **Automatically:** after every scheduled content run (Mon/Wed/Fri),
  `igDraft.ts auto-products --days 3` turns new stock into a draft with a
  facts-only caption. You approve or rewrite it in the admin panel.

The slides use live stock, the same offers the product page shows: the
lowest ₹ price, the UK sizes in stock and the fastest delivery ("Ships in
24h", "Ships in 3 days", "Pre-order, about 20 days"). A single pair gets a
launch card with a FROM price badge, cut-out angle shots from the gallery,
an info card and a "Shop now" link. Several pairs get a "new pairs in stock"
cover. If a pair sells out before the post goes out, approving or publishing
it is refused.

Many product photos were scraped from other stores' sites (Cloudinary folder
`scraped-products`). The watermark check drops any photo with another
store's mark; `auto-products` skips a pair whose main photo is marked. Your
own photos are still the safer choice.

Instagram Shopping tags (tap the shoe, see the price) are not part of this:
they need the Facebook Login API path, a Commerce Manager catalog and shop
approval, and the Merchant Center account is suspended right now. The shop
link in bio does that job for now.

## What the slides look like

1080x1350 JPEGs (stories 1080x1920), styled on how real sneaker accounts post:

| Layout | Use |
| --- | --- |
| `hero` | launch card: the shoe cut out of its photo, background colour taken from the shoe, the nickname as a big ghost word, date badge |
| `info` | release info rows: date and IST time (or price, sizes, delivery for products), where, style code |
| `angle` | another angle of the same pair, cut out, on the same colour |
| `schedule` | roundup cover: three shoes fanned out over a release calendar |
| `photo` | full-bleed photo with a dark fade; used automatically when no cut-out is possible |
| `text` | a short explanation (blog summaries, sizing) |
| `cta` | where to go next (snkrscart.com link) |

The cut-out and watermark check use Apple Vision through
`backend/src/scripts/igCutout.swift`, compiled on first use. They need macOS
14+ with `swiftc`; elsewhere slides fall back to the full-bleed photo.

## Rules the code enforces

- JPEG only (Cloudinary URLs are rewritten to `f_jpg,q_90` with a `.jpg`
  extension), carousels of 2 to 10 items, all 4:5.
- Captions: at most 2,200 characters, 5 hashtags (Instagram's limit since
  December 2025), 20 mentions, no em dashes, no `{{placeholder}}` left in.
- A post that links to a blog, drop or sneaker page cannot be approved or
  published while that page is unpublished.
- Editing an approved post sends it back to draft.
- Every status change goes through one state machine
  (`backend/src/lib/instagramState.ts`). Posts are claimed atomically, so two
  runs never post the same thing.
- Temporary errors before publishing are retried up to 3 times, 15 minutes
  apart. An error during `media_publish`, or a post stuck in "publishing" for
  15 minutes, is marked failed and never retried automatically, because it
  may already be live. Check the profile, then press Retry.
- `igDraft.ts create` refuses images that carry another account's watermark
  (an @handle or a web address found by text recognition).
- Facts on starter slides come only from the Mongo record.

## Risk: whose photos we post

Brand press and campaign images are copyrighted, and Meta disables accounts
after repeated IP takedowns. The safest content is our own photography: the
six-angle verification photos of seller pairs and in-house shots of stock.
Prefer those for regular posts and keep press images to release
announcements. Never imply we are an official Nike, Jordan, adidas, New
Balance or Crocs retailer; the CTA slide says "Independent reseller".

## Files

| Path | What |
| --- | --- |
| `backend/src/models/InstagramPost.ts` | queue item: kind, caption, media, status, schedule, result |
| `backend/src/models/InstagramAuth.ts` | encrypted refreshed token |
| `backend/src/services/instagram.ts` | Graph API client, publish flow, quota, token refresh |
| `backend/src/services/instagramPublisher.ts` | claim, prechecks, publish, retry decisions, due-post runner |
| `backend/src/services/instagramToken.ts` | token encryption and daily refresh |
| `backend/src/jobs/instagramPublishJob.ts` | 5-minute publisher + daily token refresh |
| `backend/src/routes/instagramAdmin.ts` | `/api/v1/admin/instagram/*` |
| `backend/src/routes/instagramCron.ts` | `POST /api/v1/instagram/run-due` (Bearer `IG_CRON_SECRET`) |
| `backend/src/lib/instagramRules.ts` | content rules |
| `backend/src/lib/instagramState.ts` | lifecycle |
| `backend/src/lib/instagramSlides.ts` | slide layouts and starter specs |
| `backend/src/scripts/igDraft.ts` | starter, render, create |
| `backend/src/scripts/igCutout.swift` | shoe cut-out and watermark text (Apple Vision) |
| `frontend/app/admin/instagram/page.tsx` | approval queue |
| `.claude/commands/ig-products.md` | `/ig-products` command for product posts |
| `.claude/skills/ig-*` | the 13 Instagram writing skills (MIT, from Jakeschincariol/instagram-agent-skill) |
| `.claude/instagram/voice.md` | brand voice every `ig-*` skill reads |
| `.github/workflows/instagram.yml` | hourly backup trigger |

## Tests

```bash
cd backend && npm test
```

The DB flow tests (routes, atomic claim, stuck-post recovery) run only
against a local throwaway MongoDB:

```bash
mongod --dbpath /tmp/igdb --port 27999 &
IG_TEST_MONGO_URI=mongodb://127.0.0.1:27999/igtest npm test
```

## Later

- Insights (reach, saves, shares per post) with `instagram_business_manage_insights`.
- Comment replies through polling (webhooks need Advanced Access and Business
  Verification).
- Product tags and licensed music need the Facebook Login path and a second app.
