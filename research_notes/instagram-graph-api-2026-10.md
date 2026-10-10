# Automatic Instagram posting for SNKRS CART through Meta's official API

Research date: 2026-10-10. Sources are Meta developer docs (developers.facebook.com, which now also serves pages under `/documentation/...`), Meta transparency pages, hosting vendor docs, and a few third-party pages marked as such. Doc examples use Graph API **v25.0**. The newest Graph API version is **v26.0** (released July 29, 2026); v25.0 expires July 29, 2028.

Scope: SNKRS CART (snkrscart.com) publishes its own posts to its own single Instagram account from its Express/Node backend on Render, with images on Cloudinary. Only official Meta routes are covered. Browser automation and unofficial "private API" tools break Instagram's Terms of Use, which forbid creating accounts or accessing or collecting information "in an automated way without our express permission". The official API is that permission.

---

## Decisions

| Topic | Decision |
|---|---|
| API path | **Instagram API with Instagram Login** (Business Login for Instagram). Host `https://graph.instagram.com`. Pin `v25.0` (what every Instagram doc example uses), or `v26.0` after a smoke test. Keep the version in an env var. |
| Account | Instagram **professional** account (Business is the better fit for a store; Creator also works). No Facebook Page needed. |
| Scopes | `instagram_business_basic` and `instagram_business_content_publish`. Later, optionally: `instagram_business_manage_comments` and `instagram_business_manage_insights`. |
| App Review | **Not needed.** Standard Access covers "your Instagram professional account or an account you manage". Business Verification is not needed either. |
| App mode | Develop in Development mode, then **switch the app to Live** before real posting. Meta: "Any data generated while an app is in Development mode, such as test posts, can only be seen by role users." Going Live with Standard Access needs no App Review, but it does need the basic settings filled in (privacy policy URL, data deletion URL, icon, category). |
| Token | Long-lived Instagram User token from the dashboard (valid 60 days). Refresh with `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=...` once the token is at least 24 hours old and before day 60. Keep the token in MongoDB rather than a static env var, refresh it weekly from cron, and alert if a refresh fails. This path has no never-expiring token. |
| Formats | Single image, carousel (2 to **10** items), Reels, Stories (image and video). JPEG images only. |
| Images | Cloudinary delivery URLs with an explicit `f_jpg` (or a `.jpg` URL without `f_auto`), plain ASCII, publicly reachable, no signed or expiring URLs. |
| Limits | Plan for **50 published posts per rolling 24 hours** (Meta's docs say 50 in two places and 100 in one; read `quota_total` live) and 400 containers per 24 hours. Caption: at most 2,200 characters and 20 @mentions. Use **at most 5 hashtags**: the API docs still say 30, but Instagram has capped posts at 5 since December 2025. |
| Scheduling | The API has no native scheduling. Keep a `scheduledAt` queue in MongoDB and create plus publish containers at run time. Containers expire after 24 hours. |
| Cron | **Render Cron Job** (at least $1/month per cron service, billed per second) running a Node script every 10 to 15 minutes, separate from the web service that may sleep. Free fallback: a GitHub Actions `schedule` that calls a secret-protected endpoint, accepting delays and the occasional dropped run. Vercel Hobby is unsuitable (once per day, timing within plus or minus 59 minutes). |
| Not now | Product tags, Audio API, resumable upload, hashtag search and partnership labels all need the Facebook Login path. Comment webhooks need Advanced Access plus Business Verification plus a Live app, so poll comments instead if needed. |

---

## 1. The two API paths

| | Instagram API with Instagram Login | Instagram API with Facebook Login |
|---|---|---|
| Account type | Instagram professional account (Business or Creator), "presence on Instagram only" | Professional account (Business or Creator) **linked to a Facebook Page** |
| Facebook Page | Not required: "This API setup does not require a Facebook Page to be linked to the Instagram professional account." | Required |
| Login / auth | Business Login for Instagram (Instagram credentials) | Facebook Login for Business (Facebook credentials) |
| Token type | Instagram User access token | Facebook User or Page token (System User token possible) |
| Base URL | `https://graph.instagram.com` | `https://graph.facebook.com`, plus `https://rupload.facebook.com` for resumable video |
| Publish permissions | `instagram_business_basic`, `instagram_business_content_publish` | `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`. Add `ads_management` and `ads_read` if the user's Page role comes from Business Manager. The dashboard use case also adds `business_management` and `pages_show_list` by default. |
| Extra gates | None | Page Publishing Authorization (PPA) must be complete if the Page requires it. 2FA if the Page requires it. Page task `MANAGE` or `CREATE_CONTENT`. |
| Version in docs | v25.0 (`https://graph.instagram.com/v25.0/...`) | v25.0 |
| Only on this path | Native messaging | Hashtag search, product tagging, Partnership Ads label, resumable upload, Audio API (licensed music for Reels, launched June 1, 2026), `story_insights` webhook |

The old scope names `business_basic` and `business_content_publish` were deprecated on January 27, 2025. Use the `instagram_business_*` names.

Each app can have only one setup: "You can add only one setup per app. For both setups, create a separate app."

**Recommendation: Instagram Login.** One store posting to one account it owns needs no Facebook Page, PPA, Business Manager or System User. Fewer moving parts, and every feature this project needs now (image, carousel, Reels, Stories, alt text, collaborators, user tags, location, first comment, insights) works on this path. Move to a second, Facebook Login app only if product tags or licensed music become a must.

Sources: [Overview](https://developers.facebook.com/docs/instagram-platform/overview), [Instagram Login overview](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/), [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/), [Business Login](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login), [Use case customization](https://developers.facebook.com/documentation/development/create-an-app/instagram-use-case.md), [Audio API](https://developers.facebook.com/documentation/instagram-platform/content-publishing/audio-api), [Graph API versions](https://developers.facebook.com/docs/graph-api/changelog/versions).

---

## 2. App setup, access levels and App Review

**App creation (2026 flow):** go to `https://developers.facebook.com/apps/creation/` and step through **App details** (name, contact email) > **Use cases** > **Business** > **Requirements** > **Overview** > **Go to dashboard**.
- Use case: **Manage messaging and content on Instagram**.
- On the Business step you can pick "I don't want to connect a business portfolio yet."
- The Instagram get-started guide adds: "If your current Meta app type is **not** a Business type app you will need to create a new app and select **Business** during the creation process."

**Product / use case setup:** **Dashboard** > **Customize the Manage messaging and content on Instagram use case** > **API setup with Instagram Login** > **Add all required permissions**. Then add `instagram_business_content_publish` under the use case permissions, or under **Permissions and features**.

**Access levels (quoted from Meta):**
- Standard Access "is the default access level for all apps". It is meant for apps "that will only be used by people who have roles on them, during app development, or for testing".
- **"If your app only serves your Instagram professional account or an account you manage, Standard Access is all your app needs."** ([Overview](https://developers.facebook.com/docs/instagram-platform/overview))
- Advanced Access is required only if your app "serves Instagram professional accounts that you don't own or manage". "This access level requires App Review and Business Verification."
- On the App Review page, the row "My app is only for a business I own or manage" says Standard Access, App Review "Not required". ([App Review](https://developers.facebook.com/documentation/instagram-platform/app-review))
- From the Graph access levels doc: "Permissions with Standard Access can only be requested from app users who have a role on the requesting app." Also: "All Business, Consumer, and Gaming apps are automatically approved for Standard Access for all permissions and features." ([Access levels](https://developers.facebook.com/docs/graph-api/overview/access-levels/))
- Content Publishing requirements list "Advanced or Standard Access" for both paths.

**KEY ANSWER:** Yes. An app with Standard Access, in Development or Live mode, can publish to an Instagram professional account owned or managed by someone with a role on the app, without App Review and without Business Verification. App Roles doc: Administrators, Developers and Testers can "grant the app any permission while it is in development." ([App Roles](https://developers.facebook.com/docs/development/build-and-test/app-roles))

**Important caveat on Development mode.** The App Modes doc says: "Any data generated while an app is in Development mode, such as test posts, can only be seen by role users", and such data "will become visible to all app users once you switch." ([App modes](https://developers.facebook.com/docs/development/build-and-test/app-modes/))
- A developer reported on 2026-10-09 that Facebook Page and Instagram posts from a Development-mode app were invisible to everyone except the owner. Switching the app to **Live** fixed it, the existing posts became public retroactively, and no App Review was needed under Standard Access. ([GitHub issue, third party](https://github.com/cobrasmashbc/Cobrasmash/issues/39))
- **So: finish testing, then Publish (go Live).** Live requires the basic settings (privacy policy URL, data deletion URL, app icon, category). Instagram-specific visibility in Development mode rests on Meta's general rule plus that one report. Verify by viewing a test post while signed out.

**Business Verification:** not needed for Standard Access. It is required for Advanced Access (since February 1, 2023) and for Instagram webhooks.

**Webhooks** need a Live app plus Advanced Access for `comments` and `live_comments` plus Business Verification. See section 9. ([Webhooks](https://developers.facebook.com/documentation/instagram-platform/webhooks))

---

## 3. Tokens

**Instagram Login path (recommended):**

- **Dashboard token (simplest for a single account).** Go to **Instagram > API setup with Instagram business login** and click **Generate token** next to the account. Meta's get-started guide says these App Dashboard tokens "are long-lived and are valid for 60 days."
- **OAuth flow (optional, if you build a "Connect Instagram" button in the admin):**
  1. `https://www.instagram.com/oauth/authorize?client_id=...&redirect_uri=...&response_type=code&scope=instagram_business_basic,instagram_business_content_publish`. The returned code "is valid for 1 hour and can only be used once."
  2. `POST https://api.instagram.com/oauth/access_token` with `client_id`, `client_secret`, `grant_type=authorization_code`, `redirect_uri` and `code`. Returns a short-lived token valid for 1 hour.
  3. `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=APP_SECRET&access_token=SHORT_TOKEN`. Returns `{access_token, token_type: "bearer", expires_in: 5184000}` (60 days). Server side only, never expose the app secret.
- **Refresh:** `GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=LONG_TOKEN`.
  - Rules: the token must be "at least 24 hours old but has not expired", and the user must have granted `instagram_business_basic`.
  - "Refreshed tokens are valid for 60 days from the date at which they are refreshed."
  - "Tokens that have not been refreshed in 60 days will expire and can no longer be refreshed." After that the owner must generate a new token by hand.
  - The response includes `expires_in` (for example 5183944 seconds).
- **No never-expiring option exists on this path.** Practice: keep `{token, expiresAt, refreshedAt}` in MongoDB (for example `instagram.tokens`, encrypted at rest), refresh weekly from cron, and email or alert when fewer than 10 days remain or a refresh fails.

**Facebook Login path (for comparison):**
- Long-lived user token: `GET https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=...&client_secret=...&fb_exchange_token=...`. It "generally lasts about 60 days."
- "Long-lived Page access token do not have an expiration date and only expire or are invalidated under certain conditions." ([Long-lived tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/))
- **System User token** (Business portfolio > Users > System users, or the API): the expiry options are "Never expires" or 60 days. Meta recommends expiring tokens.
  - The app and the system user must belong to the same Business Manager.
  - "Only apps with Ads Management API standard access and above can be installed." ([System user tokens](https://developers.facebook.com/docs/business-management-apis/system-users/install-apps-and-generate-tokens/))
  - This is the only true never-expiring route, but it means a Facebook Page, a Business portfolio and the Facebook Login setup.

Sources: [Get started](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started), [Access token](https://developers.facebook.com/documentation/instagram-platform/reference/access_token), [Refresh](https://developers.facebook.com/documentation/instagram-platform/reference/refresh_access_token), [Business Login](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login).

---

## 4. Publishing flow

All calls go to `https://graph.instagram.com/v25.0` with the Instagram User token (`access_token` param or `Authorization: Bearer`). Find the account ID first with `GET /me?fields=user_id,username`; `user_id` is the IG user ID used below.

**Step 1: create a container** with `POST /{ig-user-id}/media`.

| Kind | Required params | Useful optional params |
|---|---|---|
| Single image (feed) | `image_url` (public JPEG) | `caption`, `alt_text` (up to 1,000 chars, image posts only, since 2025-03-24), `location_id` (a Page ID with location data), `user_tags` (`[{username, x, y}]`, with x and y from 0.0 to 1.0), `collaborators` (up to 3 usernames; "For Feed image, Reels and Carousels only"), `is_ai_generated` |
| Carousel child | `image_url` or (`media_type=VIDEO` + `video_url`), plus `is_carousel_item=true` | `alt_text`, `user_tags`. No caption or location on children; never set `is_ai_generated` on children. |
| Carousel parent | `media_type=CAROUSEL`, `children=<id1,id2,...>` (2 to **10**; images, videos or mixed) | `caption`, `collaborators`, `location_id`, `is_ai_generated` |
| Reel | `media_type=REELS`, `video_url` | `caption`, `share_to_feed` (true means Feed and Reels tab, false means Reels tab only; placement not guaranteed), `cover_url` (public JPEG; overrides `thumb_offset`), `thumb_offset` (ms, default 0), `audio_name` (renaming original audio, allowed once), `collaborators`, `user_tags`, `location_id`, `trial_params` (`{graduation_strategy: MANUAL or SS_PERFORMANCE}`, since 2025-12-03) |
| Story (image) | `media_type=STORIES`, `image_url` | `user_tags` (x and y optional; since 2025-07-09). No stickers (link, poll, location). |
| Story (video) | `media_type=STORIES`, `video_url` | `user_tags` |

The response is `{ "id": "<container id>" }`.

**Step 2: wait for the container to be ready (needed for video):** `GET /{container-id}?fields=status_code`.
- Values: `FINISHED` (ready), `IN_PROGRESS`, `ERROR`, `EXPIRED` (not published within 24 hours), `PUBLISHED`.
- Meta recommends polling once per minute for at most 5 minutes. Images are usually `FINISHED` at once. For carousels, check every child is `FINISHED` before creating the parent.

**Step 3: publish** with `POST /{ig-user-id}/media_publish` and `creation_id=<container id>`. Returns the media `id`. Fetch `permalink` with `GET /{media-id}?fields=permalink,media_product_type` to store the post URL. Reels report `media_type=VIDEO` with `media_product_type=REELS`.

**Container rules:**
- Containers expire after 24 hours.
- At most 400 containers per account per rolling 24 hours.
- Use only US ASCII characters in URLs.

**Resumable upload** (`upload_type=resumable` + `POST https://rupload.facebook.com/ig-api-upload/<version>/<container-id>` with headers `Authorization: OAuth <token>`, `offset`, `file_size` or `file_url`): the doc says it "is available only for apps that have implemented Facebook Login for Business." On the Instagram Login path, pass a public Cloudinary `video_url` instead. That is fine for Reels up to 300 MB.

**First comment:** possible on Instagram Login with `POST /{ig-media-id}/comments?message=...`. Needs `instagram_business_basic` and `instagram_business_manage_comments`. ([Comments](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/comments))

Sources: [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/), [IG User Media reference](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media), [Resumable uploads](https://developers.facebook.com/documentation/instagram-platform/content-publishing/resumable-uploads), [Changelog](https://developers.facebook.com/documentation/instagram-platform/changelog).

---

## 5. Limits

- **Publishing limit (conflict in Meta's docs):**
  - The Content Publishing guide's rate limit section says accounts are "limited to 100 API-published posts within a 24-hour moving period. Carousels count as a single post."
  - The same page's carousel section says 50.
  - The `content_publishing_limit` reference says the current `quota_total` is 50 with `quota_duration` 86400.
  - None of these pages carries a date, so it is not clear which is newer. Enforcement happens at `media_publish`; the error code is 9 with subcode 2207042.
  - **Design for 50 and read the live value** with `GET /{ig-user-id}/content_publishing_limit?fields=config,quota_usage` (optional `since`, a Unix timestamp no older than 24 hours). For one store posting a few times a day, this never binds.
- **Container creation:** 400 per rolling 24 hours.
- **Platform rate limit (Business Use Case):** "Calls within 24 hours = 4800 * Number of Impressions". Watch the `X-Business-Use-Case-Usage` header; error 80002 when hit. ([Rate limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/))
- **Caption:** at most 2,200 characters, 30 hashtags and 20 @ tags, per the API reference (v25.0).
- **Hashtags in practice:** Instagram announced on December 18, 2025 that it would "gradually update the number of hashtags that you can include in a caption for a reel or post to five". ([Social Media Today](https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/))
  - Meta's developer docs still say 30, and no official source says whether the API rejects, trims or accepts more than 5.
  - **Unverified.** Enforce a maximum of 5 in our own code to be safe.
- **Mentions:** 20 @ tags per caption. Collaborators: up to 3 (feed image, carousel, Reels; not Stories). User tags: no count given in the reference.
- **Carousel:** at most 10 items through the API, even though the Instagram app allows 20 since 2024. All images are cropped to the first image's aspect ratio (default 1:1).

Sources: [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/), [content_publishing_limit](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/content_publishing_limit), [IG User Media](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media).

---

## 6. Media specs (from the IG User Media reference, v25.0)

**Feed image:**
- Format: **JPEG only**. "JPEG is the only supported image format. MPO and JPS are not supported." PNG and WebP are not listed.
- Size: 8 MB max.
- Aspect ratio: 4:5 to 1.91:1.
- Width: 320 to 1440 px (smaller images are scaled up, larger ones scaled down).
- Colour: sRGB (other colour spaces are converted).

**Carousel:** same image specs, 2 to 10 children. Every item is cropped to the first item's aspect ratio, so make all items the same ratio (1080x1350, 4:5, is the safe choice for sneakers).

**Reels:**
- Container: MOV or MP4, no edit lists, moov atom at the front.
- Video codec: H.264 or HEVC, progressive scan, closed GOP, 4:2:0 chroma.
- Audio: AAC, 48 kHz max, mono or stereo, 128 kbps.
- Frame rate: 23 to 60 fps. Resolution: 1920 columns max.
- Aspect ratio: 0.01:1 to 10:1 allowed, 9:16 recommended.
- Bitrate: VBR, 25 Mbps max.
- **Duration: 3 seconds to 15 minutes.** Size: **300 MB** max.
- Cover: JPEG, 8 MB max, 9:16 recommended.

**Story image:** JPEG, 8 MB max, 9:16 recommended, sRGB.

**Story video:** same container and codecs as Reels, 0.1:1 to 10:1, **3 to 60 seconds**, **100 MB** max.

**Public URL requirement:** "Media must be on a publicly accessible server when you publish, because Meta fetches it by URL."

**Cloudinary notes:**
- **Avoid `f_auto`.** Cloudinary resolves `f_auto` per request "based on the requesting browser", so Meta's fetcher may be served WebP or AVIF, or PNG for images with transparency. Use explicit `f_jpg` (for example `.../image/upload/f_jpg,q_90,c_fill,ar_4:5,w_1080/<public_id>.jpg`) so the response is `Content-Type: image/jpeg`. ([Cloudinary image optimization](https://cloudinary.com/documentation/image_optimization))
- Path-style transformations are fine. Query strings are not documented as forbidden, but Meta asks for US ASCII URLs. Avoid signed or expiring URLs, redirects and very slow first-time transformations. Pre-warm the transformed URL (one GET from the backend) before creating the container.
- **Common failure:** error 9004 with subcode 2207052 ("media could not be fetched / media download failed"). Usual causes: non-direct URLs, wrong content type, slow or unreachable hosts. ([bundle.social error list, third party](https://bundle.social/instagram-api/errors))
- For video, use Cloudinary `f_mp4,vc_h264,ac_aac` and keep within the specs above.

---

## 7. What the API cannot do

| Feature | Status |
|---|---|
| Native scheduling | **No.** No `scheduled_publish_time` or `published=false` for Instagram. Run our own scheduler. Containers expire after 24 hours. |
| Music / licensed audio | Not on Instagram Login. `audio_name` only renames original audio. The Audio API (June 1, 2026) can attach licensed or trending audio to Reels, but only on Facebook Login. |
| Filters, stickers, editing | Filters are not supported. Story stickers (link, poll, location) are not supported, so **no link sticker in Stories via API**. |
| Product tags | Supported only on **Facebook Login** (`product_tags`, at most 5, with `catalog_management` and `instagram_shopping_tag_products`, and an admin role on the Business that owns the Instagram Shop). "Shopping tags are not supported" in the general limits. Not on Instagram Login. |
| Collaborators | Supported (`collaborators`, up to 3) for feed images, carousels and Reels. Not for Stories. |
| User tags | Supported (`user_tags`) on images, carousel images, Reels, and Stories (since July 9, 2025). |
| Location tags | Supported (`location_id` = a Facebook Page ID with location data). Not on carousel children. |
| First comment | Supported through `POST /{media-id}/comments` with `instagram_business_manage_comments`. |
| Alt text | Supported on images and carousel images (`alt_text`, up to 1,000 chars). Not on Reels or Stories. |
| AI label | `is_ai_generated` (added June 22, 2026), set on the parent container only for carousels. |
| Partnership ads label | Facebook Login only. |
| Delete posts | Possible since December 3, 2025 (`instagram_manage_contents`; that is the Facebook Login permission name, the Instagram Login equivalent was not verified). |

**Instagram Shopping in India:** In 2023 Meta stopped shops without checkout in most APAC markets, but India was one of seven exempt markets where Meta would "continue to support shops without checkout on Facebook and Instagram". ([Marketing-Interactive, 2023](https://www.marketing-interactive.com/apac-shops-to-be-unable-to-host-on-fb-or-ig-from-10-aug-as-meta-updates-ad-priorities))
- Third-party 2025 to 2026 sources say Shops moved fully to website checkout in September 2025 while catalogs and tagging remain.
- **Not verified for 2026 from an official Meta page** (Meta Help Center pages did not render for fetching).
- Even if available, API product tagging needs the Facebook Login path plus a Commerce Manager catalog and shop approval.

---

## 8. India specifics

**Meta Business Verification** (needed only for Advanced Access or webhooks, not for this plan):
- India documents listed by third-party help centres that mirror Meta's list: GST registration certificate, Certificate of Incorporation, business PAN card, Shop and Establishment certificate, Udyog Aadhaar or Udyam (MSME) registration, business licence, business bank statement, utility bill.
- The legal name and address must match the Meta business portfolio exactly. ([Wati](https://support.wati.io/en/articles/11463208-meta-business-verification-required-documents-by-country), [Emovur](https://emovur.com/blog/whatsapp-business-api/meta-business-verification-documents))
- Meta's own country page ([facebook.com/business/help/159334372093366](https://www.facebook.com/business/help/159334372093366)) did not render for fetching, so the list is **not verified against Meta directly**.

**Instagram Shopping in India:** see section 7. Supported without checkout as of 2023. 2026 status unverified.

**ASCI and consumer law** (applies to the brand's own posts as advertising):
- The ASCI Code bars misleading, exaggerated or unfair claims. It also has guidelines on online deceptive design patterns, which cover digital and e-commerce ads. ([ASCI Code](https://www.ascionline.in/the-asci-code-guidelines/), [ASCI AdLaw Compendium 2026](https://www.ascionline.in/wp-content/uploads/2026/03/The-AdLaw-Compendium.pdf))
- **False urgency / "limited stock":** the advertiser must be able to show stock levels justified the message.
- **Prices:** quote final prices upfront, including all charges.
- **Claims such as "100% authentic" or "original":** keep proof (invoices, sourcing) since the claim must be substantiated.
- **Paid creators:** the disclosure label must be prominent (not buried among hashtags). The brand shares liability for creator claims. ([Lexology dark patterns guide](https://www.lexology.com/library/detail.aspx?g=c9963888-f71c-4140-b068-bbbab6f5fe42))
- The CCPA Dark Patterns Guidelines 2023 and the Consumer Protection (E-Commerce) Rules 2020 also apply to the store generally (not researched in depth here).

**Data rules:**
- Publishing our own content involves no customer personal data.
- If comments or DMs are stored later, that is personal data under the DPDP Act 2023. The DPDP Rules were notified on November 13, 2025, with the main obligations (notice, security, breach notification, children's data) applying from about May 13, 2027. ([Hogan Lovells](https://ca.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-), [S.S. Rana](https://ssrana.in/articles/meity-notifies-final-digital-personal-data-protection-rules-2025/))
- Treat the Instagram token and app secret as secrets (encrypted, never in git).

**Trademark and copyright risk for a reseller:**
- Meta's IP policy prohibits content that infringes copyright or trademark, "false affiliation with brand(s)" and counterfeit promotion. Meta will "remove accounts that: Engage in repeated violations of this policy" (policy updated August 26, 2024). ([Meta IP policy](https://transparency.meta.com/policies/community-standards/intellectual-property/), [How Meta protects IP](https://transparency.meta.com/data/intellectual-property/protecting-intellectual-property-rights/))
- Nike, Jordan and adidas run active brand-protection programmes and can file reports through Meta's IP channels.
- **Press and campaign images are copyrighted** (brand or photographer). Reposting them is the largest takedown risk, and repeated takedowns can disable the account.
- Trademark: India follows international exhaustion for genuine goods (Delhi HC, Kapil Wadhwa v. Samsung, 2012, s.30(3) Trade Marks Act). Reselling genuine pairs and naming the model is generally defensible. Implying affiliation ("official Nike store", using the swoosh as our branding) is not. ([IAM summary](https://www.iam-media.com/article/court-rules-in-favour-of-international-trademark-exhaustion))
- **Recommendation:** auto-post only the store's own product photos (shot in-house or by its own photographers), name models factually, add a line like "Independent reseller, not affiliated with Nike/adidas", and never automate reposting of brand press images. This is a risk summary, not legal advice.

---

## 9. Webhooks and insights worth adding later

**Insights** (Instagram Login supported since January 21, 2025):
- Call `GET /{ig-media-id}/insights?metric=...` with `instagram_business_basic` and `instagram_business_manage_insights`.
- FEED metrics: `reach`, `views`, `likes`, `comments`, `saved`, `shares`, `total_interactions`, `profile_visits`, `follows`, `reposts`.
- REELS metrics add `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time`, `reels_skip_rate`.
- STORY metrics: `reach`, `views`, `replies`, `navigation`, `shares`. `link_clicks` is Facebook Login only.
- `impressions` and `plays` are deprecated (v22.0+, April 21, 2025).
- Data can lag up to 48 hours and is kept for up to 2 years. Story metrics last only 24 hours.
- Standard Access is enough for our own account. ([Media insights](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights))

**Comments webhook:**
- Field `comments` (mentions included), needing `instagram_business_basic` and `instagram_business_manage_comments`.
- Requirements: "Your app must be set to Live", **Advanced Access** for `comments` and `live_comments`, **Business Verification**, and a public account. Subscribe with `POST /me/subscribed_apps?subscribed_fields=comments`.
- **Without App Review, poll `GET /{media-id}/comments` from cron instead.** ([Webhooks](https://developers.facebook.com/documentation/instagram-platform/webhooks))

**Messages:** `instagram_business_manage_messages` (same webhook constraints). Out of scope now.

---

## 10. Hosting the scheduled publisher

| Option | Facts | Verdict |
|---|---|---|
| **Render Cron Job** | At least $1/month per cron service, "prorated by the second". Runs in UTC. A run is stopped after 12 hours. "At most one run of a given cron job is active at a given time" (overlapping runs wait). Cron jobs cannot use Free instances. The Starter rate is reportedly $0.00016/min (third party, not verified on Render's live pricing). ([Render cron docs](https://render.com/docs/cronjobs), [Render free tier](https://render.com/docs/free)) | **Recommended.** Same repo and env vars, direct MongoDB access, does not depend on the sleeping web service. |
| Render free web service + external ping | Free web services spin down after 15 minutes without inbound traffic and take about 1 minute to spin up. 750 free instance hours per month. | Only as the HTTP target of an external trigger; never rely on in-process timers (`node-cron`) on a free instance. |
| **GitHub Actions `schedule`** | "The shortest interval you can run scheduled workflows is once every 5 minutes." Runs "can be delayed during periods of high loads" and "some queued jobs may be dropped". UTC by default, IANA timezone now optional. Default branch only. Disabled after 60 days of no activity in public repos. Free for public repos; 2,000 minutes per month on private repos (GitHub Free). ([Events docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [Billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)) | Good free fallback: `curl` a secret-protected `POST /internal/instagram/run` with retries and a 120-second timeout (to cover the cold start). Make the job idempotent so a late or doubled run is harmless. |
| Vercel Cron (Hobby) | "Hobby accounts are limited to cron jobs that run once per day." Precision is "Per-hour (±59 min)". Pro allows once per minute. ([Vercel cron pricing, updated 2026-07-15](https://vercel.com/docs/cron-jobs/usage-and-pricing)) | Not suitable for timed posts. |

**Recommendation:** a Render Cron Job every 10 minutes (`*/10 * * * *`) running `node scripts/instagram-publish-due.js`. The script should:
1. Take a Mongo lock.
2. Pick posts with `status=scheduled` and `scheduledAt <= now`, mark them `publishing`.
3. Create the container(s), poll status, publish.
4. Store the `mediaId` and `permalink`, mark `published` (or `failed` with the error and a retry count).
5. Once a week, refresh the token.

If the owner wants zero spend, use the GitHub Actions trigger with the same idempotent endpoint and accept up to roughly 15 to 30 minutes of delay at busy times.

---

## 11. Owner checklist (in order)

1. **Instagram app:** Profile > menu (three lines) > **Settings and activity** > **Account type and tools** (some versions: **For professionals**) > **Switch to professional account**. Pick a category (for example Shopping & retail), then **Business**. The account becomes public. Menu labels come from third-party guides and may differ slightly by app version.
2. **Meta developer account:** sign in at developers.facebook.com with a Facebook account that will be the app admin (register as a developer if asked).
3. **Create the app:** `https://developers.facebook.com/apps/creation/`.
   - **App details:** app name without "Instagram" or "Facebook" in it, plus contact email.
   - **Use cases:** **Manage messaging and content on Instagram**.
   - **Business:** "I don't want to connect a business portfolio yet" (or connect SNKRS CART's portfolio).
   - **Requirements** > **Overview** > **Go to dashboard**.
   - If asked for an app type, choose **Business**.
4. **Customize the use case:** Dashboard > **Customize the Manage messaging and content on Instagram use case** > **API setup with Instagram Login** > **Add all required permissions**. Make sure `instagram_business_basic` and `instagram_business_content_publish` are listed (add the latter under the use case permissions or **Permissions and features**). Copy the **Instagram app ID** and **Instagram app secret** shown there.
5. **Add the Instagram account:** in **Generate access tokens**, click **Add account** > **Continue** > log in to the SNKRS CART Instagram account > **Save** > **Got it**.
   - If the account does not appear or token generation fails, add it as a tester: **App roles > Roles > Add People > Instagram Tester** with the Instagram username.
   - Then accept the invite on Instagram: **Settings > Website permissions > Apps and websites > Tester invites**, or on the web under Settings > Apps and websites.
   - The tester-invite path comes from third-party 2026 guides; Meta's current doc mentions only **Add account**.
6. **Generate the token:** next to the account, click **Generate token**, log in, allow, and copy it. It is long-lived, 60 days.
7. **Find the IG user ID:** `curl "https://graph.instagram.com/v25.0/me?fields=user_id,username&access_token=TOKEN"` and copy `user_id`.
8. **Fill basic settings and go Live:**
   - **App settings > Basic:** app icon, category, **Privacy Policy URL** (for example snkrscart.com/privacy) and **User data deletion** URL (an instructions page), then **Save**.
   - Test one post (check that it is visible while signed out after going Live).
   - Click **Publish** in the left menu. No App Review is needed for the store's own account under Standard Access. This step is single-source verified (see section 2).
9. **Set env vars on Render** (web service and cron job; never in git):
   - `IG_USER_ID`
   - `IG_ACCESS_TOKEN` (initial seed only; the app then keeps the refreshed token in MongoDB)
   - `IG_APP_ID`
   - `IG_APP_SECRET`
   - `IG_API_VERSION=v25.0`
   - `IG_GRAPH_HOST=https://graph.instagram.com`
   - `INTERNAL_CRON_SECRET` (if using the GitHub Actions trigger)
10. **Create the Render Cron Job** (New > Cron Job, same repo, schedule `*/10 * * * *`, command `node scripts/instagram-publish-due.js`, same env vars), or add the GitHub Actions workflow plus the `INTERNAL_CRON_SECRET` repo secret.
11. **Calendar reminder at day 50** in case the automatic refresh ever fails. If the token expires, repeat step 6 and paste the new token in the admin or env.

---

## Could not verify

- Whether the publishing limit is 50 or 100 per 24 hours (Meta's own pages conflict and carry no dates). Read `quota_total` live.
- Whether API-published captions with more than 5 hashtags are rejected since December 2025 (the API reference still says 30).
- The exact Instagram Tester invite path for Business Login apps in 2026, and whether **Add account** alone is enough (Meta's doc implies it is).
- Instagram-specific Development-mode visibility. It is backed by Meta's general app-mode rule and one 2026-10-09 developer report, not an Instagram-specific Meta page.
- Meta's official India business verification document list and the 2026 status of Instagram Shopping in India (Meta Help Center pages did not render).
- Render's exact Starter cron per-minute price (only the $1 minimum is from Render's docs).
- Whether graph.instagram.com examples work unchanged on v26.0 (all Instagram docs still show v25.0).

---

## Sources

**Meta developer docs**
- Instagram Platform overview (paths, access levels): https://developers.facebook.com/docs/instagram-platform/overview
- Instagram API with Instagram Login: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/
- Get started (Instagram Login, v25.0, dashboard tokens 60 days, /me user_id): https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started
- Business Login for Instagram (scopes, OAuth, refresh rules): https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login
- Access token (ig_exchange_token): https://developers.facebook.com/documentation/instagram-platform/reference/access_token
- Refresh access token: https://developers.facebook.com/documentation/instagram-platform/reference/refresh_access_token
- Content Publishing guide: https://developers.facebook.com/docs/instagram-platform/content-publishing/
- IG User Media reference (params, specs, limits): https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media
- Content publishing limit: https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/content_publishing_limit
- Resumable uploads: https://developers.facebook.com/documentation/instagram-platform/content-publishing/resumable-uploads
- Audio API: https://developers.facebook.com/documentation/instagram-platform/content-publishing/audio-api
- IG Media comments: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/comments
- IG Media insights: https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights
- Webhooks: https://developers.facebook.com/documentation/instagram-platform/webhooks
- App Review (Instagram): https://developers.facebook.com/documentation/instagram-platform/app-review
- Instagram Platform changelog: https://developers.facebook.com/documentation/instagram-platform/changelog
- Docs index: https://developers.facebook.com/documentation/instagram-platform/llms.txt
- Use case customization (dashboard labels): https://developers.facebook.com/documentation/development/create-an-app/instagram-use-case.md
- Create an app: https://developers.facebook.com/docs/development/create-an-app/
- App roles: https://developers.facebook.com/docs/development/build-and-test/app-roles
- App modes: https://developers.facebook.com/docs/development/build-and-test/app-modes/
- Graph API access levels: https://developers.facebook.com/docs/graph-api/overview/access-levels/
- Graph API rate limiting: https://developers.facebook.com/docs/graph-api/overview/rate-limiting/
- Graph API versions: https://developers.facebook.com/docs/graph-api/changelog/versions
- Graph API v26 announcement: https://developers.facebook.com/blog/post/2026/07/29/introducing-graph-api-v26-and-marketing-api-v26/
- Long-lived tokens (Facebook Login): https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/
- System user tokens: https://developers.facebook.com/docs/business-management-apis/system-users/install-apps-and-generate-tokens/

**Meta policy**
- Meta IP policy: https://transparency.meta.com/policies/community-standards/intellectual-property/
- How Meta protects IP: https://transparency.meta.com/data/intellectual-property/protecting-intellectual-property-rights/
- Instagram Terms of Use: https://help.instagram.com/581066165581870

**Hosting**
- Render cron jobs: https://render.com/docs/cronjobs
- Render free tier: https://render.com/docs/free
- GitHub Actions schedule event: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- Vercel cron usage and pricing: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Cloudinary image optimization (f_auto): https://cloudinary.com/documentation/image_optimization

**Third party and news (lower confidence)**
- 5-hashtag cap (Social Media Today, 2025-12-18): https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/
- Development-mode visibility report (GitHub, 2026-10-09): https://github.com/cobrasmashbc/Cobrasmash/issues/39
- 2026 token guide (WP Social Ninja, tester invite path): https://wpsocialninja.com/instagram-access-token/
- Instagram error list (bundle.social): https://bundle.social/instagram-api/errors
- APAC shops change, India exempt (2023): https://www.marketing-interactive.com/apac-shops-to-be-unable-to-host-on-fb-or-ig-from-10-aug-as-meta-updates-ad-priorities
- India verification documents (Wati): https://support.wati.io/en/articles/11463208-meta-business-verification-required-documents-by-country
- India verification documents (Emovur): https://emovur.com/blog/whatsapp-business-api/meta-business-verification-documents
- ASCI Code: https://www.ascionline.in/the-asci-code-guidelines/
- ASCI AdLaw Compendium 2026: https://www.ascionline.in/wp-content/uploads/2026/03/The-AdLaw-Compendium.pdf
- Dark patterns in India (Lexology): https://www.lexology.com/library/detail.aspx?g=c9963888-f71c-4140-b068-bbbab6f5fe42
- DPDP Rules 2025 (Hogan Lovells): https://ca.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-
- DPDP Rules 2025 (S.S. Rana): https://ssrana.in/articles/meity-notifies-final-digital-personal-data-protection-rules-2025/
- International exhaustion (IAM): https://www.iam-media.com/article/court-rules-in-favour-of-international-trademark-exhaustion
