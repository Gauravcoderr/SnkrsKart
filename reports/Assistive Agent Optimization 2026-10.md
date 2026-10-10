# Assistive Agent Optimization (AAO) for SNKRS CART

October 2026. Method: five research tracks (agent selection evidence, agentic commerce protocols and Indian payment rails, the technical stack, measurement plus a competitor scan, and a code audit of this repo), live checks against www.snkrscart.com and seven Indian competitors, and the build described below. Confidence: H high, M medium, L low.

## Verdict

AAO means being the store an AI agent picks and can act on when it shops for someone. For an India-only store in October 2026 the order of work is clear:

1. **Be eligible on Google.** Gemini and AI Mode shopping went live in India on 2026-04-07 and read the Shopping Graph, which Merchant Center feeds (H). A vendor study found 83 percent of ChatGPT shopping carousel products also sat in Google Shopping's top 40 (M). The suspended Merchant account is therefore the single biggest AAO blocker, and the facts that disagree across the site (below) are the likely cause.
2. **Tell every surface the same truth.** Google and agents compare the feed, the product page, policy pages and checkout. A price, fee or payment method that differs between them reads as misrepresentation.
3. **Earn trust signals agents weigh.** In controlled experiments ratings were the strongest lever (+0.1 star moved an agent's pick share from 10 percent to 15 to 20 percent), then price, then third-party endorsement (H, ACES and ABxLab). Schema on its own showed no citation lift (M, Ahrefs).
4. **Be usable.** Agents that browse need readable size controls and stable URLs; agents that use tools need an MCP server; the buyer still checks out on our site.
5. **Wait on agent checkout.** ChatGPT Instant Checkout, Google UCP checkout, Copilot Checkout and Perplexity Instant Buy are US and USD only (H). UPI agent payments are closed pilots (H).

## What moves an agent's choice

| Signal | Evidence | Confidence |
|---|---|---|
| Ratings and review count | ACES (Columbia, arXiv 2508.02630) and ABxLab (arXiv 2509.25609, 17 models, 80k trials): large effects; OpenAI and Google ingest ratings | H in tests, M live |
| Price | Agents are price elastic (about -1.6 to -2.8 in ACES); OpenAI ranks merchants on price and availability | H |
| Third-party endorsement, earned media | "Overall Pick" badges doubled to quadrupled pick share; AI search cites earned media 69 to 92 percent of the time (Chen et al., arXiv 2509.08919) | H / M |
| Presence in Google Shopping | Feeds Gemini, AI Mode, and most of the ChatGPT carousel | M |
| Shipping and returns | Feed Google's store quality scoring; no agent experiment found | M Google, L agents |
| Structured data alone | No significant citation lift in a controlled test; chatbots read visible HTML | M (not a lever by itself) |
| llms.txt | Google Search ignores it; 97 percent of llms.txt files got zero requests in Ahrefs data | H (keep, invest nothing more) |
| Sponsored labels, fake scarcity | Neutral or penalised | H in tests |

Agent picks are unstable: the same brand list repeated in under 1 of 100 runs (SparkToro, M), and model updates reshuffle share sharply. Measure presence rates over many runs, never a single answer.

## Where SNKRS CART stood on 2026-10-10

Strong already: robots.txt lets 72 agent user agents in (the most open of the eight stores scanned), server-rendered product pages, a per-size Merchant feed, the largest llms.txt in the group.

| Store | Stack | Size variants in schema | GTIN / MPN | Rating in schema | Agent endpoints |
|---|---|---|---|---|---|
| SNKRS CART (before) | Next.js | No (one Offer) | None, sku was the slug | Only when reviews exist | None |
| SNKRS CART (now) | Next.js | Yes, ProductGroup | Style code as mpn | Only when reviews exist | MCP, agents.md, cart links |
| Superkicks | Shopify | Offers per size | sku = style code + size | No | Shopify UCP + MCP |
| Crepdog Crew, Dawntown | Shopify | ProductGroup | None | No | Shopify UCP |
| Mainstreet | Shopify | ProductGroup | Style code wrongly in gtin | No | Shopify UCP |
| Culture Circle | Next.js | AggregateOffer | Internal mpn | Yes (4.6, 1,676 reviews) | None |
| Hypefly | Next.js | Offers per size | Style code as productID | Yes | None |
| VegNonVeg | Laravel | No offers at all | None | No | None |

No store publishes a valid GTIN. Culture Circle is the strongest technical rival because of its ratings. Neither SNKRS CART nor Dawntown appears in the editorial "where to buy" lists AI engines cite (Indian Retailer, LBB, Harper's Bazaar India).

## Built on 2026-10-10

- **One source of per-size facts** (`frontend/lib/merchantFacts.ts`) for the Merchant feed, product page JSON-LD and MCP. Moving the feed onto it changed zero bytes of output (402 items, A/B on the same data).
- **Product page JSON-LD as a ProductGroup**: one variant per size whose sku equals the feed id, price, availability and handling days equal to the feed (verified size by size), style code as mpn only when it is a real code, UK sizes as SizeSpecification, `?size=` variant URLs. This also fixed a mismatch: the page claimed 0 to 1 day handling while policy says up to 3 days and pre-order sizes about 20.
- **Visible style code** in the specs table, **accessible size tiles** ("UK 8, ₹10,000, ships in 3 days"), and **`?size=9` preselect**.
- **Cart links**: `/cart/add?items=<slug>:<size>`, validated on the server, added with the same seller-offer data as Add to Bag. Fixed a cart bug on the way (the bag was written to storage before it was restored).
- **MCP server** at `/mcp`: search, product with live sizes, cart link, upcoming drops, store policies. Read-only, no customer data, browser origins allowlisted per the 2026-07-28 MCP spec.
- **Truthful discovery files**: llms.txt, llms-full, Organization schema and agents.md now say what checkout does (online payment, no cash on delivery; UK sizes). OpenAPI points at api.snkrscart.com, drops a dead /faqs path and lists the real filters.

## Problems found that need the owner

1. **Shipping was a hidden charge (likely misrepresentation). Fixed on 2026-10-10:** the owner chose free shipping on every order. Checkout used to add ₹199 under ₹3,000 while the shipping page, feed and schema promised ₹0, the cart showed ₹299 and the products banner promised free shipping only above ₹10,000. Backend, cart, drawer, checkout, banner, MCP and agents.md now all say free. Owner check: Merchant Center shipping settings should also say free for India.
2. **Cash on delivery and bank transfer were claimed** in llms.txt, llms-full and the Organization schema; checkout has neither and the FAQ page says online only. Removed. If COD is offered offline, say so and it goes back with the right wording.
3. **Reviews leak and are unverified.** Fixed on 2026-10-10: public review responses no longer include reviewer emails. Still open: any visitor can post a review that publishes instantly and moves the product rating. Ratings are the strongest agent lever, so they need a verified-purchase flag and moderation.
4. **Order lookup exposed personal data. Fixed on 2026-10-10:** lookups are rate limited (30 per IP per 15 minutes, 10 failed guesses per order per hour); only the signed-in owner gets the full order, anyone else gets status and tracking without name, contact, address or payment ids; seller payouts are removed from every customer response.
5. **Next.js 14.2.35 had critical advisories. Fixed on 2026-10-10:** upgraded to Next 15.5.26 + React 19.3 (no critical or high Next advisory left; two moderate self-hosted ISR ones clear with 15.5.27 after 2026-10-14). The critical protobufjs advisory (via @google/genai) was cleared by bumping it to 7.6.6. A follow-up the same day cleared every moderate and all highs except one chain: tiptap and prosemirror, postcss (forced everywhere, including Next's pinned copy), postcss-selector-parser, nanoid, undici, ws, markdown-it, linkify-it, picomatch and source-map-js were patched, with Next at 15.5.27 and byte-identical CSS. The 5 highs left all come from `braces`, which has no patched release, under Tailwind 3's build-time file scanner; removing it needs a Tailwind 4 migration.
6. **The "Royal" drop is not linked** to the pair in stock because the cautious same-shoe matcher rejects its colourway wording. Set `productSlug` in admin to link it on the drop page and in MCP.

## Roadmap

**Now (owner, no code)**
- Shipping is now free everywhere (problem 1): confirm Merchant Center shipping settings say free for India, then request the Merchant Center review again.
- List the MCP server: Claude connector directory (claude.ai/directory/manage), ChatGPT plugin directory with country India (needs a privacy policy URL, test cases and a demo video), and the official MCP Registry under `com.snkrscart/store`.
- Ask Razorpay about Agentic Payments and UPI Reserve Pay early access (Razorpay is already integrated). Reported UPI delegation caps (about ₹5,000 per payment) mean high-priced pairs will still need the buyer's own UPI approval.
- Turn on the free measurement stack: Search Console generative AI report filtered to India, Bing Webmaster Tools AI Performance, GA4 "AI Assistant" channel plus a custom group for chatgpt.com, perplexity.ai, gemini.google.com, copilot, claude.ai.
- Earned media: get into the Indian sneaker roundups and YouTube legit-check content. Never buy or fake reviews.

**Next code (about 3 months)**
- Verified-purchase reviews with moderation, review requests after delivery, rating shown in visible HTML (problem 3).
- GTIN capture per size from the box label during authentication; add `gtin` to feed and schema only when read from the box.
- Organization-level shipping and return markup once the shipping rule is settled (Google now prefers it over per-offer markup).
- Product list filters in the URL and server rendered (size, price, colour), so browsing agents can share and read filtered results.
- Declarative WebMCP on search and add-to-bag (Chrome origin trial from Chrome 149); mcp-handler can also publish tools to in-page agents.
- Agent traffic log: count ChatGPT-User, Claude-User, Perplexity-User and Google-Agent hits per product page.

**Wait**
- ACP / Instant Checkout, Google UCP checkout, Copilot Checkout, Perplexity Instant Buy (US only), NPCI Unified Agent Protocol (not announced), AP2, ONDC agents. Recheck quarterly.

## Measurement plan

Score each AI answer on four levels: mentioned, cited (a snkrscart.com link), recommended (named as a place to buy), chosen (top pick, or the pair an agent opens or adds to a bag). Log competitors named and any wrong price, payment or authenticity claim.

- Weekly: 20 prompts x 4 engines (ChatGPT, Gemini, Perplexity, Google AI Mode) x 3 runs = 240 answers, logged-out sessions from an Indian IP. At that size a presence rate moves about ±6 points by chance; ignore smaller moves.
- Monthly: add Copilot and Claude, 5 runs each; share of voice against the seven competitors; rerun the competitor scan.
- Prompts (keep 15 fixed, rotate 5 per quarter): where to buy authentic sneakers online in India; best site for original Air Jordan 1 in India; Nike Dunk Low Panda best price India; Adidas Samba OG price in India, where to buy original; authentic New Balance 550 or 9060 seller in India; sneaker reseller in India with authenticity guarantee; how to buy limited sneakers in India without fakes; Superkicks vs VegNonVeg vs Culture Circle; original Air Jordan 4 under ₹20,000; sneaker sites in India with easy returns; upcoming sneaker releases in India this month; how to check if Jordans bought online are fake; online sneaker store delivering to Bangalore in 2 days; original Nike sneakers gift under ₹10,000; asli Jordan kahan se kharide India mein; are Instagram sneaker resellers safe, alternatives; Nike Air Force 1 White UK 9 in stock India; Original Crocs Classic Clog online India; is SNKRS CART legit; SNKRS CART reviews, cheaper than Superkicks.

## Key sources

- Kalicube AAO methodology: https://kalicube.pro/methodologies/assistive-agent-optimization
- ACES: https://arxiv.org/html/2508.02630v3 ; ABxLab: https://arxiv.org/html/2509.25609v2 ; Magentic Marketplace: https://arxiv.org/pdf/2510.25779 ; GEO: https://arxiv.org/html/2311.09735v3 ; earned media bias: https://arxiv.org/html/2509.08919v1 ; critical survey: https://arxiv.org/abs/2607.14035
- OpenAI shopping results and feed spec: https://help.openai.com/en/articles/11128490 , https://developers.openai.com/commerce/specs/file-upload/products.md ; Apps SDK rules: https://developers.openai.com/apps-sdk/app-submission-guidelines
- Google: AI features guidance https://developers.google.com/search/docs/appearance/ai-features ; product variants https://developers.google.com/search/docs/appearance/structured-data/product-variants ; India AI shopping https://blog.google/intl/en-in/products/explore-communicate/new-ways-google-is-using-ai-to-make-shopping-easier/ ; UCP onboarding https://support.google.com/merchants/answer/16992327
- India payments: Razorpay, NPCI and OpenAI pilot https://razorpay.com/newsroom/razorpay-npci-and-openai-come-together-to-launch-agentic-payments-ushering-in-ai-driven-commerce-at-national-scale/ ; Claude pilot https://razorpay.com/blog/agentic-payments-and-npci/ ; NPCI at GFF 2026 https://www.medianama.com/2026/09/223-npci-ai-agents-upi-payments/
- MCP spec 2026-07-28: https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http ; Claude directory submission https://claude.com/docs/connectors/building/submission ; MCP Registry https://modelcontextprotocol.io/registry/about
- llms.txt evidence: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide , https://www.searchenginejournal.com/97-of-llms-txt-files-got-no-requests-ahrefs-data-shows/579478/
- Measurement: https://sparktoro.com/blog/new-research-ais-are-highly-inconsistent-when-recommending-brands-or-products-marketers-should-take-care-when-tracking-ai-visibility/ , https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports , https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview
