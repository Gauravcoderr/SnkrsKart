# Legal exposure in India of naming competitor stores in a price comparison, and the written rules of each store (as of 2026-11-21)

Risk briefing for a business owner, not legal advice. A lawyer should review before launch.

Labels: **verified** = primary text opened and read in this session (robots.txt fetched with curl, terms pages fetched with curl, 2026-11-21); **secondary** = law-firm or press summary seen in search results or a summarising fetch, original not opened; **background** = from the model's own prior knowledge, NOT checked this session, treat as unverified; **not found** = looked, no result. Search snippets and a summarising fetch tool were the only access to most legal sources; no Act text, gazette PDF or judgment text was opened. Where sources conflict or are thin this is said.

Method limits: Foot Locker India, Ajio and nike.in returned Akamai "Access Denied" (HTTP 403) to curl for robots.txt and terms; recorded as blocked, not guessed. Tata CLiQ terms are a JavaScript app (empty to curl). MySmartPrice and Smartprix terms returned 403 to the fetch tool. Indian Kanoon and the CCPA gazette were not opened. About 20 tool calls were used.

## Scraping and republishing facts in India (IT Act 43/66, Copyright Act, contract, cases, are prices protectable)

### Takeaway
No Indian statute or reported judgment found that decides whether scraping public price data is unlawful. Individual prices are facts and not copyright-protected; a curated database or compilation can be, and Indian courts have restrained wholesale copying of listings databases (Naukri 2005, Just Dial). Enforceability of "no scraping" website terms against a non-registered visitor is unsettled in India. Risk for publishing a small set of facts (price, size availability, link) is moderate-low in law, but the practical risk is a legal notice or technical blocking.

