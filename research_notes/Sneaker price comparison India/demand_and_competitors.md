# Sneaker price comparison India: demand and competitors (research date 2026-11-21)

Method note. About 17 tool calls. Google autocomplete was queried directly with curl (`suggestqueries.google.com`, `gl=in`, `hl=en-IN`) from a machine whose public IP resolved to country IN (checked with ipinfo.io), so those suggestions are a real India-side signal. Autocomplete shows that a phrase is suggested, never a volume. WebSearch in this environment is US-only, so every "who ranks" result below is NOT a true India SERP. No Google Trends, Keyword Planner, Semrush or Ahrefs volume was reachable. Labels: VERIFIED = page or endpoint opened or queried by me; SECONDARY = reported in a search snippet or by a third party; NOT FOUND = searched, nothing. Prior notes in `research_notes/India sneaker web reach growth/` were read and are not repeated.

## (a) What Indians type: query shapes and evidence of demand

### Takeaway

Autocomplete (India side) strongly supports "<model> price in india" for all 10 test models, and shows "lowest price", "best price", "cheapest" and "price comparison" only for some models, with suggestions that are often UK, Philippines or US flavoured rather than Indian. "Where to buy <model> in india" and Hinglish shapes produced almost nothing. Store-versus-store and "is <store> legit" shapes exist for the big names. No volumes were obtained for any shape.

### Cited Findings

- VERIFIED, autocomplete, 2026-11-21, `<model> price in india` returned suggestions that include that exact phrase for all 10 models: Nike Dunk Low Panda ("nike dunk low panda price in india", "men's ... ", "nike dunk low red panda price in india"), Air Jordan 1 Low (10+ variants by colour, gender, "se", "paris"), Adidas Samba OG ("adidas samba og price in india", "adidas samba original price in india", "... women ...", "... shoes ..."), New Balance 9060 (10+ variants incl. "amazon", colours, "men's"), NB 530 ("... flipkart", "women", "original price in india", "white"), Air Force 1 (incl. "air force 1 price in indian rupees", "... flipkart", "... original"), Nike Air Max (incl. 90, 270, 95, 97, dn8, 720 sub-models, "flipkart"), Jordan 4 (incl. "retro 4", "... flipkart", Luka 4, Tatum 4, RM, Zion 4), Yeezy 350 (incl. "boost", "v2", "zebra", "sply"), Onitsuka Tiger Mexico 66 (incl. "vs japan", "sd", "yellow"). Autocomplete endpoint: https://suggestqueries.google.com/complete/search?client=firefox&gl=in&hl=en-IN&q=...
- VERIFIED, autocomplete: `<model> lowest price` produced a suggestion with the phrase for Jordan 1 Low, Samba OG, NB 9060 ("new balance 9060 lowest price in india" also appears), NB 530, Air Force 1, Air Max, Jordan 4, Onitsuka Mexico 66; Nike Dunk Low Panda returned an empty list; Yeezy 350 returned "yeezy 350 low price / cheap price / best price" but not "lowest price".
- VERIFIED, autocomplete: `<model> best price` returned the phrase for Jordan 1 Low, Samba OG, NB 9060 (also "new balance 9060 lowest price in india"), NB 530 (but also "best price uk"), Air Force 1 (UK and Australia variants), Air Max, Jordan 4, Yeezy 350, Onitsuka. Dunk Low Panda: empty.
- VERIFIED, autocomplete: `<model> price comparison` returned the phrase for Samba OG, NB 9060, NB 530, Air Force 1, Onitsuka Mexico 66, Air Max (as "nike air max 95 price comparison" and "... 90 ..."), and Jordan 1 Low (only as "cheapest price"/"cheapest"). Empty for Dunk Low Panda, Jordan 4 and Yeezy 350.
- VERIFIED, autocomplete: `cheapest <model>` returns suggestions for every model, but mostly "cheap <model>" and "price <model>" forms, with signals of non-India markets ("philippines", "in south africa", "on stockx", "reddit", "uk"). Treat as global behaviour, not India-specific.
- VERIFIED, autocomplete: `where to buy <model> in india` returned empty for Dunk Low Panda, Jordan 1 Low, Samba OG, NB 530, Air Force 1, Air Max, Jordan 4, Yeezy 350. It returned something only for NB 9060 ("where to buy new balance 9060 in india", "is new balance available in india") and Onitsuka Mexico 66 ("buy onitsuka tiger mexico 66 india", "which stores sell onitsuka tiger"). Generic: "best site to buy sneakers in india", "best place to buy sneakers in india (reddit)", "best site to buy jordans in india", "best place to buy jordans in india" are suggested; "cheapest place to buy sneakers in india" only completes to "best place to buy sneakers in india".
- VERIFIED, autocomplete, store-versus-store: "culture circle vs" completes to crepdog crew, hype fly, superkicks, kicks machine; "vegnonveg vs" to superkicks; "superkicks vs" to vegnonveg, footlocker, "vegnonveg reddit", culture circle, crepdogcrew; "vegnonveg vs superkicks" also to "vegnonveg or superkicks". "culture circle vs vegnonveg" and "samba og price in india vs" returned empty.
- VERIFIED, autocomplete, trust: "is culture circle legit" has about 10 variants (reddit, scam, fake products, for sneakers, for shoes, in india, real, reliable); "is superkicks legit" about 10 (in india, authentic, reliable, fake, reddit); "is crepdog crew legit" 6; "is limited edt legit" about 8 (reddit, in india); "is mainstreet marketplace legit" about 8 (reddit, scam, in india); "is vegnonveg legit" only 3 ("is veg non veg legit reddit", "is vegnonveg genuine"). So trust-check queries exist for each named store, strongest for Culture Circle and Superkicks.
- VERIFIED, autocomplete, comparison intent without a model: "sneaker price comparison india" completes only to "sneaker price in india", "average sneaker price in india", "nike/adidas/puma sneaker price in india". "sneakers price comparison website" completes to "shoe price comparison website", "shoes price comparison website india", "compare shoe prices online". "sneaker price tracker india", "compare sneaker prices india", "price tracker" shapes: empty.
- VERIFIED, Hinglish: "sasta sneakers india" and "original sneakers kahan se kharide" returned empty lists.
- SECONDARY: broader autocomplete caution. A suggestion proves some searches exist, not how many; Google drops suggestions below a threshold, so an empty list means very low or no volume, which is the only volume-like signal obtained.

### Inferences

- Evidence ranking by strength (autocomplete only): "<model> price in india" (strongest, present for 10 of 10, with long-tail colour and retailer modifiers such as "flipkart", "amazon") > "<model> best price / lowest price" (present for 8 to 9 of 10 but frequently with UK or global flavour) > "<model> price comparison" (7 of 10) > "where to buy <model> in india" (2 of 10) > Hinglish and tracker shapes (none).
- The "flipkart" and "amazon" modifiers on India price queries mean searchers already expect marketplace prices; a page that lists only specialist stores answers a narrower question.
- A comparison page that names stores would be matched by "<store A> vs <store B>" and "is <store> legit" queries, but those are about the stores, not the shoes, and the legit shapes are dominated by Reddit-style intent (suggestions say "reddit" repeatedly).

### Gaps

- No search volumes for any shape. Google Trends (geo IN) and Search Console on the owner side are the only route.
- Autocomplete from one machine, one day, no personalisation control, no check of how "gl=in" changes ordering versus no gl.
- People Also Ask boxes: not retrievable with these tools (no India SERP access).

## (b) Who ranks today, and existing sneaker comparison sites

### Takeaway

I could not observe an India SERP. The only SERP-like evidence is a US-based search for "nike dunk low panda price in india", which returned Nike India product pages and independent stores (not comparison sites), plus earlier notes showing listicles by Esquire India, Puma India and coupon sites. Global sneaker comparison sites exist but none shows India or INR on the page I could read.

### Cited Findings

