# Culture Circle vs SNKRS CART, November 2026

Prepared 2026-11-18. Sources: our own Search Console and Merchant Center (pulled 2026-11-18 with `content-ml/commands/growth.sh`), both live sites fetched directly (robots.txt, sitemaps, one product page each), and web research on both brands (press, app stores, social, search results). Culture Circle business numbers are company-reported in press releases and are not verified.

## Verdict

Culture Circle is not a store of our size that does SEO better. It is a funded marketplace (Info Edge seed, Shark Tank India, 7,000+ sellers, five stores, an app) with a page for almost every sneaker model people search, each titled `<Model> Price in India` and carrying review stars. Search demand in this category is model-name queries, and they have hundreds of thousands of model pages against our 120 products. That gap explains most of the traffic difference. The part we can copy is the page shape, not the scale.

Also: the Semrush numbers for us point the wrong way. Our real organic clicks rose in October; they are falling now, in November, mostly because of one query.

## 1. Our real numbers (Search Console, not Semrush)

| Month             | Clicks, all countries | Impressions | Clicks, India |
| ----------------- | --------------------- | ----------- | ------------- |
| 2026-08           | 259                   | 18,202      | 157           |
| 2026-09           | 703                   | 34,414      | 316           |
| 2026-10           | 874                   | 53,411      | 587           |
| 2026-11 (1 to 15) | 270                   | 16,167      | 157           |

Semrush says October was 764 visits, down 810 from September. Search Console says October was our best month, up 24 percent. Semrush models small sites from a handful of tracked keywords, so treat it as a rough size class only; `growth.sh` is the source of truth.

The real decline is November: India 7-day average is 10 clicks a day against 22 a month ago, impressions 521 a day against 945.

## 2. Why November dropped

| Page or query                                            | Previous 28 days                | Last 28 days                           |
| -------------------------------------------------------- | ------------------------------- | -------------------------------------- |
| Query "new balance india"                                | 2,745 impressions, position 5.0 | 10 impressions, position 20.6          |
| Query "newbalance india"                                 | 274 impressions, position 5.8   | 3 impressions, position 35.7           |
| /brands/new-balance                                      | 3,597 impressions               | 76 impressions, position 26            |
| /blogs/indian-sneaker-festival-gurugram-2026             | 3,832 impressions               | 2,479 (event passed)                   |
| /drops/air-jordan-1-low-og-last-dance-at-the-garden-2026 | 702 impressions, 39 clicks      | 27 impressions, 0 clicks (drop passed) |

The New Balance brand page lost almost all of its visibility. Its title was rewritten on 2026-10-09 (commit bbe8d6d, "New Balance India: 1906R, 1000 & 2002R Prices"). The fall came after that change, but the data does not prove the title caused it; a Google update or a stronger competitor page could do the same. The two event pages decaying is normal for event content. The Thums Up x Gully Labs post is the one page still growing in clicks (72 to 122).

## 3. Side by side

