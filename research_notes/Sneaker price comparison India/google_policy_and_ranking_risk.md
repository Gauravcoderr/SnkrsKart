# Google policy and ranking risk for named-store price comparison pages (research date 2026-11-21)

Method note: WebFetch returns small-model summaries of truncated pages, so quoted fragments are verbatim only where shown in quotation marks, and no fetched Google page displayed a "last updated" date (only a footer copyright of 2026). Labels: VERIFIED = Google page opened this session; SECONDARY = trade press or SEO write-up; NOT FOUND = searched, nothing reliable. No store name or personal detail went into any query. About 15 tool calls were used; Mueller/Sullivan/Illyes 2024 to 2026 statements on comparison sites were not found.

## 1. Search spam policies and quality guidance (scraping, thin affiliation, doorway, scaled content, site reputation)

### Takeaway

Google's written policy covers the plan in three places: scraping ("republishing content from other sites without adding any original content or value"), thin affiliation (comparisons and ratings are named as the good alternative) and doorway abuse (many similar pages for similar queries). None of the pages mentions prices or price comparison by name, so the risk is about value added per page, not about showing other stores' prices as such.

### Cited Findings

- Scraping: "Scraping refers to the practice of taking content from other sites, often through automated means". Example abuse: "Republishing content from other sites without adding any original content or value, or even citing the original source". VERIFIED (fragment) — [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Thin affiliation: copied merchant content with no added value is abusive; good affiliate pages offer original reviews, rigorous testing and ratings, and product comparisons; "Not every site that participates in an affiliate program is a thin affiliate" (from earlier notes, same page). VERIFIED (fragment) — [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Doorway abuse: "sites or pages are created to rank for specific, similar search queries"; example "Creating substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy". VERIFIED (fragment) — [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Scaled content abuse: "many pages are generated for the primary purpose of manipulating" search rankings; keyword-stuffed nonsense example. VERIFIED (fragment; fuller wording in the earlier note) — [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Site reputation policy applies to "third-party content" published on a host site "mainly" to exploit its ranking; example is sponsored payday-loan reviews on an education site. It does not apply to a store writing its own comparison pages. VERIFIED (fragment) — [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Helpful content: warning sign "Are you mainly summarizing what others have to say without adding much value?"; "Attribution or giving credit to other sources doesn't replace the need for original effort"; Who/How/Why questions. Affiliate content was not in the fetched excerpt. VERIFIED (fragment) — [Creating helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- Mueller, Google hangout, 2017-05-05: "And you are not really adding value, you are just like showing two affiliate feeds." Old but the only Mueller statement on side-by-side merchant data that I could open. SECONDARY — [SERoundtable](https://www.seroundtable.com/google-two-affiliate-feeds-value-23807.html)
- Mueller, Bluesky, 2026-09-07 (from earlier notes): programmatic SEO "often leads to a site that's either spam, borderline spam, or low quality" and lost trust takes time to rebuild. SECONDARY — [SEJ](https://www.searchenginejournal.com/google-says-old-low-value-pages-may-affect-site-recovery/588837)

### Inferences

- A page that lists nine stores' prices fetched by script is a "scraped data" page in policy terms unless it adds things Google names as value: dated history, per-size availability, style code, sizing, our own tested notes. Prices as bare facts are not "content" in the copying sense, but a table that mirrors another store's catalogue row by row is the pattern the scraping example describes. This reading is inference; Google has not said anything on prices specifically.
- Nine named stores times about 120 models is a template at scale. Only models with real multi-store data and search demand should get a page, which also protects against the doorway pattern.

### Gaps

- Reviews system page and the Search Central statements by Sullivan, Illyes or Search Central 2024 to 2026 on comparison pages, programmatic pages or mixing a store with a comparison section: NOT FOUND. A search on "new unrelated section on a store site" returned only forum noise.
- No "last updated" dates were visible on any fetched page; re-check live.

## 2. Structured data for multi-seller price pages

### Takeaway

Product snippet markup may use AggregateOffer (lowPrice required, highPrice and offerCount recommended) for a product "being sold by multiple merchants". Merchant listing eligibility is the opposite: the merchant must be the seller, and pages that only link to other sellers are excluded. So a named-store page can carry product-snippet markup but must not be a merchant-listing candidate, and mixing the two on one URL is the risky design.

### Cited Findings

- "An AggregateOffer is a kind of Offer representing an aggregation of other offers." "it can be used for a product that is being sold by multiple merchants." lowPrice "The lowest price of all offers available" (required); highPrice and offerCount recommended; "Don't use AggregateOffer to describe a set of product variants"; "To be eligible for the price drop enhancement, use Offer, not AggregateOffer." VERIFIED (fragment) — [Product snippet](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)
- Merchant listings: "the merchant has to be the seller of the product in order to be eligible"; pages must be where shoppers can buy; excludes "pages with links to other sites that sell the product"; one product per page; merchant listings need Offer, not AggregateOffer. VERIFIED (fragment; text read to 100,000 of 104,759 chars) — [Merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing)
- General rules: "Don't mark up content that is not visible to readers of the page"; "Your structured data must be a true representation of the page content"; no misleading markup. A structured-data problem "can result in a manual action" that removes rich result eligibility but "does not change the page's ranking in web search". VERIFIED (fragment) — [Structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- Doc coverage of an `offers` array with different `seller` values: the product snippet page's wording on "multiple merchants" is the only support found. The fetched excerpts did not address a merchant marking up competitors' offers on its own domain.

### Inferences

- Markup of third-party offers is allowed in principle (AggregateOffer, offerCount equal to the number of stores actually listed and visible, low and high equal to visible figures). The worst failure is a mismatch between markup and visible price after the scraper's next run (stale JSON-LD), not the existence of competitor offers.
- Do not put our own `Offer` and AggregateOffer for competitors on the same Product node as the Merchant feed item; keep the stocked-model product page unchanged and put comparison on a separate URL with product-snippet-only markup, or no price markup.
- Offers with `seller` named: allowed syntactically; nothing in the fetched docs forbids it. Treat as untested.

### Gaps

- Last updated dates for these docs were not shown. Price drop and merchant listing doc changelog entries for 2025 to 2026 not read directly.

## 3. Merchant Center: competitor prices, outbound links, comparison sites, CSS, reinstated accounts

### Takeaway

No Merchant Center page I opened mentions competitor prices or price comparison on a merchant's site. The only text that could be applied is landing-page and domain rules, which bite on feed item landing pages, not on separate guide URLs. CSS does not exist in India. Google says suspended accounts are reinstated only in compelling circumstances, so a second suspension is a serious risk.

### Cited Findings

- Landing page requirements: "Only link to the domain from your Merchant Center account." "Don't redirect people to another website outside of the domain you claimed in your Merchant Center account." Multiple prices: "the additional prices should be clearly differentiable from the advertised base price." VERIFIED (fragment) — [Landing page requirements](https://support.google.com/merchants/answer/4752265)
- Search-based summary of the same page: the product on the landing page must be essentially identical to the feed product; feed price must be consistent through checkout. SECONDARY (search summary of Google page) — [Landing page requirements](https://support.google.com/merchants/answer/4752265?hl=en)
- Misrepresentation: bullets on prompting purchases without full information and on listings that represent you or products "in a way that isn't accurate, realistic, and truthful"; the visible text has nothing on competitors or other stores. VERIFIED (truncated) — [Misrepresentation](https://support.google.com/merchants/answer/6149970)
- Editorial and professional requirements: a site that is a "placeholder page, an ad-filled directory, or a generic search listing site" is a problem for site inaccessibility; "shouldn't be full of advertising listings and links". No mention of price comparison or competitor offers. VERIFIED (fragment) — [Editorial requirements](https://support.google.com/merchants/answer/6150244)
- Account enforcement: Google "may review information from multiple sources including your listing, website, accounts, and third-party sources"; warnings usually come first but "we may not issue a warning for egregious policy violations"; "In cases of repeated or egregious violations, we may ban you from advertising content with us"; "Accounts are only reinstated in compelling circumstances"; reviews "typically take 7 business days". The word "untrustworthy" does not appear. VERIFIED (truncated) — [Policy enforcement](https://support.google.com/merchants/answer/6150127)
- CSS programme: the requirements page lists 21 countries (Austria through the UK, including Germany, France, Italy, Netherlands, Spain, Poland, Switzerland, the UK). India is not listed. No date shown. VERIFIED — [CSS programme requirements](https://support.google.com/merchants/answer/7524491)
- Re-suspension anecdotes: merchants report suspension again after reinstatement when more products were added, and a reviewer may weigh website, accounts and external business information; Google does not publish a "probation" rule. SECONDARY, forum anecdote — [Shopify community](https://community.shopify.com/t/the-gmc-account-was-suspended-again-due-to-misrepresentation-after-reinstated-successfully/272861)

### Inferences

- Nothing found says a competitor-price page on the same domain violates Misrepresentation, but reviewers read the whole site ("website" is named). A page that tells shoppers another store is cheaper, sits on the domain claimed in Merchant Center, and sends them away is the closest fit to "don't redirect people to another website" if it is reachable from, or shown as, a feed landing page. Keep feed landing pages (product URLs) free of competitor prices and outbound shop links; put comparison only on separate guide URLs not in the feed.
- A site where the pages that carry the strongest claims ("cheapest store is X") are driven by a scraper that can be stale raises exactly the "not accurate, realistic and truthful" risk. Combined with the earlier suspension this is the highest-cost risk in the plan, with no appeal evidence that a repeat is easier.
- Free listings outside EEA/UK have no comparison-site programme; there is no India route for a comparison service to get Google placements.

### Gaps

- Price mismatch policy page and "untrustworthy promotions" page were not opened this pass (earlier note cites 10330822 and 12159029). Whether Google staff say anything about a merchant displaying competitor prices: NOT FOUND. Last-updated dates not shown. Reinstated-account scrutiny: no Google statement; only anecdotes.

## 4. Outbound links (nofollow, sponsored) and accuracy duty

### Takeaway

Google asks for `rel="sponsored"` on paid or affiliate links and accepts `nofollow` when other values do not fit; ordinary editorial links to stores need no attribute but a nofollow on a long list of commercial links is the safe default for a page whose purpose is partly commercial.

### Cited Findings

- "Mark links that are advertisements or paid placements (commonly called paid links) with the sponsored value"; nofollow "still acceptable" for these; "Use the nofollow value when other values don't apply"; ugc for user-generated links. VERIFIED (fragment) — [Qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links)
- Accuracy: structured data must be a "true representation of the page content" and match visible content. VERIFIED — [Structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- Feed and landing-page price matching and misrepresentation consequences (from earlier notes): [Merchant Center price help](https://support.google.com/merchants/answer/12159029)

### Inferences

- Use `rel="sponsored nofollow"` on any link that earns commission, `rel="nofollow"` otherwise; add visible "price seen on <date>" per row and hide a row when its observation is older than a set age (for example 48 hours given a twice daily scraper).
- No Google statement found on a limit of outbound commercial links.

### Gaps

- No Google text on penalties for stale prices on a non-merchant page beyond the structured data and Merchant Center rules above.

## 5. Ranking outcomes of comparison, affiliate and deal sites (2023 to 2026)

### Takeaway

There is no clean win or loss pattern for price comparison sites. Established brands (idealo, PriceRunner, GoodRx, Trivago) mostly held or grew, while aggregators without owned content lost in 2026 Sistrix data; German comparison sites fell in November 2026 mostly before the core update began. Evidence for small sites is absent.

### Cited Findings

- Germany, Sistrix visibility 2 to 17 November 2026 (core update started 10 November): billiger.de -27.8% (most of it before 10 Nov), idealo.de -19.9%, geizhals.de -12.9%, vergleich.org +49.9%, testsieger.de +10.6%, test.de +10.4%. The article gives no definitive cause, notes the idealo sub-periods do not add to the headline, and says final evaluation is possible early December at the earliest. SECONDARY — [drweb.de](https://www.drweb.de/core-update-preisvergleiche-sichtbarkeit/)
- March 2026 core update, US, Sistrix 27 March to 8 April (Amsive analysis): aggregators and platforms lost (YouTube -567, Reddit -64, TripAdvisor -45, Expedia -33, Indeed -18); GoodRx (drug pricing) +55%, Trivago +3.2, Hotels.com +3.6. The author says sites that "own the thing" gained over platforms that comment on it; no site is called a price comparison site in the article; visibility index not traffic; Google gave no detail. SECONDARY — [SEJ](https://searchenginejournal.com/googles-march-core-update-shifted-visibility-away-from-aggregators/573621)
- UK Sistrix tables: idealo.co.uk and PriceRunner appeared among gainers in the December 2025 core update and in a July to September 2025 window. SECONDARY (search snippet only, tables not opened) — [Sistrix December 2025 core update](https://www.sistrix.com/blog/google-december-2025-core-update-information-and-analysis/)
- Other named sites (Skinflint, Shopzilla, PriceGrabber, Camelcamelcamel, Slickdeals, 91mobiles, Smartprix, MySmartPrice, Sneakers123, Sole Retriever, The Sole Supplier) and the September 2023 helpful content update, March 2024 and 2024 site reputation actions: NOT FOUND in this pass. A direct search for Sneakers123, Sole Retriever, 91mobiles and MySmartPrice returned nothing about them.

### Inferences

- What separates winners in the available data: brand demand and owned data (GoodRx, idealo as a brand people search by name), consistent with Google favouring sources that "own the thing". A new domain has neither.
- The idealo figures show even the largest German comparison brand moving 13 to 20 percent in two weeks, so comparison traffic is volatile even for incumbents.

### Gaps

- No case of a domain under one year old ranking a comparison section, and no time-to-rank figure, was found. No Google statement on a site whose new section differs from its main purpose was found.

## 6. AI Overviews, Google's own comparison units and clicks

### Takeaway

Google has put its own comparison unit in Europe and AI Overviews now cover many shopping queries; neither has an India-specific, price-comparison-specific click study. Reported click losses are correlational except one field study.

### Cited Findings

- Since 8 September 2026 the EEA shows a "Comparison Sites" box replacing product carousels; Sistrix (October 2026, via drweb) found it on 5.9% of German results and 19.2% of purchase-intent searches, and not in Switzerland, the UK or the US. Idealo appears in its top three in 15.7% of cases. EEA only. SECONDARY — [drweb.de on the comparison box](https://www.drweb.de/google-vergleichsbox-eu-google-shopping/); [drweb.de](https://www.drweb.de/core-update-preisvergleiche-sichtbarkeit/)
- AI Overviews on about 14% of shopping queries (up from 2.1% in November 2025, Visibility Labs); Semrush figure of 96.1% for "best X for Y" shopping queries in August 2026, different query set. SECONDARY — [eMarketer](https://www.emarketer.com/content/google-ai-overviews-more-common-product-searches-complicating-discovery); [Search Engine Land](https://searchengineland.com/google-ai-overviews-shopping-queries-report-471981)
- A randomised field study reported 38% fewer organic clicks on triggered queries; Ahrefs (correlational) reports 58% lower CTR for top pages with AI Overviews. SECONDARY — [SEJ](https://www.searchenginejournal.com/ai-overviews-cut-organic-clicks-38-field-study-finds/573145/)
- Shopping ad impressions down and CTR up mid-2025 to mid-2026 (Mike Ryan data). SECONDARY — [SERoundtable](https://seroundtable.com/google-shopping-ads-imp-ctr-42021.html)
- India: April 2026 AI shopping in Gemini, AI Mode and Circle to Search runs on the Shopping Graph (from earlier notes). — [Google India blog](https://blog.google/intl/en-in/products/explore-communicate/new-ways-google-is-using-ai-to-make-shopping-easier/)

### Inferences

- For "price in india" queries, AI answers most likely pull stocked items from Merchant Center data, which is a reason not to jeopardise the account for a comparison section.

### Gaps

- Whether AI Overviews or AI Mode cite comparison pages for "price in india": NOT FOUND. No 2025 to 2026 study of clicks to comparison sites after Google's in-SERP comparison units: NOT FOUND beyond the German Sistrix box coverage.

## Bottom line for the named-store plan (inference, not Google)

- Written policy does not ban it, but it gives no safe harbour either; the real exposure is Merchant Center on a domain already suspended once.
- Lower-risk design: separate guide URLs, not feed landing pages, noindex-or-no-link from product pages, own price history and dated rows, stale rows hidden, `sponsored nofollow` links, product-snippet markup only (or none), a small hand-reviewed first batch.
- Naming a competitor as cheapest is not addressed by any Google text found; it is a trust and accuracy question as much as a policy one.
