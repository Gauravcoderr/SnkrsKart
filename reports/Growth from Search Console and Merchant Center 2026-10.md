# Growth from Search Console and Merchant Center, October 2026

Data: Google Search Console for sc-domain:snkrscart.com (2026-04-19 to 2026-10-06, web search, India unless stated) and Merchant Center account 5750742430 (pulled 2026-10-10). Everything here is reproducible with `content-ml/commands/growth.sh`; the full numbers are in `content-ml/data/growth/growth_report.json`.

## The one-paragraph verdict

Organic search is growing fast but it is a magazine, not a store. Blog and drop posts earn almost all impressions, product pages are invisible, and the Merchant Center account is suspended for misrepresentation with 390 of 398 feed items rejected over a capacity cap, so Google Shopping shows nothing. Half the readers are outside India and cannot buy. The two levers that matter most are getting the Merchant account approved and turning the pages that already rank into shop entry points. The host redirect (snkrscart.com to www) already returns a 308 and brand pages are already in the sitemap, so those two items from the first draft need no work. The modelled upside on existing rankings alone is about 115 extra clicks a month on the current 300, before Shopping is counted.

## Where traffic stands

| India, web search | Value |
|---|---|
| Clicks, last 28 days | 297 (previous 28: 138, up 115 percent) |
| Impressions, last 28 days | 14,360 (previous: 8,585, up 67 percent) |
| 90-day fitted growth | impressions up 2.0 percent a day, clicks up 1.0 percent a day |
| 7-day average now | 558 impressions, 5.9 clicks a day (30 days ago: 328 and 7.3) |
| Biggest day | 2026-09-25: 68 clicks, 1,133 impressions, 24 standard deviations above baseline (Indian Sneaker Festival lineup) |
| Next 30 days | 303 clicks if the trend holds, 175 if flat |
| Monthly clicks | Jun 77, Jul 148, Aug 157, Sep 316 |

Friday is the strongest day (9.9 clicks a day against about 6 on other days). Mobile carries 68 percent of impressions at average position 8.2; desktop sits at position 16.9 for the same site.

## Finding 1: Merchant Center is dark

| Merchant Center | Value |
|---|---|
| Account issue | Misrepresentation, CRITICAL, found by a manual check, blocks all products in India |
| Review | Requested 2026-10-09, "can take a few days" |
| Feed items sent | 398 (115 products, 92 with stock) |
| Latest upload | 2026-10-09, SUCCEEDED, 390 items rejected "Over capacity, items rejected", 8 processed |
| Accepted products | 8, all NOT_ELIGIBLE_OR_DISAPPROVED, issue codes misrepresentation and misrepresentation_limited_visibility |
| Product performance, 90 days | 0 rows: no product impression or click has ever been recorded |
| Non-product performance, 90 days | 1,517 clicks on 253,194 impressions, second half 1,092 clicks against 425 in the first half |

The non-product row is the surprise. Store and page links on Google surfaces that are not in Search Console already bring about 500 clicks a month and are rising 2.5x half over half. That is proof the account can perform once products are allowed in.

Google's own root-cause list for the suspension: business identity and model transparency on the site and in Merchant Center, visible reviews or trust badges, a professional store with no placeholders or redirects, complete business information settings plus a linked Google Business Profile, and product data that matches the store. The capacity cap is a separate limit on new accounts and is lifted by support after approval.

Demand data from the same account, category Shoes in India, latest week: Nike 1, PUMA 2, adidas 3, Red Tape 4, Bata 5, Asian 6, Campus 7, Sparx 8, Nivia 9, Skechers 10, ASICS 11, Crocs 12, Woodland 13, New Balance 14. We carry 6 of the top 14. Of the 1,000 best-selling product clusters Google tracks, we stock 1. The top of that list is mass-market running (Court Vision Low, Downshifter 14, Revolution 8, Duramo SL, Air Force 1 07, Samba OG, New Balance 530, Adizero EVO SL as a riser). Our catalogue is the premium slice, so Shopping listings should target model-plus-India queries rather than compete on volume.

## Finding 2: the site ranks as a magazine

| Page type, 90 days | Pages | Impressions | Clicks | CTR |
|---|---|---|---|---|
| Blog | 93 | 8,480 | 90 | 1.1 percent |
| Brand | 5 | 5,679 | 2 | 0.04 percent |
| Drop | 40 | 1,227 | 45 | 3.7 percent |
| Product | 47 | 368 | 5 | 1.4 percent |
| Sneaker profile | 24 | 125 | 2 | 1.6 percent |

Of 115 products in the feed, 46 pages got any impression in 90 days and 88 never appeared, including in-stock pairs like the Air Jordan 1 Low Tokyo Bio Hack, Nike Mind 001, Jordan 1 Low OG Laser, New Balance 1906 and 2002R. By query intent the picture is the same: transactional queries are the largest bucket (5,140 impressions in 90 days) and the worst converting (0.3 percent CTR), against 1.8 percent for navigational and informational queries. People search to buy, land on a brand page or a blog, and do not click.

Sixty commercial or navigational queries (1,675 impressions) rank with a blog, a drop page or nothing; 26 of them match an in-stock product that does not rank. Examples: every "last dance at the garden" query ranks the drop page while the AJ1 Low OG Garden product is in stock; "nike mind 001 india" and "nike mind 001 myntra" rank the blog while the Mind 001 product is in stock; "adidas pokemon shoes india" ranks a blog and we have no product.

Drop pages convert best of anything (3.7 percent) because they carry the exact model name, a date and a price. Product and brand pages should look like that in the result.

## Finding 3: the biggest single leak is one brand page

The site's own CTR-by-position curve, fitted with isotonic regression on 1,607 page-by-query rows from 90 days: about 3.1 percent at positions 1 to 5, 1.0 percent at 6 to 10, 0.2 percent at 12 and beyond. Scoring every row against it:

| Opportunity, 90 days | Clicks |
|---|---|
| Actual clicks on scored rows | 147 |
| CTR gap (below the curve at the current position) | 89 |
| Rank lift (to position 3 where the row is at 4 to 20) | 255 |

| Page | Impressions | Clicks | Position | Missed clicks, 90 days |
|---|---|---|---|---|
| /blogs/indian-sneaker-festival-gurugram-2026 | 5,220 | 34 | 7.9 | 129 |
| /brands/new-balance | 4,473 | 1 | 8.7 | 123 |
| /blogs/best-sneakers-college-students-india | 497 | 1 | 10.4 | 14 |
| /brands/nike | 541 | 1 | 16.8 | 13 |
| /drops/air-jordan-1-low-og-last-dance-at-the-garden-2026 | 693 | 38 | 7.8 | 10 |

"new balance india" alone: 3,326 impressions at position 5.3 and zero clicks in 90 days; it grew from 418 to 2,886 impressions in the last 28 days. The brand title and description were rewritten on 2026-10-09 (now "New Balance India: 1906R, 1000 & 2002R Prices"), which the data does not yet cover. Watch this one query in the next pull; if CTR stays under 1 percent the page needs price, stock count and model images in the result (Product structured data), not another title.

Query clusters (TF-IDF plus KMeans on 1,520 queries) tell the same story: the "india new balance" cluster has 4,133 impressions and 2 clicks; "jordan air india" has 570 impressions at position 31; "price india jordan" has 343 at position 17. The clusters that convert are events and named drops: "last dance jordan" 5.6 percent, "adidas pokemon" 5.7 percent.

A LightGBM CTR model on the same rows (position, impressions, page type, query intent, slug overlap) scores a negative out-of-fold R2, so at this volume CTR is noise-dominated and the isotonic curve is the model to trust. Revisit when clicks are ten times higher.

## Finding 4: table-of-contents anchors show up as jump links

Four blog posts report `#heading-N` URLs as separate rows: 1,490 impressions in 28 days with zero clicks. The festival post alone shows 1,425 of its 3,088 impressions on anchor URLs. These rows are Google's jump links (the "Jump to" section links shown under a result), so the main URL keeps its ranking and the extra rows are a reporting artefact, not a leak. Keep the anchors; removing them would remove the jump links. The ids were numbered (`heading-0`, `heading-1`) and shifted whenever a heading was added, which broke old links. Shipped 2026-10-10: ids are now stable slugs of the heading text.

## Finding 5: half the audience cannot buy