| Signal                              | Culture Circle                                                                                                                                                                                                                                              | SNKRS CART                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Age                                 | Founded 2023, launched January 2024                                                                                                                                                                                                                         | Domain registered 2026-04-14                                                                                             |
| Funding and fame                    | about $2.45M (IIMA Ventures, Info Edge seed, Shark Tank India S4 in January 2025)                                                                                                                                                                           | none                                                                                                                     |
| Scale (company-reported)            | 7,000+ sellers, 2.5M+ listings, "5M+ monthly active users", GMV Rs 153 Cr in FY26                                                                                                                                                                           | about 119 products, 93 in stock                                                                                          |
| Offline                             | 5 stores (Delhi, Hyderabad, Pune, Mumbai and one more)                                                                                                                                                                                                      | none                                                                                                                     |
| App                                 | iOS 4.0 stars from 7.2K ratings; Rs 2,000 off for app install                                                                                                                                                                                               | none                                                                                                                     |
| Instagram                           | about 278K followers                                                                                                                                                                                                                                        | @snkrs_cart, small                                                                                                       |
| Press                               | Inc42, YourStory, Entrepreneur India, ThePrint, Tribune, BW Disrupt, Apparel Resources, The Ken                                                                                                                                                             | none found                                                                                                               |
| Independent reviews and directories | app store ratings, review and "is it genuine" pages, CheckCheck authentication                                                                                                                                                                              | none found on Trustpilot, Reddit, Justdial, IndiaMART or Crunchbase                                                      |
| Sitemap size                        | about 1,874 child sitemaps; one India product file sampled at 4,574 product URLs and about 30,000 images; 172 India product files, so roughly 790,000 India product URLs (extrapolated from one file); 13 more country copies with hreflang; 446 blog posts | 1,434 URLs: 120 products, 218 sneaker profiles, 215 drops, 262 blog posts, 591 tag pages                                 |
| Product page title                  | "Adidas Yeezy Boost 350 V2 Bone Price in India \| Culture Circle"                                                                                                                                                                                           | "Air Jordan 1 Low OG Game Royal CZ0790-140 \| Snkrs Cart"                                                                |
| Product structured data             | Product, 27 Offers, AggregateRating 4.8 from 1,484 reviews, 5 Reviews, FAQ                                                                                                                                                                                  | Product, ProductGroup, Offer, BreadcrumbList; no rating or reviews                                                       |
| AI crawlers in robots.txt           | all allowed                                                                                                                                                                                                                                                 | all allowed (parity)                                                                                                     |
| Google Shopping                     | no ads or Shopping presence found                                                                                                                                                                                                                           | Merchant Center cleared: 409 of 409 items eligible; listings live since 2026-10-22, 450 impressions and 10 clicks so far |
| Searching the brand name            | returns their site and press                                                                                                                                                                                                                                | "snkrs cart" returns Nike SNKRS app pages first                                                                          |

## 4. Findings, ranked by how much traffic they explain

1. **Page count on model queries.** People search `<model> price in India`. Culture Circle has a page for nearly every model and colourway; we have 120 products and 218 sneaker profiles. Our sneaker profiles got only 164 impressions in 90 days, because they are not titled for the query people type. This is the largest gap and the one we can partly close.
2. **Brand demand.** Shark Tank, press, stores and an app create branded searches that Google rewards across the whole domain. We have none yet, and our name collides with Nike's SNKRS app, so even people looking for us land on Nike first.
3. **Trust signals in the result.** Their product results show review stars from 1,484 reviews. Ours show no rating. Our product-snippet results ran at 5.0 percent CTR in October against 2.1 for the site, but only 2.8 against 2.7 now, so the snippet alone is no longer an edge; stars are the missing piece.
4. **Thin pages in our sitemap.** 591 tag pages are indexable and in the sitemap, 41 percent of all our URLs; the sampled tag page lists 2 posts. Many near-empty pages dilute how Google rates the site.
5. **No independent web presence.** No press, no Reddit threads, no listicles of "best sneaker sites in India", no directory listings. Culture Circle appears on LBB and in startup press; those lists also feed AI answers.
6. **Bing still lists the old host.** Web search (Bing-backed) still returns our blog posts on `snkrs-kart.vercel.app`. That host correctly 308-redirects to `www.snkrscart.com` today, so Bing has not recrawled. Bing feeds ChatGPT search and Copilot, so this costs AI visibility, not just Bing clicks.
7. **Where we are equal or ahead.** AI crawler access, Merchant feed, OpenAI product feed, MCP endpoint and agent docs. These are ready but only pay off once there is demand to capture.

## 5. What to do, in order

