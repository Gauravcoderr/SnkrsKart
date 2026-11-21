# Local data audit: what the store already holds (2026-11-21)

Source: read-only queries against the store's own MongoDB (collections `ScrapedProduct`, `Product`) and its own Search Console export (`content-ml/data/growth/gsc_query_90.json`, 90 days to mid November 2026). All figures verified first-hand on 2026-11-21. Nothing here comes from the web.

## 1. What the scraper holds

| Store             | Listings stored | With a price | Seen in last 2 days | Seen in last 30 days | Sizes stored | Manufacturer style code stored                                                   |
| ----------------- | --------------- | ------------ | ------------------- | -------------------- | ------------ | -------------------------------------------------------------------------------- |
| Ajio              | 818             | 818          | 241                 | 566                  | 0            | 0 (field holds Ajio's internal id, e.g. `469811286002`)                          |
| Tata CLiQ         | 733             | 733          | 224                 | 547                  | 0            | 0 (internal id `MP000000031743956`); a style code appears in 15 URLs and 7 names |
| Tata CLiQ Luxury  | 610             | 610          | 235                 | 450                  | 0            | 0 (internal id); 13 URLs and 10 names carry one                                  |
| Superkicks        | 507             | 507          | 136                 | 211                  | 505          | 0                                                                                |
| Foot Locker India | 502             | 469          | 232                 | 375                  | 464          | 0 (internal id `NIKEX00089031`); 12 URLs carry one                               |
| VegNonVeg         | 366             | 366          | 142                 | 207                  | 0            | 0                                                                                |
| Myntra            | 352             | 345          | 0                   | 0                    | 345          | 0. Last successful scrape 2026-10-08, so this source is stale                    |
| Limited Edt       | 212             | 212          | 80                  | 102                  | 210          | 0 (2 descriptions carry one)                                                     |
| Nike India        | 0               | 0            | 0                   | 0                    | 0            | 0. Listed as a source in code, no rows stored                                    |

- Total 4,100 listings; 2,370 are priced, adult and seen in the last 30 days.
- Not scraped at all: Culture Circle, Crepdog Crew, Mainstreet, Dawntown, HypeFly. The owner's proposal names Culture Circle first.
- Only brands scraped: Nike, Jordan, Adidas, New Balance, Crocs.
- Foot Locker rows include clothing (T-shirts, pants), not only shoes.
- Colourway is stored only for Tata CLiQ rows. VegNonVeg rows store a bare model name ("MOON SHOE OG"); the colourway is only in the URL slug.

## 2. Can the same shoe be lined up across stores today? No.

- A side-by-side page needs proof that two listings are the same shoe (same style code, for example `553558-045`). No source stores the manufacturer style code as a field.
- Using the stored `sku` field: 1,839 distinct values, 1,838 appear on exactly one store. The single shared value is between Tata CLiQ and Tata CLiQ Luxury (same company). No pair of independent stores shares one.
- The store's own catalogue: 90 shoe products (71 in stock), 89 with a real style code. Zero of those style codes appear anywhere in a scraped row (sku, URL, name or description).
- Loose name matching (every distinctive name word of our product present on a scraped row, same brand): 14 of 90 products match at least one store, 3 match three stores. This is the same model-level matching that, on 2026-10-10, linked 44 drops to products and got the colourway wrong on 43 of them. It cannot support a "same pair, cheaper at store X" claim.
- Catalogue overlap is thin by nature: Ajio and Tata CLiQ rows are mostly mass-market pairs (Court Vision Low Rs 3,248, Downshifter 14 Rs 3,916, Ebernon Low Rs 2,498), while the store's own stock is Jordan 1, Jordan 4, Dunk and New Balance lifestyle pairs at roughly Rs 8,000 to 20,000.

## 3. No price history exists

The ingest route overwrites each listing in place (`$set` on the same document, keyed by source URL) and stamps `scrapedAt`. There is no time series of past prices. An earlier report's suggestion to show "price history from the daily scrape" has no stored data behind it yet; history would start on the day a history collection is added.

## 4. Per-size prices are not available for most sources

Sizes in stock are stored for Superkicks, Foot Locker, Limited Edt and (stale) Myntra. Ajio, Tata CLiQ, Tata CLiQ Luxury and VegNonVeg rows have no sizes. No source has a price per size (retail stores charge one price for all sizes; resale platforms such as Culture Circle price per size and are not scraped).

## 5. The store's own price position

- Google Merchant Center, 2026-11-21: 54 of 85 benchmarked items are more than 5 percent above Google's India price benchmark. On most pairs with a benchmark the store would not be the cheapest row on its own comparison page.
- Listed price for seller pairs is seller price plus 10 percent, rounded up to Rs 10.

## 6. What the store's own Search Console says about price and comparison queries (90 days)

2,173 queries, 24,324 impressions, 358 clicks in the file. These numbers show only queries the site already appears for, so they understate total market demand, but they show which shapes Google already associates with the site.

| Query shape                                               | Queries | Impressions | Share of impressions | Clicks | Avg position |
| --------------------------------------------------------- | ------- | ----------- | -------------------- | ------ | ------------ |
| Contains "price in india"                                 | 35      | 369         | 1.5%                 | 2      | 16.8         |
| Contains any price word (price, cost, rate)               | 184     | 1,132       | 4.7%                 | 9      | 12.3         |
| Cheapest, lowest, best price, discount, sale, offer, deal | 37      | 63          | 0.3%                 | 0      | 18.1         |
| "vs" or "compare"                                         | 26      | 184         | 0.8%                 | 3      | 11.7         |
| "where to buy", "buy", "shop"                             | 30      | 54          | 0.2%                 | 1      | 14.4         |
| Legit, fake, original, authentic                          | 25      | 34          | 0.1%                 | 0      | 13.6         |
| Names another store                                       | 12      | 69          | 0.3%                 | 3      | 5.3          |

- Top price queries: "jhope nike shoes price" (226 impressions, position 5.0), "jhope nike shoes price in india" (69, position 3.0), "air jordan shoes price in india" (27, position 32.7), "new balance shoes price in india" (27, position 27.9), "air jordan 1 price in india" (23, position 27.8).
- Every "vs" query is brand against brand ("nike vs adidas which is better", 66 impressions) or country against country ("onitsuka tiger price in japan vs india"). None is store against store, and none is "<model> price comparison".
- Store-name queries are almost all one query: "nike mind 001 myntra" (53 impressions, 3 clicks, position 3.3). Others: "is culture circle genuine" (1), "is superkicks india legit" (1), "culture circle or hype fly: which is better for buying authentic" (3).
- No query in the file contains "price comparison", "compare price" or "cheapest".

## 7. What the store already ships that overlaps with the proposal

- Sneaker profile pages titled "<Model> Price in India" with a dated answer sentence, an anonymous India price range (lowest, middle, highest, number of listings) built from own stock plus scraped prices of the last 30 days, and a table of the store's own pairs. Built 2026-11-21, not yet measured.
- Hub page `/sneakers/price-in-india` listing models with India price data.
- Standing project rule: never name the stores behind scraped prices, never link to them; show only the range and the listing count. The proposal under research would reverse this rule.
- "Found it cheaper? Verify the deal" button on product pages: a shopper submits another store's URL and the store's admin checks it. This is an existing, opt-in, shopper-supplied form of cross-store price comparison.
- Merchant Center history: suspended for Misrepresentation in October 2026, reinstated 2026-10-20. A cause the owner identified was the site promising one thing (free shipping) while checkout charged another.

## 8. Engineering implications (first-hand reading of the code)

- To compare the same shoe across stores the scraper must capture the manufacturer style code from each store's product detail page (it is printed on VegNonVeg, Superkicks, Limited Edt and Foot Locker product pages, not in listing JSON). That means one extra request per product per store, on hosts that already rate-limit or block (Foot Locker's Akamai blocks an IP after heavy probing; Ajio needs a headless browser fallback; a paid ScrapingAnt fallback is metered per request).
- Culture Circle, Crepdog Crew and Mainstreet need new scrapers.
- A price history collection, a matching table keyed by style code, freshness rules (hide a row older than N hours) and a takedown switch per store would all be new.
- Backend runs on Render free tier and the frontend on Vercel Hobby with CPU and ISR write limits already hit once (project paused 2026-11-18). Comparison pages whose content changes twice a day add ISR writes.
