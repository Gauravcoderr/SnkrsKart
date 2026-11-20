# Google free shopping listings and review stars for a small Indian store (as of 2026-11-21)

Notes: research ran with search snippets and page summaries from a small fetch model, so exact wording should be re-checked on the live Google pages before being quoted. No private business names were used in queries.

## 1. Free listings in India: surfaces and what drives ranking

### Takeaway
Free listings show on the Shopping tab, Search rich results, Images/Lens, and (limited countries) YouTube; Maps and Gemini are mentioned. Google publishes no ranking formula for free listings; it says relevance and quality of product data come first, plus identifiers, images, shipping and returns. India is confirmed for the Shopping Knowledge Panel and for AI shopping in Gemini/AI Mode (April 2026).

### Cited Findings
- Free listings appear in the Shopping tab (local free listings if opted in), in Search (price, availability, reviews rich results, global; "Popular Products" for apparel is US mobile only), in Images and Lens (global), on YouTube (limited countries), and the page also mentions Maps via Business Profile products and Gemini. Shopping Knowledge Panel is available in India, and needs GTIN or MPN + brand. India-specific rules for Shopping tab, Images, YouTube not stated. — [Free listings, Google Merchant Center Help](https://support.google.com/merchants/answer/9199328)
- Google says high-quality, informative, relevant content is the most important factor; no ranking factor list is published. Tips: fill required attributes, GTIN or MPN+brand, shipping and return policy, keywords in titles, large images with no promotional overlays, price consistent with the site, link Business Profile, check Performance report filtered to free listings. — [same page](https://support.google.com/merchants/answer/9199328)
- Google's 2021 welcome guide says results are based on relevance and quality; small and medium merchants saw the largest share of impression gains. Free listings sit below paid Shopping ads in the Shopping tab. Impressions below a minimum threshold may not be shown. — [Google free listings welcome PDF (March 2021)](https://services.google.com/fh/files/misc/free_listings_buy_on_google_welcome.pdf)
- Google's 2022 Shoptalk post: Trusted Store badge is based on shipping speed, shipping and return costs, return windows; early tests showed badge merchants get more clicks. — [Google blog, Shoptalk 2022](https://blog.google/products-and-platforms/products/shopping/shoptalk-2022/)
- Third-party practitioner view: title is among the most important factors; put brand/model early. Not official. — [Search Engine Land](https://searchengineland.com/google-shopping-optimize-free-product-listings-430104)
- Google India blog, 7 April 2026: Gemini app, AI Mode and Circle to Search shopping in India are powered by the Shopping Graph (50B+ products, 2B updated hourly); Gemini shopping in English and Hindi, AI Mode shopping English with Hindi "soon"; answers combine price, reviews, inventory. The post says nothing about merchant feeds or checkout. — [Google India blog](https://blog.google/intl/en-in/products/explore-communicate/new-ways-google-is-using-ai-to-make-shopping-easier/)
- AI Mode search rolled out in India 8 July 2025. — [PPC Land](https://ppc.land/google-launches-ai-mode-search-in-india/)
- Reported test (date unconfirmed) of buying certain Flipkart products directly inside Gemini/AI Mode in India; no merchant onboarding path for small stores found. — [YourStory](https://yourstory.com/ai-story/gemini-shopping-assistant-flipkart-india)

### Inferences
- With no ranking formula published, the levers are the documented ones: keyword-rich titles, real GTIN/MPN+brand, clean images, price accuracy, shipping/returns, reviews. Reviews and price are also what AI Mode answers cite, so they matter beyond the Shopping tab.
- 11 clicks / 350 impressions in the first weeks is plausibly just a new-account ramp plus low-signal listings; Google itself says impressions may be hidden under a threshold.

### Gaps
- No official 2025/2026 statement on weights of ranking factors. No India-specific free listing ranking study found.
- Whether Maps/Business Profile product listings are active for India stores: unconfirmed.

## 2. Price competitiveness, benchmarks, sale and price-drop annotations, store quality

### Takeaway
Benchmarks need a valid GTIN, compare you to click-weighted average of retailers selling the same GTIN, and Google calls it a price that "typically leads to more successful" auctions/clicks. Google does not publish how much free-listing visibility drops when above benchmark. Top Quality Store India status is conflicting.

### Cited Findings
- Benchmark = price that typically leads to more impressions/clicks/conversions, computed from all retailers selling the same GTIN in Shopping ads and organic listings; price gap is % difference vs benchmark; you must supply a valid GTIN to get benchmark data. Sale price suggestions need conversion reporting and show click/conversion uplift estimates from 7-day simulations; stop appearing when automated discounts are on. Data is for internal use only. The page does not describe the visibility effect or country coverage. — [About Pricing in Merchant Center Analytics](https://support.google.com/merchants/answer/11916926)
- Price competitiveness report lives under Growth; "free listings" there means the Shopping tab; products with too few retailers or too few clicks are excluded. Older price benchmark report was retired 1 Sept 2025, replaced by the price competitiveness table. — [Merchant Center Help 9626903 / BigQuery migration page via search](https://support.google.com/merchants/answer/9626903)
- Price drop badge: shown when price falls below the average price you listed in the past 60 days; sale price annotations, price drop annotations have separate requirements. Automated discounts (Shopping ads feature) recommend a minimum price at least 10% below current price. India eligibility for these not found. — [About price drop annotations](https://support.google.com/merchants/answer/14991443); [About automated discounts](https://support.google.com/merchants/answer/15010391)
- Top Quality Store badge replaced Trusted Store (May 2023); awarded to merchants ranked Exceptional overall in Store Quality; signals include delivery speed, returns transparency, website quality, reviews. Check in Merchant Center under Store Quality. — [About Top Quality Stores](https://support.google.com/merchants/answer/14286226); [Store Quality program](https://support.google.com/merchants/answer/14261098)
- India status conflicting: an older Google table said "No, coming in 2024" for India; a January 2025 third-party guide lists India as eligible; Google's page says available in all countries with varying features. — conflicting, see [Google](https://support.google.com/merchants/answer/14286226) vs [Mavlers](https://www.mavlers.com/blog/google-top-quality-store-badge-for-ecommerce/)

### Inferences
- Benchmark only exists for items with a valid GTIN and enough retailers, so the 85 benchmarked items are those matched by GTIN; the rest are unpriced against the market. Being 5%+ above is a negative signal for clicks, but Google gives no quantified penalty; treat as a click-through risk (shoppers compare in grid) rather than a proven ranking demotion.
- Cheapest actions: reprice only where gap is small, or accept higher price on rare/hard-to-source pairs; sale price (`sale_price`) only with real prior price (the store's own rule is no fake reference prices).

### Gaps
- No quantified visibility loss for price gap. India availability of price drop badges and automated discounts unconfirmed. Top Quality Store India eligibility unconfirmed from Google.

## 3. Feed attributes for footwear and spec changes 2025 to 2026

### Takeaway
Spec changes in 2026 are mostly shipping, video and image minimums. Identifier quality (GTIN, or MPN+brand) is the strongest documented matching signal.

### Cited Findings
- 2026 update: 14 Apr 2026 product-level `handling_cutoff_time`, `minimum_order_value`, and `loyalty_program_label` / `loyalty_tier_label` sub-attributes of `shipping`; new optional `video_link` (validation from 14 Apr, serving from 30 June 2026); warnings below new minimum image resolution from 14 Apr 2026, 500x500 minimum enforced 31 Jan 2027 across all categories. No India-specific rules and no footwear-specific content. — [Merchant Center product data specification update 2026](https://support.google.com/merchants/answer/16989427)
- Pickup cost and minimum order value mandatory for in-store products in UK, Switzerland, EEA from 30 Sept 2026 (not India). — [PPC Land](https://ppc.land/google-makes-pickup-cost-and-minimum-order-value-mandatory-in-uk-and-eea/)
- 2025 update page exists (not fetched in detail). — [2025 spec update](https://support.google.com/merchants/answer/16098264)
- GTINs are the strongest match signal for reviews and benchmarks; fallback is SKU, brand + MPN, URL. — [Product Ratings eligibility](https://support.google.com/merchants/answer/14549080)

### Inferences
- Adding `video_link` and larger lifestyle images are cheap, free levers; the 500x500 minimum is a future deadline worth a quick audit.
- Using `item_group_id`, size, size_system, gender, age_group, color is standard practice for apparel and shoes; this research did not retrieve a fresh 2026 Google statement quantifying their reach effect.

### Gaps
- Not verified this pass: current rules for `product_highlight`, `product_detail`, `lifestyle_image_link`, `size_system` for IN; 2025 spec change details. Check the live spec at https://support.google.com/merchants/answer/7052112.

## 4. Product ratings (stars) requirements and usable review sources

### Takeaway
Direct feed or aggregator needs 50+ reviews across all products, monthly full feed, retailer-owned reviews. The store has 2; the 50 threshold is the gate. Judge.me, Junip, Kudobuzz, Stamped and others are approved aggregators, so no need to build a custom feed.

### Cited Findings
- Requirements: minimum 50 reviews across all products; upload at least monthly; product URL domain must match registered domain; standalone or sub-account (not MCA); specialist review, live 2 to 4 weeks after approval; ratings show only when Google judges them accurate and relevant. Available wherever Shopping ads and free listings are offered. — [Product Ratings eligibility](https://support.google.com/merchants/answer/14549080)
- Two submission routes: approved aggregator, or free direct XML (files under 4 GB, full feed monthly). Aggregators may charge fees. Supported aggregators listed (25): Bazaarvoice, eKomi, Emplifi, Feedaty, Feefo, Guaranteed Reviews Company, Judge.me, Junip, Kudobuzz, Loox, Okendo, PowerReviews, RA Reviews, Reseller Ratings, Revi.io, Reviews.io, Shopper Approved, Shopping Satisfaction, Stamped, TargetBay, Trusted Shops, Trustpilot, Trustvoice, Verified Reviews (Skeepers), Yotpo. Some require paid tiers (Loox Scale/Unlimited, Stamped Business+). Not every aggregator supports every country. — [How to submit product reviews data](https://support.google.com/merchants/answer/7045996)
- Judge.me says it syncs to Google Shopping on its Awesome plan and excludes reviews from manual request emails and CSV; plan pricing not retrieved. — [Judge.me help](https://judge.me/help/en/articles/13845576)
- Policy: retailer must collect and own reviews; no syndicated reviews; no employee reviews; no AI/automated reviews; no shipping/retailer comments in product reviews; keep old reviews; incentivised reviews allowed only if incentive is not sentiment dependent and flagged with `<is_incentivized_review>`. — [Product Ratings policies](https://support.google.com/merchants/answer/6098512)
- Google Customer Reviews (GCR) per its FAQ helps with store ratings; the page does not say it produces product ratings. — [GCR FAQ](https://support.google.com/merchants/answer/14632922)

### Inferences
- A custom-built store can use the free direct XML route (the store already has `google-product-reviews.xml`) but the 50-review gate applies either way; an aggregator only helps with collecting emails, not with the threshold.
- Combined with low order volume, 50 genuine reviews needs a long runway; best lever is requesting reviews from every buyer, including Instagram DM buyers if orders are processed through the site (the review must be tied to a product and a purchase).

### Gaps
- Current prices of Judge.me, Junip, Kudobuzz for India not retrieved. Whether aggregators support India shipping reviews: unconfirmed per vendor.

## 5. Store ratings thresholds and India

### Takeaway
India is confirmed for store ratings on English shopping searches (Oct 2024) and for Google Customer Reviews. Threshold is about 100 eligible reviews in the country, average at least 3.5 for ads.

### Cited Findings
- Store ratings expanded to English-language shopping searches in Australia, Canada, India and the UK; without store ratings you can join the free GCR program or collect on independent review sites. — [Search Central blog, Oct 2024](https://developers.google.com/search/blog/2024/10/store-ratings)
- GCR FAQ: India is listed; needs an order confirmation page, an estimated delivery date for each item, enough unique reviews in a country within 12 months; "most merchants can obtain a rating after collecting 100 or more eligible reviews"; badge optional; survey email goes to customers who opt in after checkout. — [GCR FAQ](https://support.google.com/merchants/answer/14632922); [opt-in and survey](https://support.google.com/merchants/answer/14629305)
- Store ratings page: about 100 reviews, 3.5 average for ads stars, ratings calculated per country, about 30 independent partners (Trustpilot, Yotpo, Bazaarvoice, Feefo, Trusted Shops etc.); time window conflicting inside Google's own page (24 months in requirements, 5 years in troubleshooting) while GCR says 12 months. — [Store ratings overview](https://support.google.com/merchants/answer/190657)

### Inferences
- GCR is free and works with a custom store (opt-in snippet on the confirmation page, needs a delivery date). Even before 100 reviews it collects verified post-purchase reviews at zero cost.

### Gaps
- Whether low-volume India stores get partial ratings, and how fast GCR reviews appear: not found.

## 6. Organic review snippets (own site structured data)

### Takeaway
Product AggregateRating on own product pages is allowed if ratings are visible on the page and come from real users on the site. The self-serving restriction applies to LocalBusiness and Organization, not Product. Stars in normal results are never guaranteed.

### Cited Findings
- Product with `aggregateRating` requires ratingValue, name, and ratingCount or reviewCount; ratings must be readable on the page; do not aggregate reviews from other sites. — [Review snippet guidelines](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- Self-serving rule: LocalBusiness/Organization markup is for sites collecting reviews about other entities; own-controlled reviews, including embedded Google Business/Facebook widgets on the entity's own site, are ineligible for stars. Fake or undisclosed incentivised reviews prohibited. — same page
- A product snippet needs at least one of review, aggregateRating or offers. Merchant listing markup is for pages where product can be bought. — [Product snippet](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)

### Inferences
- The store's existing rule (rating from Review docs only) fits the policy. Stars still require enough genuine data; with 2 reviews, markup is allowed but unlikely to produce stars reliably.

### Gaps
- No Google statement on a minimum review count for organic stars.

## 7. Honest review collection, incentives and Indian rules

### Takeaway
Ask 7 to 14 days after delivery for footwear, keep it simple, one reminder, never gate by sentiment, disclose incentives. IS 19000:2022 is voluntary; Indian law already penalises fake reviews as dark patterns.

### Cited Findings
- IS 19000:2022 effective 25 Nov 2022, voluntary; requires disclosure of paid or sponsored reviews and bars bought/written-for-pay reviews; government signalled it may become mandatory (May 2024 support from large platforms). No source found confirming a mandatory notification in 2025 or 2026. — [Sansa Legal summary](https://www.sansalegal.com/post/google-review-policy-changes-2026-and-india-s-legal-framework-against-fake-online-reviews); [PIB press release](https://pib.gov.in/PressReleasePage.aspx?PRID=1882828); [Outlook Business](https://www.outlookbusiness.com/news/centre-to-make-framework-against-fake-reviews-mandatory-for-ecommerce-platforms)
- CCPA Dark Patterns Guidelines 2023 treat fake reviews and false ratings as disguised advertisement; CCPA advisory 5 June 2025 asks platforms to self-audit; penalties up to Rs 10 lakh first, Rs 50 lakh later (Section 21 CPA 2019). Secondary source, verify. — [Sansa Legal](https://www.sansalegal.com/post/google-review-policy-changes-2026-and-india-s-legal-framework-against-fake-online-reviews)
- Google Business Profile policy (April 2026, per one law firm): bans AI-generated reviews, review kiosks, staff quotas, review gating. Secondary source. — same
- Timing data, all vendor sourced: Stamped 6.5% response vs 1 to 3% typical; Kudobuzz 5 to 10% average; 7 to 10 days after delivery gives 2 to 3 times higher response than immediate; Judge.me says 1 to 9 days after fulfilment; Ravecapture 2026 playbook suggests 7 to 14 days after delivery for footwear. Follow-ups: Stamped 1 email 2.2% vs 3 emails 3.6%; Mailchimp suggests a single follow-up. — [Ravecapture](https://ravecapture.com/playbooks/state-of-ecommerce-reviews-ugc-2026/chapter-5/); [Stamped](https://website.stamped.io/blog/best-ways-to-optimize-your-review-request-emails/); [Kudobuzz](https://blog.kudobuzz.com/the-review-response-rate-study-what-time-day-and-method-actually-work/)

### Inferences
- With roughly 5 to 10 percent response, 50 reviews needs about 500 to 1,000 delivered orders, so GCR (post-delivery survey, no review writing needed) and photo/WhatsApp asks matter more than hoping for stars soon.
- A small non-sentiment-dependent thank-you (same for any review, disclosed) is within Google's product ratings policy, but disclose and flag as incentivised; safest is no incentive.

### Gaps
- No Indian WhatsApp-specific conversion numbers found. No confirmation of mandatory IS 19000 status in 2026.

## 8. Google Business Profile reviews

### Takeaway
Not sourced beyond the policy note above; no evidence found that GBP reviews feed Product or Shopping ratings for an online-only store.

### Cited Findings
- Merchant Center free listings page mentions linking Business Profile and Maps via products module. — [Free listings](https://support.google.com/merchants/answer/9199328)
- Embedded GBP review widgets on your own site cannot earn review stars. — [Review snippet guidelines](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)

### Gaps
- Whether GBP reviews show for brand searches for service-area/online stores in India: not researched.
