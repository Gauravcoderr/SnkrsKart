# Sneaker fact sources, Indian price feeds, and structured data for drop / calendar / model-hub pages

All live fetches below were made on 2026-10-07 from a macOS curl with a desktop Chrome user agent (no proxy, no headless browser). "403" means the server refused that plain fetch; the project's `got-scraping` / ScrapingAnt / Puppeteer stack (see `backend/src/services/scraper/http.ts`) may still get through, but that was not tested here.

## 1. Sneaker data APIs and databases (coverage, India prices, cost, limits, legality)

### Takeaway
There is no single trustworthy, India-aware sneaker fact API. The only free, unauthenticated, brand-owned machine-readable source that returns Indian MRP, style codes and dates is Nike's `api.nike.com/product_feed/threads/v2` (works for marketplace `IN`, 15,299 threads on the web channel). Resale aggregators (StockX official API, KicksDB) are gated or paid and quote USD/EUR; the popular open-source Sneaks-API has been dead since Feb 2023; Wikidata coverage of sneaker models is thin and contains entity-resolution errors.

### Cited Findings

**StockX**
- StockX runs an official portal at developer.stockx.com; the Public API is v2.0.0, authenticates with an `x-api-key` header plus an OAuth 2.0 bearer token from StockX's Auth0 tenant, and is limited to "approved developers in the StockX Developer Program". Four API groups: Catalog ("search for catalog data, and request products to be added"), Listings, Batch (async bulk), Order. Rate limits exist ("2 limits") but numbers are not published in the public profile — [API Evangelist StockX profile](https://providers.apievangelist.com/providers/stockx/)
- Application review "typically take[s] 5-7 business days" and "access can be denied or revoked"; you need a StockX account, approved developer access, API key and app credentials — [umatechnology.org summary of the official API](https://umatechnology.org/how-to-scrape-stockx-data-with-the-official-api/) (secondary source; the portal itself is a client-rendered Next.js app: curl of `https://developer.stockx.com/` and `/portal/getting-started` returned HTTP 200 but only the text "StockX Developer Portal", `/portal/faq`, `/portal/pricing` returned 404, fetched 2026-10-07)
- StockX positions the API as a seller tool ("StockX Pro, StockX Scout App, and StockX Developers ... cross-platform selling, inventory management, and bulk selling") — [StockX seller program announcement](https://stockx.com/about/stockx-rolls-out-revamped-seller-program-introduces-lower-fees-for-global-seller-community)
- Scraping instead of the API: `https://stockx.com/air-jordan-1-retro-high-og-chicago-lost-and-found` returned HTTP 403 (76 KB challenge page, 0 JSON-LD blocks) to plain curl on 2026-10-07 (own fetch).

**GOAT**
- No official public developer API was found; community tools (Sneaks-API, commercial "SneakerAPI" wrappers) scrape GOAT/alias — [search summary citing Sneaks-API and SneakerAPI](https://github.com/druv5319/Sneaks-API). `https://www.goat.com/sneakers/air-jordan-1-retro-high-og-chicago-lost-and-found-dz5485-612` returned HTTP 403 to curl on 2026-10-07 (own fetch).

**KicksDB / kicks.dev** (fetched 2026-10-07)
- Aggregates "StockX, GOAT, and Flight Club" into "one unified API for the entire secondary sneaker and streetwear market". Fields shown: title, brand, model, SKU, gender, description, images/360 galleries, breadcrumbs, min/max/avg prices across sources, per-size variant prices, annual/quarterly highs and lows, sales counts, volatility, weekly orders, 15/30/60-day sales history — [kicks.dev](https://kicks.dev/)
- Pricing (monthly, ex-VAT): Free €0 for 1,000 req/mo, "basic API features", US market only, "3-day trial included"; Starter €29 for 50,000 req/mo (Standard + Unified APIs, global); Pro €79 for 250,000 req/mo (real-time APIs with SSE); Enterprise on request; Shopify Manager add-on €0.05/product. Standard API "supports 10+ currencies and global markets"; INR/India not named — [kicks.dev](https://kicks.dev/)

**TheSneakerDatabase (RapidAPI, tg4-solutions)**
- RapidAPI listing is client-rendered (WebFetch saw only "API Hub"). The maintained Node client documents the API shape: requires `rapidApiKey`; `getSneakers({limit})`, `getSneakerById`; filterable fields `releaseDate`, `releaseYear`, `retailPrice` (operators like `gte`, `lte`); sortable `name`, `silhouette`, `retailPrice`, `releaseDate`, `releaseYear`; docs link `rapidapi.com/tg4-solutions-tg4-solutions-default/api/the-sneaker-database` — [sneakerdb-client README](https://raw.githubusercontent.com/angelxmoreno/sneakerdb-client/main/README.md)
- Alternative paid datasets: Apify "Ultimate Sneaker Database API" at "$2.00 per 1,000 sneaker searches" claiming "over 251,787 sneakers" — [Apify pricing](https://apify.com/dev00/sneaker-database-api/pricing); Zyla Labs also lists a "Sneakers Database API" — [Zyla](https://www.zylalabs.com/api-marketplace/data/sneakers+database+api/916)

**Sneaks-API (open source)**
- GitHub API on 2026-10-07: `pushed_at` 2023-02-12, 498 stars, 142 forks, 25 open issues, no license file, not archived; description "A StockX, FlightClub, Goat, and Stadium Goods API all in one" — [GitHub repo](https://github.com/druv5319/Sneaks-API). It "mainly scrapes StockX" — [npm package](https://www.npmjs.com/package/sneaks-api)

**Sole Retriever**
- No public API. Every HTML page tried returned HTTP 403 behind Cloudflare (calendar hub, a product page with full browser headers and HTTP/2, and WebFetch) on 2026-10-07. The sitemaps are open and are the usable machine-readable surface: `sitemap.xml` index → `sitemap-models.xml` (342 URLs), `sitemap-brands.xml` (60), `sitemap-products.xml` (10,007 URLs, 10.5 MB), `sitemap-collections.xml` (72), `sitemap-retailers.xml` (500), `sitemap-google-news.xml` (36), `sitemap-news/0`..`/17`, `sitemap-blog-tags.xml`, `sitemap-performance-lab.xml`; all carry `<lastmod>` (brands/collections/retailers refreshed 2026-10-07 06:40Z; product entries e.g. 2026-10-07T05:54Z) — [soleretriever.com/sitemap.xml](https://www.soleretriever.com/sitemap.xml) (own fetch)
- Product URLs embed brand, model and style code: `/sneaker-release-dates/jordan/air-jordan-1-high/air-jordan-1-retro-high-og-royal-iq5495-005`, `/sneaker-release-dates/nike/mind/nike-mind-001-work-blue-hq4307-401` — [sitemap-products.xml](https://www.soleretriever.com/sitemap-products.xml)
- Editorial date formats seen in indexed copy: exact ("will be released December 12, 2026 through Nike and select Jordan retailers"), seasonal ("Holiday 2026"), and "TBD" prices — [Sole Retriever AJ11 Space Jam article](https://www.soleretriever.com/news/articles/air-jordan-11-retro-space-jam-in-hand-preview)

**Nike (api.nike.com product feed)** (own fetches 2026-10-07, no auth, no cookies)
- `GET https://api.nike.com/product_feed/threads/v2?filter=marketplace(IN)&filter=language(en-GB)&filter=channelId(010794e5-35fe-4e32-aaff-cd2c74f89d61)&count=2` → HTTP 200, `pages.totalResources` 498 (SNKRS channel, India). Object fields: `publishedContent.properties.{title,subtitle,seo{title,description,slug,doNotIndex},coverCard,products}`, `productInfo[].merchProduct.{styleColor,status,commerceStartDate,commercePublishDate,publishType,exclusiveAccess}`, `productInfo[].merchPrice.{fullPrice,currentPrice,currency,discounted}`, `productInfo[].productContent.{fullTitle,title,subtitle,colorDescription,slug,globalPid}`, `productInfo[].launchView.{startEntryDate,method}`, `skus[]`, `availableSkus[]`, `imageUrls`, `lastFetchTime`.
- India SNKRS channel sample of 100 threads (`sort=effectiveStartSellDateDesc`): 84 had `productInfo`, only 1 had `launchView.startEntryDate` (2025-10-23T09:00Z, method `LEO`), statuses INACTIVE 83 / HOLD 1, currency INR throughout. `filter=upcoming(true)` returned 0 for IN but 15 for US (US sample showed future `commerceStartDate` 2027-02-18 with `launchView.startEntryDate` 2026-10-07T14:00Z for `IV6999-001` Air Force 1 '01 at 150 USD).
- India web channel `channelId(d9a5bc42-4b9c-4976-858a-f159cf99c647)` → 15,299 threads with INR MRP and style codes, e.g. "Air Jordan 1 High OG 'Khaki' Women's Shoes | FD2596-201 | 16995 INR | ACTIVE | commerceStart 2026-06-27 | Khaki/Sail/Cargo Khaki/Multi-Colour", "Air Jordan 3 x Levi's 'Ecru Denim' | IR0910-400 | 20295 INR | HOLD". Style-code filter `filter=productInfo.merchProduct.styleColor(HQ6998-600)` is accepted (200) but returned 0 on the SNKRS channel.
- Quirk: one IN SNKRS thread had a Korean `publishedContent.properties.title` ("에어 조던 6 레트로 \"Infrared Salesman\"") with English `seo.title`; prefer `productContent.fullTitle` / `seo.title` over `properties.title`.
- `https://www.nike.com/in/launch` and `https://www.nike.com/in/w/jordan-shoes-37eefzy7ok` returned HTTP 403 (Akamai) to curl; the API host did not.
- Apify sells a wrapper that "reads Nike's own product API directly" — [Apify Nike API Scraper](https://apify.com/rl1987/nike-api-scraper)

**adidas / New Balance / Crocs**
- adidas: `adidas.co.in/api/plp/content-engine`, `adidas.co.in/api/products/IF3225`, `adidas.co.in/release-dates`, `adidas.com/us/release-dates` all HTTP 403 "Access Denied" (Akamai `errors.edgesuite.net`) on 2026-10-07 (own fetch).
- Crocs India `https://www.crocs.in/` HTTP 200 HTML, `/products.json` 404 (not Shopify). New Balance India `newbalance.co.in` / `newbalance.in` failed to connect (curl exit, HTTP 000) (own fetch).

**RSS / news feeds** (own fetch 2026-10-07)
- `https://sneakernews.com/feed/` 200, 7 items; `https://sneakerbardetroit.com/feed/` 200, 25 items, each with `title`, `link`, `dc:creator`, `pubDate`, `category` (brand → model → variant, e.g. Nike / Nike Air Force 1 / Nike Air Force 1 Low), `description`; style code appears in the slug (`/nike-air-force-1-low-wheat-iv3472-700/`), not as a field; `https://hypebeast.com/feed` 200, 20 items; `https://www.nicekicks.com/feed/` 200, 10 items; `https://houseofheat.co/feed` 403; `https://sneakernews.com/sitemap_index.xml` 403.

**Wikipedia / Wikidata** (Wikidata API, 2026-10-07)
- Q420953 "Air Jordan" (brand): P571 inception 1984, P287 designer Q3529194 Tinker Hatfield and Q23071087 (labelled "Peter Moore, botanist", i.e. a wrong-entity link), P941 inspired by Q41421 Michael Jordan, P127 owned by Q483915 Nike, sitelink enwiki "Air Jordan" — [wbgetentities Q420953](https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q420953&props=claims|labels|sitelinks&languages=en&format=json)
- Q5315336 "Dunk": P571 1985, P176 manufacturer Nike, P287 designer Q140461394 ("Peter Moore, British businessman born 1955", also a wrong-entity link) — [wbgetentities Q5315336](https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q5315336&props=claims&languages=en&format=json)
- Q407113 "Air Force 1" has no P287/P571 claims; Q4682715 "Adidas Samba" has only P176 manufacturer Q3895. `wbsearchentities` found no items for "Air Jordan I", "Air Jordan 4", "Nike Air Max 1", "New Balance 990", "Crocs Classic Clog" (own queries).

### Inferences
- For a verification step, the authoritative machine-readable tiers are: (1) Nike product feed for Nike/Jordan style code, name, colour, INR MRP and `commerceStartDate`; (2) Shopify `products.json` of Indian retailers for INR list price and style code (section 2); (3) KicksDB (paid) or TheSneakerDatabase for USD retail, release date and colorway on any brand; (4) blog RSS for recency. StockX official access is realistic only if the store becomes a StockX seller.
- Wikidata should be used only for brand-level facts (inception year, manufacturer) and only after resolving designer QIDs to a person whose description is a footwear designer; the two "Peter Moore" links above point to the wrong people.
- Sole Retriever's `sitemap-products.xml` is a free, legal-to-read index of ~10k release slugs with style codes and `lastmod`; it can seed a "does this style code exist and when was its page last changed" check without scraping the blocked pages.

### Gaps
- StockX API pricing, rate-limit numbers, catalog field list (styleId, retailPrice, releaseDate) and whether India/INR is supported: portal is JS-only; not retrievable without an account.
- TheSneakerDatabase RapidAPI quota tiers and prices: listing is JS-rendered; not retrieved.
- KicksDB Terms of Service on caching/redistribution: not fetched.
- adidas Confirmed app endpoints, adidas.co.in launch page data, New Balance India and Crocs India launch pages: all blocked or unreachable from this environment.
- Nike feed terms of use for third-party consumption: not found; the endpoint is undocumented and unauthenticated, which does not make it licensed.

## 2. Indian price and availability sources (what exposes JSON, what blocks, how often prices change)

### Takeaway
Four of the target Indian stores are Shopify and expose `/products.json` with INR prices, availability and (for Superkicks and Limited Edt) style-code-prefixed SKUs; VegNonVeg is custom but server-rendered; Culture Circle is Next.js on a private API; adidas India, Ajio and Myntra's gateway block plain fetches; Nike India is best read through api.nike.com. Shopify `updated_at` is bumped daily on every product, so it cannot be used to infer price-change cadence.

### Cited Findings
(All own fetches 2026-10-07 unless linked.)
- **Superkicks** `https://www.superkicks.in/products.json?limit=250` → 200, 1.29 MB. Of 250 products, 166 footwear (`product_type` "Lifestyle Sneakers" 148, "Slides & Clogs" 13, "Basketball Sneakers" 5); vendors Nike 58, adidas Originals 27, Jordan 24, New Balance 22, adidas 10. Every footwear item has a variant `sku` of the form `STYLECODE-SIZE` (e.g. `IM9148-281-S`); a Nike/adidas-style code regex matched 119/166. `compare_at_price` set on 9/166. Tags carry `Brand - Jordan`, `Franchise: ...`, `Season: FW26`, `NO-COD`. All 166 had `updated_at` within the last 24 h.
- **Limited Edt** `https://limitededt.in/products.json?limit=250` → 200, 1.46 MB; 128 footwear; vendors Adidas 35, Adidas Originals 19, Nike 14, Jordan Brand 13, New Balance 13; SKU `STYLECODE-SIZE` (e.g. `KE5169-5`); style code matched 87/128; `compare_at_price` 1/128; all `updated_at` < 24 h.
- **Crepdog Crew** `https://www.crepdogcrew.com/collections/sneakers/products.json?limit=5` → 200. SKU is often `null` or an internal `CL#####` code; the style code appears in `body_html`/tags instead (e.g. "Air Jordan 1 Retro Low OG Last Dance At The Garden" → `IR0088-001`, ₹18,999; "Adidas x Pokemon Superstar II Charmander" → `KI2855`, ₹9,499). In the full 250 sample, 22/34 footwear had `compare_at_price` (discounting is common), vendors included Hermès and On.
- **Hustle Culture** `https://www.hustleculture.co.in/products.json` → 200 (Shopify) but 0 footwear in the first 250 (apparel such as Gymshark). **Mainstreet** `https://www.mainstreet.co.in/products.json` → 200 (Shopify) with mixed goods (first item "Ninja 6-Cup CleanCrisp Glass Container").
- **VegNonVeg**: `/products.json` → 404 JSON `{"message":""}`, `/sitemap.xml` → 404; homepage is a custom app (Laravel `csrf-token` meta); `https://www.vegnonveg.com/search?q=dunk` → 200, 227 KB server-rendered HTML with `/products/{handle}` links (e.g. `/products/nike-dunk-low-hydrogen-bluepale-ivory-sail`) and one `application/ld+json` block.
- **Culture Circle**: `culture-circle.com/products.json` returns the Next.js HTML app (200, 154 KB); backend host `api.culture-circle.com` referenced in HTML; JSON-LD is `Organization` (legalName "Metacircles Technologies Private Limited") + `WebSite` with `SearchAction` to `/search?q=`.
- **Nike India**: see section 1; web channel returns `fullPrice`/`currentPrice` in INR per style code.
- **adidas India**: all `/api/*` and category URLs 403 (Akamai).
- **Myntra**: `https://www.myntra.com/gateway/v2/search/nike%20dunk` → 401 with no body; `https://www.myntra.com/nike-dunk` → 200, 559 KB HTML containing `window.__myx = ` with `"price":6787`, `"price":8295` etc. (server-side JSON available to plain curl).
- **Ajio**: `https://www.ajio.com/api/search?...` → 403 "Access Denied" to plain curl (the project's CLAUDE.md records that `got-scraping` gets through, and that Puppeteer is the fallback).
- **Flipkart**: `https://www.flipkart.com/search?q=nike%20dunk` → 200, 778 KB HTML.
- **Tata CLiQ**: `searchbff.tatacliq.com/products/mpl/search?searchText=nike%20dunk&...pageSize=2&typeID=all` → 200 but `{"status":"Error","error":"error","type":"productSearchPageWsDto"}` with my parameter set; CLAUDE.md documents the working call (no `mode` header) and that Luxury must be read from `window.initialData` on brand category pages.
- Press coverage of the stores: VegNonVeg "India's first multi-brand sneaker boutique"; Crepdog Crew founded 2019 by Anchit Kapil, Bharat Mehrotra and Shaurya Kumar, "delivering 350-400 pairs of sneakers to customers across 500 cities" — [Indian Retailer](https://www.indianretailer.com/article/retail-business/fashion-accessories/8-best-places-buy-limited-edition-sneakers-and)

### Inferences
- Join key for Indian prices: Superkicks and Limited Edt SKUs can be split on the last `-` to get the style code; Crepdog Crew needs a regex over `body_html` + tags; VegNonVeg needs an HTML scrape keyed on title. Nike India gives the brand MRP; retailers above give the street list price (often equal to MRP, sometimes discounted via `compare_at_price`).
- Price-change cadence cannot be measured from `updated_at` (every product touched daily, presumably by inventory apps). Measure it by diffing `variants[].price` snapshots instead; a daily snapshot is sufficient because Shopify prices are edited manually by these stores.
- Myntra and Flipkart are scrape-only (SSR JSON / HTML), Ajio and adidas need the stealth transport, Culture Circle needs API reverse-engineering or a headless browser.

### Gaps
- No quantitative source on how often Indian retailers change sneaker prices; only the snapshot-diff method above.
- Reddit r/SneakersIndia is blocked for our search tool (`reddit.com` not accessible), so community reliability signals could not be gathered.
- Culture Circle's `api.culture-circle.com` endpoints and whether they require signed headers were not probed.
- Crocs India and New Balance India product feeds: platform unknown / unreachable.

## 3. Detecting and reconciling conflicting facts

### Takeaway
No sneaker aggregator publishes a reconciliation methodology (searches returned only SEO spam, which I did not cite). The usable evidence is structural: brand feeds expose per-market dates and prices, aggregators hedge with "Holiday 2026" / "TBD", and feeds and sitemaps carry timestamps, which together support a tiered, dated, style-code-keyed resolution rule.

### Cited Findings
- Nike's feed is per marketplace and exposes both `merchProduct.commerceStartDate` and `launchView.startEntryDate` (`method` `LEO`), so "release date" differs by country and by channel (own fetch, section 1).
- Sole Retriever publishes exact dates when confirmed ("will be released December 12, 2026 through Nike and select Jordan retailers in-store and online") and seasonal placeholders otherwise ("Holiday 2026"), with "TBD" prices — [Sole Retriever](https://www.soleretriever.com/news/articles/air-jordan-11-retro-space-jam-in-hand-preview); its sitemaps carry same-day `lastmod` (own fetch).
- Sneaker Bar Detroit RSS items carry `pubDate` and brand/model categories, and encode the style code in the URL slug (own fetch, section 1).
- Google's own guidance on dates: provide `datePublished` and `dateModified` in ISO 8601 with timezone — [Google Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)

### Inferences
- Source hierarchy for the verifier: brand feed for the target market (Nike IN) > brand feed for US > Indian retailer listing (Shopify JSON) > Sole Retriever product page / sitemap > Sneaker News / SBD / Hypebeast RSS > other blogs. Within a tier, the most recently dated statement wins; across tiers, a lower tier may only override a higher tier when it is newer by a configurable window (e.g. > 7 days) and names a delay explicitly.
- Always join on the style code (regex `^[A-Z]{1,2}\d{4}-\d{3}$` for Nike/Jordan, `^[A-Z]{2}\d{4}$` for adidas, `^[A-Z]{1,2}\d{3,4}[A-Z]{0,3}\d*$` for New Balance, numeric for Crocs); never on name, because names differ per source (Nike "Air Jordan 1 High OG 'Khaki' Women's Shoes" vs retailer "AIR JORDAN 1 HIGH OG WMNS KHAKI").
- Treat prices as market-scoped facts: USD retail from aggregators and INR MRP from Nike IN / Shopify are different facts, not conflicts; flag only when two INR sources differ.
- Emit a "conflict" rather than auto-resolving when dates differ by more than a few days across tiers, when a style code is attached to two different names, or when the only source is a blog older than the brand feed's `lastFetchTime`.

### Gaps
- No published accuracy data or methodology from Sole Retriever, Sneaker News, House of Heat or KicksOnFire; the search returned only spam domains, which were discarded.

## 4. Structured data for this niche (2025-2026 status, what the big sites use)

### Takeaway
FAQ rich results are gone for everyone since 7 May 2026 and HowTo is gone from the gallery; Event markup is explicitly disallowed for sales/drops; ItemList carousels only render for four unrelated types. What remains for sneaker pages: Product (merchant listing on buyable product pages, product snippets elsewhere), Article/NewsArticle/BlogPosting with author + dates, BreadcrumbList, Organization, WebSite SearchAction, Video and image metadata. The one calendar I could inspect (Nice Kicks) uses only WebPage/ItemPage + BreadcrumbList + WebSite + Organization.

### Cited Findings
- FAQ: "As of May 7, 2026, FAQ rich results have been deprecated for most sites ... no website—including government and health sites that had retained eligibility—will see FAQ-structured content rendered"; the Search Console FAQ report is dropped in June 2026 and the API support in August 2026; FAQPage remains a valid schema.org type and unused markup is harmless — [TechWyse](https://www.techwyse.com/news/ai-search/google-faq-rich-results-deprecated-2026); [Search Engine Journal](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/)
- Google's structured-data gallery (fetched 2026-10-07) lists Article, Breadcrumb, Carousel, Course list, Dataset, Discussion forum, Education Q&A, Employer aggregate rating, Event, Image metadata, Job posting, Local business, Math solver, Movie, Organization, Product, Profile page, Q&A, Recipe, Review snippet, Software app, Speakable, Subscription and paywalled content, Vacation rental, Video; FAQ, HowTo, Sitelinks search box, Estimated salary, Vehicle listing, Learning video, Practice problems, Special announcement and Book actions are not listed — [Search gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- Event eligibility: "Don't add short-term discounts or purchase opportunities", "Don't mark coupons or vouchers as events", "Don't promote non-event products or services"; events must have a physical `location` with `address` and `name`; online-only events are not supported — [Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event)
- Carousel: ItemList works only "in combination with one of the following supported structured data features: Course list, Movie, Recipe, Restaurant"; "other carousel-like features ... like Top stories ... You can't control those types of carousels with carousel markup"; `itemListElement` needs at least two `ListItem` of the same type with `position` and `url` (summary page) or `item` (all-in-one) — [Carousel](https://developers.google.com/search/docs/appearance/structured-data/carousel)
- Product: "Only pages where a shopper can purchase a product are eligible for merchant listing experiences"; "Product rich results only support pages that focus on a single product"; required `name`, `image` (≥ 50K pixels, 16x9 / 4x3 / 1x1), `offers.price` (> 0) and `priceCurrency` (ISO 4217); recommended `brand`, `description`, `gtin*` (numeric only), `mpn`, `sku` (no whitespace, ASCII), `aggregateRating`, `offers.availability` (InStock, OutOfStock, PreOrder, SoldOut, BackOrder, OnlineOnly, InStoreOnly, LimitedAvailability, Discontinued, PreSale), `itemCondition`, `url`, `priceValidUntil`, `shippingDetails`, `hasMerchantReturnPolicy` — [Merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing)
- Product snippets are "for pages where people can't directly purchase the product" and "offer more options for specifying review information"; both experiences support product variants — [Product structured data intro](https://developers.google.com/search/docs/appearance/structured-data/product)
- Article: `Article`, `NewsArticle`, `BlogPosting` are interchangeable; `author` should have `name` plus `url` or `sameAs`, one `author` object per person, `Person`/`Organization` types; `datePublished` and `dateModified` in ISO 8601 with timezone; images ≥ 50K pixels in 16x9, 4x3, 1x1; "no markup requirement to be eligible for Google News features like Top Stories" — [Article](https://developers.google.com/search/docs/appearance/structured-data/article)
- Observed markup, Nice Kicks calendar (HTTP 200, 3 JSON-LD blocks): `@graph` with `["WebPage","ItemPage"]` carrying `datePublished` 2026-01-09 and `dateModified` 2026-01-10T19:44:16Z, `ReadAction`, `WebSite` + `SearchAction`, `Organization` + `ImageObject`; a separate `BreadcrumbList` (Home → Sneaker Release Dates); no Product, Event or ItemList — [nicekicks.com/sneaker-release-dates/](https://www.nicekicks.com/sneaker-release-dates/) (own fetch 2026-10-07)
- Observed markup, Culture Circle homepage: `Organization` + `WebSite` with `SearchAction` only (own fetch 2026-10-07).
- Blocked for inspection on 2026-10-07: soleretriever.com (403 Cloudflare), sneakernews.com/release-dates/ (403), kicksonfire.com/app/sneaker-release-dates/ (403), houseofheat.co/release-dates (403), nike.com/in/launch (403), stockx.com product page (403), goat.com product page (403).

### Inferences
- Drop pages on snkrscart.com should carry `Product` with `offers` (merchant listing) only where the shoe is buyable there; for not-yet-released drops use `Product` without a purchasable offer (or `availability: PreOrder` only if pre-orders are real) plus `releaseDate` as a plain schema.org property (Google ignores it for rich results, but it is harmless and machine-readable), never `Event`.
- Calendar pages: `CollectionPage`/`ItemPage` + `BreadcrumbList` + accurate `dateModified`; `ItemList` of `ListItem{url}` is fine for crawl structure but will not render a carousel.
- Model hubs and blog posts: `Article`/`BlogPosting` with a real `Person` author and author page URL, `dateModified` bumped only on substantive edits, images in all three aspect ratios; drop the FAQPage block (keep the FAQ as HTML copy if it reads well).
- `mpn` is the right slot for the style code on `Product`; `sku` should be the merchant's own identifier (the project already stores style codes in `sku`, so map `sku → mpn` and emit an internal id as `sku`, or emit the style code in both).

### Gaps
- Direct JSON-LD from Sole Retriever, Sneaker News, StockX, Nike Launch, KicksOnFire and House of Heat could not be captured; all block server-side fetches. A headless browser or the project's stealth transport would be needed.
- No evidence was found on which rich results actually appear for sneaker queries in 2026 (no SERP-feature study); treat "Product snippets + Top Stories + image badges" as the working assumption.

## 5. Release calendar page architecture that ranks

### Takeaway
The ranking calendars are hierarchical hubs rather than month archives: Sole Retriever is `/sneaker-release-dates` → `/{brand}` (60) → `/{brand}/{model}` (342) → `/{brand}/{model}/{slug}-{stylecode}` (10,007), with same-day sitemap `lastmod`; Nice Kicks runs one WordPress list with `?nk=upcoming` / `?nk=available` toggles, `/page/N/` pagination and per-brand lists; Sneaker News pairs an evergreen `/release-dates/` + `/air-jordan-release-dates` with weekly dated roundup posts; House of Heat keys product URLs as `/{brand}/{slug}-{stylecode}-release-date`.

### Cited Findings
- Sole Retriever URL tiers (from open sitemaps, 2026-10-07): brands `/sneaker-release-dates/fear-of-god`, `/sneaker-release-dates/dior`; models `/sneaker-release-dates/nike/dunk-low`, `/sneaker-release-dates/jordan/air-jordan-1-high`, `/sneaker-release-dates/new-balance/550`, `/sneaker-release-dates/yeezy/adidas-yeezy-boost-350`; products `/sneaker-release-dates/jordan/nike-air-jordan-5/air-jordan-5-retro-halloween-hq7978-001`; news `/news/articles/{slug}`; retailer pages `/retailers/{slug}/releases`; collections `/collections/supreme-nike`; a Google News sitemap that mixes product pages and articles — [sitemap index](https://www.soleretriever.com/sitemap.xml), [models](https://www.soleretriever.com/sitemap-models.xml), [brands](https://www.soleretriever.com/sitemap-brands.xml), [products](https://www.soleretriever.com/sitemap-products.xml)
- Nice Kicks (HTML fetched 2026-10-07): H1 "Sneaker Release Dates", each entry an H2 of the full colourway name (e.g. "Air Jordan 1 High OG \"Royal\"", "Nike Mind 001 \"Solar Red\""), 20 `$` prices on page 1, toggles `/sneaker-release-dates/?nk=upcoming` and `?nk=available`, pagination `/sneaker-release-dates/page/2/`..`/4/`, brand calendars `/air-jordan-release-dates/` and `/nike-kobe-release-dates/`; title "Sneaker Release Dates for 2026 - New Sneakers Daily | Nice Kicks"; JSON-LD `dateModified` 2026-01-10 although entries are current — [Nice Kicks calendar](https://www.nicekicks.com/sneaker-release-dates/)
- Sneaker News: evergreen hubs `/release-dates/` and `/air-jordan-release-dates` ("Air Jordan Release Date Calendar for 2026 is updated daily"), weekly roundup posts such as `/2026/07/26/sneaker-release-dates-july-26-august-1-2026/`, year archive `/2026/` — [Sneaker News Jordan calendar](https://www.sneakernews.com/air-jordan-release-dates); [weekly roundup](https://sneakernews.com/2026/07/26/sneaker-release-dates-july-26-august-1-2026/)
- House of Heat product URL pattern `/nike/nike-air-presto-heat-map-ct3550-200-release-date`, `/nike/nike-lebron-3-qs-home-ao2434-101-release-date`; a `fire.houseofheat.co` mirror serves the same paths — [House of Heat](https://houseofheat.co/nike/nike-air-presto-heat-map-ct3550-200-release-date)
- KicksOnFire calendar lives at `/app/sneaker-release-dates/` (403 on fetch). Hibbett publishes a retailer calendar faceted by brand/colour at `/launch-calendar/{facet}/` — [Hibbett](https://www.hibbett.com/launch-calendar/converse/)
- Google's ecommerce guidance for hierarchy: "add links from menus to category pages, from category pages to sub-category pages, and finally from sub-category pages to all product pages"; use `<a href>` not JS handlers; "use a sitemap or a Google Merchant Center feed" for pages crawlers cannot reach — [Help Google understand your ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure)

### Inferences
- The dominant pattern is one canonical evergreen calendar URL (never `/2026/october` as the primary) with per-brand and per-model child hubs and one stable URL per colourway containing the style code. Month/year views should be filters of the canonical URL (`?month=2026-10`, mirrored to `history.replaceState` as the project already does) with `rel=canonical` pointing at the base page, or indexable month pages only if they carry unique copy.
- Keep released items on the same hub under a "Recently released" block (Sole Retriever's product pages persist after release and keep getting `lastmod` updates) rather than deleting or redirecting them.
- Bump `dateModified` only when the entry set or copy changes (Nice Kicks' stale value shows WordPress does not do this automatically; the project should compute it from the newest drop `updatedAt`).
- Add a news-style sitemap for drop detail pages and articles (Sole Retriever includes product pages in its Google News sitemap).

### Gaps
- Could not inspect the rendered calendar pages of Sole Retriever, Sneaker News, House of Heat or KicksOnFire (403), so grouping UI, "upcoming/released" wording and internal-link modules are inferred from URL structure and the Nice Kicks page only.
- No canonical/pagination behaviour was observable for month archives on these sites.

## 6. Model hub architecture ("Air Jordan 1 history, sizing, how to style")

### Takeaway
Top-ranking model hubs are 2,200 to 2,400 words, 7 to 10 H2 sections, narrative rather than tabular, dated with a named or brand author, and either link heavily to colourway product pages (retailer hubs) or to sibling guides (media hubs). None of the two inspected hubs had a size table or FAQ block, which is a gap snkrscart.com can fill.

### Cited Findings
- Stadium Goods "Sneakers You Need to Know: Air Jordan 1": sections in order "Knowing the Air Jordan 1's Three Heights", "The Alternate Air Jordan 1s", "Air Jordan 1 Colorways & Collaborations", "The Women's Air Jordan 1", "Jordan 1 Sizing: How Does the Jordan 1 Fit?", "The Air Jordan 1's Most Memorable On-Court Moments", "The Air Jordan 1: A Legendary Sneaker"; ~2,200 words; 4 captioned product images; no comparison table, no size table (sizing as prose: "select your standard sneaker size"), no FAQ; byline "By Stadium Goods", 27 July 2022; ~15+ links to colourway shop pages such as `/shopping/air-jordan-1-retro-high-og-chicago` — [Stadium Goods guide](https://www.stadiumgoods.com/blogs/news/air-jordan-1-guide-history-different-heights-sizing)
- Complex "How to Wear Air Jordan 1s": 10 sections ("High, Mid, or Low?", "OG or New Colorway?", "Make Sure You Buy the Right Size", "Make Sure They Compliment the Fit", "Laced Tight or Hangin' Loose?", "Stand Out With a Lace Swap", "Show Them Off With Some Tapered Pants", "Don't Be Afraid to Rock 'Em With Baggy Pants Too", "Wearing Shorts? Find the Right Socks", "Just Wear Them"); ~2,400 words; 10 commissioned illustrations (Naomi Otsu); author Mike DeStefano, 16 Aug 2022, no updated date; links to Complex's Air Force 1, AJ1 Low and Dunk guides and to external lace retailers plus StockX/GOAT; no colourway product pages — [Complex guide](https://www.complex.com/style/how-to-wear-air-jordan-1-guide)
- Other hubs ranking for the query: StockX "The Buyer's Guide: Air Jordan 1" — [StockX](https://stockx.com/news/es-es/the-buyers-guide-air-jordan-1); Stadium Goods "Air Jordan 1 Size Guide, How to Clean, Different Heights" — [Stadium Goods](https://www.stadiumgoods.com/blogs/news/air-jordan-1-size-guide-how-to-clean-different-heights); Pushas "The Complete Jordan 1 Size Guide" — [Pushas](https://pushas.com.au/blogs/size-guides/the-complete-jordan-1-size-guide)
- Sole Retriever's model hubs are release-list pages per silhouette (`/sneaker-release-dates/jordan/air-jordan-1-high`, `/sneaker-release-dates/nike/dunk-low`, `/sneaker-release-dates/new-balance/550`), i.e. the model page is the parent of every colourway page — [sitemap-models.xml](https://www.soleretriever.com/sitemap-models.xml)
- Wikidata brand-level facts available for hub intros: Air Jordan inception 1984, Dunk inception 1985, Nike founded 1964-01-25 (own Wikidata fetch, section 1).

### Inferences
- A competitive hub for this store should combine both archetypes: history + heights/variants + colourway timeline (Stadium Goods) and fit/sizing + styling (Complex), add what neither has (a real UK/US/EU size table, a High vs Mid vs Low comparison table, "shop in India" module reading live `offers`), and link down to every colourway product/drop page and across to sibling model hubs. 2,000 to 2,500 words is the observed norm; longer is not evidenced.
- Keep the FAQ as visible HTML (useful for people and AI answers) but do not expect a rich result.

### Gaps
- Could not inspect Sole Retriever or GOAT model pages (403), so their section structure is unknown.
- No source quantifies the effect of comparison tables or size tables on rankings for sneaker hubs.

## 7. Google Merchant Center and blog/product reinforcement

### Takeaway
Google's own ecommerce documentation recommends linking products from blog posts and using structured data and Merchant Center feeds to reinforce site structure, and the out-of-stock literature says keep product pages live rather than 404 or redirect; no study was found showing that in-stock status improves blog rankings or that schema `mentions`/`about` matter.

### Cited Findings
- "if you have a best selling product, consider linking to it from the home page or in other content, such as blog posts or newsletters on your site" — [Google ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure)
- "navigation structures on your site (such as menus and cross page links) can impact Google's understanding of your site structure"; structured data "can help Google understand the purpose of the different pages on your site to reinforce this structure"; "use a sitemap or a Google Merchant Center feed. These sources can include links to pages on a site that a crawler would not otherwise find" — same page. The guide series also covers "Share product data", "Include structured data", "Design a URL structure", "Pagination and incremental page loading" — [Google ecommerce guide](https://developers.google.com/search/docs/specialty/ecommerce)
- Out-of-stock handling: keep pages live and indexable, signal unavailability to users and engines; "Never return a 404 error" and avoid redirects for temporarily unavailable items; permanently gone items should be removed from internal links — [Orbit Media](https://www.orbitmedia.com/blog/seo-for-out-of-stock-ecommerce-products/); [Ahrefs](https://ahrefs.com/blog/ecommerce-out-of-stock-products/)
- Google recommends nesting Merchant return policy and Loyalty Program structured data under `Organization` for ecommerce sites — [Product structured data intro](https://developers.google.com/search/docs/appearance/structured-data/product)
- Author entity guidance: `author.url`/`sameAs` to an author profile page, `Person` vs `Organization` — [Article](https://developers.google.com/search/docs/appearance/structured-data/article)

### Inferences
- The concrete, documented levers are: blog → product `<a href>` links, product → blog links ("read the guide"), BreadcrumbList on both, `Organization` with `sameAs` and return policy, and a Merchant Center feed whose `link` values match canonical product URLs (the project's `/api/feed` already does this). Keep released drop pages and sold-out product pages live with `availability: SoldOut/OutOfStock` so blog links keep resolving.
- Nothing supports adding `mentions`/`about` to Article for ranking; include them only if cheap.

### Gaps
- No evidence that in-stock products make related blog posts rank better, or that Merchant Center feed data influences organic blog rankings.

## 8. Image SEO for sneakers (traffic share, licensing, alt text, originals)

### Takeaway
Visual search is large (Google Lens > 25 billion searches/month, ~20% shopping-related), Google's image guidance is specific (alt text, filenames, placement, srcset, image sitemaps, structured data badges, `primaryImageOfPage`/`og:image`), and reuse of Nike press renders or blog photos is a copyright exposure: Nike's terms allow only personal, non-commercial use and Indian fair dealing is narrower than US fair use.

### Cited Findings
- Google Lens "now processes more than 25 billion searches per month, up from nearly 20 billion per month reported in October 2024"; "approximately 20% of Lens queries are connected to shopping-related research" — [Scalevise](https://scalevise.com/resources/google-lens-25-billion-monthly-searches-visual-search/)
- Claim that "23% of all Google searches happen through Google Images" — [ConvertCart](https://www.convertcart.com/blog/how-to-get-more-ecommerce-traffic-from-image-search) (vendor blog, original study not cited; treat as indicative only)
- Google image best practices: alt text should be "useful, information-rich content that uses keywords appropriately and is in context" (example "Dalmatian puppy playing fetch"); filenames "my-new-black-kitten.jpg is better than IMG00023.JPG"; place images near relevant text; use `srcset`/`<picture>` with a fallback `src`; image sitemaps may "include URLs from other domains in the `<image:loc>` elements" (CDN-friendly); Product/Recipe/Video structured data earns a "prominent badge" in Google Images; set `primaryImageOfPage` or `og:image`; hotlinking can be blocked by checking the referrer and returning 200/204 to Google — [Google Images SEO](https://developers.google.com/search/docs/appearance/google-images)
- Image metadata / licensable images is a listed gallery feature ("Image metadata") — [Search gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- Nike Terms of Use (version dated 2024-07-05): content is licensed "solely for their intended purpose", "for personal, non-commercial use"; users "agree not to use, copy, reproduce, edit, translate, display, distribute, publish, download, transmit, sell, create derivative works from, or in any way exploit any content without prior written consent"; Nike may revoke the licence at any time — [Nike Terms of Use archive](https://www.toolongdidntread.it.com/companies/nike/terms/v/20240705_rev01); [ToS tracker copy](https://tostracker.app/document/nike-2)
- Indian law: Section 52(1)(a) permits fair dealing for "criticism or review" and "reporting of current events and current affairs"; "fair dealing in Indian copyright law is much more restrictive than its US counterpart fair use" because it is an enumerated list; use that harms the owner's ability to monetise may not qualify — [BananaIP](https://bananaip.com/ip-news-center/copyrights-fair-dealing-fair-use-india); [The Legal School](https://thelegalschool.in/blog/fair-dealing-indian-copyright-law)
- Copyright scope illustration: in Rentmeester v. Nike the Ninth Circuit held the Jumpman silhouette did not infringe the photographer's image because the pose itself is not protected, while the photo remained copyrighted — [Bloomberg Law](https://news.bloomberglaw.com/ip-law/nike-bounces-claim-jumpman-logo-infringed-michael-jordan-photo); [Sneaker Freaker](https://sneakerfreaker.com/news/photographer-unsuccessful-in-copyright-dispute-against-nike-over-jordan-image)

### Inferences
- Official Nike product renders are copyrighted Nike content; republishing them on a commercial store blog is outside Nike's licence and only arguably inside Indian fair dealing when the image is the object of review or news. Photos taken from Sneaker Bar Detroit or Sneaker News belong to those sites or their leak sources and carry the same exposure plus hotlink-bandwidth issues. Lowest-risk path: original photography of stock the store actually holds (also the only way to get the licensable-image badge honestly), or Cloudinary-hosted brand images where a distribution agreement exists.
- Operational rules for the templater: descriptive filename `air-jordan-1-high-og-royal-iq5495-005-side.jpg`, alt text "Air Jordan 1 High OG Royal (IQ5495-005), lateral view", image placed next to the paragraph that names it, `srcset` with three widths, 16x9/4x3/1x1 crops for Article/Product `image`, `og:image` = hero, image sitemap entries pointing at Cloudinary.

### Gaps
- Sneaker Bar Detroit and Sneaker News terms-of-use pages were unreachable (404/403), so their stated reuse policy is unknown.
- No authoritative 2025-2026 statistic for Google Images' share of total search or of sneaker-retail referral traffic; the 23% figure is vendor-cited and undated.
- Nike's press-site (about.nike.com) media asset terms were not found.
