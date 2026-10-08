# Keyword, search-demand and ranking-measurement data sources for an India-focused automated content pipeline

Research date: 2026-10-07. All vendor pages were fetched on this date unless a different article date is given. Prices are USD unless stated. "Fetched" = read directly from the vendor page; "via" = third-party write-up with its own date.

## Key Question 1: Google Search Console API (data, quotas, per-URL daily pulls, URL Inspection, striking distance, week 1-4 measurement)

### Takeaway
GSC is the only free, first-party source of India-specific query, page, CTR and position data for your own site, with 16 months of history, generous quotas (1,200 queries/min per site) and a type switch for Discover and Google News. It cannot give you volume for keywords you do not already rank for, and the API returns "top rows" rather than every row, so long-tail Hindi queries will be partly anonymised.

### Cited Findings
- Search Analytics quota: per-site 1,200 QPM, per-user 1,200 QPM, per-project 30,000,000 QPD and 40,000 QPM. URL Inspection: per-site 2,000 QPD and 600 QPM, per-project 10,000,000 QPD and 15,000 QPM. All other resources: 20 QPS / 200 QPM per user, 100,000,000 QPD per project. — [Search Console API usage limits](https://developers.google.com/webmaster-tools/limits)
- `searchanalytics.query` request body: `startDate`/`endDate` in YYYY-MM-DD, Pacific time; dimensions `country, device, page, query, searchAppearance, date, hour`; `type` values `discover, googleNews, news, image, video, web` (`searchType` deprecated); filter operators `contains, equals, notContains, notEquals, includingRegex, excludingRegex`; `aggregationType` `auto, byPage, byProperty, byNewsShowcasePanel`; `rowLimit` 1 to 25,000 (default 1,000); `startRow` zero-based; `dataState` `all` (fresh), `final` (default) or `hourly_all`. Response rows carry `keys, clicks, impressions, ctr (0-1), position`. — [searchanalytics.query reference](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- "The API is bounded by internal limitations of Search Console and does not guarantee to return all data rows but rather top ones." Default sort is clicks descending; date-grouped results sort oldest first. — [searchanalytics.query reference](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- Pagination guidance: "If your query has more than 25,000 rows of data, you can request data in batches of 25,000 rows at a time by sending multiple queries and incrementing the startRow value each time." — [Search Analytics how-to](https://developers.google.com/webmaster-tools/v1/how-tos/search_analytics)
- URL Inspection endpoint: `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect` with `inspectionUrl` (must be under the property), `siteUrl` (URL-prefix or `sc-domain:` form) and optional `languageCode`; scopes `webmasters` or `webmasters.readonly`; it only views index status and "cannot test the indexability of a live URL" (no request-indexing capability). — [urlInspection.index.inspect](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect)
- Data retention: "Search Console keeps data for the last 16 months" (stated in the GA4 Search Console integration help). — [Google Analytics help 13682862](https://support.google.com/analytics/answer/13682862); the 16-month cap and date-picker presets (7d, 28d, 3m, 6m, 12m, 16m) are also described by [SEOTesting](https://seotesting.com/google-search-console/how-long-does-gsc-keep-my-data/)
- Fresh data: Google's 2019 announcement says fresh impressions, clicks and position can be used about 12 hours after the day observed and that 36 hours after the day observed most data points (93%) are final; 95% of data points have at least 97% of final impressions and clicks; the report runs on Pacific time. — [Google Search Central blog, Sept 2019](https://webmasters.googleblog.com/2019/09/search-performance-fresh-data.html); summarised by [Search Engine Journal](https://www.searchenginejournal.com/google-search-console-can-now-report-on-same-day-data/327387/)
- Striking-distance definitions in practitioner tooling: SEOTesting uses roughly position 5 to 20 with real impressions and notes the large CTR drop from page 1 to page 2 — [SEOTesting](https://seotesting.com/blog/striking-distance-keywords-gsc-api/); the gsc-mcp server defines it as positions 8 to 25 with sufficient impressions — [gsc-mcp tool](https://glama.ai/mcp/servers/conorbronsdon/gsc-mcp/tools/gsc_striking_distance); Luca Berton's 2026 Python script filters positions 11 to 20 — [lucaberton.com](https://lucaberton.com/blog/google-search-console-growth-analysis-python-script-2026/)
- Open-source GSC pulling: `joshcarty/google-searchconsole` Python wrapper and JC Chouinard's guide for pulling data for a list of URLs — [jcchouinard.com](https://www.jcchouinard.com/google-search-console-data-from-a-list-of-urls/); Builtvisible's minimal Python pull script — [Builtvisible](https://builtvisible.com/how-to-pull-gsc-data-with-a-simple-python-script/); `evemilano/Google_Search_Console_Data_Analysis` repo — [GitHub](https://github.com/evemilano/Google_Search_Console_Data_Analysis)

### Inferences
- A daily per-URL pull is: one `searchanalytics.query` per day with `dimensions: ["date","page","query"]`, `type: "web"`, `dataState: "all"`, `rowLimit: 25000`, paging on `startRow`, filtered to `country equals ind` for India-only views. Store rows keyed on (date, page, query, country, device). At 1,200 QPM per site this is nowhere near quota for a blog with a few thousand URLs.
- Sample call (constructed from the documented parameters above, Node 18+ `fetch` with a Google OAuth bearer token):
  ```ts
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent('sc-domain:snkrscart.com')}/searchAnalytics/query`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: '2026-09-01', endDate: '2026-10-05',
        dimensions: ['date', 'page', 'query'],
        type: 'web', dataState: 'all', rowLimit: 25000, startRow: 0,
        dimensionFilterGroups: [{ filters: [
          { dimension: 'country', operator: 'equals', expression: 'ind' },
          { dimension: 'page', operator: 'contains', expression: '/blogs/' } ] }]
      }) });
  ```
- Week 1 to 4 measurement for a new article: pull `dimensions: ["date"]` plus a `page equals <url>` filter daily from publish date; because fresh data lands ~12h after the day and finalises within ~36h, a "day 7 / day 14 / day 28" snapshot is reliable if taken 2 days after the window closes. Impressions appear before clicks; a page with rising impressions and position drifting from 40s into the 8 to 20 band is the striking-distance trigger for a refresh.
- The "top rows only" behaviour plus anonymised low-volume queries means Hindi and Hinglish long-tail will be under-reported in query-level rows; page-level totals remain complete, so compare page-level impressions against the sum of query rows to estimate the hidden share.
- Auth: for a pipeline on Render, a service account is the low-friction option (add the service-account email as a user on the Search Console property; no refresh-token dance). OAuth user consent is needed only if you want to act as a human user. The URL Inspection reference did not state service-account support explicitly, but it uses the same scopes as Search Analytics.

### Gaps
- Could not fetch the Search Console help article text that states the 16-month retention and query-anonymisation thresholds directly; retention is cited via the GA4 help page and a practitioner article instead.
- No official statement found on how many "anonymised" rows are dropped per query; practitioner lore only.
- No source found quantifying typical week-1 to week-4 impression curves for new articles; this is left as inference.

## Key Question 2: Google Trends (official API alpha, pytrends in 2026, export, related and rising for geo=IN, release timing)

### Takeaway
As of August 2026 Google's official Trends API is still an application-gated alpha with no related or rising queries, pytrends is archived and broken, and the practical options are the maintained `trendspy` scraper (free, ToS risk, 429s) or paid passthroughs (DataForSEO Trends, SerpApi Trends) that do expose rising queries for India.

### Cited Findings
- Google announced the Trends API alpha on 24 July 2025; access is application-based and prioritises developers with specific use cases who can implement soon and give feedback. — [Google Search Central blog, July 2025](https://developers.google.com/search/blog/2025/07/trends-api); summary of the application criteria via [ScrapeBadger](https://scrapebadger.com/blog/does-google-trends-have-an-api-what-to-use-in-2026)
- Alpha capabilities as reported: a rolling five-year window, aggregation by day, week, month or year, geographic breakdown by region and sub-region, and a consistent scaling method that lets you join and compare data across requests (values are relative interest, not absolute counts). — via [ScrapeBadger](https://scrapebadger.com/blog/does-google-trends-have-an-api-what-to-use-in-2026) and [ScrapeGraphAI](https://scrapegraphai.com/blog/google-trends-api)
- Status one year on: "Nearly a year later it is still an alpha, still allowlisted, still an application form"; a developer writing on 23 Aug 2026 says his application was not approved and that DataForSEO and SerpApi Trends endpoints cost roughly $50 to 75/month, uneconomical for checking 30 keywords weekly. — [dev.to, 2026-08-23](https://dev.to/radevicb/google-trends-still-has-no-api-in-2026-heres-what-i-use-instead-1840)
- pytrends: repository archived 17 April 2025 (read-only), last release April 2023; it 429s on first call because of stale session handling. Suggested drop-in: `pip install trendspy`. — [apiserpent](https://apiserpent.com/blog/pytrends-dead-google-trends-data-2026); [dev.to](https://dev.to/esteban_ortega/pytrends-is-dead-heres-how-to-get-google-trends-data-in-2026-1a18)
- trendspy (PyPI) exposes `related_queries`, `related_topics`, `interest_by_region` and a `geo()` lookup for location codes such as IN — [PyPI trendspy](https://pypi.org/project/trendspy); `trendspyg` adds a CLI, an MCP server and a local history archive — [GitHub flack0x/trendspyg](https://github.com/flack0x/trendspyg)
- DataForSEO Google Trends Explore (live): `POST https://api.dataforseo.com/v3/keywords_data/google_trends/explore/live`; max 5 keywords per request (100 chars each); `location_code` (India 2356) or `location_name`; `time_range` presets from `past_hour` to `past_5_years` and `2004_present`, or `date_from`/`date_to`; `type` `web, news, youtube, images, froogle`; `item_types` `google_trends_graph, google_trends_map, google_trends_topics_list, google_trends_queries_list` (lists are single-keyword only); returns Top (0 to 100 relative) and Rising (percentage increase) queries; limits 250 live tasks/minute and a 500K daily cap on Trends requests across all DataForSEO users "due to the limited capacity of the Google Trends service". — [DataForSEO docs](https://docs.dataforseo.com/v3/keywords_data/google_trends/explore/live/)
- SerpApi Google Trends: `q` up to 5 terms (comma separated, 100 chars each), `geo`, `hl`, `region` (COUNTRY, REGION, DMA, CITY), `data_type` `TIMESERIES, GEO_MAP, GEO_MAP_0, RELATED_TOPICS, RELATED_QUERIES` (related lists single-query only), `date` presets or yyyy-mm-dd ranges, `tz`, `cat`, `gprop` (images, news, froogle, youtube); 1-hour cache, cached searches free. — [SerpApi Google Trends API](https://serpapi.com/google-trends-api)

### Inferences
- For release-timing content (e.g. a Jordan retro dropping in India), the useful signals are `RELATED_QUERIES` rising for the model name with `geo=IN` over `past_90_days`, plus the YouTube `type` for hype. Both DataForSEO and SerpApi support exactly that; the official alpha does not (no related/rising reported in any source).
- Sample DataForSEO call (constructed from the documented fields):
  ```ts
  await fetch('https://api.dataforseo.com/v3/keywords_data/google_trends/explore/live', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64'), 'Content-Type': 'application/json' },
    body: JSON.stringify([{ keywords: ['air jordan 1 low'], location_code: 2356, language_code: 'en',
      time_range: 'past_90_days', type: 'web', item_types: ['google_trends_graph', 'google_trends_queries_list'] }])
  });
  ```
- trends.google.com still offers manual CSV export per chart from the UI; this is fine for one-off checks but not for a pipeline.
- Auth: DataForSEO and SerpApi are API-key only (no OAuth), which suits Render cron jobs. trendspy needs no key but will need proxy rotation and backoff to survive 429s, and scraping Trends is against Google's ToS.

### Gaps
- Could not fetch the body of Google's official alpha announcement (the fetch returned the blog index); alpha feature list is cited through secondary write-ups that quote it.
- No published per-task price for DataForSEO Trends was visible on its pricing hub pages (the pages render prices client-side); only the "$50 minimum payment" was readable.
- No data found on how good Google Trends regional data is for Indian sub-regions beyond "region/sub-region" being available.

## Key Question 3: Google Ads Keyword Planner API (KeywordPlanIdeaService)

### Takeaway
The Keyword Planner API is free but the auth path is heavy (Google Ads account, developer token with Basic access, brand verification, OAuth) and keyword-planning calls are blocked at Explorer level; volumes are rounded and low-spend accounts have historically been bucketed into ranges. DataForSEO's Google Ads endpoint resells the same data with API-key auth for $0.075 per request of up to 1,000 keywords.

### Cited Findings
- `KeywordPlanIdeaService.GenerateKeywordIdeas`: requires `customer_id`, `language` as `languageConstants/{id}`, `geo_target_constants` (up to 10, or empty for all), one seed type (`keyword_seed` 1 to 20 keywords, `url_seed`, `keyword_and_url_seed`, or `site_seed` which can return up to 250,000 ideas) and `keyword_plan_network` (`GOOGLE_SEARCH` or `GOOGLE_SEARCH_AND_PARTNERS`); results carry `text` and `keyword_idea_metrics` (average monthly searches, competition, top-of-page bid percentiles); pagination up to 10,000 per page via `next_page_token`; no KeywordPlan resource is needed. — [Google Ads API: Generate keyword ideas](https://developers.google.com/google-ads/api/docs/keyword-planning/generate-keyword-ideas)
- Access levels: Test (test accounts only, 15,000 ops/day, automatic); Explorer (test and production, 2,880 ops/day on production, restricts account creation, user management, planning tools and billing); Basic (15,000 ops/day, requires brand verification, may be auto-upgraded after application); Standard (unlimited ops, manual audit, typically 10 business days). KeywordPlanIdeaService is restricted at Explorer and available from Basic. — [Google Ads API access levels](https://developers.google.com/google-ads/api/docs/access-levels)
- Rounded ranges: Google confirmed in 2016 that Keyword Planner shows ranges (0, 1-100, 100-1K, 1K-10K, 10K-100K, 100K-1M, 1M+) for lower-spend accounts, and that heavy requesting can also trigger ranged data. — [Search Engine Land, 2016](https://searchengineland.com/google-officially-throttling-keyword-planner-data-low-spending-adwords-accounts-255795); the API field is `avgMonthlySearches` and returns approximate volume — [Adverity connector reference](https://docs.adverity.com/reference/connectors/connector-google-ads-keyword-planner.html)
- `KeywordPlanHistoricalMetrics` (REST reference) exists for exact-list lookups via `GenerateKeywordHistoricalMetrics`. — [Google Ads API REST reference](https://developers.google.cn/google-ads/api/rest/reference/rest/v17/KeywordPlanHistoricalMetrics)
- Resource-name formats `languageConstants/{criterion_id}` and `geoTargetConstants/{criterion_id}` — [GeoTargetConstant reference](https://developers.google.com/google-ads/api/reference/rpc/v22/GeoTargetConstant)
- DataForSEO's resold Google Ads search volume: `cost` 0.075 per request in the example response, up to 1,000 keywords per request, returns search_volume, cpc, competition and competition_index, low/high top-of-page bid, 12 months of `monthly_searches`; `search_partners` flag; "no more than 12 requests per minute per account using Google Ads Live endpoints"; language_code `hi` supported; no Google Ads account needed on your side. — [DataForSEO Google Ads search volume docs](https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live/)

### Inferences
- India's geo criterion ID is 2356 (DataForSEO uses Google's geotarget IDs and lists 2356 for India in its Labs docs); English is 1000 and Hindi 1023 in Google's language table. Verify both against Google's downloadable geotargets CSV and language codes page before hardcoding; the summariser of the DataForSEO Ads page returned "2040" for India, which looks like an extraction error.
- Cost: $0 in Google fees, but the effective cost is set-up time (Ads account + manager account, developer token, Basic-access application with brand verification, OAuth refresh token stored on Render). For a two-person team, DataForSEO at $0.075 per 1,000 keywords is cheaper than that engineering time unless you already run Ads.
- Because planner volumes are 12-month averages rounded to buckets, they are poor for sneaker drops (spiky demand). Use them for evergreen head terms ("nike dunk low price in india") and use Trends/autocomplete for drop-timed content.

### Gaps
- Could not fetch Google's own list of language/geo criterion IDs (page too large; only TOC returned), so 2356/1000/1023 are flagged for verification.
- No current (2025-2026) official statement found on whether Basic-access API users still receive bucketed volumes; the bucketing evidence is from 2016 and connector docs.
- No per-day quota specific to GenerateKeywordIdeas found beyond the general operations limits.

## Key Question 4: Paid SERP and keyword APIs (DataForSEO, Semrush, Ahrefs, Moz, SE Ranking, Serper, SerpApi, ValueSERP/Scale SERP, Keywords Everywhere, Mangools, Ubersuggest)

### Takeaway
For a low budget the clear winners are DataForSEO ($50 minimum, pay-as-you-go, India + Hindi, exposes PAA, autocomplete, Trends, Labs keyword ideas with intent) and Serper ($50 for 50K SERPs with `peopleAlsoAsk` and `relatedSearches`, 6-month expiry). Semrush and Ahrefs APIs start at $129 to $549/month plus unpublished unit pricing; Moz, SE Ranking and Keywords Everywhere sit in between and are workable for volume lookups.

### Cited Findings
**DataForSEO (fetched 2026-10-07)**
- Pay-as-you-go, "the minimum payment amount is $50". — [DataForSEO pricing](https://dataforseo.com/pricing)
- Google Organic SERP (live advanced): up to 2,000 API calls per minute, one task per live call; `depth` default 10, max 200; "Your account will be billed per each SERP containing up to 10 results"; `people_also_ask_click_depth` 1 to 4 at "$0.00015 extra for each click"; `device` desktop/mobile; returns 36+ item types including organic, paid, featured_snippet, people_also_ask, related_searches, knowledge_graph, local_pack, video, shopping. — [DataForSEO SERP docs](https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/)
- Per-1,000 SERP price as quoted by a third party: $0.60 standard queue, $2.00 live. — via [apiserpent, 2026-02-21 updated 2026-08-12](https://apiserpent.com/blog/serp-api-pricing-comparison)
- Google Autocomplete (live advanced): example `cost` 0.002 per request; `keyword` up to 700 chars, `location_code`, `language_code`, `cursor_pointer`, `client` (chrome, gws-wiz, youtube, gws-wiz-serp, safari, firefox, others); items carry `suggestion, search_query_url, highlighted, thumbnail_url, relevance (chrome clients only)`; 2,000 calls/min. — [DataForSEO Autocomplete docs](https://docs.dataforseo.com/v3/serp/google/autocomplete/live/advanced/)
- Google Ads search volume: `cost` 0.075 per request, up to 1,000 keywords, 12 requests/min. — [DataForSEO docs](https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live/)
- DataForSEO Labs Keyword Suggestions: example `cost` 0.0101; `limit` max 1,000 (default 100), `offset_token` for >10,000; up to 8 filters; per-keyword `keyword_info` (search_volume, cpc, competition_level, monthly_searches), `keyword_properties`, `search_intent_info` (informational/navigational/commercial/transactional), `serp_info`, optional `keyword_info_normalized_with_clickstream`; India `location_code` 2356 with Hindi and English listed via the Locations and Languages endpoint. — [DataForSEO Labs docs](https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live/)

**Semrush**
- Legacy Business plan $499.95/month is gone from the pricing page; the current Advanced plan is $549/month ($455.67/month annual) and is the tier that unlocks API access; API units are sold separately and "after upgrading ... the number of units will still be zero"; Semrush does not publish a per-unit dollar price (third-party estimate ~$50 per million, unverified); smallest unit package 2,000,000 units; Domain Organic Search Keywords costs 10 units per line (current) and 50 per line (historical). — via [ryandoser.com, 2026-08-23 updated 2026-09-30](https://ryandoser.com/semrush-api-pricing/)
- Rate limit reported as 10 API units per second; "The option to purchase API units is only available for Business users". — via [docket.io](https://docket.io/resources/research/semrush-pricing) and [requestly](https://requestly.com/api-explorer/semrush/)
- Analytics API report families include Keyword Overview (all databases / one database), Batch Keyword Overview, Related Keywords, Broad Match Keyword, Phrase questions, Keyword Difficulty. — [Semrush Analytics API basics](https://developer.semrush.com/api/v3/analytics/basic-docs/)
- India database: Semrush announced its Indian database with 6,000,000 keywords from Google India, updated daily/weekly/monthly by popularity (undated news post). — [Semrush news](https://www.semrush.com/news/265525-our-indian-database-is-available/); Semrush now claims 27.6B keywords across 142 databases — via [electroiq](https://electroiq.com/stats/semrush-statistics/)

**Ahrefs (fetched 2026-10-07)**
- Plans: Lite $129/mo, Standard $249/mo, Advanced $449/mo, Enterprise $1,499/mo (annual commitment); "API and MCP access" is listed on Lite, Standard and Advanced; Enterprise has "Uncapped API access" and "Custom API Endpoints"; tracked keywords 750 / 2,000 / 5,000. — [Ahrefs pricing](https://ahrefs.com/pricing)
- API units per plan: Lite 200,000, Standard 800,000, Advanced 2,000,000, Enterprise 4,000,000 or custom; "each request costs at least 50 units"; a request pulling 100 backlinks with six fields costs 600 units; the $29 Starter tier has no API. — via [ryandoser.com, 2026-08-22 updated 2026-09-30](https://ryandoser.com/ahrefs-api-pricing/); contradicted by another source quoting Lite 100,000 and Standard 400,000 units — via [studiomeyer.io](https://studiomeyer.io/en/blog/ahrefs-api-units-cost)

**Moz**
- API access is bundled with Moz Pro: Standard $99/mo ($79 annual) includes 10,000 rows/month, Medium $179/mo ($143 annual) 35,000 rows/month; standalone API tiers are quoted as Starter $20 to $75, Growth $125 to $500, Advanced $2,000 (4M rows), Enterprise $10,000 (40M rows), row-based billing with overage. — via [aionx](https://aionx.co/ai-comparisons/moz-pro-pricing-guide/) and [toolsurf](https://www.toolsurf.com/moz-api-pricing-2025-plans-access-tiers-best-affordable-options-2026-plans-features-best-deals-compared/) (moz.com blocked direct fetch)

**SE Ranking (fetched 2026-10-07)**
- Core $129/mo ($103.20 annual): 2,000 keywords tracked daily, 25K API credits/month; Growth $279/mo ($223.20 annual): 5,000 keywords, 100K API credits; standalone API plan from $179/mo annual; Enterprise custom. — [SE Ranking pricing](https://seranking.com/pricing.html)
- Data API pay-as-you-go $50 per 250,000 credits with 100,000 free credits and no card; returns positions, ranking landing page, SERP-feature presence, volume, competitor positions; "credits consumed per check not published". — via [searlo.tech, verified 2026-08-26](https://searlo.tech/blog/best-rank-tracker-api-2026)
- Keyword research endpoints accept ISO 3166-1 alpha-2 country codes and up to 5,000 keywords per POST. — via [SE Ranking Data API quickstart](https://seranking.com/api/data/quickstart-guide)

**Serper.dev (fetched 2026-10-07)**
- 2,500 free queries, no card. Packs: Starter $50 = 50,000 credits ($1.00/1K, 50 qps); Standard $375 = 500,000 ($0.75/1K, 100 qps); Scale $1,250 = 2.5M ($0.50/1K, 200 qps); Ultimate $3,750 = 12.5M ($0.30/1K, 300 qps); all valid 6 months; credits deducted only on successful responses; country and language selectable. Endpoints: Search, Images, News, Maps, Places, Videos, Shopping, Scholar, Patents, Autocomplete; search JSON includes `peopleAlsoAsk` and `relatedSearches`. — [serper.dev](https://serper.dev/)
- Requesting 11 to 100 results costs 2 credits per query. — via [apiserpent](https://apiserpent.com/blog/serper-pricing-credits-explained)

**SerpApi (fetched 2026-10-07)**
- Free 250 searches/month; Developer $75/mo 5,000 (1,000/hr); Production $150/mo 15,000 (3,000/hr); Big Data $275/mo 30,000 (6,000/hr); enterprise via contact; downgrades move leftover searches to "Extra Credits". — [SerpApi pricing](https://serpapi.com/pricing). A third party also lists a $25/1K entry tier — via [apiserpent](https://apiserpent.com/blog/serp-api-pricing-comparison) (not visible on the fetched pricing page).
- Google Autocomplete API: `q`, `gl`, `hl`, `cp`, `client` (Chrome, Firefox, Safari, YouTube, gws-wiz); output `suggestions[].value, relevance, type`; YouTube suggestions via `client`. — [SerpApi Google Autocomplete API](https://serpapi.com/google-autocomplete-api)

**ValueSERP and Scale SERP (Traject Data, fetched 2026-10-07)**
- ValueSERP (annual billing, 10% off): Starter $50/mo 25,000 credits (250/min), Professional $240/mo 200,000 (1,000/min), Enterprise $1,000/mo 1,000,000 (1,500/min); free trial without card; JSON/HTML/CSV output. — [Traject Data ValueSERP pricing](https://trajectdata.com/pricing/value-serp-api)
- Scale SERP (annual, 20% off): $66/mo 10,000 credits (overage $0.0118), $199/mo 50,000 ($0.00796), $599/mo 250,000 ($0.004792); 125 free searches/month, no card; location down to postal code; desktop/mobile/tablet. — [Traject Data Scale SERP pricing](https://trajectdata.com/pricing/scale-serp-api)

**Keywords Everywhere (fetched 2026-10-07)**
- Credits: 200,000 for $80 ($0.40/1K), 500,000 for $150, 2M for $500, 6M for $1,300, 15M for $2,700, 50M for $8,000; "One credit gets you the volume, cpc, competition & 12 month trend data for one keyword"; credits valid one year; features include related keywords, People Also Search For, long-tail, 12-month trend. — [Keywords Everywhere credits](https://keywordseverywhere.com/credits.html)
- API: `POST https://api.keywordseverywhere.com/v1/get_keyword_data`, Bearer token, parameters `dataSource`, `country`, `currency`, `kw[]` (up to 100 keywords per call), 1 credit per keyword result, response includes credits left. — via [Keywords Everywhere API docs mirror](https://glama.ai/mcp/servers/@hithereiamaliff/mcp-keywords-everywhere/blob/c026be8eaab8fcdb8c7acb8f2833650f50cd2fc7/References/4%20keyword-data-api-docs.md); official docs page at [keywordseverywhere.com/api-documentation.html](https://keywordseverywhere.com/api-documentation.html) (renders client-side; could not be read)

**Mangools**
- Public REST API documented at apidocs.mangools.com; tokens come with Basic, Premium or Agency plans; KWFinder, SERPChecker and SERPWatcher have first-class coverage; quotas are plan-tied and meaningful volume needs quote-based private access; no SDKs, no webhooks, no OpenAPI spec. — via [supergood.ai API report card](https://supergood.ai/api-report-card/mangools)

**Ubersuggest**
- Reported as having no public API and none planned; one integration guide claims paid plans expose `https://app.neilpatel.com/api/v2/` endpoints (`/keywords/suggestions`, `/keywords/overview`, `/traffic/url`, `/traffic/keywords`) documented inside the account dashboard. — via [supergood.ai](https://supergood.ai/api-report-card/ubersuggest) and [rapidevelopers](https://www.rapidevelopers.com/md/replit-integration/ubersuggest) (conflicting, low-confidence)

### Inferences
- Budget stack for India: DataForSEO for volume (Google Ads resale, Hindi `hi` + `location_code` 2356), Labs keyword suggestions with intent, autocomplete and Trends; Serper for SERP + PAA + related searches at $1/1K. A monthly spend of roughly $50 to $100 covers tens of thousands of SERPs and tens of thousands of keyword volume lookups.
- Sample Serper call (constructed from documented parameters; `gl`/`hl` are the standard Google params the page says are selectable):
  ```ts
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST', headers: { 'X-API-KEY': process.env.SERPER_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: 'nike dunk low panda price in india', gl: 'in', hl: 'en', num: 10 }) });
  const { organic, peopleAlsoAsk, relatedSearches } = await r.json();
  ```
- Semrush and Ahrefs are the deepest India keyword databases but the entry price ($129 to $549/month plus unit packs) is hard to justify until the pipeline proves out; their unit pricing is opaque enough that you cannot forecast cost.
- All of these are API-key or basic-auth (DataForSEO uses HTTP Basic with login:password); none require OAuth, so they slot into Render cron jobs without token refresh logic.
- ToS: DataForSEO, Serper, SerpApi, ValueSERP and Scale SERP all scrape Google on your behalf; the ToS risk sits with the vendor, not with your IPs. Semrush, Ahrefs, Moz, Keywords Everywhere and SE Ranking sell their own databases.

### Gaps
- DataForSEO's pricing hub pages render prices client-side, so the organic SERP per-task price was taken from a dated third-party comparison; confirm in the DataForSEO dashboard before budgeting.
- Semrush per-unit pricing is unpublished; no official figure exists.
- Ahrefs unit allowances conflict between two third-party sources (200K vs 100K for Lite); Ahrefs' own pricing page does not list units.
- Moz's own pricing page could not be fetched; all Moz figures are second-hand.
- Keywords Everywhere India quality: country `in` is supported but no source describes coverage depth for Hindi.
- Mangools and Ubersuggest API pricing not published; Mangools private API is quote-based.
- Ahrefs India database size and whether its API exposes "questions"/PAA were not found.

## Key Question 5: Free and scrapable sources (Google autocomplete, YouTube autocomplete, Bing Webmaster keyword API, Reddit, Amazon/Flipkart/Myntra autocomplete)

### Takeaway
Google and YouTube autocomplete are free, undocumented GET endpoints that work with `gl=in&hl=en|hi` and are the cheapest demand signal for sneaker names, but they are unofficial and blockable; Bing Webmaster Tools has a real, keyed keyword research API with country and language parameters; Reddit's free tier bars commercial use; Indian e-commerce autocomplete has no documented endpoints and carries ToS risk.

### Cited Findings
- Google autocomplete: `GET https://suggestqueries.google.com/complete/search?client=firefox&q=...` returns JSON like `["apple", ["apple store", "apple watch", ...]]`; `client` sets the format, `q` the query, `cp` the cursor position (0 = before the query, default end of query); the endpoint is undocumented but "sufficiently stable and widely used in SEO". — via [Habr article on the Query Suggest API](https://habr.com/ru/articles/988902/) and [GrowthRocks glossary](https://intl.growthrocks.com/glossary/growth-glossary/googles-query-suggest-api); the `output=firefox` variant is shown by [Labnol, 2011](https://www.labnol.org/internet/google-autocomplete/20434); SerpApi's open-source engine code shows the same endpoint and `gl`/`hl` handling — [serpapi deno source](https://deno.land/x/serpapi@1.1.1/src/engines/google_autocomplete.ts?source)
- YouTube autocomplete: same host with `client=youtube&ds=yt&q=...`; `ds=yt` switches the data source to YouTube. — via [SeoTools for Excel community](https://community.seotoolsforexcel.com/t/any-way-to-scrape-youtube-autocomplete/454) and [youtube-autocomplete npm package](https://npmjs.com/youtube-autocomplete); Oxylabs added a YouTube Autocomplete scraping source in October 2025 — [Oxylabs changelog](https://developers.oxylabs.io/changelog/october-2025/youtube-autocomplete-scraping-source)
- DataForSEO and SerpApi both offer `client=youtube` autocomplete as a paid wrapper (see Question 4). — [DataForSEO Autocomplete docs](https://docs.dataforseo.com/v3/serp/google/autocomplete/live/advanced/); [SerpApi Autocomplete](https://serpapi.com/google-autocomplete-api)
- Bing Webmaster Tools API access: OAuth 2.0 (recommended) or an API key generated in Settings > API Access; one API key per user, usable across all verified sites. — [Microsoft Learn: Getting access](https://learn.microsoft.com/en-us/bingwebmaster/getting-access)
- Bing keyword methods: `GetKeyword(string q, string country, string language, DateTime startDate, DateTime endDate)` returns a `Keyword` ("Get keyword impressions for selected period"); `GetRelatedKeywords` has the same signature; `GetKeywordStats(q, country, language)` returns historical statistics; site-performance methods include `GetQueryStats`, `GetPageQueryStats`, `GetQueryPageStats`, `GetQueryPageDetailStats`, `GetRankAndTrafficStats`, `GetQueryTrafficStats`, `GetUrlTrafficInfo`; submission methods `SubmitUrl`, `SubmitUrlBatch`, `GetUrlSubmissionQuota`. — [IWebmasterApi interface](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi?view=bing-webmaster-dotnet); [GetKeyword method](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.getkeyword?view=bing-webmaster-dotnet)
- Reddit Data API: free tier 100 queries/min with OAuth (10 without), no commercial use; self-service registration closed, new OAuth tokens need manual approval (2 to 4 weeks); commercial access about $0.24 per 1,000 calls, with a quoted $12,000/month for up to 50M calls. — via [Octolens](https://octolens.com/blog/reddit-api-pricing) and [Techloy](https://www.techloy.com/reddit-api-pricing-in-2026-complete-guide-for-developers-and-businesses/)
- Indian e-commerce: no public documentation of Flipkart, Myntra or Amazon.in autosuggest endpoints was found; the ecosystem consists of third-party scrapers (several Apify Flipkart search actors, a Myntra product scraper) and Oxylabs' Flipkart target. — [Apify Flipkart search scraper](https://apify.com/automation-hub/flipkart-search-scrapper.md); [Oxylabs Flipkart target](https://developers.oxylabs.io/api-targets/e-commerce/flipkart)

### Inferences
- Sample free autocomplete pull (constructed; parameters as documented above):
  ```ts
  const u = new URL('https://suggestqueries.google.com/complete/search');
  u.search = new URLSearchParams({ client: 'firefox', q: 'air jordan 1 ', gl: 'in', hl: 'en' }).toString();
  const [, suggestions] = await (await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
  // YouTube: add ds=yt and client=youtube
  ```
  Expanding "a..z" and "0..9" suffixes plus Hindi seeds (`hl=hi`) gives a few hundred suggestions per model name for free. Add jitter (1 to 3 s) and a per-day cap; the endpoint is not covered by any Google API ToS, so treat it as "may break or block any day" and keep the DataForSEO autocomplete ($0.002/call) as fallback.
- Bing Webmaster's `GetKeyword`/`GetRelatedKeywords` with `country="in"` and `language="en"` is the only free, keyed keyword-volume API with India parameters; volumes are Bing impressions (a small share of Indian search), so use it for relative ranking of terms rather than absolute volume. Auth is a static API key, ideal for Render.
- Reddit search is usable as a qualitative demand signal (which models people ask about in r/SneakersIndia) but the free tier explicitly bars commercial use, so a company pipeline should either stay on manual exports or budget for commercial access.
- Scraping Flipkart/Myntra/Amazon.in autosuggest means reverse-engineering private XHR endpoints that each site's ToS prohibits; Akamai-style blocking (already seen on Myntra/AJIO in this project's scraper) applies. Prefer product-intent terms from Google Shopping/autocomplete instead.

### Gaps
- No official Google documentation exists for `suggestqueries.google.com`; rate limits and blocking thresholds are anecdotal.
- No source quantifies Bing's share of Indian search or the quality of Bing keyword volumes for India.
- Bing API country/language accepted values were not listed on the method pages (strings only).
- No documented Flipkart/Myntra/Amazon.in autosuggest endpoint found, by design of those platforms.

## Key Question 6: AlsoAsked, AnswerThePublic, Keyword Insights and India-specific tools

### Takeaway
AlsoAsked is the cheapest PAA-tree tool with an API ($59/month Pro), Keyword Insights bundles clustering with an API at $145/month, and AnswerThePublic ($99 to $199/month) has no API evidence; no dedicated India-only keyword tool with an API surfaced, so India coverage comes from the general tools' `in` databases.

### Cited Findings
- AlsoAsked: Free 3 searches/day; Basic $12/month for 100 searches with full depth, CSV/PNG export and history; Lite $29/month for 300 searches with priority processing; Pro $59/month for unlimited searches, API access and bulk search; no annual discount listed. — via [toolradar](https://toolradar.com/tools/alsoasked/pricing)
- AnswerThePublic: pricing starts at $99/month; Expert plan $199/month with deep keyword research, competitive insights, content planning and export; it is built on search-engine autocomplete data. — via [Capterra](https://www.capterra.com/p/230308/AnswerThePublic/pricing/) and [SoftwareSuggest](https://www.softwaresuggest.com/answerthepublic/pricing)
- Keyword Insights: Basic $58/month; Professional $145/month includes a public API; the product generates and clusters keywords. — via [Capterra](https://www.capterra.com/p/230999/Keyword-Insights/)
- PAA can also be pulled directly from SERP APIs: Serper returns `peopleAlsoAsk` in every search response — [serper.dev](https://serper.dev/); DataForSEO returns `people_also_ask` items and can expand the PAA tree with `people_also_ask_click_depth` 1 to 4 at $0.00015 per click — [DataForSEO SERP docs](https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/)

### Inferences
- For a scripted pipeline, AlsoAsked's API at $59/month is only worth it if you want the multi-level PAA tree per seed; the same tree can be built for fractions of a cent per seed from DataForSEO (`people_also_ask_click_depth: 2`) or by issuing follow-up Serper queries for each PAA question.
- AnswerThePublic appears to be UI-first; nothing in the sources indicates an API, so treat it as unavailable for automation.
- "India-specific" keyword tools did not surface; the India signal comes from `gl=in`/`location_code 2356`/`db=in` in the general tools plus Hindi via `hl=hi` or `language_code hi`.

### Gaps
- Could not fetch alsoasked.com directly; pricing and API inclusion are from a 2026 aggregator.
- No source confirms whether AlsoAsked supports India as a region in the API (the UI supports regions, but this was not verified).
- No evidence of an AnswerThePublic API was found; absence of evidence, not confirmed absence.
- No India-only keyword research tool with an API was found.

## Key Question 7: Scoring keyword opportunity and clustering keywords into topics (open-source approaches)

### Takeaway
Practitioners score opportunity as some combination of log-scaled volume, inverted difficulty, intent weight and relevance, with no universal formula; clustering is best done by SERP overlap (shared top-10 URLs) with embeddings as a pre-filter, and there are open-source implementations (OpenSEO's skill, an RBO-based cluster finder, OnCrawl's Python walkthrough).

### Cited Findings
- Rankability's Opportunity score is 0 to 100 and "combines search volume, weighted on a logarithmic scale; keyword difficulty, with easier terms receiving more weight; intent, with transactional and commercial weighted more heavily than informational or navigational; CPC as an additional commercial-value signal", and is explicitly "not a forecast of traffic". — [Rankability help](https://help.rankability.com/researcher/keyword-opportunities-and-scoring)
- Alternative formulas in tooling: `(Volume x Intent Value) / Difficulty` and `(Volume x (1 - Difficulty/100)) x Intent Multiplier`; "There is no universal formula, as every tool weights factors differently." — via [SEO Machine opportunity scorer](https://www.mintlify.com/TheCraigHewitt/seomachine/api/opportunity-scorer) and [rankai guide](https://rankai.ai/articles/keyword-opportunity-guide)
- OpenSEO (every-app/open-seo) clustering: cosine similarity of text embeddings with SERP-intent validation in a three-step pipeline; SERP-overlap thresholds: 7 to 10 shared top results merge into one target page, 4 to 6 group under the same spoke cluster, 2 to 3 go to adjacent clusters, 0 to 1 to different clusters; it designs hub-and-spoke clusters with internal-link matrices. — [OpenSEO algorithm note](https://instagit.com/every-app/open-seo/keyword-clustering-algorithm-similarity-metrics/)
- `thedahv/keyword-cluster-finder` is a Go port of a Python rank-biased-overlap (RBO) implementation for SERP structures, crediting `dlukes/rbo`. — [pkg.go.dev](https://beta.pkg.go.dev/github.com/thedahv/keyword-cluster-finder)
- OnCrawl's walkthrough clusters keywords in Python using SERP results from a SERP API (shared ranking URLs define the cluster). — [OnCrawl](https://www.oncrawl.com/on-page-seo/keyword-clustering-using-python-serp-api/); Search Engine Journal has a related "automate search intent clustering" method — [SEJ](https://www.searchenginejournal.com/automate-search-intent-clustering/413760/); BrightonSEO October 2024 talk "keyword clustering with SERP similarity" — [BrightonSEO](https://brightonseo.com/talks/2024-mustknow-automations-keyword-clustering-with-serp-similarity-and-more)
- Dependencies seen in open clustering skills: scikit-learn, sentence-transformers, pandas. — via [clawfu keyword-clusterer skill](https://skillselion.com/skills/guia-matthieu/clawfu-skills/keyword-clusterer)
- DataForSEO Labs returns `search_intent_info` (informational/navigational/commercial/transactional) per keyword and `serp_info` item types, which feed intent weighting without a separate classifier. — [DataForSEO Labs docs](https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live/)

### Inferences
- A workable score for a sneaker blog: `score = log10(volume_in + 10) * intent_w * relevance * (1 - kd/100) * freshness`, where `intent_w` is 1.0 informational / 1.3 commercial / 1.5 transactional (blog can still capture transactional via store links), `relevance` is 0 to 1 from an embedding similarity to your catalogue brands (Nike, Jordan, Adidas, New Balance, Crocs), `kd` is DataForSEO/Semrush difficulty or a proxy (count of DR>70 domains in Serper top 10), and `freshness` boosts terms with rising Trends or a drop date within 30 days. Add a GSC bonus when you already rank 8 to 25 (striking distance).
- Clustering pipeline on a budget: embed candidate keywords (any local sentence-transformer, free) to pre-group; for each pre-group fetch Serper top-10 for India (`gl=in`) at $1/1K; merge keywords sharing >= 4 of 10 URLs into one article target, >= 7 into one H1. 1,000 keywords clusters for about $1 of SERP calls.
- Node option: run embeddings via a small HTTP service or use the OpenSEO thresholds with Serper output; the RBO Go port is callable as a CLI from a Node script if you prefer rank-aware overlap.

### Gaps
- No peer-reviewed or large-sample evidence that any specific weighting predicts traffic; all formulas are vendor heuristics.
- Did not locate a maintained TypeScript/Node clustering library; Python and Go dominate.
- Keyword difficulty for Hindi queries is thin in every tool; no source addresses it.

## Key Question 8: Rank tracking on a budget (GSC-only vs SE Ranking, Nightwatch, Wincher, AccuRanker, SERPWatcher) with India locations and API access

### Takeaway
GSC gives free average position per query/page for India with no fixed keyword cap but no exact daily SERP position; the cheapest trackers with API access are SE Ranking Core ($129/month, 2,000 keywords, 25K API credits) and Nightwatch Professional (€159/month, 2,500 keywords); Wincher ($49 entry) and AccuRanker ($224 Professional) gate API access to higher tiers. A DIY tracker on Serper costs about $1 per 1,000 checks.

### Cited Findings
- SE Ranking Core $129/mo ($103.20 annual) tracks 2,000 keywords daily with 25K API credits/month; Growth $279/mo ($223.20 annual) 5,000 keywords, 100K API credits. — [SE Ranking pricing](https://seranking.com/pricing.html); third-party summary: about 6 cents per keyword/month on Core — via [spotsaas](https://www.spotsaas.com/blog/best-rank-tracker-tools)
- Nightwatch: Starter €79/mo (€948/yr) 500 keywords, no API; Professional €159/mo (€1,908/yr) 2,500 keywords, API included; Agency €399/mo 7,500 keywords; Enterprise 20,000+ custom; daily tracking; "107,000+ locations across 190+ countries, in any language"; 14-day trial, no card. — [Nightwatch pricing](https://nightwatch.io/pricing)
- Wincher: three tiers at 500 / 1,000 / 5,000 keywords, daily updates, API only on the highest tier, free trial. — [Wincher pricing](https://www.wincher.com/pricing); entry price quoted as $49/month for 500 keywords — via [distribb](https://distribb.io/blog/seo-rank-tracker)
- AccuRanker: Professional $224/mo (2,000 / 3,000 / 5,000 keyword options), Expert $764/mo (10,000 to 25,000) with "Unlimited read API", Enterprise adds "Unlimited write API", daily updates, 10% annual discount. — [AccuRanker pricing](https://www.accuranker.com/pricing/); a third-party roundup claims API "on all plans" at $249 — via [distribb](https://distribb.io/blog/seo-rank-tracker) (contradicted by the fetched pricing page)
- Mangools SERPWatcher is covered by the Mangools REST API on Basic/Premium/Agency plans. — via [supergood.ai](https://supergood.ai/api-report-card/mangools)
- SE Ranking's Data API returns position, ranking landing page, SERP-feature presence, volume and competitor positions, pay-as-you-go $50 per 250K credits, 100K free credits. — via [searlo.tech, 2026-08-26](https://searlo.tech/blog/best-rank-tracker-api-2026)
- GSC position is an average per impression across the date range, and the API returns only top rows. — [searchanalytics.query reference](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- Serper at $1.00 per 1,000 searches with 50 qps on the $50 pack, 6-month credit life. — [serper.dev](https://serper.dev/)

### Inferences
- Phase 1 (free): GSC-only. Daily pull of `date, page, query` with `country equals ind`; "rank" = average position. It covers every query you already rank for and needs no keyword list, but it cannot track a target keyword before you rank for it, has no competitor positions and blurs multiple URLs/positions into one average.
- Phase 2 (about $5 to $20/month): DIY tracker on Serper or DataForSEO standard queue ($0.60/1K): 300 target keywords x daily x 30 days = 9,000 checks = about $9 on Serper or about $5.40 on DataForSEO standard. Store rank of `snkrscart.com` and top-10 competitors per keyword for India (`gl=in`, optional `location` for Delhi/Mumbai). This beats every SaaS tracker on price for < 2,000 keywords and gives you competitor data free.
- Phase 3: SE Ranking Core if you want a UI, alerts and shared reports for non-engineers; it is the cheapest with API credits included.
- All trackers' APIs are key-based; GSC is OAuth/service account.

### Gaps
- None of the fetched pricing pages confirms Indian city-level locations explicitly (Nightwatch's "107,000+ locations" implies it); verify Delhi/Mumbai availability in each trial.
- Wincher's actual dollar prices did not render on the pricing page fetch; only tier structure was readable.
- SE Ranking credits consumed per rank check are not published, so API-only cost per keyword cannot be computed.

## Key Question 9: Google Discover and Google News performance via the GSC API

### Takeaway
Since October 2021 the Search Analytics API exposes Discover (`type: "discover"`) and Google News (`type: "googleNews"`) alongside web search, but Discover has no query or position dimensions, so Discover reporting is page-level clicks/impressions/CTR only.

### Cited Findings
- `type` accepts `discover`, `googleNews`, `news`, `image`, `video`, `web`; `aggregationType` includes `byNewsShowcasePanel`. — [searchanalytics.query reference](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- October 2021 announcement: the API added Discover and Google News via the `type` parameter and regex filters; "queries and positions are not supported by the Google Discover report. If an unsupported dimension is requested, the API will return an error message." — [Google Search Central blog, Oct 2021 (DE)](https://developers.google.com/search/blog/2021/10/search-analytics-discover-gnews?hl=de); English coverage via [Infidigit](https://www.infidigit.com/news/search-analytics-api-can-now-pull-data-from-google-news-discover-and-supports-regex/)

### Inferences
- For a sneaker blog, Discover is often the bigger traffic source than Search for news-style posts; pull `type: "discover"` with `dimensions: ["date","page"]` daily and `type: "googleNews"` with `["date","page","country"]`. Join to the web pull on (date, page) to compute a Discover share per article.
- Discover rows only exist for properties with enough Discover traffic (Google omits the report otherwise), so expect empty results until the site qualifies.

### Gaps
- Could not fetch the English version of the 2021 post body; the dimension restriction is cited from the German edition and a secondary summary.
- No source lists exactly which dimensions Google News supports (country and device appear in practice; not verified).

## Key Question 10: IndexNow and the Google Indexing API, eligibility and whether they speed up blog crawling

### Takeaway
The Google Indexing API is only for JobPosting and BroadcastEvent livestream pages, is spam-monitored and can be revoked for misuse (and one agency test suggests non-eligible submissions hurt); IndexNow is free and trivial but Google does not participate as of 2026, so it only speeds Bing, Yandex, Naver, Seznam and Yep. For Google, the levers remain sitemaps (`lastmod`), internal links and, manually, URL Inspection "request indexing".

### Cited Findings
- "The Indexing API can only be used to crawl pages with either `JobPosting` or `BroadcastEvent` embedded in a `VideoObject`"; default quota is 200 requests for onboarding, more on approval; requires a service account and Search Console ownership; "Any attempts to abuse the Indexing API, including the use of multiple accounts or other means to exceed usage quotas, may result in access being revoked." — [Google Indexing API quickstart](https://developers.google.com/search/apis/indexing-api/v3/quickstart)
- Google added an explicit spam warning to the Indexing API docs ("All submissions through the Indexing API undergo rigorous spam detection"). — [Search Engine Journal](https://www.searchenginejournal.com/google-adds-spam-warning-to-indexing-api-documentation/526839/); SEJ also reports that submitting non-job URLs signals ephemeral content and cites agency MiroMind's test in which disabling Indexing API submissions for non-job content saw impressions rise from about 3,000 to 6,000 and clicks up 300%. — [Search Engine Journal](https://www.searchenginejournal.com/google-indexing-api-warning/547521/)
- Google's own URL Inspection API "cannot test the indexability of a live URL" and does not request indexing. — [urlInspection.index.inspect](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect)
- IndexNow: notify engines on add/update/delete via `GET https://<searchengine>/indexnow?url=...&key=...` or JSON POST to `/indexnow` with up to 10,000 URLs per post; ownership proven by hosting `{key}.txt` at the root or via `keyLocation`; participating engines named: Bing, Yandex, Naver, Seznam, Yep; HTTP 429 means "Too Many Requests (potential Spam)". — [IndexNow documentation](https://www.indexnow.org/documentation)
- Google does not support IndexNow as of April 2026 despite a 2021 test announcement; it continues to rely on its own crawling. — via [blckalpaca knowledge base](https://blckalpaca.at/en/knowledge-base/seo-geo/technical-seo/indexnow-35-billion-urls-daily-without-google) and [meshworld](https://meshworld.in/blog/web-dev/seo/indexnow/search-engines-supporting-indexnow/)
- Bing Webmaster API also offers `SubmitUrlBatch` and `GetUrlSubmissionQuota`. — [IWebmasterApi interface](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi?view=bing-webmaster-dotnet)

### Inferences
- This project already pings IndexNow from `fixProductNames.ts`; keep doing it for blogs and drops (it is free and covers Bing/Yandex), but do not expect any Google effect.
- Do not wire blog posts into the Google Indexing API; it is ineligible, revocable and possibly harmful. For Google speed: keep `lastmod` accurate in the sitemap, link new posts from high-crawl pages (home, /drops), and use the URL Inspection API only to monitor `coverageState`/`lastCrawlTime` for new posts (2,000 inspections/day/property is ample for a daily check of the last 30 posts).
- Sample IndexNow batch (constructed from the documented POST body):
  ```ts
  await fetch('https://api.indexnow.org/indexnow', { method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'snkrscart.com', key: process.env.INDEXNOW_KEY,
      keyLocation: `https://snkrscart.com/${process.env.INDEXNOW_KEY}.txt`,
      urlList: ['https://snkrscart.com/blogs/new-post'] }) });
  ```

### Gaps
- The MiroMind result is a single-agency case study reported by SEJ, not a controlled public dataset.
- No official Google statement dated 2025-2026 on IndexNow was found; the "not supported as of April 2026" claim is from secondary SEO knowledge bases.
- No measurement found of how much faster Bing indexes IndexNow-submitted blog URLs versus sitemap discovery.
