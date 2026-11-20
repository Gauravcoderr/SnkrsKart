# Competitor page structure, Indian sneaker sites (PARTIAL, fetched 2026-11-21)

Status: INCOMPLETE. Sitemap counts and a few page heads were fetched directly with curl. After that, the sandbox proxy returned "local_rate_limited" and then HTTP 429 (Retry-After 60) on most page fetches, and the WebSearch/WebFetch quota hit a 5-hour limit. No web search was run, so there is no Google India ranking, Similarweb or Semrush data. Everything below is from direct fetches on 2026-11-21 unless marked inferred. Nothing was guessed for pages that were not fetched.

## 1. Sitemap and catalogue scale (Shopify sites, from /sitemap.xml)

### Takeaway

Four of the sites are Shopify and expose child sitemaps for products, collections, pages, blogs and articles. Collections far outnumber blog posts everywhere, so collections (not blogs) are the main SEO landing-page mechanism for the Shopify stores.

### Cited Findings

- Crepdog Crew: 11 product child sitemaps (about 10,689 product loc lines counted), 532 collection URLs, 25 page URLs, 16 articles, 2 blogs. Article path pattern `/blogs/articles/<slug>`. — [sitemap](https://crepdogcrew.com/sitemap.xml)
- Superkicks: 10 product child sitemaps (about 9,461 lines), 1,025 collection URLs (two collection sitemaps: 1,000 + 25), 60 pages, 46 articles across 3 blogs (`/blogs/news`, `/blogs/community`, `/blogs/activation`). — [sitemap](https://www.superkicks.in/sitemap.xml)
- Dawntown: 45 product child sitemaps (about 44,785 lines; includes many variants/toys/collectibles, so inflated vs distinct styles), 712 collection URLs, 42 pages, 8 articles in one blog `/blogs/sneakernews/<slug>`. — [sitemap](https://dawntown.co.in/sitemap.xml)
- Limited Edt: 2 product child sitemaps (about 1,669 lines), 273 collection URLs, 23 pages, 28 articles across 3 blogs (`/blogs/launches/<slug>`, `/blogs/blogs`). — [sitemap](https://limitededt.in/sitemap.xml)
- All four parent sitemaps list a `sitemap_agentic_discovery.xml` child (Shopify's agent-discovery sitemap). Not opened.
- Model-style collection handles exist on all four: Crepdog `collections/adidas-samba`, `dunk-lows`, `dunk-highs`, `jordan-1-highs`, `jordan-1-lows`, `jordan-1-mids`, `jordan-4s`, `all-dunks`, `all-jordans`; Superkicks `collections/air-jordan-1`, `air-jordan-1-low`, `adidas-samba`, `air-force-1-07`, plus colourway-level collections such as `air-jordan-1-high-og-royal`, `adidas-originals-samba-og-mercedes-amg-petronas-f1-team`; Dawntown `air-jordan-1-high`, `air-jordan-1-low`, `air-jordan-1-mid`, `air-jordan-2`, `air-jordan-3`, `dunk-low`, `dunk-lows`, `new-balance-9060`; Limited Edt `adidas-samba`, `adidas-samba-og-mercedes`, `jordan-1`, `new-balance-550`, `new-balance-9060`, `nike-air-force-1`, `nike-dunks`. — handles from each site's collections sitemap (URLs above)
- Collections.json (first rows) shows Dawntown collection descriptions are templated SEO copy, for example the 3AM BREAKFAST collection description reads "Shop authentic 3AM BREAKFAST in India at Dawntown – hoodies and sweatshirts, starting from ₹3,299. Popular picks right now include Sugga Frog - Boxy Fit. Every piece is checked before it ships." — [dawntown collections.json](https://dawntown.co.in/collections.json?limit=250)
- Limited Edt has a collection "ABANDONED CART" with 2,520 products, i.e. it uses collections for non-SEO purposes too (mixed use). — [limitededt collections.json](https://limitededt.in/collections.json?limit=250)

### Inferences

- Pattern (inferred): per model and per colourway collections, with several overlapping handles for the same model (`dunk-lows` and `dunk-low`, `air-jordan-1-low`), so cannibalisation risk exists on these sites.
- Dawntown description template (inferred from one example): "Shop authentic {collection} in India at Dawntown – {product types}, starting from ₹{min price}. Popular picks right now include {top product}. Every piece is checked before it ships." A cheap pattern to copy because it is built from stored data.

### Gaps

- /products.json was rate-limited, so no exact distinct-product counts.
- Superkicks 1,025 and Crepdog 532 collections: how many are indexable vs noindex not checked.

## 2. Title, meta, H1, structured data on pages fetched

### Takeaway

Crepdog Crew collection and blog pages were read in full; Superkicks blog read; others only homepages or sitemaps. Crepdog's model collection title packs model + audience + colour words; its collection pages have only BreadcrumbList schema.

### Cited Findings

- Crepdog Crew home: title "Get Limited Edition Sneakers & Streetwear in India | Crepdog Crew"; description "India's Biggest Platform for Sneakers, Streetwear, Watches & More. Get the latest limited edition drops and exclusive styles online — only at Crepdog Crew."; H1 "Crepdog Crew"; JSON-LD BreadcrumbList, WebSite+SearchAction, Organization. — [crepdogcrew.com](https://crepdogcrew.com/)
- Crepdog Crew model collection `/collections/adidas-samba`: title "Adidas Samba Sneakers | Women | Men | Black | White | Crepdog Crew"; description "Buy Adidas Samba shoes at CrepDogCrew. Samba is an iconic timeless design from Adidas in loads of colorways. Shop Sambas in White, Black, Green, Suede and more at CrepDogCrew"; H1 "ADIDAS SAMBA"; JSON-LD only BreadcrumbList (no ItemList, no FAQPage); about 2,300 visible words in page text but that includes the product grid and menus. — [page](https://crepdogcrew.com/collections/adidas-samba)
- Crepdog Crew blog `/blogs/articles/5-yeezy-must-haves`: title "5 YEEZY MUST-HAVES" (no brand suffix, no keyword frame); description is the first paragraph of the post; H1 same as title; JSON-LD Article, WebPage, Person, Organization, BreadcrumbList. — [page](https://crepdogcrew.com/blogs/articles/5-yeezy-must-haves)
- Superkicks blog `/blogs/community/the-rise-of-y2k-running-shoes-in-fashion`: title "The Rise of Y2K Running Shoes in Fashion – Superkicks"; description is first paragraph ("Nostalgia has a way of bringing the past back with a twist..."); H1 is post title; JSON-LD Organization, Article, WebPage, Person; about 1,100 words. — [page](https://www.superkicks.in/blogs/community/the-rise-of-y2k-running-shoes-in-fashion)
- Crepdog blog topics visible in sitemap slugs: "crack-d-the-evolution-of-air-jordan-1", "hype-season-highlight-fear-of-god", "5-yeezy-must-haves", "what-the-paul-and-what-it-means". Only 16 posts, so a thin editorial layer. — [articles sitemap](https://crepdogcrew.com/sitemap.xml)
- Superkicks blog slugs: release news ("saucony-shadow-6000-ny-cheesecake-october-31-2022") and culture ("the-rise-of-y2k-running-shoes-in-fashion"); 46 posts total. — [sitemap](https://www.superkicks.in/sitemap.xml)
- Dawntown blog slugs: "top-3-sneaker-for-monsoon", "luxury-sneakers-high-fashion-street-style", "evolution-air-jordans-michael-jordan-sneaker-culture", "sneaker-maintenance-air-jordans"; 8 posts. — [sitemap](https://dawntown.co.in/sitemap.xml)
- Limited Edt blog slugs under `/blogs/launches/` ("adidas-ivy-park-park-trail", "y-3-spring-summer-2023-chapter-1", "puma-dapper-dan", "feng-chen-wang-spring-summer-23"): brand launch announcements, 28 posts. — [sitemap](https://limitededt.in/sitemap.xml)
- VegNonVeg home (custom Laravel-style site, not Shopify): title "VegNonVeg: India's Premium Multi-Brand Sneaker, Apparel & Art Boutique"; description "VegNonVeg is India's first multi-brand sneaker store..."; Organization JSON-LD says "multiple retail locations across India ... since 2016". Note the canonical on `/sitemap.xml` response pointed at the sitemap URL itself and the sitemap URL returned the HTML home page (a sitemap/canonical misconfiguration, inferred from the fetch). — [vegnonveg.com](https://www.vegnonveg.com/)
- Hypefly (custom Next.js site, not Shopify): title "Hype Fly India | Premium and Limited Sneakers and Streetwear"; robots "index,follow"; sitemap index lists sitemap-0, products-sitemap, collections-sitemap, blog-sitemap. — [hypefly.co.in](https://hypefly.co.in/sitemap.xml)
- Find Your Kicks returned HTTP 503 with a "Maintenance | Find Your Kicks" page on 2026-11-21. — [findyourkicks.com](https://findyourkicks.com/)
- Sole Search (solesearchindia.com): /sitemap.xml, /collections.json, /products.json all returned an Apache 404; not Shopify. Home returned 301 (not followed to content). — [solesearchindia.com](https://solesearchindia.com/sitemap.xml)

### Inferences

- Blog title tags on both Shopify blogs are just post title + (brand), no "price in India" or query-shaped framing. Blogs are not where these sites win search (inferred; no ranking data collected).
- The collection title pattern "<Brand> <Model> Sneakers | Women | Men | <colours> | <Store>" is the only query-shaped title found.

### Gaps

- Not fetched (rate limit): Crepdog product page, Dunk Low collection, Superkicks product and collection pages, Dawntown and Limited Edt product/collection pages, VegNonVeg product/collection/blog, Hypefly product/collection/blog, Mainstreet Marketplace, Culture Circle (known facts only per brief). So no title/meta/H1 patterns, Product/AggregateRating schema, FAQ presence, size guides or authenticity copy confirmed for product pages of any competitor.
- Mainstreet Marketplace was not attempted at all.

## 3. Google India rankings, blogs in SERPs, traffic estimates, trust elements

### Takeaway

Not researched this session because the search quota was exhausted before any search ran.

### Cited Findings

- None. Only trust fact from fetched data: VegNonVeg Organization JSON-LD states retail locations and a 2016 start; Dawntown collection copy says "Every piece is checked before it ships." — sources above.

### Inferences

- None made.

### Gaps

- Ranking observations for "<model> price in india", "buy <model> india", "<model> india".
- Similarweb/Semrush estimates and dates.
- Trust elements per site (authenticity pages, review counts, press logos, store addresses).
- Other well-ranking Indian sneaker sites.
- Suggested rerun: after the quota resets (about 12:30am IST), fetch with spacing of 60+ seconds per host, via WebFetch, one host at a time, starting with Crepdog product page, Superkicks Air Jordan 1 collection, Dawntown New Balance 9060 collection, Limited Edt Samba collection, Culture Circle product page.

Scratch artefacts (raw sitemaps and a page extractor script) are in /private/tmp/claude-502/s/.
