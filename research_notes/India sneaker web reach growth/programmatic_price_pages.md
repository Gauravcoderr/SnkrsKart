# Programmatic "price in India" pages: best practice and risk (research date 2026-11-21)

Method note: WebFetch returns short summaries (small model), so quotes marked "excerpt" are fragments, not full policy text. 91mobiles, Smartprix and MySmartPrice returned HTTP 403 to fetch; only CarDekho was fetched live. No Search Off the Record transcripts or Danny Sullivan primary posts were retrieved; those statements are secondhand.

## 1. Google scaled content abuse policy and enforcement

### Takeaway
Google's policy is about intent and value, not method: many pages made mainly to manipulate rankings without helping users are spam, whether made by AI, humans or both. Mueller (Sept 2026) said programmatic SEO "often" ends up spam, borderline spam or low quality, and that a site can carry the lost trust for months.

### Cited Findings
- Official policy excerpt: "Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings" and "not helping users." Example given: "Using generative AI tools or other similar tools to generate many pages without adding value for users." Other examples: scraping/spinning, stitching content, spreading content across sites to hide scale, keyword-heavy nonsense pages. Hosts are advised to exclude such content from Search. — [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Doorway abuse excerpt: "sites or pages are created to rank for specific, similar search queries"; example "Creating substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy." — [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Thin affiliation: copied merchant descriptions with no original content; "Not every site that participates in an affiliate program is a thin affiliate"; value adders named include price context, original testing and comparisons. — [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Policy was introduced March 2024 (general knowledge, also stated in secondary coverage). Sullivan reportedly said Google does not care whether scaled content is "AI, automation, or human beings" (secondhand quote). Manual actions specifically for scaled content abuse reportedly began June 2025 (one SEO article, unverified). — [ppc.land / search roundup via WebSearch](https://ppc.land/scaled-content-abuse/)
- John Mueller on Bluesky, 2026-09-07, replying about a site generated from domain/technology/attribute combinations: programmatic SEO "often leads to a site that's either spam, borderline spam, or low quality"; "Our systems have possibly lost faith in your site providing good value to users based on the old pages"; "It's easy to spin something up with many pages, it's hard to provide real value to users"; fixing "tends to take time & significant effort to show the value." He did not say all programmatic SEO is spam, and said adding more generated text per page would not fix it. — [SEJ 2026-09-08](https://www.searchenginejournal.com/google-says-old-low-value-pages-may-affect-site-recovery/588837); [TechWyse 2026-09-09](https://www.techwyse.com/news/search-seo/google-john-mueller-programmatic-seo-site-trust-recovery) (both secondary, Bluesky post not opened)
- 2026 spam updates reported in March, June, August and (reportedly) September 2026; August 2026 coverage describes drops for very large programmatic sites (one with 1.5M+ indexed URLs) and thin affiliate pages; one report says the June update did not target link spam or site reputation abuse. I found no Google primary post detailing each. — [GSQi Aug 2026 case studies](https://gsqi.com/marketing-blog/august-2026-google-spam-update-case-studies/) (not opened, title only); [ppc.land third spam update 2026](https://ppc.land/googles-third-spam-update-of-2026-hits-every-language-and-region/) (title only)
- Site reputation abuse: since 2026 EEA treatment changed (ranked on own merits rather than manual action); outside EEA manual actions still apply. Not relevant unless third-party content is hosted. — [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

### Inferences
- Acceptable vs abuse in practice: each page must have data a user cannot get from a sibling page or the search results (real price spread, dates, size availability, style code, our own offers). A page differing only by model name swapped into a template is the doorway/scaled pattern.
- A young low-trust domain is the profile Mueller's "lost faith" comment is about; a failed batch can taint the whole site, so quality gating before indexing matters more than volume.

### Gaps
- No verbatim Search Off the Record or Sullivan transcript found. No Google-primary text on what changed in the 2026 updates.

## 2. How Indian price sites build pages

### Takeaway
Only CarDekho was verified live. Its page pattern (answer sentence with date, variant table, city-wise price, rivals table, expert score, FAQ, update stamps) is the template; for sneakers, variant table maps to per-size/colourway, city-wise does not (we ship free pan-India).

### Cited Findings
- CarDekho Swift page (fetched 2026-11-21): title "Maruti Suzuki Swift Price, Petrol & CNG Mileage"; H1 is just the model; opening line "As of November 2026, the Maruti Suzuki Swift is priced from ₹5.84 Lakh to ₹8.89 Lakh (ex-showroom) in India" with a New Delhi on-road price; 17-row variants table (price, fuel, transmission, mileage); city-wise on-road ranges (Bangalore, Hyderabad, Chennai, Mumbai, Pune); EMI calculator; FAQ section plus community Q&A from "CarDekho Experts" dated 2024 to 2026; expert review with sub-scores and verdict; "Updated 9 days ago"; rivals comparison table with head-to-head links. — [CarDekho Swift](https://www.cardekho.com/maruti/swift)
- Smartprix: 150,000+ product database; has a price history tool. — [WebSearch summary, Gizbot/Smartprix about](https://us.smartprix.com/about/smartprix)
- MySmartPrice: browse by brand, price band and feature; 20M+ monthly visits claimed. — [MySmartPrice](https://www.mysmartprice.com/mobile/)
- 91mobiles: lists prices from top online stores, price lists by brand. — [91mobiles](https://www.91mobiles.com/ogo-phones.html)

### Inferences
- Recurring elements likely to transfer: dated answer sentence with price range, size/colourway table with per-row price, price history (we have a daily scrape so we can chart it), FAQ built from stored fields, rivals/alternatives table, update date, expert note on fit/sizing. Not transferable: city-wise on-road price, EMI (optional), store-by-store table (policy: never name other stores, so show range only).
- Those incumbents have huge authority, so copying their element count does not copy their ranking.

### Gaps
- 91mobiles, Smartprix, MySmartPrice, PriceDekho, BikeDekho, PriceBaba, Gadgets360 pages not inspected (403 or not tried). Their schema types and exact title patterns are unverified.

## 3. Unique data, quality signals, case studies

### Takeaway
Anecdotal evidence consistently says new domains that publish thousands of templated pages get few indexed; pages with differentiated evidence fare better. No rigorous study found.

### Cited Findings
- 287k-page site on a new domain: about 2,500 indexed (0.9%), author blames no backlinks or brand. — [DEV Community](https://dev.to/apex_stack/i-built-a-287000-page-website-heres-what-i-learned-about-programmatic-seo-4d5h)
- 8,000 programmatic pages, Google indexed zero (GSC postmortem, anecdote). — [DEV Community](https://dev.to/_9848c5582063b42abecb7/i-built-8000-programmatic-seo-pages-google-indexed-zero-a-gsc-postmortem-569i)
- 262-page test: 56 indexed (21.4%); pages that performed had differentiated evidence. — search roundup, original not opened
- 50,000 AI pages deindexed as thin with no manual action; recovery by new domain, fewer pages. — [SEJ](https://www.searchenginejournal.com/why-website-deindexed-by-google-for-programmatic-seo-bounced-back/552179/)
- Crawl-economics argument against scaled AI content. — [SEJ](https://www.searchenginejournal.com/scaled-ai-content-often-fails-googles-crawl-economics-explain-why/) (not opened)
- Google's thin affiliate text names price context and comparisons as value adders. — [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

### Inferences
- Our own daily price scrape history, per-size offers, style codes, dated releases and MRP are the unique data. Gate each page on having at least a minimum set of those.

### Gaps
- No Ahrefs/Sistrix/Lily Ray/Glenn Gabe numbers retrieved; all case numbers above are self-reported blog posts of unknown reliability.

## 4. Rollout strategy for a low-authority site

### Takeaway
Practitioner consensus: phase it, gate by data completeness, watch indexation in Search Console, prune. No Google statement gives page counts.

### Cited Findings
- Recurring practitioner lessons: launch in phases, differentiate each page with real data, build trust via links/brand, watch crawl and index reports, consolidate if indexing stalls. Googlebot reported visiting about 200 to 500 pages/day on a brand-new domain (one anecdote). — [DEV Community](https://dev.to/apex_stack/i-built-a-287000-page-website-heres-what-i-learned-about-programmatic-seo-4d5h); [HackerNoon](https://hackernoon.com/i-launched-two-similar-job-boards-google-indexed-one-and-rejected-the-other)
- Mueller: old low-value pages can keep hurting the site, so removing them later does not instantly restore trust. — [SEJ 2026-09-08](https://www.searchenginejournal.com/google-says-old-low-value-pages-may-affect-site-recovery/588837)
- Mueller (older): toggling noindex on and off as stock changes is counterproductive; noindex best for pages never meant to be indexed. — [SERoundtable / SEJ out-of-stock](https://www.searchenginejournal.com/google-out-of-stock-products-may-impact-search-visibility/444500/)

### Inferences (labelled opinion, not Google)
- Start with 20 to 40 pages for models that already have the most data and search demand, hand-reviewed; add 20 to 40 per 2 weeks only if the earlier batch shows indexed and impressions. Pages below the data threshold: do not publish (not even noindex linked from nav; keep out of sitemap). Put only indexable pages in sitemap, link from a hub (brand and model guides) and from the existing 218 guide pages. Prune or merge pages with zero impressions after about 90 days. Use query data (Search Console, autocomplete) to pick models; skip colourway-level pages, make one page per model with colourways as table rows.

### Gaps
- No Google-stated safe page count; no India-specific rollout study.

## 5. Structured data for a page about a product the site does not sell

### Takeaway
Product snippets (non-merchant) accept Offer or AggregateOffer with lowPrice required; merchant listings require the merchant to be the seller and a purchasable page. Do not mark a price-range page as a merchant listing and do not use AggregateOffer for our own size variants.

### Cited Findings
- AggregateOffer: "an aggregation of other offers", "can be used for a product that is being sold by multiple merchants"; lowPrice required ("lowest price of all offers available"), highPrice and offerCount recommended; "To be eligible for the price drop enhancement, use Offer, not AggregateOffer." — [Product snippet docs](https://developers.google.com/search/docs/appearance/structured-data/product-snippet) (fetch summary)
- Report scope: product snippets cover "product reviews and aggregator sites"; merchant listings cover pages where shoppers can buy. — same
- Merchant listings: "the merchant has to be the seller", "Only pages where a shopper can purchase a product are eligible", "Product snippets accept an Offer or AggregateOffer but merchant listings require an Offer", only single-product pages (or variants), not "pages with links to other sites that sell the product." — [Merchant listing docs](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing)
- Changes found: July 2026 merchant listing docs added Product.category (text or CategoryCode) and a sale-duration section aligning with Merchant Center `sale_price_effective_date`; canonicalization guide updated 2026-07-10. — [TechWyse](https://www.techwyse.com/news/search-news/google-merchant-listing-structured-data-sale-duration-product-category) (secondary)

### Inferences
- For models we do not stock: Product with AggregateOffer (lowPrice/highPrice/priceCurrency INR/offerCount) is syntactically eligible for product snippets, but whether Google shows it is not promised, and prices must match visible page text. Risk: AggregateOffer from scraped third-party prices reads as aggregating sellers; we are not naming them. Safer minimum: Product without offers plus on-page prices, or AggregateOffer only where offerCount is honest.
- For stocked models: use Offer (existing ProductGroup approach) so merchant listing and price drop remain possible.

### Gaps
- Docs text on "pages that aggregate other sellers" beyond the above not confirmed; Google changelog not read directly; 2025 changes not found.

## 6. Title and meta patterns, rewriting

### Takeaway
Google rewrites most titles; 51 to 60 characters are changed least. CarDekho puts "Price" plus attributes in the title and the dated "As of November 2026" claim in the first sentence rather than the title.

### Cited Findings
- Zyppy 2023 (80,000+ titles): 61.6% rewritten at least partly; 51-60 character titles changed only 39 to 42% of the time; pipes replaced 41% vs dashes 19.7%. — [SEJ](https://www.searchenginejournal.com/google-changes-more-than-61-percent-of-title-tags/435618/)
- Q1 2025 study: 76% changed (single study, methods vary; Ahrefs found 33.4% with a different method). Google still uses the original title for ranking. — [Search Engine Land](https://searchengineland.com/google-changed-76-of-title-tags-in-q1-2025-heres-what-that-means-454847)
- AI headline rewrites tested 2026, no opt-out reported. — [SEJ](https://searchenginejournal.com/google-ai-headlines-in-search/570208/)
- CarDekho title: "Maruti Suzuki Swift Price, Petrol & CNG Mileage". — [CarDekho](https://www.cardekho.com/maruti/swift)

### Gaps
- Live SERP title patterns for sneaker "price in India" queries and for 91mobiles/Smartprix not captured.

## 7. AI Overviews and AI Mode for price queries in India

### Takeaway
Google expanded AI shopping in India in April 2026 (Gemini, AI Mode, Circle to Search) showing prices, reviews and inventory from the Shopping Graph; whether informational price pages are cited is unverified.

### Cited Findings
- April 2026 India shopping rollout, English and Hindi; Shopping Graph about 50 billion products. — [Google India blog](https://blog.google/intl/en-in/products/explore-communicate/new-ways-google-is-using-ai-to-make-shopping-easier/); [Deccan Herald](https://www.deccanherald.com/technology/artificial-intelligence/google-brings-improved-shopping-experience-on-gemini-ai-mode-and-circle-to-search-3960693)
- AI Mode launched in India June 2025. — [Google India blog](https://blog.google/intl/en-in/products/google-search-introducing-ai-mode-in-india/)
- Third-party study (Productrise): AI Mode listings about 21.6% higher priced than Search, not India-specific, unverified by Google. — [Let's Data Science](https://letsdatascience.com/news/google-ai-mode-shows-different-shopping-results-294bd698)

### Inferences
- Price answers in AI surfaces likely come from the Shopping Graph (Merchant Center feeds) for stocked items, so the feed matters more than page markup. For non-stocked models, citable pages need a dated answer sentence and a plain table (CarDekho pattern).

### Gaps
- No evidence on citation behaviour for price pages; one source claims spam policies extended to AI Overviews/AI Mode in May 2026 (unverified).

## 8. Risks specific to the plan

### Takeaway
Biggest risks: doorway/scaled pattern across 218+ near-identical pages, soft-404 treatment of no-stock pages, and Merchant Center price mismatch.

### Cited Findings
- Soft 404: Mueller said out-of-stock pages may be treated as soft 404 depending on value beyond the product; no fixed timeframe; temporarily out-of-stock pages should stay live with availability markup; retired items 404. — [SEJ](https://www.searchenginejournal.com/google-out-of-stock-products-may-impact-search-visibility/444500/); [SERoundtable](https://seroundtable.com/google-timeframe-out-of-stock-product-soft-404-30777.html) (older, 2018 to 2021)
- Merchant Center: Googlebot compares feed price with landing-page price and structured data; price ranges and JS-injected prices cause mismatches; violations reviewed under Misrepresentation, which can suspend the account without warning. Feed should carry the lowest value when a range is shown. — [Merchant Center help](https://support.google.com/merchants/answer/10330822); [mismatch help](https://support.google.com/merchants/answer/12159029)
- India scraping law: no statute on scraping; prices as facts generally not copyright-protected, but selection/arrangement of a database can be, India has no sui generis database right, and disputes are brought as copyright, unfair competition or contract (site terms) claims. Law-firm blogs, not case text. — [Lawrato](https://lawrato.com/indian-kanoon/civil-law/is-web-scraping-legal-in-india-what-a-business-can-and-cannot-collect-3192); [S.S. Rana](https://ssrana.in/articles/data-scraping-issues-india/); [Mondaq](https://www.mondaq.com/india/copyright/900156/data-scraping-and-legal-issues-in-india)

### Inferences
- Show only aggregated range and a date ("observed 21 Nov 2026"), never reproduce a store's catalogue wholesale or its images/copy; check robots/terms of the 9 sites.
- Do not put a price range in markup on pages where the Merchant feed carries a different price for the same item; for stocked models keep page, JSON-LD and feed identical (existing rule).
- One page per model, not per colourway, to avoid near-duplicates; colourways as rows with distinct style codes.
- Show real state: "not sold by us currently" with a restock/notify path; do not fake add-to-cart.

### Gaps
- No Indian case law found specific to price scraping; legal advice needed. No Google statement on doorway status of price pages specifically.
