# UI and page design patterns for sneaker price comparison pages (mobile first, India, Nov 2026)

Scope note on method: 15 tool calls were used. Most commercial comparison pages (StockX, 91mobiles, idealo, Google Shopping, PriceRunner) block automated fetching or render prices client side, so layout descriptions of those sites could not be verified by opening them. Only what a fetch or search actually returned is cited below. Anything else is listed under Inferences (my design reasoning, not sourced) or Gaps. A designer should treat the Gaps as a to-do list for manual review on a real phone.

## 1. Detail page anatomy on the best comparison products

### Takeaway

Direct page-level verification was possible only for Sneakers123 (listing shell, empty result) and Google's help text for price insights. The block order below is therefore mostly a synthesis from verified research findings, not a copy of a named live page.

### Cited Findings

- Sneakers123 (verified, page opened, but the product URL returned a zero-result search shell, so no offer table was visible): header nav, breadcrumb, H1 "Sneaker kaufen" with a count ("284931 Sneakers im Preisvergleich"), a control bar with a FILTER button and a "Sortieren nach" dropdown, results, then a long editorial/SEO text block, then a size filter and footer. Sort options: Relevant, Neuheiten, Hoechster Preis, Niedrigster Preis. Filters: size ("<17" to "47" plus a toggle to show or hide half sizes), brand, gender, 15 colour swatches, sale (20, 50, 70 percent or more). — [Sneakers123](https://www.sneakers123.com/en/sneaker/nike-air-force-1-07-cw2288-111)
- Sneakers123 disclosure (verified): the footer says it is an independent platform linking customers to partner retailers, holds no stock, does not guarantee availability, and that prices plus shipping and return policies are shown before purchase; fulfilment is by the dealer named at checkout. It links to "243 Online-Shops weltweit". — [Sneakers123](https://www.sneakers123.com/en/sneaker/nike-air-force-1-07-cw2288-111)
- Google Shopping "price insights" (secondary, official help text): a section on the product page labels the price lower, typical or higher than normal and shows how the price moved in recent months. The typical price is based on sellers across the web, not only those on Google Shopping. A separate feature flags when a price has dropped to its 30-day low, computed on total price (item price, discount, shipping). Stated as US only. — [Google Help](https://support.google.com/faqs/answer/10675605)
- Google price insights chart (secondary, 2020 news report, older): the chart shows the low and high prices with the retailer you are viewing marked on the range. — [9to5Google](https://9to5google.com/2020/10/22/google-shopping-price-insights/)
- StockX product page (verified, page opened, dynamic content not loaded): static shell shows retail price in Product Details, CTAs "Make Offer" and "Sell This Item", and headings "Market Data" and "Historical Data" and a "Last Sale" label, all with "Loading..." placeholders. Confirms the page is client rendered for market data. — [StockX](https://www.stockx.com/nike-air-force-1-low-white-07)

### Inferences

- A defensible block order for a phone, built from the findings in sections 3 to 6: (1) image and name, colourway, style code; (2) size chips with price under each chip; (3) verdict line for the selected size; (4) offer cards; (5) range or price history; (6) alert capture; (7) how we rank and how we earn (footer-level but linked from the verdict).
- Because StockX loads prices late, any server-rendered approach should output the lowest price and offer rows in HTML, not after hydration (see section 9).

### Gaps

- Could not open: Google Shopping product page, PriceRunner, idealo (fetch refused: "unable to fetch from www.idealo.co.uk"), Klarna, Skyscanner, Kayak, 91mobiles (HTTP 403), Smartprix, MySmartPrice, PriceDekho, Sole Retriever, Sneakerjagers, The Sole Supplier, GOAT, Lyst, Keepa, Camelcamelcamel. No verified above-the-fold description, column order, default sort or CTA wording exists in these notes for any of them. Needs a manual review on a real Android phone or app store screenshots.

## 2. Size-first comparison (StockX, GOAT, Sneakers123, Klekt, Culture Circle, Crepdog Crew)

### Takeaway

Only Sneakers123's size filter was verified (a size filter with half-size toggle on the listing page). The size-chip-with-price pattern at StockX, GOAT, Klekt, Culture Circle and Crepdog Crew was not verified.

### Cited Findings

- Sneakers123 has a size filter with sizes "<17" to "47" and a "Zwischengroessen ein-/ausblenden" toggle, i.e. size is a listing-level filter, and half sizes can be hidden. — [Sneakers123](https://www.sneakers123.com/en/sneaker/nike-air-force-1-07-cw2288-111)
- StockX static shell shows no size grid or per-size price in server HTML; market data is a "Loading..." placeholder. — [StockX](https://www.stockx.com/nike-air-force-1-low-white-07)
- NN/G: on mobile, wordy comparison entries may fit only about 2 columns on a narrow screen; numeric tables can fit more. That bounds a size by store matrix at 360 px. — [NN/G](https://www.nngroup.com/articles/mobile-tables/)

### Inferences

- At 360 px a size by store matrix with named store columns cannot fit more than about 2 to 3 data columns legibly. A chip row (one chip per UK size, price under the chip, out-of-stock chips greyed and struck) followed by cards for the chosen size avoids the matrix on phones. The matrix can remain as a tablet/desktop view.
- For variant B (anonymous stores), a size chip showing "from Rs X" plus a count ("3 stores") is the natural cell.

### Gaps

- No verified description of GOAT, Klekt, Culture Circle, Crepdog Crew size UIs. No data on whether chips with prices outperform a dropdown.

## 3. Mobile layout of comparison tables (Baymard, NN/G)

### Takeaway

Research supports: sticky headers, a locked first column if scrolling sideways, visible cues for overflow, legibility without zoom, building the large-screen table first, and "only show differences". It gives no fixed attribute limit and no cards-versus-table verdict.

### Cited Findings

- NN/G (Amy Schade, 2017, older but still the standard): "You must first create a usable table for a large screen before translating it to a small one." — [NN/G Mobile Tables](https://www.nngroup.com/articles/mobile-tables/)
- NN/G: keep column headers sticky on any table longer than one screen; "Without sticky headers, it is easy to lose the context of what the table is displaying." — [NN/G](https://www.nngroup.com/articles/mobile-tables/)
- NN/G: lock the leftmost row-header column in place when users must scroll horizontally. — [NN/G](https://www.nngroup.com/articles/mobile-tables/)
- NN/G: horizontal scrolling is generally discouraged but "somewhat acceptable for large tables on mobile"; it must be apparent that more data lies beyond the fold; arrows or cut-off columns work best, dots are easier to miss. — [NN/G](https://www.nngroup.com/articles/mobile-tables/)
- NN/G: no fixed attribute count; items must be legible without zoom; an 11-column numeric example worked only with logos and abbreviated headers and can confuse unfamiliar users; rotating the phone is a last resort. — [NN/G](https://www.nngroup.com/articles/mobile-tables/)
- NN/G: for comparison tasks give users control of the view while they look at data; accordions can group attributes. — [NN/G](https://www.nngroup.com/articles/mobile-tables/)
- NN/G: the article does not address card versus table layouts (so claims that research proves cards win are not supported by this article). — [NN/G](https://www.nngroup.com/articles/mobile-tables/)
- Baymard comparison tools article: keep product names, thumbnails and prices in sticky column headings while scrolling; B&H Photo cited as a positive example; HP cited as losing headers. — [Baymard](https://baymard.com/blog/user-friendly-comparison-tools)
- Baymard: preferred pattern is an "Only show differences" option; highlighting differing rows is an acceptable fallback (Home Depot shades, Best Buy highlights, Schneider Electric "Hide similarities"). — [Baymard](https://baymard.com/blog/user-friendly-comparison-tools)
- Baymard: grouping attributes by category beat a single alphabetical list; ordering inside groups by popularity or alphabet made no measurable difference. — [Baymard](https://baymard.com/blog/user-friendly-comparison-tools)
- Baymard: use alternating row shading or separating lines so users can track a row across columns. — [Baymard](https://baymard.com/blog/user-friendly-comparison-tools)
- Baymard testing: 67 percent of participants used comparison features; users had severe difficulties both selecting items to compare and comparing specs (search-result summary of Baymard's article). Mobile-specific comparison findings are behind Baymard Premium. — [Baymard article list](https://baymard.com/research-articles/user-friendly-comparison-tools)

### Inferences

- The offer table has about 8 attributes (store, price, sizes, delivery, shipping, returns, authenticity, checked time, link). With NN/G's 2-column legibility limit, a phone should show a card per offer with price, delivery and the buy link on the first line, and fold the rest into an expandable "Details" row. This is my reading, not a tested result.
- "Only show differences" maps to hiding rows where every store has the same value (for example identical return policy).

### Gaps

- Baymard mobile guidelines (paywalled), and GOV.UK, Material, Apple HIG table guidance were not retrieved.

## 4. Listing page patterns

### Takeaway

Only Sneakers123's listing controls were verified. Card content, price-drop badges and pagination approaches for PriceRunner, idealo, 91mobiles and Sole Retriever are unverified.

### Cited Findings

- Sneakers123 listing: result count in the heading, FILTER button plus sort dropdown (Relevant, Neuheiten, Hoechster Preis, Niedrigster Preis), filters for size, brand, gender, colour, sale depth. — [Sneakers123](https://www.sneakers123.com/en/sneaker/nike-air-force-1-07-cw2288-111)
- Sneakers123 puts a long editorial/FAQ block after the results, so the page doubles as SEO content. — [Sneakers123](https://www.sneakers123.com/en/sneaker/nike-air-force-1-07-cw2288-111)
- Baymard: its product-list and filtering research exists and is mostly paywalled; summary at [Baymard current state of product list](https://baymard.com/blog/current-state-product-list-and-filtering) was not opened.

### Inferences

- A card: image, model and colourway, "Lowest Rs X" (and "for your size" once a size is chosen), "N stores" or "Our price Rs Y", a price-drop badge only when the drop is real over a stated window, and "Checked 3 h ago".
- Filters that matter for a price-led list: brand, size in stock, price band; sort: price low, biggest drop, newest. Load-more with real paginated URLs (?page=2) keeps crawlability; not tested here.

### Gaps

- Pagination versus load more evidence for SEO, and PriceRunner, idealo, 91mobiles, Sole Retriever card contents: not found.

## 5. Trust and honesty patterns, disclosure, self-preferencing, regulation

### Takeaway

The UK CMA's CARE principles give a direct checklist: say how you make money, how you rank, which commercial relationships affected results, how much of the market you cover, and label ads. A comparison page that is also a seller should apply this to its own row.

### Cited Findings

- CMA digital comparison tools final report summary (2017, older, good-practice reference): CARE = Clear, Accurate, Responsible, Easy to use. — [GOV.UK](https://www.gov.uk/government/publications/digital-comparison-tools-summary-of-final-report/digital-comparison-tools-summary-of-final-report)
- Clear: be open about what you offer and how you earn money; "Prominently provide a general explanation of how they make money"; "Clearly explain how they have ranked the results presented"; "Clearly state when and how commercial relationships have affected the results presented"; "Clearly explain how much of the market they cover"; "Ensure all advertising is clearly identifiable". — [GOV.UK](https://www.gov.uk/government/publications/digital-comparison-tools-summary-of-final-report/digital-comparison-tools-summary-of-final-report)
- Accurate: information should be complete, correct, relevant, current and not misleading. — [GOV.UK](https://www.gov.uk/government/publications/digital-comparison-tools-summary-of-final-report/digital-comparison-tools-summary-of-final-report)
- EU Consumer Rights Directive Art. 6a (added by the Omnibus Directive, for online marketplaces, secondary legal summary): main ranking parameters and their relative importance must be given in a specific section directly and easily reachable from the offers page. Hiding paid placement or payment for higher ranking is an unfair practice. — [CMS law summary](https://cms.law/en/deu/legal-updates/online-plattformen-muessen-ranking-parameter-offenlegen); [legislation.gov.uk Art. 3](https://www.legislation.gov.uk/eudr/2019/2161/article/3/data.html)
- Label placement matters: a Danish consumer authority study found awareness of paid results nearly tripled, to 67 percent, when label prominence, clarity and placement improved. — [KFST](https://en.kfst.dk/publikationer/kfst-english/2022/20220525-clear-and-intuitive-disclosures-benefit-consumers-on-online-marketsplaces/)
- Sneakers123 footer example (verified): states it is independent of retailers, holds no stock, guarantees no availability. — [Sneakers123](https://www.sneakers123.com/en/sneaker/nike-air-force-1-07-cw2288-111)
- Google counts total price (item, discount, shipping) for its 30-day-low flag, a pattern for "total cost including shipping". — [Google Help](https://support.google.com/faqs/answer/10675605)

### Inferences

- Because the store is also a seller, a defensible design: rank by one stated rule (lowest total price for the selected size), print the rule under the verdict, mark the own row with a neutral "Sold by us" label, and never move it up when it is not cheapest. This follows CARE points on ranking and commercial relationships. It is not tested.
- Freshness: show an absolute and relative stamp ("Checked 21 Nov, 2 h ago") per offer row and add "Price may have changed, confirm at the store". Stale rows (for example over 48 h) should grey out and drop out of the range. No sourced threshold exists.
- Variant B needs a CARE coverage statement ("5 Indian stores checked, not the whole market").

### Gaps

- Google "by Google" vs CSS labels, Amazon buy box, Progressive's comparison display, Kayak/Skyscanner sponsored labels: not opened. India-specific rules (Consumer Protection Act 2019 and the Central Consumer Protection Authority dark-pattern guidelines) were not researched; check with counsel before launch.

## 6. Recommendation block ("best place to buy")

### Takeaway

No verified phrasing from live sites was retrieved. Only the principle (state ranking rule, label commercial effects) is sourced.

### Cited Findings

- CMA: explain how results are ranked and state how commercial relationships affected them. — [GOV.UK](https://www.gov.uk/government/publications/digital-comparison-tools-summary-of-final-report/digital-comparison-tools-summary-of-final-report)
- Google's flag uses total price (item, discount, shipping). — [Google Help](https://support.google.com/faqs/answer/10675605)

### Inferences

- Proposed wording: "Lowest for UK 9: Rs 10,499 total, delivered by 26 Nov." If the cheapest store lacks the user's size: "Cheapest overall is Rs 9,499, but not in UK 9. Lowest for UK 9 is Rs 10,299." Always compute the verdict after size selection. When our own offer is cheapest, say "Lowest we found for UK 9" and not "best", to avoid an unsupported superlative.

### Gaps

- Real wording from PriceRunner, idealo, Kayak and similar: not retrieved.

## 7. Variant B: aggregated range patterns

### Takeaway

Google's typical price bar is the one verified precedent: low and typical band, with the viewed retailer marked on the range. KBB, Zillow, Glassdoor, CarDekho, StockX were not verified.

### Cited Findings

- Google price insights: label low, typical or higher than normal, history of recent months, typical price from sellers across the web. — [Google Help](https://support.google.com/faqs/answer/10675605)
- Google (2020 report, older): chart shows low and high prices with the viewed retailer marked on the range. — [9to5Google](https://9to5google.com/2020/10/22/google-shopping-price-insights/)
- Merchant side of the same feature: Chrome panel shows the typical price range across stores. — [Google Merchant Center help](https://support.google.com/merchants/answer/14198594)

### Inferences

- Build a horizontal range bar from the lowest to highest of 5 offers, tick mark for the median, a distinct pin for our price, and text underneath ("5 Indian stores, Rs 9,499 to Rs 12,999, checked today. Ours: Rs 10,299"). Pair the colour with words ("Near the low end") for accessibility. With under 3 sources, show a range only as text, not a bar (consistent with the repo rule that the middle listing appears from 3 listings).

### Gaps

- No verified visual treatment from KBB, Zillow, Glassdoor, CarDekho or StockX.

## 8. Price history and alerts

### Takeaway

Google ties a "30-day low" flag to total price. Alert conversion data found is only vendor marketing; no reliable benchmark exists in what was retrieved.

### Cited Findings

- Google flags a price drop to its 30-day low, based on total price, and says this does not predict future prices. — [Google Help](https://support.google.com/faqs/answer/10675605)
- Vendors support alert delivery over email, WhatsApp, SMS and push; some claims (push click-through 4x to 8x email) are vendor marketing; a 4 percent one-hour push conversion appears as a question to test on a vendor page, not a verified benchmark. — [Bruin](https://getbruin.com/use-cases/ecommerce/fx2-push-notification-price-drop-conversion/); [AiTrillion](https://www.aitrillion.com/price-drop-alert-web-push-notifications); [Brevo help](https://help.brevo.com/hc/en-us/articles/36029681874962-Price-drop-alert-Send-automated-price-drop-alerts-to-re-engage-customers)
- Recommended measures: open rate, click-through, conversion, revenue per notification, browse to alert to purchase funnel (vendor guidance). — [Helloretail](https://helloretail.com/en/blog/2026-02-21-price-drop-alerts-klaviyo/)

### Inferences

- Alert capture should ask for a target price and size, not just an email, and add a "last checked" line. WhatsApp opt-in needs explicit consent. Use a simple step or line chart with 30, 90 days toggles; "lowest in 30 days" only when the data covers 30 days.

### Gaps

- Keepa, Camelcamelcamel and an Indian price history tool (Pricebefore, PriceHistory.app style) were not opened. Independent alert conversion data not found.

## 9. Indian context, accessibility and performance

### Takeaway

Not researched with live pages (91mobiles blocked, Myntra, Ajio, Flipkart, Smartprix not fetched). Only the general principles from NN/G and the repo's own rules apply.

### Cited Findings

- NN/G: legibility without zoom, discoverable overflow, sticky headers. — [NN/G](https://www.nngroup.com/articles/mobile-tables/)
- StockX shell shows late-loaded market data placeholders ("Loading..."), the layout-shift risk pattern. — [StockX](https://www.stockx.com/nike-air-force-1-low-white-07)
- Sneakers123 serves long text and filters in server HTML on its listing page (fetch could read them), indicating crawlable output. — [Sneakers123](https://www.sneakers123.com/en/sneaker/nike-air-force-1-07-cw2288-111)

### Inferences

- Indian conventions to verify manually before building: lakh grouping (Rs 1,00,000) via en-IN formatting, "Delivery by Tue, 25 Nov" after a pincode check, COD yes/no flag, bank offer and EMI lines only where true for that store, WhatsApp share button. All unverified here.
- Use real table or list markup (ul of offer cards with price as text, or a table with th scope), tap targets at least 44 to 48 px (WCAG 2.2 target size and Material guidance, not retrieved here), server render offers and reserve fixed height for the price and chart slots.

### Gaps

- Everything in the Indian conventions bullet, plus GOV.UK/Material/Apple HIG table rules, web.dev layout shift guidance, and contrast minimums were not retrieved this session.
