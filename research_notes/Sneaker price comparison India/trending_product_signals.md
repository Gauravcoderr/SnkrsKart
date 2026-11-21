# Free signals for sneaker demand and launches in India (as of 2026-11-21)

Method note: about 25 searches and fetches. WebFetch summaries are produced by a small model, so quoted rules are "verified (page opened, summarised)". Reddit, Wikimedia, Lyst full list, Nike India, StockX and Shopify JSON checks partly failed (see Gaps). Nothing in any query named the store.

## Google Trends: official API, unofficial routes, comparing many models

### Takeaway

An official Google Trends API exists only as an application-only alpha (launched 2025-07-24); no quota or terms are published on its page, so it cannot be planned around. Unofficial routes (pytrends, now archived) are unreliable in 2026; use them only as a low-weight, cached, optional signal with an anchor-term method.

### Cited Findings

- Official alpha announced 2025-07-24, access on a rolling basis to a limited number of developers; applications via a form — [Google Search Central blog](https://developers.google.com/search/blog/2025/07/trends-api); [Google apply page](https://developers.google.com/search/apis/trends) (verified)
- Alpha gives a rolling 5-year window, daily/weekly/monthly/yearly aggregation, comparison across countries and sub-regions; page states no quotas and no API-specific terms. Google prioritises applicants with a clear use case who start soon and give feedback — [Google apply page](https://developers.google.com/search/apis/trends) (verified)
- Alpha will not include Trending Now; there is no 1:1 support — [search summary of Google/SEJ coverage](https://developers.google.com/search/apis/trends/help) (secondary; summary of search results)
- pytrends GitHub repo archived 2025-04-17, last release 4.9.2 (April 2023), so 429 fixes will not ship — summarised from [search results incl. dev.to](https://dev.to/esteban_ortega/pytrends-is-dead-heres-how-to-get-google-trends-data-in-2026-1a18) (secondary, vendor blogs)
- Conflicting vendor tests: one (July 2026) says a hand-rolled request works once the NID cookie is warmed; another (2026-09-11) says Explore methods worked but all three trending-search methods returned 404 — [apiserpent](https://apiserpent.com/blog/pytrends-dead-google-trends-data-2026), [scrapebadger](https://scrapebadger.com/blog/best-google-trends-scraper-in-2026-every-tool-compared-honestly) (secondary, single tests by vendors selling scrapers)
- Google's terms for scraping Trends: not found in this pass; treat unofficial access as not permitted/unstated until read.

### Inferences

- Anchor-term method (standard practice, not sourced here): pick one anchor shoe with steady India volume, query every batch of 4 models plus the anchor, divide each model by the anchor's value in the same batch, then compare ratios across batches. Use 12-month window, geo IN, category Shoes/Sneakers (category 'Sneakers' filter) and treat values under about 5 as noise.
- Daily/realtime trending RSS for India likely broken (404 in one test); do not depend on it.
- Apply for the alpha anyway (free); until accepted, make Trends optional.

### Gaps

- Official Trends terms text, alpha quota, and whether geo IN is confirmed for alpha testers: not found.
- Whether the Trending Now RSS for IN still serves: only conflicting secondary claims.

## Google Merchant Center reports and Merchant API

### Takeaway

Besides best sellers, Merchant Center has Popular products (weekly/monthly rank and rank change, India included), price competitiveness and competitive visibility. Reports need a standalone or sub-account (not Advanced accounts) and the PERFORMANCE_REPORTING or ADMIN access right.

### Cited Findings

- Merchant API reports: one view per request; reports not available to Advanced accounts; mentions Alpha features (YouTube affiliate, UCP agentic reporting); no 2026 changes listed on that guide — [Merchant API reports guide](https://developers.google.com/merchant/api/guides/reports/overview) (verified)
- `accounts.reports.search` requires `PERFORMANCE_REPORTING` or `ADMIN`; table list lives in "Available fields" — [reference](https://developers.google.com/merchant/api/reference/rest/reports_v1/accounts.reports/search) (verified)
- Popular products page: 36 countries incl. India; rank where smaller is more popular, rank change, availability, price range, country, category, time period; monthly or weekly up to 2 years back; weekly refresh, new data up to 2 weeks to appear; CSV export; cards personalised to products and countries you sell — [Popular products help](https://support.google.com/merchants/answer/9488679) (verified)
- Price Range dimension shows current prices across Google for the product — same page (verified); competitive visibility details not found.

### Inferences

- Best sellers and Popular products measure the same demand rank; fetch both, they overlap, count as one source family in the recipe.
- Price competitiveness and price insights give price position, not demand; use to decide which tracked models are worth repricing, not which to add.

### Gaps

- Exact view names (best sellers, price competitiveness, competitive visibility) and any 2026 field changes: reference "Available fields" page not retrieved.

## Keyword volume sources with India data

### Takeaway

Keyword Planner volume for accounts without spend is bucketed ranges and exact figures are gated; Bing Webmaster keyword research shows impressions and a location filter but India volume is unconfirmed. Wikipedia pageviews is free and allowed but weak for sneakers.

### Cited Findings

- Accounts with little or no spend see ranges (e.g. 1K to 10K, 10K to 100K); a roughly $100+/month threshold for exact data is an unverified estimate; API access needs developer token, approval and OAuth; API appears to inherit UI limits — [SERoundtable](https://www.seroundtable.com/google-keyword-planner-data-ranges-campaign-only-22506.html), [Google Ads API docs](https://developers.google.com/google-ads/api/docs/keyword-planning) (secondary; vendors DataForSEO and Keywords Everywhere have a commercial bias)
- Bing Webmaster Tools is free; keyword research reports impressions and has location and language selectors; Bing does not publish per-keyword volume publicly — [Practical Ecommerce](https://www.practicalecommerce.com/using-bings-keyword-research-tool), [Keywords Everywhere](https://keywordseverywhere.com/tools/bing-keyword-tool/) (secondary)
- Wikimedia pageviews doc page returned 404 at the URL tried; rate limits and user-agent rules not confirmed.

### Inferences

- The shop's own Search Console and Google autocomplete already beat these for India; use Bing only as a cross-check.
- Ahrefs/Semrush free tiers, Keywords Everywhere free mode and YouTube suggestions: not researched; do not rely on them.

### Gaps

- Pageviews API terms, Ahrefs/Semrush free-tier limits, Bing AI performance report, YouTube search suggestions: not found.

## Resale and marketplace lists (stores, StockX)

### Takeaway

Shopify stores expose `/collections/...` and `products.json`, but two checked Indian stores block `sort_by` URLs in robots.txt, so a "best-selling" sort is disallowed there. Treat product order from allowed pages and new-arrival counts as the usable signal.

### Cited Findings

- Superkicks robots.txt (`*`): blocks `/collections/*sort_by*`, multi-filter collections, `/search`, cart/checkout/account; does not block `/products` or `products.json`; states "Checkouts are for humans" and bars automated buying agents; sitemap listed — [robots.txt](https://www.superkicks.in/robots.txt) (verified)
- Limited Edt robots.txt: same `sort_by` disallow for `*`; no crawl-delay; products.json not mentioned — [robots.txt](https://www.limitededt.in/robots.txt) (verified)
- VegNonVeg robots.txt: disallows `/cart/`, `/checkout/`, `/account/`, `/wishlist/`, `/search/`, `/?`; collections and sort_by not blocked — [robots.txt](https://www.vegnonveg.com/robots.txt) (verified)
- Superkicks `products.json` fetch returned HTTP 429 with Retry-After 60 — [fetch result](https://www.superkicks.in/collections/all/products.json?limit=3) (verified, shows rate limiting)
- StockX robots.txt: only `*/trending-deals=` rule seen in summary; no automation statement seen; StockX terms not read — [robots.txt](https://stockx.com/robots.txt) (verified, partial)

### Inferences

- Do not use `sort_by=best-selling` on Superkicks or Limited Edt. Default collection order and `published_at`/`created_at` in products.json (new arrivals) are not blocked by robots but terms were not read.
- StockX/GOAT are global, not India demand.

### Gaps

- Mainstreet, Culture Circle, Crepdog Crew robots and terms; any India year-end ranking from them; marketplace terms of use for all: not found.

## Launch calendars and feeds

### Takeaway

Sneaker News publishes a working RSS feed (global news, not India-specific). Nike's India launch URL redirects to nike.in and showed no usable calendar in this pass.

### Cited Findings

- Sneaker News feed is valid RSS 2.0, newest items dated 2026-11-20, only 7 items per fetch — [feed](https://sneakernews.com/feed/) (verified)
- `nike.com/in/launch` 301 redirects to `nike.in`; content not read — [fetch result](https://www.nike.com/in/launch) (verified)

### Inferences

- RSS gives model names and launch buzz; India date must come from the shop's own calendar or brand India pages. Use RSS titles with a model-name matcher for mention counts.

### Gaps

- adidas Confirmed India, Sole Retriever, Nice Kicks, KicksOnFire, House of Heat feeds and terms; whether any state India release dates reliably: not checked.

## Community and social signals

### Takeaway

Reddit's free tier is non-commercial, approval-gated, and access status in late 2026 is unclear from secondary sources. YouTube's free quota is usable but small for search.

### Cited Findings

- Reddit free tier reported at about 100 queries/min per OAuth client for approved non-commercial use; self-service credentials reportedly ended 2025-11-11; one source says new requests closed 2026-10-31; no official Reddit page found — [dev.to](https://dev.to/agenthustler/reddit-data-api-2026-after-the-pricing-change-heres-what-developers-actually-use-4o2h), [data365](https://data365.co/blog/reddit-api-pricing) (secondary, conflicting)
- reddit.com cannot be fetched by this tool; r/SneakersIndia stats not verified.
- YouTube Data API: default 10,000 units/day; `videos.list` costs 1; the fetched page summary says `search.list` has a separate default of 100 calls/day at 1 point each (this conflicts with the older documented cost of 100 units per search, so check the live page) — [quota page](https://developers.google.com/youtube/v3/determine_quota_cost) (verified, summary possibly unreliable)
- Instagram hashtag search doc URL returned 404; the 30 unique hashtags per 7 days limit is from memory, not verified.

### Inferences

- A shop with a commercial purpose is likely outside Reddit's free non-commercial tier; skip Reddit or read it manually.

### Gaps

- Telegram/WhatsApp channels, Google News RSS terms, Instagram hashtag availability under Instagram Login: not found.

## Indian marketplace bestseller lists

### Takeaway

Amazon India robots.txt does not block best-seller paths for generic bots, but it has no terms text in that file and its Conditions of Use were not read; Myntra and Ajio were not conclusively checked.

### Cited Findings

- amazon.in robots.txt: `*` group does not block `/gp/bestsellers` or `/Best-Sellers`; GPTBot, ClaudeBot and EtaoSpider are `Disallow: /`; no automation statement in file — [robots.txt](https://www.amazon.in/robots.txt) (verified)
- Myntra robots fetch timed out; Flipkart and Ajio not fetched.

### Inferences

- Robots allowance is not terms permission; amazon.in Conditions of Use likely restrict automated reading, flagged and not recommended without reading them.

### Gaps

- Myntra/Flipkart/Ajio robots and terms, Myntra and Flipkart year-end trend reports: not found.

## Published trend reports for India

### Takeaway

No published India report naming sneaker models was found in this pass.

### Cited Findings

- Google India Year in Search 2025 (published 2025-12-04) top lists showed Gemini, Asia Cup, Ghibli and films; no footwear category seen in summaries — [Google India blog](https://blog.google/intl/en-in/products/explore-communicate/indias-year-in-search-2025/) (verified via search summary)
- Lyst Index Q3 2026: Prada top brand, Vans Premium Authentic reported at No. 4 product; full product list not retrieved; global, not India — [Hypebae](https://hypebae.com/2026/10/lyst-index-hottest-brands-items-products-q3-prada-balenciaga-cos-free-people-chanel-ballet-flats) (secondary)

### Gaps

- Myntra FlipTrends, Culture Circle, Crepdog, RedSeer, StockX India commentary: not found.

## How comparison sites choose what to track

### Takeaway

No public statement from Sneakers123, Sole Retriever, StockX, PriceRunner or Indian comparison sites about catalogue selection was found.

### Cited Findings

- None.

### Gaps

- Not searched in this pass.

## Scoring recipe

### Takeaway

Blend ranks with reciprocal rank fusion plus recency decay, and require at least two independent source families. This recipe is a recommendation from standard practice, not from a cited source.

### Cited Findings

- No source cited; method is general practice.

### Inferences

- Source families (independent): A Merchant (Best sellers plus Popular products count once), B own Search Console and autocomplete, C Google Trends via anchor ratio if available, D launch buzz (Sneaker News RSS mentions plus own calendar), E allowed store new-arrivals. Reddit, Amazon only if terms are cleared.
- Score = sum over families of w_f / (60 + rank_f), then multiply by decay exp(-days_since_signal / 30) for launch items. Weights: A 0.35, B 0.25, C 0.15, D 0.15, E 0.10. Merchant riser flag adds +10% to its term; demand level high adds +5%.
- Admission rule: at least 2 families, or family A rank within top 50 on its own.
- Worked sizing for 50 models: keep the top 35 by score, reserve 10 slots for models in the next 30 days of the calendar, 5 for risers outside the top 35. Example: a model at Merchant rank 20 (0.35/80=0.0044), Search Console rank 10 (0.25/70=0.0036), launch buzz rank 8 (0.15/68=0.0022) totals 0.0102 before decay; one at rank 5 in only Merchant scores 0.0054 and is admitted only by the top-50 rule.
- Normalise model names first (style code, then brand plus model plus colourway tokens) so the same shoe counts once per family.

### Gaps

- Weights are untuned guesses; calibrate against the shop's own sales after 8 weeks.