| #   | Action                                                                                                                                                                                                                  | Why (finding)                                         | Effort         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------- |
| 1   | Find out why /brands/new-balance fell from position 5 to 26: check the URL in Search Console URL Inspection, compare the live title with the pre-2026-10-09 title, and test restoring the old title on that page only   | Section 2: this one page is most of the November loss | S              |
| 2   | Retitle sneaker profiles and products to the `<Model> Price in India` pattern, keeping the style code in the description                                                                                                | Finding 1                                             | S              |
| 3   | Grow sneaker profiles toward the models India actually searches (Merchant best-seller clusters and our own query list), each with real price data from the store, sellers and scraped prices; no page without real data | Finding 1                                             | M              |
| 4   | Remove tag pages with fewer than 3 posts from the sitemap and mark them noindex                                                                                                                                         | Finding 4                                             | S              |
| 5   | Collect real product reviews after delivery and add AggregateRating only from those reviews                                                                                                                             | Finding 3                                             | M              |
| 6   | Verify the site in Bing Webmaster Tools, submit the sitemap, and keep pinging IndexNow                                                                                                                                  | Finding 6                                             | S (owner step) |
| 7   | Build off-site presence: Google Business Profile, Justdial, pitch "best sneaker stores in India" list writers, honest Reddit participation                                                                              | Findings 2 and 5                                      | M, ongoing     |
| 8   | Decide on the name: always write "SNKRS CART India" in titles and profiles, and consider the trademark risk of "SNKRS", which is Nike's app name                                                                        | Finding 2                                             | owner decision |

## Not copyable in the short term

Funding, Shark Tank, 7,000 sellers, physical stores, a 14-country catalogue and an app with thousands of ratings. Matching their total traffic is not a realistic target; matching their page shape on the models we stock is.

## Data and how to rerun

- Search Console and Merchant: `cd ~/snkrs-cart/content-ml && commands/growth.sh`, output `data/growth/growth_report.json`. The October data it replaced is backed up in the session scratchpad only.
- Sitemaps: <https://www.culture-circle.com/sitemap.xml> and <https://www.snkrscart.com/sitemap.xml>.
- Search result checks used a US-located web search tool, so presence was recorded, not true India rank positions.

## Addendum: Bing AI Topics export (2026-11-17)

Source: Bing Webmaster Tools, AI Performance, Topics Portfolio (beta since 2026-10-13), files `snkrscart.com_AITopicsOverallPortfolio_11_17_2026.csv` and `snkrscart.com_AITopicsTopOpportunityQueries_11_17_2026.csv`. Opportunity queries are queries in our topics where Bing's AI answers cite other sites and not us; the citation range is how often those answers cited someone.

| Topic Bing assigns us | AI query volume | Queries | Sites competing |
|---|---|---|---|
| Shoes & Footwear | 10M to 50M | 50K to 100K | 10K to 50K |
| Customer Reviews & Ratings | 10M to 50M | 100K to 500K | 50K to 100K |
| Shopping | 100M to 500M | 100K to 500K | 100K to 500K |

What the 50 opportunity queries say:

- About 30 of 50 are release-date questions. The biggest is "jordan release dates 2026" (1K to 5K citations to other sites), then "jordan releases 2026", "top sneaker releases 2026", "nike releases 2026" and "kobe shoes release 2026".
- 12 are Caitlin Clark or Nike Caitlin 1 release date and price variants, a US audience.
- A few are single models ("jordan 3 pure money", "air force 1 low") or lists ("most collectible luxury shoe brands").

What we already have against them:

| Query family | Our pages | Gap |
|---|---|---|
| Release dates 2026 | one /drops calendar ("Sneaker Release Dates India 2026", 50 Event items), 214 drop pages, 2 release round-up posts | no Jordan-only, Nike-only or Kobe calendar page |
| Caitlin 1 | 2 blogs and 1 drop page, separate | no single Caitlin 1 page with every colourway, date and price |
| Kobe 2026 | 35 Kobe pages | no "Kobe release dates 2026" page tying them together |
| Jordan 3 Pure Money | none | missing |
| Reviews and ratings topic | Bing files us under it | product pages show no rating (finding 3) |

Reading: Bing's AI already sees us as a release-date source but cites others because our dates are spread over many pages and one generic calendar. Brand calendars built from the drop data we already hold (Jordan, Nike, Kobe, Caitlin 1) answer these queries directly. Most of this demand is outside India, so the payoff is citations and authority more than orders.

Still needed from Bing: the Citations and Pages tab (which of our pages get cited, for which queries) and, after a few days, Search Performance from the www property.