### Cited Findings
- India has no single statute on web scraping; commentators treat it case by case under the IT Act and the Copyright Act. — [law.asia](https://law.asia/india-data-scraping-regulation/), [S.S. Rana](https://ssrana.in/articles/data-scraping-issues-india/), [Mondaq](https://www.mondaq.com/india/copyright/900156/data-scraping-and-legal-issues-in-india) (secondary)
- IT Act s.43: civil compensation for accessing a computer resource or downloading/copying data without the owner's permission; s.66 makes it criminal only when done dishonestly or fraudulently (needs intent). A Rajya Sabha answer of 7 Feb 2025 tied scraping for AI training to s.43. — [law.asia](https://law.asia/india-data-scraping-regulation/) (secondary); [Rajya Sabha PQ 267, 7 Feb 2025](https://rsdebate.nic.in/bitstream/123456789/758404/1/PQ_267_07022025_U558_p280_p280.pdf) (listed in search, not opened)
- Copyright: facts are generally unprotected, arrangement and selection of a compilation can be, and reproducing substantial portions of a database can infringe; India has no sui generis database right. — [S.S. Rana](https://ssrana.in/articles/data-scraping-issues-india/), [Lawrato](https://lawrato.com/indian-kanoon/civil-law/is-web-scraping-legal-in-india-what-a-business-can-and-cannot-collect-3192) (secondary)
- Eastern Book Company v D.B. Modak (Supreme Court, 2008): originality needs a "modicum of creativity", rejecting both "sweat of the brow" and pure creativity — **background, not verified this session** (my attempt to open it on Indian Kanoon landed on a wrong document; search returned no holding text).
- Info Edge (Naukri) v Bixee: Delhi High Court, 2005, restrained deep-linking, copying and reproducing naukri.com content and noted its dynamic jobs database. Decided on copying and database protection, not browsewrap terms. — [Business Standard, Dec 2005](https://www.business-standard.com/article/economy-policy/hc-tells-site-not-to-use-naukri-com-content-105122901007_1.html) (secondary, snippet)
- Just Dial: Delhi High Court granted relief where thousands of listings, source data and numbers were allegedly lifted verbatim. Date and reasoning not retrieved. — [Bar and Bench](https://www.barandbench.com/news/litigation/delhi-high-court-grants-relief-to-just-dial-in-suit-alleging-data-theft-trademark-violation) (secondary, snippet only)
- Whether contractual or technical anti-scraping restrictions are enforceable: "courts in India have yet to determine". — [law.asia](https://law.asia/india-data-scraping-regulation/) (secondary). No Delhi High Court ruling on browsewrap enforceability against scrapers found.
- ANI v OpenAI (Delhi High Court): reported as treating training on public text as fair dealing; separate question, and the same report says public hosting does not waive copyright. — [SetIndiaBiz](https://www.setindiabiz.com/?p=25113) (secondary, a single outlet, treat cautiously)
- 2013 SpicyIP piece on the intersection of copyright and IT-law data extraction exists. — [SpicyIP](https://spicyip.com/2013/10/data-extraction-intersection-of-copyright-and-information-technology-laws-in-india.html) (title seen, not opened)
- Foreign context, all **background, not verified**: hiQ v LinkedIn (9th Cir. 2022: scraping public profiles is likely not "without authorization" under the US CFAA, but hiQ later lost on contract and settled); Meta v Bright Data (N.D. Cal. Jan 2024: logged-off scraping of public data not a breach of Meta's terms that bind users); X Corp v Bright Data (N.D. Cal. 2024: X's contract claim dismissed, pre-empted by copyright law); Ryanair v PR Aviation (CJEU 2015: where a database is outside the EU database directive, owners may restrict reuse by contract); Ryanair v Booking (reported 2024, outcome and court not confirmed). Relevance: US rulings favour access to public data, CJEU allows contractual restriction. None binds an Indian court.
- No Indian reported case found on MakeMyTrip, OLX, Zomato or Swiggy menu scraping, Tata Sky, real-estate or travel aggregator scraping, or price aggregation. **Not found.**

### Inferences
- Taking one price, a size list and a link per product, with the site's data published openly, is a small taking of facts, far from the wholesale verbatim copying of a curated database in the Naukri and Just Dial cases; copyright exposure is low. The stronger claims a store could make are breach of its terms (see store table) and passing off or unfair competition if the page implies affiliation.
- A twice-daily scrape that the store's terms forbid, by a direct competitor, is the fact pattern most likely to produce a notice, because it shows intent and commercial use.

### Gaps
- No primary text of the IT Act, Copyright Act, EBC judgment, Naukri v Bixee, Just Dial order. No Indian browsewrap case. No Info Edge or Infomedia 18 scraping order found.

## Comparative advertising by a competitor (TM Act 29(8), 30(1), case law, what a lawful comparison must be, stale or wrong prices)

### Takeaway
Indian courts allow truthful comparison and puffery but restrain denigration, specific and generic. A competitor naming rivals in a "cheapest at X" line is comparing in the course of trade, so it must be true, current and not disparaging. A stale or wrong price shown next to a rival's name is the main avoidable exposure.

### Cited Findings
- Dabur v Patanjali (Delhi High Court, single judge Mini Pushkarna, 3 July 2025, CS(COMM) 1195/2024): print ads were specific disparagement of Dabur, TV ad generic disparagement of the whole chyawanprash class; went beyond puffery. — [Legal Service India summary](https://www.legalserviceindia.com/Legal-Articles/?p=11573), [Delhi HC judgment PDF](https://delhihighcourt.nic.in/app/showFileJudgment/59203072025SC11952024_203421.pdf) (listed, not opened) (secondary)
- Dabur v Patanjali "dhoka" ad (Justice Tejas Karia, 6 Nov 2025, CS(COMM) 1182/2025 per one source): barred; comparative advertising must not be "false, misleading, unfair or deceptive". Division Bench later allowed "ordinary Chyawanprash" as comparative puffery but not the "40 herbs" reference that identified Dabur. Case numbers and dates differ between sources. — [LiveLaw](https://www.livelaw.in/amp/high-court/delhi-high-court/delhi-high-court-restrains-patanjali-from-broadcasting-dhoka-chyawanprash-ad-in-daburs-plea-309483), [Bar and Bench](https://www.barandbench.com/news/litigation/delhi-high-court-allows-patanjali-to-use-why-settle-for-ordinary-chyawanprash-in-ads-but), [SCC Online](https://www.scconline.com/blog/?p=366417) (secondary, snippets)
- Reckitt v Wipro (Santoor v Dettol) and Reckitt v HUL (Domex, 2022) discussed on the line between superiority claims and denigration; Godrej Sara Lee v Reckitt called a benchmark. — [Legal Service India](https://www.legalserviceindia.com/Legal-Articles/?p=11573) (secondary)
- Reckitt & Colman v M.P. Ramchandran (Calcutta High Court 1999), Pepsi v Hindustan Coca-Cola (Delhi 2003), Dabur v Colortek (Delhi 2010), Havells v Amritanshu Khaitan (Delhi 2015): principles that a seller may claim his goods are best, may compare, may not say a rival's are bad; four-factor test (intent, manner, story line, effect) — **background, not verified this session.**
- TM Act 1999 s.29(8) (advertising that takes unfair advantage of or is against honest practices, or detrimental to the mark's distinctive character or repute, is infringement) and s.30(1) (use in accordance with honest practices in industrial or commercial matters is not infringement): **background, Act text not opened.** Nominative use of a rival's name as a plain word to identify it, with no confusion about origin, is the lowest-risk reading; not confirmed by an Indian case in this session.

### Inferences
- Lawful comparison, as the cases and guidelines describe it: true when published, verifiable, same product (style code, size, new, authentic) and same terms (shipping, taxes, delivery time, return rights), not selective in a way that misleads, no adjectives about the rival's quality.
- A "cheapest at X" statement is a specific factual claim about a named rival's price. If the rival's price changed after the scrape, the claim is false at the time a customer reads it. Mitigation is a visible "checked at <time>" stamp, a re-check rule, and hiding a row older than a fixed age (design choice, not a legal requirement found).

### Gaps
- No 2023 to 2026 Delhi High Court ruling found on a retailer naming a rival retailer's price; the 2025 cases concern advertisers of medicinal products. No Indian case on stale price displays found.

## Consumer law (CPA 2019, CCPA misleading-ad guidelines 2022, dark patterns 2023, ASCI) and disclosure

### Takeaway
A comparison run by a seller is an advertisement and must not mislead. The CCPA 2022 guidelines carry disclaimer rules and penalties up to ₹10 lakh (first) and ₹50 lakh (subsequent). I could not retrieve the guidelines' own comparative-advertising clause. A plain disclosure that the site sells the product itself is advisable and a "recommend" ranking that always favours own offer is the dark-pattern and misleading-ad risk.

### Cited Findings
- CCPA notified the Guidelines for Prevention of Misleading Advertisements and Endorsements for Misleading Advertisements, 2022 on 9 June 2022 under s.18 CPA 2019 (sources differ: effective 9 or 10 June 2022). — [Khaitan Ergo](https://khaitanco.com/sites/default/files/2022-06/Ergo_11062022.pdf) (listed), [Mondaq](https://www.mondaq.com/india/advertising-marketing-branding/1201534/ccpa-releases-guidelines-for-prevention-of-misleading-advertisements-and-endorsements-for-misleading-advertisements-2022) (secondary)
- Disclaimers: "shall not attempt to correct a misleading claim", "shall not attempt to hide material information", same language, "clear and prominently placed". — [Lakshmikumaran & Sridharan](https://www.lkslaw.com/insights/articles/prevention-of-misleading-advertisements-analysis-of-guidelines-issued-by-central-consumer-protection-authority) (secondary)
- Penalty under s.21(2): up to ₹10 lakh first offence, up to ₹50 lakh subsequent. — same (secondary)
- The guidelines' conditions for comparative advertisements: **not found in any source opened**; the same Lakshmikumaran article does not mention them. Obtain the gazette text from consumeraffairs.nic.in.
- CCPA dark patterns guidelines 2023 and the ASCI Code chapter on comparisons: **not searched or retrieved.** Background only: dark patterns guidelines were notified 30 Nov 2023, and ASCI Code Ch. I and Ch. IV require honest, substantiated, non-denigrating claims. Unverified.
- Whether a comparison run by one of the compared sellers needs a disclosure: **not found** as an explicit rule. Inference below.

### Inferences
- Treat "we sell this too" as a material connection and say so next to any "cheapest at" or "buy here" line. Giving the recommended store only when the rival is actually lower (not hiding it when our price wins) keeps the comparison from reading as a rigged ranking.

### Gaps
- Guideline text on comparative ads, dark-patterns list, ASCI wording, any CCPA action on a price comparison.

## E-commerce rules (inventory vs marketplace; 2026 amendment)

### Takeaway
No source found says that outbound comparison listings turn an inventory entity into a marketplace entity. The 2026 amendment does not appear to change those definitions.

### Cited Findings
- Consumer Protection (E-Commerce) (Amendment) Rules, 2026 notified 9 Sept 2026, in force 1 Jan 2027. Reported changes: "ranking" definition (Rule 3(1)(j)) broadened; Rule 4(12) sponsored listings must be "distinctly identified"; Rule 4(11)(c) bars misleading users by manipulating search results or indexes; Rule 4(13) prior price shown with a reduced price; yearly dark-pattern self-audit; Rule 5(6) limits use of collected information by marketplace entities; Rule 7 best-before display for inventory entities. No change to inventory or marketplace definitions reported. — [AZB (fetch summary)](https://www.azbpartners.com/bank/rethinking-e-commerce-compliance-key-changes-under-the-consumer-protection-e-commerce-amendment-rules-2026/), [Bar and Bench](https://www.barandbench.com/law-firms/view-point/consumer-protection-e-commerce-amendment-rules-2026-from-consumer-disclosure-to-platform-governance), [India Briefing](https://www.india-briefing.com/news/india-ecommerce-amendment-rules-2026-key-changes-47308.html/) (secondary; gazette G.S.R. 789(E) not opened)
- 2020 Rules: "e-commerce entity" umbrella; marketplace and inventory entities; excludes sellers on a marketplace. — [PRS comments PDF](https://PRSINDIA.org/files/bills_acts/bills_parliament/2021/CommentseCommerce_Rules2020_upto_21July2021.pdf) (secondary)

### Inferences
- The store holds title to inventory and sells through its own checkout, so it stays an inventory entity; links out to rivals do not give it a buyer-seller platform. Rule 4(11)(c) and the dark-pattern audit make an unlabelled "recommended" ranking that always favours the own offer a new compliance question from 1 Jan 2027. Label any own-offer slot as the store's own.

### Gaps
- Amendment text itself; whether the final rules kept the 2021 draft widening of "e-commerce entity".

## Logos, images and names

### Takeaway
Plain text names with a link carry the lowest risk. Logos are registered marks and several terms reserve them; competitor product photos are copyrighted works and hotlinking or copying them is the highest-risk element.

### Cited Findings
- VegNonVeg: "VegNonVeg Brand Name and Logo are the registered trademarks of HSS Apparel Private Limited"; content may not be reproduced "for any public or commercial purpose". — [VegNonVeg legal page](https://www.vegnonveg.com/legal) (verified)
- Culture Circle: content including "images, logos, product photographs, brand names" may not be copied, reproduced, republished or displayed without prior written consent. — [Culture Circle terms](https://www.culture-circle.com/terms-conditions) (verified)
- Limited Edt: Content (text, graphics, logos, design, layout, pricing) owned or licensed; no reproducing or publishing "other than with the prior written consent". — [Limited Edt terms, last updated 22 Sept 2023](https://limitededt.in/pages/terms-conditions) (verified)
- Copyright in product photography, hotlinking, nominative use of logos in India: no case retrieved. **Not found.** Background only: photographs are artistic works under the Copyright Act 1957; unverified here.

### Inferences
- Safer: own photos of the pair we sell, a generic or brand-neutral icon, or text names only; link to the rival product page rather than embed its image; never copy descriptions.

### Gaps
- No Indian authority on logos or hotlinking in comparison sites.

## Store rules: robots.txt and terms (all fetched 2026-11-21)

### Takeaway
Of 12 hosts, Foot Locker India and Ajio (robots.txt and terms) and nike.in (terms) returned 403, and Tata CLiQ terms were unreadable. Six stores forbid scraping or automated access in their terms (Myntra, VegNonVeg, Superkicks, Crepdog Crew, Culture Circle, Mainstreet); VegNonVeg and Superkicks also forbid "collection and use of product listings, description, or prices". robots.txt leaves product pages open on most, but Nike disallows `*/p/` product paths, and Superkicks, VegNonVeg and Tata CLiQ disallow search. The scraper already runs against all of these; naming them makes the contract exposure visible to them.

### Cited Findings
Table: robots.txt (verified), terms (verified unless stated), operating entity.

| Store | robots.txt | Terms on scraping, price reuse | Entity / date |
|---|---|---|---|
| vegnonveg.com | HTTP 200. `User-agent: *` Disallow `/cart/ /checkout/ /account/ /wishlist/ /search/ /?`, Allow `/`; no bots named. [robots](https://www.vegnonveg.com/robots.txt) | Bars "spiders, robots, crawlers... or other mechanism... to navigate or search the Platforms"; copying or duplicating; permission excludes "commercial use of the VegnonVeg Content, any collection and use of product listings, description, or prices, and, any derivative use". Courts in Delhi. [legal](https://www.vegnonveg.com/legal) | HSS Apparel Private Limited, Okhla, New Delhi; IP contact hello@VegnonVeg.com; no date shown |
| superkicks.in | HTTP 200 (Shopify). Header comment bars "Automated scraping, buy-for-me agents"; `*` Disallow `/search /cart /checkout /collections/*sort_by*` etc; `Nutch` disallowed; AhrefsBot crawl-delay 10. Products not disallowed. [robots](https://www.superkicks.in/robots.txt) | Same wording as VegNonVeg (cl. 3.2.4 spiders/robots; 2.4 no "collection and use of product listings, description, or prices"). Mumbai courts, arbitration Bengaluru. [terms](https://www.superkicks.in/pages/terms-conditions) | Legal entity name not found in the page text; no date seen |
| limitededt.in | HTTP 200 (Shopify). `*` Allow `/`; disallows cart, checkout, account, sort_by, filters; names GPTBot and OAI-SearchBot (cart/checkout disallowed only). [robots](https://limitededt.in/robots.txt) | No scraping, robot or automated-access clause found. Bars reproducing or publishing Content "pricing" or Trade Marks without written consent. [terms](https://limitededt.in/pages/terms-conditions) | "Limited Edt" (no company form given); last updated 22 Sept 2023 |
| culture-circle.com | HTTP 200. `*` Allow `/`, Disallow `/api/ /checkout/ /track-order/`; welcomes named AI bots (GPTBot, ClaudeBot etc.) except same three paths. [robots](https://culture-circle.com/robots.txt) | "prohibited from using any data mining, robots, or similar data gathering or extraction tools"; personal non-commercial licence; no copying of text, images, logos, photos. New Delhi courts. [terms](https://www.culture-circle.com/terms-conditions) | Metacircles Technologies Private Limited named in consent clause (the legal operator is not stated plainly); Gurgaon business days; no date seen |
| crepdogcrew.com | HTTP 200 (Shopify). `*` Allow `/`; disallows cart, checkout, sort_by, filters, `cart.js`; points agents to UCP/MCP instead of scripts ("AJAX surfaces: agents should use UCP/MCP instead"). Products open. [robots](https://crepdogcrew.com/robots.txt) | "The use of any robot, spider, or other automatic device or software ... is strictly prohibited"; no use "to ... spider, crawl, or scrape". [terms](https://crepdogcrew.com/pages/terms) | House Of CDC Fashion Private Limited, DLF Phase IV, Gurugram; no date seen |
| mainstreet (marketplace.mainstreet.co.in; www redirects there) | HTTP 200 (Shopify), same template as Crepdog: products open, same disallows. [robots](https://marketplace.mainstreet.co.in/robots.txt) | Bars "to ... spider, crawl, or scrape" (no separate robot sentence). [terms](https://marketplace.mainstreet.co.in/policies/terms-of-service) | "The Mainstreet Marketplace" (no company form found); no date seen |
| footlocker.co.in | **Blocked**: HTTP 403 Akamai Access Denied for robots.txt and terms | not read | not found |
| myntra.com | HTTP 200, 735 lines. `*` Disallow includes `*/filters*`, `*/name/*`, `*/brand/*`, `*ajax_search*`, `*mkproductdetail*`, `*/search/track/*`; I did not read lines past 50 for named bots. [robots](https://www.myntra.com/robots.txt) | "shall not use any 'deep-link', 'page-scrape', 'robot', 'spider' or other automatic device, program, algorithm or methodology... to access, acquire, copy or monitor any portion of the Platform or any Content". [termsofuse](https://www.myntra.com/termsofuse) | Myntra Designs Private Limited, Bengaluru (Tata/Flipkart group not checked); "Last updated: 31 October, 2026", version 4.1 |
| ajio.com | **Blocked**: HTTP 403 | not read | not found |
| tatacliq.com | HTTP 200. `*` Disallow `/search/`, `/*?q=`, `/que/`, tracking params; Googlebot, ChatGPT-User, GeminiBot, PerplexityBot, ClaudeBot fully allowed; GPTBot allowed. [robots](https://www.tatacliq.com/robots.txt) | Terms page is a JavaScript app, empty to curl: **not read** | not found |
| luxury.tatacliq.com | HTTP 200. `*` Disallow account, cart, `/search`, `/*?query=*`; MJ12bot, dotbot, Gigabot, CazoodleBot fully disallowed. [robots](https://luxury.tatacliq.com/robots.txt) | not read | not found |
| nike.com/in | www.nike.com robots.txt HTTP 200, comment "just crawl it": `*` Disallow `*/p/` (product pages), `*/checkout/`, `*/member/*`; Baiduspider etc. disallowed. nike.com/in/ redirects 301 to **nike.in**, whose own robots.txt was not fetched. [robots](https://www.nike.com/robots.txt) | nike.in terms: **blocked** (403) | not found |

- Overall pattern: Shopify-based stores (Superkicks, Limited Edt, Crepdog, Mainstreet) use platform robots.txt; Crepdog and Mainstreet point agents to UCP/MCP endpoints and Superkicks bars "buy-for-me" agents; their terms are shorter, templated. (verified)

### Inferences
- Strictest on paper: VegNonVeg and Superkicks (explicit ban on "collection and use of ... prices"), then Myntra (explicit "page-scrape"/"monitor"), Culture Circle, Crepdog. Lowest on paper: Limited Edt (no automation ban, but a pricing reuse bar) and Tata CLiQ (unread).
- Likelihood of a notice (judgment, not evidence): higher from stores that are direct competitors in the same Delhi/Gurugram sneaker niche (VegNonVeg, Culture Circle, Crepdog, Superkicks) than from large corporates (Myntra, Tata CLiQ, Nike), who may more likely block by technical means. No evidence gathered either way.
- Foot Locker India, Ajio and nike.in block automated fetch outright; the existing scraper for these may already rely on workarounds (see CLAUDE.md scraper section), which is an additional IT Act s.43/66 argument for the store if it circumvents a block.

### Gaps
- Terms of Foot Locker India, Ajio, nike.in, Tata CLiQ (both), Mainstreet's company form; Superkicks entity; Myntra robots beyond line 50.

## Enforcement reality and how comparison sites justify themselves

### Takeaway
No public record found of an Indian retailer suing or sending a reported notice to a price-comparison site, deal site, browser extension or affiliate over price display. Absence of public record is not absence of notices.

### Cited Findings
- MySmartPrice terms identify the operator as MSP Digital Media Private Limited and define services to include affiliate and advertising services; the price-accuracy wording was not retrieved. — [MySmartPrice terms](https://mysmartprice.com/terms) (search snippet; the page itself returned 403 to the fetch tool)
- Smartprix terms page exists; not retrieved. — [Smartprix terms](https://www.smartprix.com/about/terms-of-services) (403)
- 91mobiles, PriceDekho, BuyHatke, PriceHistory disclaimers: **not retrieved.**
- Cases or notices against BuyHatke, PriceHistory, MySmartPrice, 91mobiles, Smartprix: **not found.**

### Inferences
- General pattern of comparison sites (from the search blurbs, not Indian sources): "prices approximate, subject to change, verify at merchant" disclaimers and affiliate commissions. Not verified for any Indian site.

### Gaps
- Everything specific to how the Indian aggregators claim the right to show store prices.

## Safer design choices

### Takeaway
Measures below are the practical set; where a source backs one it is cited, otherwise it is the researcher's inference from the findings above and should be checked with a lawyer.

### Cited Findings
- Stores' own rules support these checks: VegNonVeg, Superkicks, Culture Circle and Myntra name IP and copyright contacts or consent routes: hello@VegnonVeg.com (VegNonVeg terms); Myntra has a grievance officer in its terms. (verified, pages above)
- Crepdog and Mainstreet robots.txt direct agents to official UCP/MCP endpoints and to bots@shopify.com for contact; Superkicks lists Shopify Checkout Kit and the same contact. (verified)
- Google's merchant-listing rules say pages that only link to other sellers are not merchant listings; relevant to markup, not law. — [Merchant listing docs](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) (from earlier note, secondary)

### Inferences
- Ranked by risk reduction: (1) get written permission or an affiliate or feed arrangement from the stores that matter most (VegNonVeg, Superkicks, Culture Circle, Crepdog); (2) keep the anonymous range for stores whose terms forbid price collection and name only stores that grant permission; (3) text names, no logos, no images, no copied descriptions; (4) "price checked <date and time>" stamp, auto-hide rows after a set age, re-verify before showing "cheapest"; (5) show like-for-like only (same style code, size, new and authentic, note shipping and returns), never adjectives about rivals; (6) label own offer as the store's own and show the rival even when cheaper; (7) honour robots.txt (Nike product pages `*/p/` are disallowed; Superkicks and VegNonVeg `/search`; Tata CLiQ `/search/`), slow requests, and stop on 403 rather than work around; (8) a visible takedown contact and a prompt removal process; (9) keep the 1 Jan 2027 amendment (Rule 4(11)(c), 4(12)) in mind for any "recommended" ordering.

### Gaps
- No lawyer or comparison-site source describing these choices was retrieved; items are inferences. Risk ratings per practice for the owner, as judgment only: publishing anonymous range = low; named stores with text and link = moderate (contract claim plausible for VegNonVeg, Superkicks, Myntra, Culture Circle, Crepdog); "cheapest at X" recommendation with stale data = moderate to high (false-comparison exposure); logos = moderate; competitor images or hotlinking = high.