- VERIFIED (search results, NOT a true India SERP, US-only engine): for "nike dunk low panda price in india" results were Nike India product URLs (nike.com/in/t/dunk-low-...), Superkicks (superkicks.in/products/wmns-dunk-low-black) and 10 Hills Studio product pages (listed Black Panda 2.0 at Rs 13,499, reduced from Rs 16,999, and Reverse Panda at Rs 20,399 "sourced on order"). No comparison site appeared. — [10 Hills Studio](https://www.10hillsstudio.com/products/nike-dunk-low-black-panda-2-0), [Nike India](https://www.nike.com/in/t/dunk-low-retro-shoes-69h36X/DV0831-111), [Superkicks](https://www.superkicks.in/products/wmns-dunk-low-black)
- VERIFIED (search results, not India SERP): query on store comparison returned Esquire India's "best sneakers under 10000 rs", Culture Circle's own blogs (best sneakers under 15000, under 20k), Ludic "best websites to buy sneakers in india", Harper's Bazaar India sneaker destinations (16 Aug 2025), The Ken piece on Culture Circle. No side-by-side same-shoe cross-store price table found. — [Ludic](https://ludic.life/blogs/footwear/best-websites-to-buy-sneakers-in-india), [Harper's Bazaar India](https://www.harpersbazaar.in/fashion/story/laced-up-indias-coolest-sneaker-destinations-1260563-2025-08-16)
- VERIFIED (page opened 2026-11-21): Sneakers123 is a price comparison site. The page text mentions "over 150", "243" and "over 200" shops (inconsistent figures on the same page), per-sneaker price in euros, discount percentage, number of shops per model, a price alert by target price, named shops END. (UK), StockX (USA), Caliroots (Sweden), Foot Locker FR, adidas IT/FR/ES; operator address in Seoul. No mention of India or INR. Monetisation not stated on the page. — [Sneakers123](https://www.sneakers123.com/en)
- SECONDARY: Sneakerjagers' advertising page says more than 10 million people find it each year and sells paid webshop placement; no store count found (the fetched URL returned 404 on direct fetch, content came from a search snippet). — [Sneakerjagers](https://www.sneakerjagers.com/en/advertising)
- SECONDARY: Sole Retriever is an app and release site: subscription plans (Basic 6.99, Pro 14.99 per month, yearly Pro 149.99 per an app-paywall listing) and aggregates release information from more than 2,000 retailers; revenue estimates from third parties vary widely (about 90K per month down to under 10K) and are not reliable. — [Adapty paywall library](https://adapty.io/paywall-library/sole-retriever-sneakers/), [Barchart](https://www.barchart.com/story/news/34174009/sole-retriever-app-users-secure-over-110-000-sneakers-and-counting)
- SECONDARY: Lyst earns commission on verified sales (no listing fees per its partner page), brands bid for placement; Zozo acquired Lyst in April 2025. Klarna's merchant commission is reported at 3 to 6 percent of GMV; PriceRunner is part of Klarna since 2022 and sells traffic through per-click prices for listed shops. — [Glossy](https://www.glossy.co/fashion/how-the-lvmh-backed-aggregator-lyst-does-business), [Lyst partners](https://www.lyst.com/partners/), [PriceRunner](https://www.pricerunner.com/c/advertising)
- NOT FOUND: Semrush or Similarweb traffic for Sneakers123, Sneakerjagers, Sole Retriever, everysize, The Sole Supplier, Lyst, StockX, GOAT. The search returned only a Grips estimate of USD 71,597 revenue for Sneakers123, which is a third-party estimate. — [Grips](https://gripsintelligence.com/insights/retailers/sneakers123.com)
- NOT FOUND: any evidence that Sneakers123, Sneakerjagers, Sole Retriever, everysize, Lyst, StockX, GOAT, Klarna or PriceRunner covers India or INR. Only Sneakers123 was opened and it shows none. The others were not opened (gap).
- VERIFIED (search results): Indian price anchors that confuse comparisons: a July 2026 third-party page lists a Samba OG Big Kid at Rs 17,407 on Amazon India versus Rs 10,999 official (from the earlier notes, [Magicdrop](https://magicdrop.in/drops/black-samba)).

### Inferences

- Global comparison sites make money by commission or paid placement from shops, which needs affiliate or CPC deals; a small Indian reseller comparing named competitors would have no such deals (inference) and would be both a listed shop and the editor of the comparison.
- Because the Sneakers123 page itself says nothing about India, a India-specific comparison page would not collide with it for India queries (inference, based on one page).

### Gaps

- No true India SERPs for any of the 10 models and query shapes; need an India IP or Search Console.
- Not opened: Sole Retriever, Sneakerjagers (404), The Sole Supplier, everysize, Lyst, StockX, GOAT, PriceRunner product pages; no comparison page read on these.
- No traffic figures for the sneaker comparison sites.

## (c) Indian general price comparison sites and their fate 2022 to 2026

### Takeaway

Hard evidence of closure is thin: Junglee closed in November 2017 (before the period). For 2023 to 2026 I found no source reporting closure, pivot or traffic collapse for MySmartPrice, PriceDekho, BuyHatke, Smartprix, 91mobiles, PriceBaba or CompareRaja. Current Similarweb data shows Smartprix ranked first in India's price comparison category in October 2026, and MySmartPrice still active. No source shows any of them comparing sneakers across VegNonVeg, Superkicks or Culture Circle.

### Cited Findings

- VERIFIED: Similarweb "Top Price Comparison Websites in India, October 2026" (updated 1 November 2026): rank 1 smartprix.com, 2 casence.in, 3 shoppermeet.net, 4 shopyvision.com, 5 oneclearwinner.com; no visit figures shown. mysmartprice.com does not appear in the top 5. — [Similarweb](https://www.similarweb.com/top-websites/india/e-commerce-and-shopping/price-comparison/)
- VERIFIED but internally odd: Similarweb MySmartPrice snapshot (October 2026): 17.3M visits over the last 3 months, up 60.8 percent versus the previous month, India 97.45 percent of traffic, country rank 807, global rank improved from 14,386 to 9,231; page says Display is 96.4 percent of desktop visits, which looks implausible and should not be relied on. — [Similarweb](https://www.similarweb.com/website/mysmartprice.com/)
- SECONDARY: older Semrush snapshots for MySmartPrice (page dated 16 September 2025) show a 20 percent drop in one month and Direct plus Google as the top sources; another snapshot shows a 48 percent drop with an unclear date. Single-month estimates, not a trend. — [Semrush](https://cw.semrush.com/website/mysmartprice.com/overview)
- VERIFIED: Junglee (Amazon's product discovery and peer-to-peer platform, launched in India 2012) was shut on or about 13 November 2017; its peer-to-peer features moved into Amazon.in Local Finds. — [YourStory](https://yourstory.com/2017/11/amazon-calls-day-junglee-wipes-off-first-step-india-market), [TechStartups](https://techstartups.com/2017/11/13/amazon-shuts-online-product-discovery-platform-junglee-given-p2p-indian-market/)
- SECONDARY: price-history tools are active for Indian fashion stores: PriceHistory (app, lists Amazon, Flipkart, Myntra, Nykaa, Croma, Ajio, Meesho, JioMart, Decathlon and others) with a footwear deals page scoring each discount against the product's own recorded price rather than MRP; Flipshope claims 16 lakh users on its Ajio page (vendor claim); BuyHatke app store listing says it compares prices across stores and tracks price changes; Desidime lists shoe deals. None of the retrieved pages lists VegNonVeg, Superkicks, Culture Circle, Crepdog, Limited Edt or Mainstreet. — [PriceHistory footwear deals](https://pricehistoryapp.com/deals/footwear), [PriceHistory app](https://pricehistoryapp.com/get-the-app), [Flipshope Ajio](https://flipshope.com/ajio-price-history-tracker), [Desidime shoes](https://www.desidime.com/groups/shoes)
- SECONDARY: Indian-startup press hits for "MySmartPrice layoffs, shutdown or pivot" returned unrelated companies only; no coverage of MySmartPrice, PriceDekho, BuyHatke, PriceBaba, Pricee or CompareRaja closing or pivoting was found. — search result set via Inc42 listings, no relevant article.
- VERIFIED (global context, not India): Ahrefs analysis (published 26 Nov 2024, window 18 to 25 Nov 2024): comparison keywords were the largest category (2,555 keywords, 41.0 percent of the dataset) among keywords lost by seven big affiliate publishers (WSJ Buyside, USA Today Reviewed, Independent Advisor, The Sun Shopping, Forbes Advisor, Newsweek Vault, CNN Underscored) after the September 2023 Helpful Content Update; Reddit took about 6 percent of the lost traffic share, then Bankrate and Amazon. — [Ahrefs](https://ahrefs.com/blog/affiliate-publisher-site-reputation-abuse/)
- SECONDARY (global): Search Engine Land reports affiliate sites losing organic traffic after the March 2024 core update; HouseFresh lost 91 percent of Google traffic; Amsive reports review and affiliate sites in the top 10 were largely replaced by ecommerce stores by May 2024. — [Search Engine Land](https://searchengineland.com/affiliate-sites-losing-organic-traffic-443792), [Search Engine Land (HouseFresh)](https://searchengineland.com/review-site-google-traffic-affiliate-seo-content-440143), [Amsive](https://www.amsive.com/insights/seo/seo-visibility-shifts-from-review-sites-to-ecommmerce-user-generated-content-sites-in-2024/)
- SECONDARY: Indian news publishers reported Google-linked traffic falls of roughly 15 to 30 percent (news sites, not comparison sites). — [exchange4media](https://www.exchange4media.com/digital-news/digital-publishers-hit-hard-as-google-tightens-search-policies-140982.html), [WARC](https://www.warc.com/content/feed/indias-news-publishers-react-to-decreasing-online-traffic/en-GB/7876)
- NOT FOUND: Similarweb or Semrush figures for PriceDekho, BuyHatke, Pricee, PriceBaba, CompareRaja, 91mobiles; not opened.

### Inferences

- The only dated evidence about comparison pages in Google is global and says comparison and affiliate content lost ground to retailers, Reddit and large brands from 2023 to 2025. A comparison page on a seven-month-old domain with no brand search sits in the weakest position described by those sources (inference; the sources study big US publishers, not Indian micro-sites).
- Indian comparison sites that survive are electronics and mobile focused (Smartprix at rank 1); I found no sneaker coverage by them.

### Gaps

- No dated Indian-site traffic series 2022 to 2026; Similarweb pages only gave snapshots.
- Not opened: 91mobiles, Smartprix, PriceDekho, Pricee, CompareRaja, PriceBaba, BuyHatke site pages; whether any has a footwear or sneaker category is not established beyond the negative evidence above.
- Which comparison companies closed, pivoted or shrank 2023 to 2026: not found.

## (d) Does a sneaker-specific Indian cross-store comparison exist

### Takeaway

None found. Searches tried returned general price-history tools, coupon sites and affiliate listicles, never a sneaker-only cross-store same-shoe table for Indian specialist stores.

### Cited Findings

- Searches tried (autocomplete, India): "sneaker price comparison india", "sneaker price tracker india", "compare sneaker prices india", "sneakers price comparison website", "sasta sneakers india", "cheapest place to buy sneakers in india", "culture circle vs vegnonveg". Result: none returns a tool; two return empty lists. — VERIFIED, own queries, 2026-11-21
- Searches tried (web, US-only engine): "sneaker price comparison India stores Culture Circle VegNonVeg Superkicks"; "sneaker deals India Telegram OR extension OR app compare prices Superkicks VegNonVeg Nike India tracker"; "PriceHistory app India price tracker ... footwear BuyHatke extension users". Result: listicles (Esquire India, Ludic, Zoutons, Magicdrop, Culture Circle's own blogs), PriceHistory and Flipshope for general e-commerce, Desidime deals; nothing sneaker-specific. Magicdrop and Zoutons publish dated price roundups (affiliate style) sourced mostly from Amazon India and Tata CLiQ listings and mention WhatsApp and Telegram drop alerts. — [Magicdrop](https://magicdrop.in/drops/black-adidas-sneakers), [Zoutons](https://zoutons.com/news/adidas-same-samba-four-prices-july-2026-picks)
- Not searched or not retrievable: Instagram deal pages, Telegram channel directories, Chrome Web Store extension listings for sneakers (the engine cannot see Instagram or Telegram).

### Inferences

- Absence of any sneaker-specific comparison could mean an unserved need or a missing one: autocomplete shows no "sneaker price tracker india" suggestion, so there is no visible search demand for the tool itself (inference from absence of a suggestion).

### Gaps

- Instagram, Telegram and extension ecosystems not checked.

## (e) Does Google India already answer this in results

### Takeaway

Yes in part: Google announced on 7 April 2026 AI shopping upgrades in India (Gemini app, AI Mode, Circle to Search) that show prices from across the web and comparison tables. No source retrieved states the Shopping tab or knowledge panel behaviour for sneaker queries in India, and no price tracking mention was found in the announcement.

### Cited Findings

- VERIFIED (page opened): Google India blog, 7 April 2026: Gemini app shopping lets users "get shoppable product listings, comparison tables, prices from across the web and places to buy"; AI Mode in Search gets a conversational shopping upgrade with comparison tables placing products side by side with price, reviews and inventory; Shopping Graph over 50 billion products, about 2 billion updated hourly; Gemini shopping in English and Hindi, AI Mode shopping in English with Hindi "rolling out soon"; the post does not mention price tracking. — [Google India blog](https://blog.google/intl/en-in/products/explore-communicate/new-ways-google-is-using-ai-to-make-shopping-easier/)
- SECONDARY: the same launch covered by Digit, Business Today (7 April 2026), Fone Arena and Deccan Herald; Free Press Journal reports a test of a Flipkart Buy button inside Gemini and AI Mode in India (unconfirmed by Google per the summary). — [Business Today](https://www.businesstoday.in/technology/story/google-brings-new-shopping-experiences-to-gemini-app-ai-mode-and-circle-to-search-524480-2026-04-07), [Free Press Journal](https://www.freepressjournal.in/tech/google-tests-flipkart-buy-button-inside-gemini-ai-mode-in-india)
- NOT FOUND: whether the classic Shopping tab shows "compare prices from N stores" for sneaker queries in India, and whether AI Overviews answer "<model> price in india" with a price range. I could not view an India SERP.
- From the earlier project notes (not re-verified): the owner's own Merchant Center account was reinstated 2026-10-20 and a listing feed exists, which feeds the same Shopping Graph.

### Inferences

- Google's Shopping Graph is built from merchant feeds, so Google can already show a price range across stores for any model that stores list; a third-party page would compete with that panel for the same query (inference; the panel itself was not observed in India).

### Gaps

- Direct screenshots or text of India SERPs, AI Overviews and AI Mode answers for the 10 test queries: need an India IP and browser; not possible here.
- Shopping tab layout for sneakers in India.

## Overall note for the report writer

Strong evidence: India autocomplete supports "<model> price in india" for all tested models (VERIFIED). Weak or absent evidence: volumes for any shape, India SERP composition, any Indian site doing sneaker cross-store comparison (none found, search coverage limited), the fate of Indian comparison companies after 2022 (nothing found beyond Junglee 2017). Global evidence (Ahrefs Nov 2024, Search Engine Land 2024) says comparison and affiliate pages lost visibility to retailers and Reddit; it is context, not India-specific. Not opened despite the brief: Sole Retriever, Sneakerjagers, everysize, The Sole Supplier, Lyst, StockX, GOAT, PriceRunner, 91mobiles, PriceDekho, Pricee, CompareRaja, PriceBaba, BuyHatke, Smartprix pages.