Last 28 days, all countries: USA 24,419 impressions and 291 clicks, India 13,994 impressions and 288 clicks. India is 30 percent of impressions and 39 percent of clicks. The store ships only to India. Topics like "best white sneakers 2025" and Jordan release coverage attract a global readership that cannot convert.

## Smaller signals

- PRODUCT_SNIPPETS rich results: 128 clicks on 2,581 impressions (5.0 percent CTR) against 2.1 percent for the site. Structured data is the cheapest CTR lever available.
- Image search: 1,630 impressions, 1 click; "nike mind 001" has 381 image impressions at position 30. Product images with descriptive filenames and alt text are not ranking.
- Falling: /brands/nike dropped from 340 to 84 impressions (position 16 to 26), /brands/jordan from 216 to 122, the college-students post from 276 to 14, and "new balance india website" vanished from position 2.5.
- Rising and new: all festival queries, "best white sneakers 2025" (168 impressions at position 5.8, new), the Last Dance drop (693 impressions from nothing), "nike mind 001 india".
- Cannibalisation is minor: "snkrs india" splits between /brands/nike and the home page; "adidas pokemon india" between two blog posts.
- Discover: no traffic recorded.

## Next actions, in order

| # | Action | Evidence | Expected | Effort |
|---|---|---|---|---|
| 1 | Clear the Merchant misrepresentation suspension and the item cap | 390 of 398 items rejected, 8 accepted and disapproved, 0 product clicks ever, non-product surfaces already give 500 clicks a month | A new channel: about 200 in-stock sizes in free listings | M |
| 2 | Fix CTR on pages already on page one: titles, descriptions, Product and Offer structured data on brand and category pages (brand JSON-LD now prices from live per-size offers, shipped 2026-10-10) | 89 missed clicks per 90 days below the site's own curve, 45 of them on /brands/new-balance; product snippets run at 5 percent CTR | 15 to 30 extra clicks a month | S |
| 3 | Push striking-distance pages from positions 4 to 15 into the top 3 | 255 modelled clicks per 90 days; targets listed in growth_report.json under opportunities_page_query_top | 25 to 50 extra clicks a month | M |
| 4 | Make product and brand pages visible (shipped 2026-10-10: blogs and drops auto-link the matching in-stock product with Product `mentions` in the article JSON-LD; landing pages /category/air-jordan-1, /category/air-jordan-4, /category/nike-dunk-low; product sitemap lastmod from updatedAt). Still open: check index coverage for /products/ in Search Console | 88 of 115 product pages never seen, 26 in-stock products behind queries that rank a blog instead | Product pages reach 5 to 10 percent of blog impressions in two months | M |
| 5 | Keep the anchors, make their ids stable (shipped 2026-10-10) | 1,490 impressions on #heading-N URLs in 28 days are jump links, not a leak; numbered ids broke old links | Jump links survive edits; nothing to consolidate | S |
| 6 | Plan posts around spikes: a calendar of India events and drops, published 10 days ahead and updated on the day, plus a monthly drops hub | Week 39 (festival plus Last Dance) was the best week with 153 clicks | About 100 extra clicks for each spike month | M |
| 7 | Decide what to do with the 70 percent non-India impressions: geo-target topics to India (INR prices, where to buy in India) or monetise with affiliate links | USA matches India in clicks, cannot buy | A higher share of clicks that can convert | S |
| 8 | Keep the non-product Merchant surfaces complete (brand and category pages are already in the sitemap; business profile, logo and policies are Merchant Center settings) | 1,517 clicks in 90 days, rising 2.5x half over half | Holds 500 clicks a month and compounds with action 1 | S |
| 9 | Source what Google says India buys, within our premium lane | We stock 1 of 1,000 tracked best-seller clusters; carry 6 of the top 14 brands | Demand-led catalogue growth | L |

## How to rerun

```bash
cd ~/snkrs-cart/content-ml
commands/growth.sh            # pull everything and analyse (about 30 seconds)
commands/growth.sh --no-pull  # analyse saved data
```

Compare the next run against this one on: Merchant product_performance_view rows, products accepted by Google, CTR of "new balance india", fragment_impressions, product_pages_with_impressions_90d, india_click_share and the 28-day click total.
