# Second pass: on-screen design of price comparison pages (mobile first, India, Nov 2026)

Method note. 24 tool calls. The Internet Archive route FAILED outright: the fetch tool answered "unable to fetch from web.archive.org" for the first snapshot URL, so no archived page was opened for any site. The remaining routes (help centres, search summaries, one fetch of a product page) gave far less than the brief asked for. Labels used: verified = page opened and read this session; secondary = search-result summary or article text, not the page itself; not found. Most "secondary" items come from web search summaries of official help pages, so a human should open the linked page before relying on exact wording. Nothing here repeats the first-pass file (ui_patterns.md). Nothing is guessed; Inferences are marked as reasoning.

## 1. Detail page anatomy (PriceRunner, idealo, Klarna, 91mobiles, Smartprix, MySmartPrice, Sole Retriever, Sneakerjagers, The Sole Supplier, GOAT, Klekt, Lyst, Keepa, Indian price history tool)

### Takeaway

Block-by-block phone anatomy could NOT be established for any of these sites. Routes tried: Internet Archive (failed, tool refuses the domain), help centre search (worked partly for PriceRunner, Smartprix, Kayak), product page fetch (worked only for Culture Circle, and showed little). What exists is feature-level facts, not layout.

### Cited Findings

- PriceRunner (secondary, help page summarised by search; route: help centre): on a product page the user sees an overview of prices from different retailers that can be filtered by price, delivery or rating; "Price history" can be opened with 1-month, 3-month or full views and can be filtered to one retailer; a "Price alert" button notifies of drops; the lowest price shown at the top excludes shipping and includes VAT; PriceRunner says to double check the price on the retailer's site because it does not guarantee prices. An account is free and gives email or push notification on a drop or when a user's target price is hit; the site works without an account. Snapshot date: not stated. — [PriceRunner compare prices](https://www.pricerunner.com/info/compare-prices); [PriceRunner membership](https://www.pricerunner.com/info/pricerunner-membership); [PriceRunner FAQ prices](https://pricerunner.com/info/faq-prices). Direct fetch of the compare-prices URL returned only the About heading, so it is not verified.
- Smartprix (verified, how-to article opened, updated 13 Jul 2023): the product page has a "Price History" option; it opens a graph with a range selector of one month, three months, six months, one year, three years, or the product's whole life; the app has a "Product Price History" option; price alerts are described for the app only (set a threshold, get notified when it is reached). The article does not show the store list, any "lowest" label or the page layout. — [Smartprix price history article](https://www.smartprix.com/bytes/smartprix-product-price-history-graph-unlocking-best-deals-and-avoiding-overpayment/)
- Smartprix and MySmartPrice (secondary): Smartprix says it compares each product's price across leading e-tailers and suggests where to buy; MySmartPrice says it shows retailer prices together with offers and coupons; one review says MySmartPrice is optimised for slow connections. — [Smartprix about](https://smartprix.com/about/smartprix); [MySmartPrice purpose](https://mysmartprice.com/purpose)
- Culture Circle UAE product page (verified, page text opened, capture likely excludes JavaScript content): no size selector, price per size, buy button, seller comparison module or price history appeared in the captured text. It showed "Try on", "View authenticity certificate", "View Similar", trust lines ("Includes authentication certificate", "By CheckCheck global standards", "As seen on Shark Tank India"), a size guide link ("Air Jordan 1 Size Guide: UK, US and Fit in India"), a "Culture Note" with collapsible Origin, Utility, Influence and Construction sections, and a lower general line "We show you price comparisons across sellers so you always get better deals." — [Culture Circle](https://www.culture-circle.com/ae/products/jordan-1-retro-high-comme-des-garcons-white-sale)
- Kayak (verified, help page opened): the price forecast estimates whether a price is likely to go up or down over the next seven days; Kayak's first advice is "if you see a good price on a route, book it"; it shows the confidence of the statistical analysis with each forecast, does not guarantee it, and says it checks its predictions daily. — [Kayak price trend explanation](https://www.kayak.co.in/price-trend-explanation). The page does not define label thresholds or how labels look.

### Inferences

- Because PriceRunner puts the lowest price (without shipping) at the top and Google uses total price, a store that compares sneakers should state in one line whether its "lowest" includes shipping. Our own store ships free in India, so a total price is simple to state.
- The only sourced chart pattern shared by PriceRunner and Smartprix is a range toggle of 1 month, 3 months and longer. A history control with 30 days, 90 days and all can be copied; the data must exist first.

### Gaps

- Not opened and no layout facts: idealo, Klarna price comparison, 91mobiles, MySmartPrice (page), PriceDekho, Sole Retriever, Sneakerjagers, The Sole Supplier, GOAT, Klekt, Lyst, Keepa, Camelcamelcamel, any Indian price history tool. Archive route failed for all. App store listing and YouTube routes were not tried (call budget). Needs a human with a phone and the archive in a normal browser.

## 2. Size-first price display (StockX, GOAT, Klekt, Culture Circle, Crepdog Crew)

### Takeaway

Not found. Only the negative result for Culture Circle is verified (no size selector or per-size price in the captured page text, which may be JavaScript loaded).

### Cited Findings

- Culture Circle: the captured page text had a size guide link but no size control or per-size price; actions shown were "Request sourcing" and "Order for pickup" with a Dubai hub (this is the UAE site, which may differ from the India site). — [Culture Circle](https://www.culture-circle.com/ae/products/jordan-1-retro-high-comme-des-garcons-white-sale)

### Inferences

- A JavaScript-only size grid is a risk for search engines and for the CLS rule in section 9; offers for the default size should be in server HTML.

### Gaps

- StockX, GOAT, Klekt, Crepdog Crew size controls, states (selected, unavailable, lowest) and buy button position: not found. Culture Circle India page: not opened.

## 3. Listing page cards (PriceRunner, idealo, 91mobiles, Smartprix, Sole Retriever) and Google pagination guidance

### Takeaway

Card fields were not found for any named site. Google's pagination rules were verified: use real links with unique URLs, not buttons or fragments.

### Cited Findings

- Google Search Central (verified, page opened): Google crawls URLs in `href` attributes of `<a>` elements; its crawlers do not click buttons or run scripts that need user actions; load more and infinite scroll built with JavaScript may stay hidden unless the content is also reachable by standard links or a sitemap; link each page to the next with `<a href>`; give each page a unique URL such as `?page=n`; Google ignores fragment identifiers (`#page=2`); Google no longer uses rel next/prev; do not point the canonical of page 2 onward to page 1, give each its own canonical. — [Google pagination and incremental page loading](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)

### Inferences

- A "Load more" button is acceptable for users if each batch also has a real `?page=n` link in the HTML (a plain link underneath or a hidden-from-sight but present anchor); a button alone hides products from Google.

### Gaps

- Card fields, badges ("price drop", "lowest in 30 days"), "from N stores" wording, filter and sort lists, and pagination method on PriceRunner, idealo, 91mobiles, Smartprix, Sole Retriever: not found.

## 4. Verdict and recommendation wording

### Takeaway

Only Kayak's and KBB's approaches were sourced. No idealo rating scale or "Our pick" wording was found; the idealo search returned nothing about it.

### Cited Findings

- Kayak (verified): advice leads with "book it" for a good price; forecast shown with a confidence level, a seven-day horizon, and a statement that it is not guaranteed; accuracy is checked daily and the method is described (analysis of search requests, models on past data). — [Kayak](https://www.kayak.co.in/price-trend-explanation); also [Kayak help, price forecast](https://www.kayak.com/c/help/pricing/how-does-kayak-price-forecast-work.62022.faq) (secondary: forecast only for routes with enough data, and when it says wait, Kayak suggests a price alert).
- idealo (secondary, third party): offers are normally ordered lowest first, sorted by total price including shipping according to one vendor guide; business model is cost per click. The "good price / fair price" scale and its rule were not found. — [Wikipedia idealo](https://en.wikipedia.org/wiki/Idealo)

### Inferences

- The explanation pattern that recurs (Kayak, PriceRunner): say what the verdict is based on, how fresh it is, and that it is not a guarantee. Reuse this three-part pattern; the exact words are ours to write.

### Gaps

- idealo rating scale, Google's low/typical/high bar wording on the page (first pass has only help text), "Best price", "Cheapest", "Our pick", "Good deal" as used by comparison sites: not found.

## 5. Anonymous range displays (variant B)

### Takeaway

Kelley Blue Book is the one new precedent, from secondary text. Zillow, Glassdoor, CarDekho, CarWale and StockX were not researched.

### Cited Findings

- KBB (secondary, search summary of KBB pages): "Fair Market Range" is the range of prices KBB estimates most people will pay for a specific vehicle this week; "Fair Purchase Price" is generally the midpoint of that range; the range is for that vehicle with the selected equipment; it updates weekly; used ranges are based on dealership transactions, auction sales, listings and KBB analytics; the gauge has colour zones, with dealer materials labelling white as below the range, green within it and red above it. — [KBB Price Advisor](https://www.kbb.com/priceadvisor/); [KBB definitions of values](https://b2b.kbb.com/kbb-vehicle-values/definitions-of-our-values); [KBB range-based pricing](https://b2b.kbb.com/kbb-vehicle-values/range-based-pricing)

### Inferences

- KBB shows the three things variant B needs: a range, a midpoint, a stated time window ("this week") and a stated data basis. A range bar with a midpoint tick, a dated caption and a one-line basis sentence follows this. Colour zones alone fail contrast and colour-blind use, so add words.

### Gaps

- Zillow Zestimate range, Glassdoor pay range, CarDekho and CarWale price range, StockX bid/ask/last sale graphic and sentence wording: not found.

## 6. Indian shopping conventions and Legal Metrology

### Takeaway

Only the legal side was researched, from law firm and news summaries (secondary). Myntra, Ajio, Flipkart, Amazon India, 91mobiles and Smartprix conventions (lakh format, MRP line, bank offer, EMI, COD, pincode check, return line, WhatsApp share, Hinglish) were not looked at.

### Cited Findings

- Legal Metrology (Packaged Commodities) Rules, 2011, Rule 6(10) requires e-commerce entities to show the mandatory declarations on their platforms; commentary lists MRP inclusive of all taxes, country of origin, and name and address of manufacturer, packer or importer, and says only one MRP should be shown; the physical pack must still carry the declarations. — [Chambers summary](https://chambers.com/articles/lmpc-rules-amended-new-compliance-for-e-commerce); [S.S. Rana](https://ssrana.in/articles/compliances-for-website-e-commerce-website/); [Lakshmikumaran & Sridharan](https://www.lkslaw.com/insights/articles/aiming-greater-transparency-on-sale-of-packaged-commodity-online)
- Amendment Rules 2026 add Rule 6(10A): e-commerce entities selling imported products must offer a searchable and sortable country of origin filter; notified 13 Feb 2026, effective 1 July 2026. — [SCC Online](https://www.scconline.com/blog/post/2026/02/21/legal-metrology-packaged-commodities-amendment-rules-2026-explained/)
- GSTIN in seller details appears only in a court petition description; the rule text was not seen, so it is unverified. — [search summary of Indian Kanoon](https://future.indiankanoon.org/doc/107188558/)

### Inferences

- A price comparison page shows other stores' offers, which are not our packaged commodity listing; whether Rule 6(10) applies to the comparison rows is a legal question for counsel. Our own offer row should carry MRP, country of origin and manufacturer or importer at least on the product page.

### Gaps

- All shop-by-shop conventions listed above, and the primary gazette text of the Rules: not found.

## 7. CCPA Dark Patterns Guidelines 2023

### Takeaway

The structure is confirmed but the full list of 13 names could not be read: the one law firm page that lists them returned HTTP 403, and the consumeraffairs.nic.in PDF found was the September 2023 draft, not opened.

### Cited Findings

- Guidelines notified 30 November 2023 under Section 18 of the Consumer Protection Act 2019; Annexure 1 lists 13 specified practices; the summary confirms false urgency, basket sneaking, drip pricing and disguised advertisement are among them; the final version added trick question, SaaS billing and rogue malware compared with the draft; clause 5 is the operative duty and commentators call the annexure indicative; penalties are those of the 2019 Act (the summary gives up to 2 years and INR 1 million, repeat offences 5 years and INR 5 million; check this figure with counsel). — [JSA Law](https://www.jsalaw.com/newsletters-and-updates/ccpa-issues-guidelines-for-prevention-and-regulation-of-dark-patterns-2023/) (page 403 for fetch, so these points come from a search summary of it and of [Mondaq](https://www.mondaq.com/india/consumer-trading-unfair-trading/1398262/ccpa-issues-guidelines-for-prevention-and-regulation-of-dark-patterns-2023-effective-30-november-2023)); draft text at [consumeraffairs.nic.in](https://consumeraffairs.nic.in/sites/default/files/file-uploads/latestnews/Draft%20Guidelines%20for%20Prevention%20and%20Regulation%20of%20Dark%20Patterns%202023.pdf) (not opened)

### Inferences

- Patterns that map onto a comparison page: false urgency (fake "only 2 left", countdowns), drip pricing (shipping or fees added after the listed price), disguised advertisement (paid or own-store placement not labelled), basket sneaking. A "bait and switch" risk is a listed price the user cannot get for their size.

### Gaps

- Exact names and definitions of all 13 patterns: not read. Read Annexure 1 on consumeraffairs.nic.in or the gazette.

## 8. Accessibility and performance for an offers table

### Takeaway

Standards verified: WCAG 2.2 target size, GOV.UK table, W3C WAI tables, web.dev CLS. Contrast numbers and web.dev server rendering guidance were not retrieved.

### Cited Findings

- WCAG 2.2 SC 2.5.8 Target Size (Minimum), AA (verified): pointer targets at least 24 by 24 CSS px; smaller targets pass if a 24 px circle on each does not overlap another target; other exceptions are an equivalent control, inline links in text, user agent controls, and essential presentation. — [W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- GOV.UK table (verified): use tables to compare rows and columns, never for layout; use `<caption>` as a heading; use `scope` on headers; right-align numbers; "aim to have less data in your tables"; a small-text-on-mobile class exists but is for tables with a lot of data. Scroll containers are not covered. — [GOV.UK table](https://design-system.service.gov.uk/components/table/)
- W3C WAI tables (verified): header cells with `th` and `scope`; caption for the topic; summary for complex tables; correct markup lets users display tables as lists; no responsive table guidance on that page. — [W3C WAI tables](https://www.w3.org/WAI/tutorials/tables/)
- web.dev CLS (verified): good CLS is 0.1 or less, above 0.25 is poor, at the 75th percentile, mobile and desktop separately; shifts come from late loading resources, images without dimensions, font swaps and third party widgets; for user triggered loads, make space right away and show a loading indicator; the article does not itself state "set width and height". — [web.dev CLS](https://web.dev/articles/cls)

### Inferences

- Offer cards need at least 24 px targets, and the 44 to 48 px used by first pass is stricter than the AA minimum. Reserve a fixed height for the offer list and history chart, and render offers server side (also needed for Google, section 3). Use a real `ul` of cards or a `table` with `caption` and `th scope`, with prices as text.

### Gaps

- WCAG contrast ratios (1.4.3, 1.4.11), web.dev server rendering guidance, responsive table techniques: not retrieved.

## 9. Price drop alerts and WhatsApp opt-in

### Takeaway

WhatsApp's policy was verified. No non-vendor data on opt-in or return rates was found.

### Cited Findings

- WhatsApp Business Messaging Policy (verified): businesses may contact people only if the person gave their number and "you have received opt-in permission from the recipient confirming that they wish to receive subsequent messages or calls from you"; the business is "solely responsible for determining the method of opt-in"; the page does not prescribe wording; best practice: opt-in that covers the message categories, separate opt-in per category, and clearly state the value of the messages; opt-out requests must be respected and instructions to opt out are recommended. — [WhatsApp Business policy](https://whatsappbusiness.com/policy/)
- PriceRunner and Smartprix alert patterns (secondary): PriceRunner alerts by email or push for a drop or a target price, free account optional; Smartprix target price alert in the app. — links in section 1.
- Kayak suggests a price alert next to a "wait" forecast (secondary). — [Kayak help](https://www.kayak.com/c/help/pricing/how-does-kayak-price-forecast-work.62022.faq)

### Inferences

- Put the alert next to the verdict when the verdict is "not the lowest yet", with fields for size and target price, a separate tick box for WhatsApp with the value stated, and a one-line opt-out instruction.

### Gaps

- Opt-in or return rates from non-vendor sources, Indian rules on promotional messages, Keepa and Indian price history tool alert flows: not found.

## Summary of what remains open (for a human with a phone)

Open on a 360 px Android phone and screenshot: PriceRunner, idealo, 91mobiles and Smartprix product pages; StockX, GOAT, Klekt, Culture Circle India and Crepdog Crew size selectors; Sole Retriever listing; Myntra, Ajio, Flipkart and Amazon India price lines. Read Annexure 1 of the dark patterns guidelines. The Internet Archive needs a normal browser; this tool cannot reach it.
