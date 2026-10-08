# Pipeline tooling and models for a pre-publish content enhancement and SEO stage (2026)

Scope: a build-oriented survey for inserting an automated "enhance + SEO-optimise + verify" stage between "draft written" and "published" in the SNKRS CART content pipeline (Claude Code skills writing HTML blogs, drop-calendar entries and sneaker profiles into MongoDB). Stack constraint: TypeScript (Next.js 14 on Vercel, Express on Render, MongoDB); Python only for offline scripts. Budget: a few hundred USD per month at most. All prices were fetched on 2026-10-07 unless a different date is stated; vendor pages change often, so treat every number as "as of fetch date".

## KQ1. Commercial SEO content optimisers: what the score measures, API, 2026 price, minimum plan, India SERP support, published methodology

### Takeaway
Every mainstream optimiser (Surfer, Clearscope, MarketMuse, Frase, NeuronWriter, Scalenut, Outranking, Dashword, Content Harmony, Ahrefs AI Content Helper) scores a draft against terms/topics extracted from the top-ranking pages for a target keyword, plus word count and heading structure; only Surfer (Peace of Mind, $299/mo), Frase (all plans, 5,000+ API requests/mo from $49), NeuronWriter (Gold+, $69/mo) and Koala (all paid plans from $25) expose a usable API within a few-hundred-dollar budget, and Ahrefs' own May 2025 study found only weak correlation between any tool's content score and rankings.

### Cited Findings

Surfer SEO
- Pricing page (fetched 2026-10-07, annual billing): AI Search Analytics $82/mo, Discovery $49/mo, Standard $99/mo, Pro $182/mo, Peace of Mind $299/mo, Enterprise custom. Documents: Discovery 120, Standard and Pro 360, Peace of Mind "Unlimited*". "Only Peace of Mind includes 'API Access' as a standard feature." All plans include "AI Writing Assistant (Surfy)", "AI Detector & Humanizer" and "Plagiarism Check". "Surfer works with all languages!" - [Surfer pricing](https://surferseo.com/pricing/)
- A third-party roundup lists the same ladder plus Enterprise at $999/mo and confirms "API access is available starting at the Peace of Mind tier at $299/mo, which is the first unlimited document tier with API." - [eesel.ai Surfer pricing 2026](https://www.eesel.ai/blog/surfer-seo-pricing)
- Surfer's own help-centre article historically described an API add-on at $29/month, "included for free only in the Enterprise plan"; that article URL now returns 404, so the add-on price is likely stale and superseded by the Peace of Mind requirement. - [Surfer API add-on article (404 on 2026-10-07)](https://docs.surferseo.com/en/articles/7925007-surfer-api-add-on-purchase); surfaced via [search summary](https://docs.surferseo.com/en/articles/5700335-surfer-api-documentation)
- New Surfer API v2 announced 25 May 2026: "Full Content Editor customization" (brand knowledge, custom voice, templates, word count, outlines) programmatically, a "Unified AI Search Content Score endpoint", "machine-readable documentation designed specifically for agents and integrations", AI Tracker reporting "coming soon". Access "requires either the Peace of Mind or Enterprise plans"; keys requested via Settings > API through support; currently a "closed user group", GA "coming soon"; foundation for "Surfer MCP" and "Agentic Surfy". No pricing, credits or rate limits stated. - [Surfer: New Surfer API (June 2026)](https://surferseo.com/updates/new-surfer-api-june2026/)
- API endpoint map (V1 deprecated, V2 recommended): create Content Editor `POST /api/v1/content_editors` → `POST /api/v2/workspaces/{workspace_id}/content_editors`; NLP terms `GET .../content_editors/{id}/terms` → `.../seo_guidelines/terms`; Content Score `GET .../content_editors/{id}/content_score` → `.../seo_guidelines/score`; "SERP Analyzer, Audit, AI Detector, and Humanizer remain on V1". Audit flow: `POST /api/v1/audits`, "wait 5-10 minutes", GET returns audited page and competitor scores "up to 5". AI detector `POST https://app.surferseo.com/api/v1/ai_detector/detect` (text ≤100,000 chars, returns `ai_probability` 0-1, rate limit "60 requests/min", errors `422 Quota exceeded | No access`, `429`). Humanizer `POST /api/v1/humanizer/humanize` (text ≥128 chars, model `surfer-humanizer-v1`). Clean HTML of a draft via `GET /api/v1/content_editors/:id/content`. - [Surfer API examples of use](https://docs.surferseo.com/en/articles/8201326-surfer-api-examples-of-use)
- Content Editor setup lets you "select the country your target audience resides in and their preferred device", including "very specific locations within a country", a language, and a "crawler type (desktop or mobile)", so India (and Indian cities) SERPs are selectable. - [Surfer Content Editor overview](https://docs.surferseo.com/en/articles/5700347-content-editor-overview)
- Third-party reviews describe the Content Score as 0-100 with "three major buckets": Structure, Headings and NLP Terms, broken into "word count match, NLP term coverage, heading structure, and paragraph distribution", with NLP terms claimed to make up "about 60-70% of the score delta between values of 40 and 75". These are reviewer estimates, not a Surfer-published formula. - [hackceleration Surfer review 2026](https://hackceleration.com/labs/review/surfer); [roborhythms Surfer review 2026](https://www.roborhythms.com/surfer-seo-review-2026/)

Clearscope
- Pricing: Essentials $129/month (50 tracked queries, 50 pages, 20 topic explorations/mo, 20 drafts/mo), Business $399/month (300 queries, 300 pages, 50 explorations, 20 drafts), Enterprise custom. Add-ons: "Additional Pages: $25/mo (Essentials), $15/mo (Business)"; "Additional Drafts: $50 (Essentials), $20 (Business)". 14-day free trial. No API mentioned on the pricing page. - [Clearscope pricing](https://www.clearscope.io/pricing)
- Methodology: "Clearscope scrapes the top-ranking content on the search engine results page (SERP) and calculates the importance of each term by how much the keyword appears in the competitors' articles." Term importance is 1-10, "10 being a must-include term". "Content Grades are Clearscope's measure of content relevance and comprehensiveness." New "AI Term Presence" shows whether terms appear in Gemini and GPT answers for the query. - [Clearscope: How does Clearscope grade your content](https://clearscope.io/support/articles/how-does-clearscope-grade-your-content)
- IBM case study: Clearscope implemented "Watson Natural Language Understanding software to extract concepts, entities, keywords, and other signals from top-performing pages", turned into "actionable guidance on readability, word count, and content type". - [IBM/Clearscope case study](https://www.casestudies.com/company/ibm/case-study/automating-search-engine-optimization-with-ibm-watson-services); [Clearscope customers: IBM](https://clearscope.io/customers/ibm)

MarketMuse
- Vendor pricing page shows four tiers (Free, Optimize, Research, Strategy) but no dollar prices ("Book a demo"). Free: "10 queries/month", 1 user, no briefs. Optimize: "100 Tracked Topics", "5 Content Briefs/month", "100 queries/month", 1 user. Research: "1000 Tracked Topics", "10 Content Briefs/month", unlimited queries, 3 users. Strategy: "10K Tracked Topics", "20 Content Briefs/month", 5 users, "all 9 brief types". Methodology: "MarketMuse analyzes the text on a page and scores the content based on its inclusion of the model's subtopics", using "a combination of proprietary and open source algorithms to classify parts of speech and calculate their relevance." - [MarketMuse pricing](https://www.marketmuse.com/pricing/)
- Third-party price trackers report Optimize $99/mo, Research $249/mo, Strategy $499/mo (2026). - [costbench MarketMuse pricing 2026](https://www.costbench.com/software/ai-seo-tools/marketmuse/)

Frase
- Pricing (fetched 2026-10-07): Starter $49/mo ($39 annual), Professional $129/mo ($103 annual), Scale $299/mo ($239 annual), Enterprise custom. Articles/mo: 10 / 40 / 100. Audit pages/mo: 50 / 250 / 1,000. "API/MCP/CLI requests": 5,000 / 20,000 / 50,000 per month. Overages: Professional $5/article, $0.50/audit page; Scale $4/article, $0.40/audit page. Extra seats $29/mo. - [Frase pricing](https://www.frase.io/pricing)

NeuronWriter
- Pricing (monthly / annual): Bronze $23 / $19, Silver $45 / $37, Gold $69 / $57, Platinum $93 / $77, Diamond $117 / $97. Content analyses/mo: 25 / 50 / 75 / 100 / 150. AI credits 15k-75k. "Own OpenAI key" and "Neuron API" on Gold and above. 7-day trial on Gold terms; 30-day refund. - [NeuronWriter pricing](https://neuronwriter.com/pricing/)
- "you choose the language and target country when setting up a new query. Getting the country right matters more than anything else on this screen, because it decides which live results NeuronWriter scores"; supports "170 languages". - [marcandrews NeuronWriter walkthrough](https://marcandrews.com/how-to-optimise-content-with-neuronwriter-step-by-step/)

Other tools (prices from vendor pages where fetched, else roundups)
- Scalenut (vendor page): Starter $59/mo ($24/mo annual on a "60% off limited offer"), Plus $89/mo ($36), Professional $199/mo ($80), VIP custom; articles/mo "5 to 10", "30 to 60", "75 to 150" (promo-doubled). API not mentioned on the pricing page. - [Scalenut pricing](https://www.scalenut.com/pricing)
- Content Harmony (vendor page): Standard-5 $50/mo … Standard-150 $799/mo (5 to 150 "workflows" = Keyword Report + Content Brief + Content Grader); Enterprise from $1,000/mo with "Early API Access"; "$10 trial" for 10 credits. - [Content Harmony pricing](https://www.contentharmony.com/pricing/)
- Koala (vendor page): Starter $25/mo (45,000 words), Professional $49 (100k words), Boost $99 (250k), Growth $179 (500k), Elite $350 (1M) … Scale III $2,000 (10M). "API and MCP access" on all paid plans; "Real-time factual data" from Starter; Search Console integration and "Deep research" from Professional. Word counts quoted for "GPT-6 Luna" usage. - [Koala pricing](https://koala.sh/pricing)
- Byword: vendor page title "Plans Starting at $99/month" (body not retrievable); a third-party breakdown lists Starter $99/mo for 25 articles, Standard $299/mo for 80, Scale $999/mo for 300. - [Byword pricing](https://byword.ai/pricing); [ustechautomations Byword pricing 2026](https://ustechautomations.com/resources/blog/byword-pricing-2026)
- Outranking: Starter $19/mo, SEO Writer ~$69/mo, SEO Wizard ~$139/mo; "analyzes SERPs using Google NLP". Dashword from $39/mo. GrowthBar ~$36/mo, "acquired by SEOptimer and the product is in transition". SEO.ai $149-$749/mo (Feb 2026). - [Rankability: best SEO content optimization tools 2026](https://www.rankability.com/blog/best-seo-content-optimization-tools/)
- Semrush ContentShake AI "is now the Content Toolkit inside the Semrush platform", priced at $60/month. - [Semrush KB ContentShake](https://zh.semrush.com/kb/1358-contentshake); [aimadefor Semrush AI review](https://www.aimadefor.com/blog/semrush-review-marketers/)
- Ahrefs AI Content Helper: "uses AI to identify the core topics for your target keyword, then scores your content, along with your competitors', against those topics in real-time"; min/max word count taken from the SERP; "in beta testing and therefore currently free with all subscriptions… after this, it will be a paid add-on". Ahrefs tiers: Starter $29, Lite $129, Standard $249, Advanced $449, Enterprise $1,499 per month. - [Ahrefs blog: AI Content Helper](https://ahrefs.com/blog/ai-content-helper/); [Ahrefs help: about the AI Content Helper](https://help.ahrefs.com/en/articles/9879434-about-the-new-ai-content-helper); [TechRadar Ahrefs review](https://www.techradar.com/reviews/ahrefs)
- Jasper: Creator from ~$49/mo with "SEO mode" (keyword suggestions, readability), Business custom with API and SSO. - [aitoolsdevpro Jasper guide 2026](https://aitoolsdevpro.com/ai-tools/jasper-guide/)

Does the score predict rankings?
- Ahrefs tested 20 random keywords across Surfer, Frase, NeuronWriter, Clearscope and Ahrefs' AI Content Helper: "weak correlations everywhere"; NeuronWriter and AI Content Helper strongest, Surfer, Frase and Clearscope "very weak". Tools "struggled analyzing Reddit, Quora, and YouTube (often showing zero scores)". Spearman and Kendall averaged per keyword. Updated 21 May 2025. - [Ahrefs: Do higher content scores mean higher rankings?](https://ahrefs.com/blog/seo-content-score-study/)
- Semrush analysed 20,000 blog URLs with GPTZero: 57% of AI-generated vs 58% of human content appeared in the top 10; human content "somewhat more likely" in the top 5. - [Semrush: Does Google penalize AI content?](https://semrush.com/blog/does-google-penalize-ai-content)

### Inferences
- For a budget of a few hundred dollars, the only "buy" options that give a programmatic score per draft are: Frase Starter ($49/mo, 5,000 API/MCP/CLI requests), NeuronWriter Gold ($69/mo or $57 annual, Neuron API), Koala Starter ($25/mo, API + MCP) and Surfer Peace of Mind ($299/mo, which alone consumes the budget). Clearscope and MarketMuse have no public API at these price points.
- All of these vendors compute roughly the same thing: term frequency / topic coverage against the top ~10-20 SERP pages for one keyword, plus word count and heading targets. The Ahrefs study implies the marginal ranking value of chasing a 90+ score is low; the main value is as a coverage checklist (missed sub-topics, missing entities) that an LLM editor can act on.
- India SERP targeting is confirmed for Surfer (country + city + device) and NeuronWriter (country + language). Frase, Koala and Clearscope were not confirmed for India in fetched sources.
- Surfer's API v2 is the only one explicitly built for "agents and integrations" (MCP coming), but it is gated behind a $299/mo plan and a closed beta as of June 2026.

### Gaps
- Surfer API credit costs, per-endpoint rate limits (besides AI detector 60 rpm) and v2 GA date are not published.
- Clearscope's A++ to F grading thresholds, number of competitors scraped, and any API were not found on vendor pages.
- Frase, Koala, Clearscope, Scalenut: country/India SERP selection not confirmed in fetched sources.
- MarketMuse dollar prices come only from third-party trackers; vendor page says "Book a demo".
- No vendor publishes its full scoring formula; the Surfer bucket weights above are reviewer estimates.

## KQ2. Open-source and DIY equivalents (SERP scraping, term gaps, entities, embeddings, score calculators, readability, internal links, schema)

### Takeaway
A TypeScript DIY equivalent is cheap: a SERP API at roughly $0.30-$1.00 per 1,000 queries (Serper gives 2,500 free queries), BM25/TF-IDF term-gap analysis with an npm library, entity extraction via Dandelion (1,000 free units/day) or Google Cloud NL (5,000 free units/month), embeddings at $0.02-$0.20 per million tokens, `text-readability` for Flesch scores, `schema-dts` for typed JSON-LD, and MongoDB Atlas Vector Search (available on the free M0 tier) for internal-link suggestions over your own corpus; the one ready-made open-source "content score" MCP server found has 0 stars and should be treated as a reference design, not a dependency.

### Cited Findings

SERP data (needed to replicate what Surfer/Clearscope scrape)
- Serper: "Get 2,500 free queries", "No credit card required"; endpoints Search, Images, News, Maps, Places, Videos, Shopping, Scholar, Patents, Autocomplete. - [serper.dev](https://serper.dev/)
- 2026 price comparison: Serper $0.30-$1.00 per 1,000 searches (base $1/1K); SerpApi $5-$25 per 1,000, Developer plan $75/month for 5,000; DataForSEO $0.60/1K (Standard queue, ~5-min delay) to $2/1K (Live); at 10,000 searches/month DataForSEO costs ~$6. - [apiserpent SERP API pricing comparison 2026](https://apiserpent.com/blog/serp-api-pricing-comparison); [searlo SERP API pricing 2026](https://searlo.tech/serp-api-pricing)

Entity extraction
- Google Cloud Natural Language, Entity Analysis: "first 5,000 units per month free, then $0.0010 per unit for 5K-1M units, $0.00050 per unit for 1M-5M"; a unit is 1,000 Unicode characters. - [Cloud Natural Language pricing](https://cloud.google.com/natural-language/pricing)
- TextRazor: "500 included requests per day" free (2 concurrent); Starter $200/month for 6,000/day; Growth $600/month for 50,000/day; Pro $1,200/month for 120,000/day; each request handles up to 10KB of text; does "entity extraction, topic tagging" with Wikipedia/Wikidata links. - [TextRazor plans](https://www.textrazor.com/plans)
- Dandelion: free Basic plan 1,000 units/day, "no expiring trial, contract, or credit card"; Entity Extraction costs 1 unit per request; Pro 2,000 units/day from $49/month; Startup 10,000/day from $99/month. - [Dandelion plans and pricing](https://dandelion.eu/profile/plans-and-pricing/)
- Only the Cloud Natural Language API v1beta1 was shut down (27 Dec 2019); no deprecation of the current NL API was found in Google's deprecation pages as of 2026-10-07. - [Cloud NL v1beta1 deprecation notice](https://docs.cloud.google.com/natural-language/deprecation)

Embeddings (for similarity to top results and internal-link suggestion)
- OpenAI: text-embedding-3-small "$0.02" per million tokens, text-embedding-3-large "$0.13". - [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)
- Voyage AI: voyage-4-lite $0.02/M, voyage-4 $0.06/M, voyage-4-large $0.12/M, voyage-context-4 $0.12/M, with 200 million free tokens each; rerankers rerank-3 $0.05/M and rerank-3-lite $0.02/M (200M free); batch endpoint 33% discount. - [Voyage AI pricing](https://docs.voyageai.com/docs/pricing)
- Google: Gemini Embedding 2 text "$0.20" per million tokens. - [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- MongoDB Atlas: the free M0 tier "includes Atlas Vector Search" (512 MB storage); Flex tier (GA Feb 2025) also includes Vector Search and Atlas Search. - [costbench: Atlas Vector Search free plan 2026](https://costbench.com/software/vector-databases/mongodb-atlas-vector-search/free-plan/) (third-party; verify in Atlas console)

Open-source content-score calculators
- `sharozdawa/content-optimizer` is an MIT-licensed Node.js (18+) MCP server scoring content in seven weighted categories: Keyword Usage 20 ("density, placement in first paragraph and headings"), Word Count 15 (vs SERP benchmarks), Heading Structure 15, Readability 15 (Flesch-Kincaid), Entity Coverage 15 (topic gaps vs competitors), Content Depth 10, Internal Structure 10; six tools (score, keyword analysis, readability, heading optimisation, topic detection, recommendations). README does not say which SERP API or NLP method it uses. "0 stars, 0 forks, 9 commits". - [GitHub sharozdawa/content-optimizer](https://github.com/sharozdawa/content-optimizer)
- No other maintained open-source "Surfer clone" was found; search results were dominated by SaaS free tools (e.g. SEOJuice TF-IDF tool). - [SEOJuice free TF-IDF tool](https://seojuice.io/tools/free-tf-idf-tool)

TypeScript building blocks
- BM25: `fast-bm25` ("high-performance BM25 (Okapi BM25) implementation in TypeScript with field boosting"), `okapibm25`, `@basementuniverse/bm25`. - [npm fast-bm25](https://npmjs.com/package/fast-bm25); [okapibm25](https://classic.yarnpkg.com/en/package/okapibm25)
- Readability: `text-readability` (`fleschReadingEase()`, `fleschKincaidGrade()`), `flesch`, `flesch-kincaid`, `retext-readability`. - [npm text-readability](https://npmjs.com/package/text-readability); [retext-readability](https://awesome.ecosyste.ms/projects/github.com%2Fretextjs%2Fretext-readability)
- Schema: `schema-dts` (Google) gives "TypeScript definitions for Schema.org vocabulary in JSON-LD format… discriminated type unions"; `schema-dts-gen` CLI generates typings from custom ontologies. - [npm schema-dts](https://npmjs.com/package/schema-dts); [GitHub google/schema-dts](https://github.com/Eyas/schema-dts)

Methodology precedents to copy
- Clearscope's published method (scrape top SERP, weight terms by frequency across competitors, 1-10 importance) and MarketMuse's (score inclusion of a topic model's sub-topics) are both reproducible with BM25/TF-IDF plus entity extraction. - [Clearscope grading](https://clearscope.io/support/articles/how-does-clearscope-grade-your-content); [MarketMuse pricing/methodology](https://www.marketmuse.com/pricing/)

### Inferences
- A DIY "content score" for one draft costs roughly: 1 Serper query (≈$0.001) + fetching 10 pages (free, own HTTP with the project's existing `stealthGet`) + BM25 over 10 docs (free, in-process) + optional Dandelion entity call per page (11 units, inside the 1,000/day free tier) + one embedding call for the draft and 10 competitors (≈11 × 1,500 tokens = 16.5k tokens ≈ $0.0003 on text-embedding-3-small). Well under one cent per article.
- Internal-link suggestion fits the existing stack: embed every published blog/drop/profile once (300 docs × ~1,500 tokens = 450k tokens ≈ $0.01), store vectors in the same MongoDB (Atlas Vector Search on M0/Flex), and query top-k neighbours for each new draft's sections. This also powers "avoid repetition" by flagging drafts whose cosine similarity to an existing article exceeds a threshold.
- Entity coverage is the piece most worth outsourcing: Dandelion's 1,000 free units/day comfortably covers 60 articles/month × 11 pages; Google NL's 5,000 free units/month (1,000 chars each) covers about 60 competitor pages/month before billing at $1 per 1,000 units.
- The `content-optimizer` MCP server's seven-category weighting is a reasonable starting rubric but has no community validation; re-implement it in the Express backend rather than depend on the package.

### Gaps
- No open-source project was found that reproduces Surfer/Clearscope scoring with published validation against rankings.
- Serper's exact paid tiers were not retrievable (pricing page 404); only the third-party range ($0.30-$1.00/1k) and the 2,500 free queries are confirmed.
- Whether Atlas Vector Search on M0 has index-count or vector-size limits was not verified from MongoDB's own docs.
- spaCy is Python-only; no equivalent TypeScript NER library was evaluated here (a cloud API or an LLM call is the practical TS route).

## KQ3. LLM pipeline architecture patterns for quality content (planner/writer/editor/fact-checker, critique-revise loops, claim verification, retrieval of own corpus, structured metadata) and published open-source projects

### Takeaway
The published pattern that works is a staged pipeline: plan → draft → self-critique against a rubric → revise (Self-Refine reports ~20% absolute gains with strong models) → decompose into atomic claims and verify each against fetched sources (FActScore/SAFE: automated checking agrees with humans ~72% of the time at >20x lower cost) → structured metadata output; the open-source implementations (gpt-researcher, STORM/Co-STORM, CrewAI planner/writer/editor, a Gemini+Claude dual-LLM AEO pipeline) are all Python and all admit their output is not publication-ready without human edits.

### Cited Findings

Generate-critique-revise
- Self-Refine: "generate an initial output using an LLM; then, the same LLM provides feedback for its output and uses it to refine itself, iteratively"; evaluated on "7 diverse tasks" with GPT-3.5, ChatGPT and GPT-4; "~20% absolute on average in task performance"; "no supervised training data, additional training, or reinforcement learning". - [Self-Refine, arXiv 2303.17651](https://arxiv.org/abs/2303.17651)

Claim extraction and verification
- FActScore decomposes generations into atomic facts and measures the percentage supported by a knowledge source; ChatGPT achieved 58% factual precision on biographies; the automated estimator had "less than a 2% error rate" vs humans; human evaluation of 6,500 generations "would have cost $26K". EMNLP 2023; pip-installable. - [FActScore, arXiv 2305.14251](https://arxiv.org/abs/2305.14251)
- SAFE (DeepMind, "Long-form factuality in LLMs"): an LLM splits a response into individual facts, then for each fact issues Google Search queries and reasons over results to label supported/unsupported; proposes F1@K balancing precision with a user-preferred fact count K. "on a set of ~16k individual facts, SAFE agrees with crowdsourced human annotators 72% of the time", "on a random subset of 100 disagreement cases, SAFE wins 76% of the time", and is "more than 20 times cheaper than human annotators". - [SAFE, arXiv 2403.18802](https://arxiv.org/abs/2403.18802)
- Qraft (TACL 2025): an "LLM-based agentic framework mimicking human fact-checker workflows", evaluated with professional fact-checkers, which "lags considerably behind expert-written articles". - [Can LLMs automate fact-checking article writing? arXiv 2503.17684](https://arxiv.org/pdf/2503.17684)
- Deep Research survey (Dec 2025) decomposes such systems into "query planning, information acquisition, memory management, and answer generation" and frames them as tasks "requiring critical thinking, multi-source, and verifiable outputs, which are beyond single-shot prompting or standard retrieval-augmented generation". - [Deep Research: A Systematic Survey, arXiv 2512.02038](https://arxiv.org/pdf/2512.02038)

Open-source projects
- gpt-researcher (29.9k stars, Python): "The planner generates research questions, while the execution agents gather relevant information. The publisher then aggregates all findings into a comprehensive report." LangGraph multi-agent variant with researcher/editor/reviewer/revisor/writer/publisher roles. Deep Research "costs approximately $0.4 per research" with o3-mini and "~5 minutes per deep research". Works with "any LLM providers" via OpenAI-compatible endpoints; MCP integration. Stated limitation: "Current LLMs have token limitations, insufficient for generating long research reports." - [GitHub assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher)
- STORM / Co-STORM (31.6k stars, Python; NAACL 2024 and EMNLP 2024): "perspective-guided question asking" (surveys articles on similar topics to find perspectives) and "simulated conversation" between a Wikipedia writer and a topic expert grounded in Internet sources; stages pre-writing (research + outline), writing (article with citations), polishing. Co-STORM adds LLM experts, a moderator and a human with a "dynamic updated mind map". LMs via litellm; retrievers: You, Bing, VectorRM, Serper, Brave, SearXNG, DuckDuckGo, Tavily, Google, Azure AI Search. README: "The system cannot produce publication-ready articles that often require a significant number of edits." - [GitHub stanford-oval/storm](https://github.com/stanford-oval/storm)
- `cspektor-code/aeo-seo-automation-pipeline` (Python + Streamlit): Stage 1 Gemini "Scrapes article content, extracts section outlines, isolates atomic technical facts into a scratchpad, generates draft Q&A pairs, and executes an automated self-critique pass"; Stage 2 Claude "Reviews draft Q&A pairs for accuracy, scope, tone, and brand alignment, enforcing strict evidence-matching fact checks against the raw article text"; rule validation "Question: 10-18 words | Answer: 50-70 words" with fallbacks if Claude's revisions violate rules; "AEO Fact-Retention Metrics: Tracks extracted key facts (numbers, metrics, CVEs, tools, actors) and measures their retention ratio across AI generation steps"; flagged rows highlighted for manual inspection. - [GitHub cspektor-code/aeo-seo-automation-pipeline](https://github.com/cspektor-code/aeo-seo-automation-pipeline)
- CrewAI tutorial pattern: Planner ("structured plan for the article"), Writer, Editor ("reviews and edits the article for clarity, coherence, and accuracy"), extended with a Publisher agent handling formatting and API integration; adapted from the DeepLearning.AI multi-agent course. - [dev.to: multi-agent blog publishing with CrewAI](https://dev.to/aileenvl/building-a-multi-agent-blog-publishing-system-with-crewai-efn); [Substack: agentic AI system with CrewAI](https://arunsbn.substack.com/p/building-an-agentic-ai-system-with)
- n8n and similar template marketplaces offer "research top Google results, create an SEO brief, write long-form blogs, and humanize" workflows; no Dify- or Flowise-specific SEO template was found. - [growwstacks n8n blog agent](https://growwstacks.com/workflows/the-blog-agent/)

Anthropic API features relevant to this architecture (fetched 2026-10-07)
- Structured outputs via `output_config: {format: {...}}` (the older `output_format` is deprecated); `strict: true` on tool definitions guarantees schema-valid input; citations on `document` blocks return `cited_text` with char/page locations; web fetch tool has "no additional charges" beyond tokens (10 kB page ≈ 2,500 tokens); web search is "$10 per 1,000 searches". - [Claude pricing docs](https://platform.claude.com/docs/en/about-claude/pricing); claude-api skill (TypeScript README) loaded in-session

### Inferences
- Reference architecture for the new stage (text diagram). Everything is one Express job per draft; "LLM" calls are Anthropic SDK (TypeScript) with the style corpus in a cached system prefix; deterministic steps are plain Node.

```
 draft (HTML, slug, type: blog | drop | profile)  from Claude Code skill
          |
          v
 [1] Normalise ............. parse HTML -> blocks; extract headings, word count, links, images
          |
          v
 [2] Retrieve ............... a) Serper search(keyword, gl=in, hl=en) -> top 10 URLs
                              b) fetch + readability-extract 10 pages (own stealthGet)
                              c) embed draft + own corpus -> top-k similar own articles (Atlas Vector Search)
          |
          v
 [3] Score (deterministic) .. BM25/TF-IDF term gaps vs top 10; entity gaps (Dandelion/Google NL);
                              heading + length targets (median of SERP); Flesch via text-readability;
                              duplicate risk = max cosine vs own corpus; schema completeness (schema-dts)
          |
          v
 [4] Plan fixes (LLM, cheap). JSON: {missing_topics[], weak_sections[], internal_links[], meta{title,desc}, faq[]}
          |
          v
 [5] Revise (LLM, strong) ... rewrite only flagged sections; style corpus cached; strict JSON of {html, changes[]}
          |
          v
 [6] Claim check (LLM+web) .. split revised text into atomic claims (dates, prices, SKUs, colourways)
                              -> for each: own sources first (drop/profile docs in Mongo), then 1 web search
                              -> supported | unsupported | unverifiable; unsupported => soften or remove
          |
          v
 [7] Judge (LLM, cheap) ..... rubric 1-5 on accuracy, originality, voice, SEO coverage; pairwise vs pre-revision
          |
          v
 [8] Gate .................... auto-publish if score>=4 and 0 unsupported claims and dup<0.85
                              else write to Mongo as status:"needs_review" + report; admin approves
```

- Pass [3] before any LLM call keeps cost near zero and gives the editor concrete, checkable instructions (exact missing terms, exact heading count), which is what the commercial tools sell.
- Step [6] is the one that CNET/Bankrate lacked (see KQ8). For sneaker content, most verifiable claims are release dates, retail prices, style codes and colourway names, which already exist in the project's `Drop`, `Product` and `SneakerProfile` collections; verifying against own data first avoids most web searches.
- What the open-source projects get wrong for this use case: (a) they optimise for research breadth, not for a house style or a fixed site taxonomy; (b) none scores against the live SERP; (c) none does an atomic-claim verification pass with a hard publish gate (gpt-researcher and STORM both cite sources but do not re-verify generated sentences); (d) all are Python, so they would run as offline scripts here, not in the Express stage.
- Keep humans in the loop at [8]: the gate should route, not just publish; see KQ7.

### Gaps
- No published, end-to-end open-source project combining SERP-based scoring + revise + claim verification was found; the pieces exist separately.
- Self-Refine's abstract does not report how many iterations were used or its failure modes with weaker models; the iteration count for this pipeline (1-2) is an inference.
- Dify/Flowise SEO content templates: none found in search.

## KQ4. Model options and 2026 pricing per million tokens; which are strong at editing, style-guide following and judging; long-context and caching features

### Takeaway
As of 2026-10-07 the sensible tiers are: Claude Sonnet 5.5 $2/$10 (cache reads $0.20), Claude Opus 5.5 $4/$20 (cache reads $0.20), Claude Haiku 4.5 $1/$5; Gemini 2.5 Flash-Lite $0.10/$0.40 and 2.5 Flash $0.30/$2.50 (2.5 Flash scheduled for deprecation 16 Oct 2026), Gemini 3.5 Flash $1.50/$9; OpenAI gpt-5.6-luna $0.20/$1.20, gpt-5.6-terra $2/$12, gpt-5.6-sol $4/$20; DeepSeek V4.1-Flash $0.30/$1.20 peak ($0.15/$0.60 off-peak); Groq Llama 3.3 70B $0.59/$0.79 and GPT-OSS-120B $0.15/$0.60; Together Qwen3.5 9B $0.17/$0.25. Anthropic prompt caching (1h write at 2x, reads at 0.1x or lower, 1M context at flat price) makes passing a 30k-token style corpus on every call cost about $0.006 per call on Sonnet/Opus 5.5.

### Cited Findings

Anthropic (first-party API; fetched 2026-10-07)
- Model table: Claude Fable 5.1 $10 in / $50 out, 5m cache write $12.50, 1h cache write $20, cache read $0.25; Claude Opus 5.5 $4 / $20, cache write $5 (5m) / $8 (1h), cache read $0.20; Claude Opus 5 $5 / $25, cache read $0.50; Claude Sonnet 5.5 $2 / $10, cache write $2.50 / $4, cache read $0.20; Claude Sonnet 5 $2 / $10 (introductory pricing made permanent; "The previously scheduled increase to $3/$15 … on September 1, 2026 will not occur"); Claude Sonnet 4.6 $3 / $15; Claude Haiku 4.5 $1 / $5, cache write $1.25 / $2, cache read $0.10. - [Claude platform pricing docs](https://platform.claude.com/docs/en/about-claude/pricing)
- Caching multipliers: "5-minute cache write 1.25x base input price", "1-hour cache write 2x base input price", "Cache read (hit) 0.1x base input price (0.025x on Claude Fable 5.1 and Claude Mythos 5.1; 0.05x on Claude Opus 5.5)"; "caching pays off after one cache read for the 5-minute duration… or after two cache reads for the 1-hour duration". Batch API "50% discount on both input and output tokens" (Sonnet 5.5 batch $1 / $5; Opus 5.5 batch $2 / $10; Haiku 4.5 batch $0.50 / $2.50). "Claude 4.6 and later models … include the full 1M token context window at standard pricing. (A 900k-token request is billed at the same per-token rate as a 9k-token request.)" Claude 4.7+ use a tokenizer that "produces approximately 30% more tokens for the same text". US-only inference (`inference_geo: "us"`) is a 1.1x multiplier. Web search $10 per 1,000 searches; web fetch free beyond tokens. - [Claude platform pricing docs](https://platform.claude.com/docs/en/about-claude/pricing)
- claude.com/pricing confirms the same headline numbers (Fable 5.1 $10/$50, Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 4.5 $1/$5; "Save 50% with batch processing"; Opus 5.5 fast mode 2x). - [claude.com pricing](https://claude.com/pricing)
- In-session claude-api skill notes (cached 2026-09-25): all current models except Haiku 4.5 support 1M context; recommended default `claude-opus-5-5` with `thinking: {type: "adaptive"}` and `output_config.effort`; Sonnet 5.5 described as "speed and capability for everyday coding, agent, and enterprise work"; Haiku positioned "for simple tasks". - [Claude platform pricing docs](https://platform.claude.com/docs/en/about-claude/pricing) and the bundled claude-api skill

Google Gemini (fetched 2026-10-07)
- Gemini 3.8 Flash and 3.7 Flash: input "$0.75 through December 31, 2026. $1.50 starting January 1, 2027", output "$3.75 through December 31, 2026. $7.50 starting January 1, 2027"; batch 50% off; context caching "$0.075 through December 31, 2026". Gemini 3.5 Flash $1.50 / $9.00 (caching $0.15 + storage). Gemini 3.5 Flash-Lite $0.30 / $2.50. Gemini 2.5 Flash $0.30 / $2.50. Gemini 2.5 Flash-Lite $0.10 / $0.40. Gemini 3.1 Pro Preview $2.00 (≤200k) / $4.00 (>200k) input, $12.00 / $18.00 output. Gemini Embedding 2 text $0.20. Free tier: "Free input & output tokens" with limited model access via Google AI Studio. - [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- Rate limit tiers: Free "Active project or free trial"; Tier 1 "Set up and link an active billing account"; Tier 2 "Paid $100 + 3 days"; Tier 3 "Paid $1,000 + 30 days"; exact per-model RPM/TPM/RPD are shown only in AI Studio. - [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- Third-party reports of free-tier limits conflict: one says 2.5 Flash 15 RPM / 1,500 RPD / 1M TPM and Flash-Lite 30 RPM / 1,500 RPD; another says as of Jan 2026 2.5 Flash was 10 RPM / 250k TPM / 250 RPD and Flash-Lite 30 RPM / 1,000 RPD, and that "since 2026 the free plan covers only the Flash and Flash-Lite models". - [pasqualepillitteri: Gemini 2.5 Flash free limits](https://pasqualepillitteri.it/en/news/6683/gemini-2-5-flash-free-1m-tokens); contradicted by [yingtu: Gemini free tier limits 2026](https://yingtu.ai/en/blog/google-gemini-api-free-tier-limits-2026)
- "Gemini 2.5 Flash ($0.30/$2.50) is scheduled for deprecation on October 16, 2026"; "Gemini 3.5 Flash, launched May 19, 2026, is priced at $1.50/$9.00". - [CloudZero Gemini pricing](https://www.cloudzero.com/blog/gemini-pricing/)

OpenAI (fetched 2026-10-07)
- gpt-5.6-sol $4.00 in / $0.40 cached / $20.00 out; gpt-5.6-terra $2.00 / $0.20 / $12.00; gpt-5.6-luna $0.20 / $0.02 / $1.20; gpt-5.5 $5.00 / $0.50 / $30.00; gpt-5.4 $2.50 / $0.25 / $15.00; gpt-5.1 and gpt-5 $1.25 / $0.125 / $10.00. text-embedding-3-small $0.02, -large $0.13. Batch "approximately 50% reduction"; Flex tier "modest savings on select models". The page notes OpenAI is "winding down the fine-tuning platform". - [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)

Open models via hosts
- Groq (Aug 2026): Llama 3.3 70B Versatile $0.59 in / $0.79 out; GPT-OSS 120B $0.15 / $0.60. - [aipricing.guru Groq pricing](https://www.aipricing.guru/groq-pricing/); Groq's own pricing page rendered only marketing copy on fetch
- Groq free-plan limits shown in docs for text models: openai/gpt-oss-120b and -20b "30 RPM, 1K RPD, 8K TPM, 200K TPD"; qwen/qwen3.8-27b the same. - [Groq rate limits](https://console.groq.com/docs/rate-limits)
- Together serverless: Llama 3.3 70B $1.04 / $1.04; Qwen3.5 9B $0.17 / $0.25; Qwen3.7-Max $1.50 / $4.50; DeepSeek V4 Pro 0813 $1.32 / $3.96; Kimi K3 $2.70 / $13.50; GLM-5.3-Flash $0.15 / $0.50; DeepSeek V4.1 Flash $0.30 / $1.20; Qwen3.8 Flash $0.15 / $0.47; cached tokens "up to 80% reduction". - [Together AI pricing](https://www.together.ai/pricing)
- DeepSeek first-party: deepseek-flash (V4.1-Flash) cache-miss input $0.30 peak / $0.15 off-peak, cache-hit $0.006 / $0.003, output $1.20 / $0.60; deepseek-v4-pro cache-miss $1.32 / $0.66, output $3.96 / $1.98. "Off-peak rates are half of the peak rates"; peak is 01:00-04:00 and 06:00-10:00 UTC Mon-Fri; weekends and Chinese holidays are off-peak. - [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing)
- Fireworks serverless embeddings: ≤150M params $0.008/M, 150-350M $0.016/M; Qwen3 8B $0.10/M input. - [Fireworks pricing](https://fireworks.ai/pricing)

Judging quality
- "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena": GPT-4 judges achieve "over 80% agreement" with human preferences; identifies position, verbosity and self-enhancement biases and proposes mitigations. - [arXiv 2306.05685](https://arxiv.org/abs/2306.05685)

### Inferences
- Cost of a 30k-token style corpus per call (Anthropic): Sonnet 5.5 or Opus 5.5 cache read 30k × $0.20/M = $0.006; Haiku 4.5 = $0.003; Fable 5.1 = $0.0075. Writing the cache once per hour on Sonnet 5.5 costs 30k × $4/M = $0.12 (1h TTL) or $0.075 (5m TTL). A nightly batch of 5-10 articles within one hour amortises one write across all calls. On Gemini, context caching on 3.8 Flash is $0.075/M (plus storage), i.e. $0.00225 per call for 30k tokens.
- Worked per-article cost (18k uncached input: draft + 10 summarised SERP pages; 30k cached style; 4k output; 3 LLM passes: plan, revise, judge): Sonnet 5.5 ≈ 3 × ($0.036 + $0.006 + $0.04) ≈ $0.25; Opus 5.5 ≈ 3 × ($0.072 + $0.006 + $0.08) ≈ $0.47; Haiku 4.5 ≈ $0.13; Gemini 2.5 Flash-Lite ≈ 3 × ($0.0048 + $0.0016) ≈ $0.02; gpt-5.6-luna ≈ $0.03. Batch API halves the Anthropic figures if the stage runs asynchronously (publishing is not latency-sensitive). At 60 articles/month, Opus 5.5 for revise + Haiku 4.5 for plan/judge lands around $15-$25/month before SERP/entity costs, far below a $299 Surfer plan.
- Claim checking: 40 atomic claims per article × 1 Serper query ≈ $0.04; using Anthropic's server-side web search instead is $0.40 per article (40 × $0.01), so prefer own-corpus lookup first, then Serper, and reserve Anthropic web search for hard cases.
- Model roles: use the strongest affordable model (Opus 5.5, or Sonnet 5.5 when cost-bound) for the revise step because style fidelity and long-instruction following matter most there; use Haiku 4.5 / Gemini Flash-Lite / gpt-5.6-luna for extraction, claim splitting and rubric judging where the MT-Bench result (>80% agreement) and cheapness matter; always swap candidate order when doing pairwise judging because of position bias (see KQ6).
- Gemini free tier is enough for development and judging at low volume (hundreds of requests/day) but the conflicting RPD reports (250 vs 1,500) mean the live number in AI Studio must be checked; 2.5 Flash's 16 Oct 2026 deprecation means new code should target 2.5 Flash-Lite, 3.5 Flash-Lite or 3.8 Flash.
- Anthropic's flat 1M-context pricing means you can pass the full own-corpus (300 articles ≈ 450k tokens) in one judging call if ever needed, but cached retrieval of top-k neighbours is far cheaper and should be the default.

### Gaps
- No fetched source gives head-to-head benchmark numbers for "editing quality" or "style-guide adherence" across Claude, Gemini, GPT-5 and open models in 2026; the role assignments above are inferences from pricing and the vendor positioning in the Claude skill.
- Groq's official per-model price list and its free-tier limits for Llama models were not retrievable (marketing page only); the Llama/GPT-OSS prices are from a third-party tracker dated Aug 2026.
- Exact Gemini free-tier RPM/RPD values conflict between third-party sources and are not published by Google.
- OpenAI fine-tuning status beyond "winding down" was not detailed on the pricing page.

## KQ5. Fine-tuning paths and costs; when fine-tuning beats prompting for a corpus under 300 articles

### Takeaway
Fine-tuning hosted models costs little to train (Fireworks LoRA SFT $0.50 per million training tokens for ≤16B models, Together Qwen3.5 9B $0.34/M, Vertex Gemini 2.5 Flash SFT $5/M) and a 300-article corpus is only ~0.5M tokens, but Gemini API/AI Studio tuning was removed in May 2025 (Vertex only, with always-on endpoint charges), OpenAI is winding down its fine-tuning platform, and local 7B-14B models on Apple Silicon run at roughly 90 tok/s under MLX; with cached 30k-token style prompts costing well under a cent per call, prompting with a style guide plus retrieved exemplars is the better default below 300 articles, and fine-tuning only pays when you need a cheap small model to reproduce voice at high volume or offline.

### Cited Findings
- Fireworks fine-tuning per 1M training tokens: ≤16B LoRA SFT $0.50, LoRA DPO $1.00, full-parameter SFT $1.00; 16.1B-80B LoRA SFT $3.00; 80B-300B $6.00; "Serve fine-tuned models for the same price as base models." On-demand GPUs: H100/H200 $8.00/hr, B200 $13.00/hr. - [Fireworks pricing](https://fireworks.ai/pricing)
- Together fine-tuning per 1M tokens: Qwen3.5 9B $0.34 SFT / $0.84 DPO; Llama 3.3 70B $2.03 SFT / $5.08 DPO; Gemma 4 31B $1.05 SFT; DeepSeek-V3.1 $7.00 SFT; minimum charges "$4-$60 depending on model size"; dedicated H100 $5.49/hour. - [Together AI pricing](https://www.together.ai/pricing)
- OpenAI pricing page: fine-tuning training "range from $1.50 to $25.00" per model with inference "$0.80 to $15.00" output; "OpenAI is winding down the fine-tuning platform." - [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)
- Third-party tracker: GPT-4.1-mini fine-tuning ~$0.80 per 1M training tokens, tuned inference ~$0.80 in / $3.20 out per 1M. - [costbench OpenAI fine-tuning 2026](https://www.costbench.com/software/fine-tuning-apis/openai-fine-tuning/)
- Gemini API: "With the deprecation of Gemini 1.5 Flash-001 in May 2025, we no longer have a model available which supports fine-tuning in the Gemini API, but it is supported in Vertex AI"; tuning removed from AI Studio; Google "plans to bring fine-tuning support back in the future". - [Google AI model tuning guidance](https://ai.google.dev/docs/model_tuning_guidance); [Google AI forum: fine-tuning disabled](https://discuss.ai.google.dev/t/gemini-api-fine-tuning-disabled/92763)
- Vertex AI supervised tuning for Gemini 2.5 Flash: $5.00 per 1M training tokens (tokens × epochs); tuned-model prediction priced as the base model, but "you pay for each model deployed to an endpoint even if no prediction is made, and you must undeploy your model to stop incurring further charges". - [Vertex AI generative AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing); [Google dev forum: Vertex tuned model pricing](https://discuss.google.dev/t/pricing-vertex-hosted-tuned-model/185475)
- Local Apple Silicon: Ollama switched to an MLX backend in the Ollama 0.19 preview on 30 March 2026; engine is chosen by file format ("GGUF files run on llama.cpp, safetensors files run on MLX"). MLX decode ≈ 93.3 tok/s on Qwen3-8B 4-bit on M4-class hardware (21% over llama.cpp); MLX's throughput lead is "20-87%" for sub-14B dense models, "narrowing to roughly 10-20% at 14B and above". - [lilting.ch: Ollama moves to MLX](https://lilting.ch/en/articles/ollama-mlx-apple-silicon-preview); [markaicode MLX vs llama.cpp M4 benchmarks](https://markaicode.com/benchmarks/cuda-gemma-4-m4-max-memory-benchmark/); [openclawdc MLX vs llama.cpp](https://openclawdc.com/blog/mlx-vs-llama-cpp-apple-silicon/)
- Prompting alternative cost basis: Anthropic 1h cache write 2x, read 0.1x (Sonnet 5.5 read $0.20/M); 1M context at flat price. - [Claude platform pricing docs](https://platform.claude.com/docs/en/about-claude/pricing)
- Self-Refine shows prompting-only critique/revise gives "~20% absolute" gains with no training. - [Self-Refine](https://arxiv.org/abs/2303.17651)

### Inferences
- Data needed: 300 articles × ~1,500 tokens ≈ 450k tokens; 3 epochs ≈ 1.35M training tokens → Fireworks LoRA on a ≤16B model ≈ $0.68, Together Qwen3.5 9B ≈ $0.46 (above the $4 minimum, so ~$4), Vertex Gemini 2.5 Flash ≈ $6.75 plus endpoint-hours. Training cost is negligible; hosting and maintenance are the real costs (Vertex endpoint billed while deployed; Fireworks LoRA served at base price is the cheapest hosted route).
- Compare with prompting: a 30k-token style guide + 3 retrieved exemplars cached costs ≈ $0.006 per call on Sonnet/Opus 5.5. At 60 articles × 3 calls/month that is ≈ $1/month of style-corpus overhead. Fine-tuning cannot beat that on cost; it can only win on (a) using a much cheaper/smaller model for high volume, (b) offline/local generation, or (c) when the voice is so specific that a 1M-context frontier model with exemplars still misses it, which is unlikely for a 300-article corpus.
- Decision rule: below 300 articles, prompt with style guide + retrieved exemplars + critique loop (frontier model). Revisit fine-tuning when (1) monthly volume exceeds ~1,000 enhancement passes, (2) you want a local M-series model for drafting, or (3) you have ≥1,000 human-approved before/after pairs (the enhancement stage itself will generate these over time; store them).
- Local: a 7B-14B 4-bit model on an M-series Mac at ~60-90 tok/s produces a 1,500-word revision in ~30-40 s, fine for an overnight batch but not as a Render-hosted service; keep local models to offline scripts (Python acceptable) and keep the production stage on hosted APIs.
- Avoid building on Gemini API tuning (removed) or OpenAI fine-tuning (winding down); if you must fine-tune, use Fireworks or Together LoRA on Qwen/Llama, or Vertex for Gemini.

### Gaps
- No fetched source gives a controlled comparison of fine-tuned small model vs frontier model + style guide on brand-voice adherence; the <300-article rule is an inference.
- Fireworks per-model serverless inference prices for Llama/Qwen chat models were not on the fetched page (only size-tier embeddings and fine-tuning tables).
- M4 (non-Max) 14B tok/s numbers specifically were not found; the ~93 tok/s figure is for an 8B model.

## KQ6. Evaluation: offline (LLM-as-judge pairwise, human spot checks, rubric agreement) and online (GSC impressions/clicks at 7/28 days, Discover, engagement); open-source eval harnesses and prices

### Takeaway
Offline, teams use pairwise LLM-as-judge (GPT-4-class judges reach >80% agreement with humans, but position bias is systematic and must be countered by swapping candidate order and using reference-guided rubrics) plus human spot checks; online, the SE Ranking experiments show 36 days is enough to see indexation and first impressions while month 2-3 reveals whether pages hold (their unedited AI sites fell from 28% to 3% of pages in the top 100); promptfoo (free Community, Cloud $50/mo), DeepEval (OSS; Confident AI from $19.99/user), Braintrust (free Starter, Pro $249/mo), LangSmith (free Developer 5k traces, Plus $39/seat) and Arize Phoenix (Elastic License 2.0, free self-host) cover the harness need.

### Cited Findings

LLM-as-judge
- MT-Bench paper: GPT-4 judge "over 80% agreement" with human preferences; biases: position, verbosity, self-enhancement; mitigations proposed. - [arXiv 2306.05685](https://arxiv.org/abs/2306.05685)
- "Judging the Judges" (15 LLM judges, MT-Bench and DevBench, 22 tasks, ~40 solution models, >150,000 instances): position bias "is not due to random chance and varies significantly across judges and tasks"; "weakly influenced by the length of prompt components" but "strongly affected by the quality gap between solutions"; list-wise "DIRECT LIST exhibits the most position bias, while intermediate pairwise preferences have the least". Introduces repetition stability, position consistency and preference fairness metrics. - [arXiv 2406.07791](https://arxiv.org/abs/2406.07791)
- Automated factuality checking agrees with crowd annotators 72% of the time and wins 76% of adjudicated disagreements at >20x lower cost (SAFE). - [arXiv 2403.18802](https://arxiv.org/abs/2403.18802)

Online metrics
- SE Ranking blog experiment: 6 AI-assisted articles, human-edited and fact-checked, with an AI disclaimer, published 4 Jun to 9 Sep 2024; over 13 months (Jun 2024-Jul 2025) "555K impressions and 2,300+ clicks", 3 of 6 in organic top 10, 4 cited in AI Overviews. - [SE Ranking AI content experiment](https://seranking.com/blog/ai-content-experiment/)
- SE Ranking new-domain experiment: 2,000 one-click AI articles on 20 new WordPress sites (no edits, no internal links, no images) launched 5-6 Nov 2024; after 36 days "70.95%" indexed ("1,419 out of 2,000 pages"), "122,102 impressions", "244 clicks"; 5 sites had 20-30% of keywords in the top 30; from months 2-3 the share of pages in the top 100 "dropped from 28% to just 3%"; after 16 months "most sites settled into a pattern of low visibility". - [SE Ranking AI content experiment](https://seranking.com/blog/ai-content-experiment/)
- Google added a Generative AI performance report to Search Console in June 2026 breaking out AI Overviews and AI Mode impressions, "at launch it carried impressions only, with no clicks, CTR, or query dimension". - [Search Engine Journal: track AIO visibility](https://www.searchenginejournal.com/google-aio-track-visibility/560470/)
- Standard practice: "Compare the last 28 complete days with the previous 28, and segment losses by page and query, then device and country"; flag "high impressions with low clicks (demand exists but click capture is weak)". - [NeuralText: analyzing Search Console performance data](https://docs.neuraltext.com/feature-guides/search-console-integration/analyzing-performance-data); [1clickreport AIO zero-click 2026](https://www.1clickreport.com/blog/ai-overviews-zero-click-first-party-data-2026)

Eval harnesses and prices
- promptfoo: Community plan "Free Forever" (core evaluation and red-teaming up to 10k probes/month, local/self-hosted); Cloud $50/month for team collaboration; Enterprise/On-Premise custom. - [toolradar promptfoo pricing](https://toolradar.com/tools/promptfoo/pricing)
- Braintrust: Starter $0 with "$10 model credits per month, 1 GB processed data per month, and 10,000 scores per month"; Pro $249/month. - [Braintrust plans and limits](https://www.braintrust.dev/docs/plans-and-limits)
- DeepEval is open source; Confident AI (hosted) Free, Starter $19.99/user/month, Premium $49.99/user/month. - [Braintrust: DeepEval alternatives 2026](https://braintrust.dev/articles/deepeval-alternatives-2026)
- LangSmith: Developer $0 per seat with 5K base traces/month; Plus $39 per seat. - [FutureAGI: best LLM evaluation tools 2026](https://futureagi.com/blog/best-llm-evaluation-tools-2026/)
- Arize Phoenix: "released under the Elastic License 2.0 and is free to self-host on your own infrastructure with no feature gates". - [Arize Phoenix self-hosting license](https://www.arize.com/docs/phoenix/self-hosting/license.md)
- Anthropic's claude-api skill ships `build-eval` and `hillclimb` guides (interview to source prompts, pick grading method, measure cost; then train/validation/test hill-climbing) for TypeScript projects. - bundled claude-api skill (loaded in-session; see [Claude platform docs](https://platform.claude.com/docs/en/about-claude/pricing))

### Inferences
- Offline protocol for this pipeline: keep every (draft, enhanced) pair; judge pairwise with a cheap model twice with swapped order and only count consistent wins (addresses the position bias finding); use a reference-guided rubric (accuracy vs own Mongo facts, voice vs style guide, SEO coverage vs the deterministic score, originality vs duplicate score); human spot-check a fixed 10% sample weekly and track judge-human agreement, aiming for the ~80% MT-Bench level before trusting auto-publish.
- Online protocol: snapshot GSC per URL at day 7 (indexed? impressions > 0?), day 28 (impressions, clicks, avg position vs the pre-enhancement cohort) and day 90 (does it hold, given SE Ranking's month 2-3 collapse pattern for low-quality pages). Because the Generative AI report has impressions only, treat AIO/AI Mode citations as a secondary signal. Compare enhanced vs unenhanced cohorts of similar article type (blog vs drop vs profile) rather than absolute numbers.
- Harness choice for a TypeScript stack: promptfoo (YAML/TS, free, CI-friendly) for regression tests of prompts; Braintrust free tier or Phoenix self-host if you want traces and a UI; DeepEval/LangSmith are more Python-centric.

### Gaps
- No source quantified Google Discover performance for AI-enhanced content; Discover is not covered by the fetched experiments.
- promptfoo's own pricing page was not fetched (third-party tracker used); verify the $50 Cloud figure.
- No published agreement rates between LLM judges and human editors specifically for SEO content quality were found.

## KQ7. Programmatic and automated publishing cautions: Google's scaled content abuse policy and how to stay compliant

### Takeaway
Google's spam policy defines scaled content abuse as generating "many pages for the primary purpose of manipulating search rankings and not helping users", explicitly including generative-AI output "without adding value"; its 2023 guidance says AI use is not itself a violation ("however content is produced…"), and its helpful-content self-assessment asks whether AI/automation use is "self-evident to visitors through disclosures" and whether content adds "substantial additional value and originality", so the compliant pattern is human review gates, disclosure, verified facts, and updating existing pages rather than mass-churning new ones.

### Cited Findings
- "Scaled content abuse is when many pages are generated for the primary purpose of manipulating search rankings and not helping users." Examples: "Using generative AI tools or other similar tools to generate many pages without adding value for users"; scraping feeds/search results to generate pages "with minimal added value"; "Stitching or combining content from different web pages without adding value"; "Creating multiple sites to hide the scaled nature of content"; keyword-stuffed pages that lack coherence. - [Google Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Site reputation abuse (third-party content on a host to exploit its ranking signals) and expired domain abuse are separate policies on the same page; site reputation abuse pages may receive manual actions outside the EEA and are ranked separately inside it. - [Google Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- Google (8 Feb 2023): "however content is produced, those seeking success in Google Search should be looking to produce original, high-quality, people-first content demonstrating qualities E-E-A-T"; its focus on quality "rather than how content is produced" has guided results "for years". - [Google Search's guidance about AI-generated content](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content)
- Helpful-content self-assessment: "Is it self-evident to your visitors who authored your content?"; "Is the use of automation, including AI-generation, self-evident to visitors through disclosures or in other ways?"; "Are you providing background about how automation or AI-generation was used to create content?"; does the content "provide substantial additional value and originality" rather than rewriting sources; a warning sign is when "the content is primarily made to attract visits from search engines". - [Google: Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- Semrush's 20,000-URL study found AI and human content appear in the top 10 at similar rates (57% vs 58%). - [Semrush: Does Google penalize AI content?](https://semrush.com/blog/does-google-penalize-ai-content)
- SE Ranking's unedited 2,000-page experiment collapsed from 28% to 3% of pages in the top 100 within months, while its 6 edited, fact-checked, disclosed articles earned 555K impressions over 13 months. - [SE Ranking AI content experiment](https://seranking.com/blog/ai-content-experiment/)

### Inferences
- The enhancement stage is itself a compliance asset if it (a) adds verifiable, original value (own price/availability data, release dates from the drop calendar, India-specific context) rather than SERP-term stuffing, (b) hard-gates unsupported claims, (c) writes a review record (what changed, why, sources) so a human approves anything the judge is unsure about, and (d) prefers updating existing articles (refresh dates, prices, add FAQ) over spawning near-duplicate new URLs.
- Add a visible "How this was made" disclosure line with a named author/editor on blog posts; this maps directly to Google's "Who" and "How" questions and matches the SE Ranking configuration that performed well.
- Keep volume proportional to editorial capacity: a daily cap on auto-published pieces, with the rest queued as `needs_review`, is the simplest way to stay away from the "many pages" threshold.

### Gaps
- Google does not publish a numeric threshold for "many pages", nor how it detects editorial oversight; the cap above is a judgement call.
- No fetched source documents a manual action specifically triggered by an LLM-enhanced (as opposed to LLM-generated) page.

## KQ8. Reference architectures and write-ups from teams running LLM content at scale (successes and failures)

### Takeaway
Published outcomes split cleanly: unedited mass generation (Causal via Byword: 1,800 articles, 3.6M views, then a 42% drop after exposure; CNET: errors in 41 of 77 AI articles; Bankrate: article pulled; SE Ranking's 2,000 pages: 28% → 3% top-100) versus edited, verified, disclosed content (SE Ranking's 6 articles: 555K impressions, 3 of 6 in the top 10), while HubSpot's 2025 traffic collapse (customers' organic traffic down 27% YoY; its own blog down 70-80%) shows that even human-quality content aimed at generic informational queries loses to AI Overviews, so the pipeline should target queries with commercial or first-party-data intent.

### Cited Findings
- Causal / Exceljet "SEO heist": Jake Ward downloaded Exceljet's sitemap, converted ~1,800 page titles into prompts and generated 1,800 articles "in a few hours"; the site took "3.6 million total views over 18 months"; after his X post went viral "his site's organic traffic has decreased by 42%". HubSpot's experts: "Publicly crowing about manipulating Google's results is typically a one-way road to penalization" (Aja Frost); "your entire site will eventually be hit" (Rory Hope). - [HubSpot: I asked experts if an AI SEO heist is worth it](https://blog.hubspot.com/ai/seo-heist)
- The same heist used Byword as the article writer and reached 489,509 visits in one October; Exceljet's owner found the copies "complete with new errors". - [Yahoo/Insider: inside the first SEO heist](https://ca.news.yahoo.com/inside-first-seo-heist-ai-100002423.html); [Futurism: man horrified as AI steals content](https://futurism.com/the-byte/man-horrified-ai-steals-content-errors)
- CNET (Red Ventures): after review, "incorrect information in 41 of the 77 articles"; one compound-interest explainer said "you'll earn $10,300 at the end of the first year" instead of $300 on a $10,000 deposit at 3%; the articles were created to attract search traffic and affiliate revenue; CNET paused the program. - [Engadget: CNET reviewing AI articles](https://www.engadget.com/cnet-reviewing-ai-written-articles-serious-errors-113041405.html); [Futurism: CNET AI errors](https://futurism.com/cnet-ai-errors); [The Batch: CNET pauses AI articles](https://www.deeplearning.ai/the-batch/cnet-pauses-its-practice-of-writing-news-articles-with-ai/)
- Bankrate (also Red Ventures) published an AI-generated article and deleted it after errors were pointed out. - [Futurism: Bankrate deletes AI article](https://futurism.com/bankrate-ai-generated-article-errors)
- HubSpot: "organic traffic for HubSpot customers fell 27% year-over-year"; HubSpot's own blog saw a 70-80% decline between 2024 and 2025 (other analyses say 75-81%), attributed to "years of high-volume content unrelated to what HubSpot sells, which lost its footing once AI Overviews absorbed generic informational queries"; HubSpot acquired XFunnel (AEO) on 31 Oct 2025. - [PPC Land: HubSpot AEO tool, traffic drops 27%](https://ppc.land/hubspot-launches-aeo-tool-as-organic-traffic-drops-27-for-its-customers/); [Edify: HubSpot traffic down 75%](https://edifycontent.com/blog/has-ai-killed-seo-analysis-of-hubspot-traffic-down-75-percent); [thestacc: HubSpot 81% decline](https://thestacc.com/blog/hubspot-traffic-drop-analysis/)
- SE Ranking (vendor running its own program): edited + fact-checked + disclosed AI articles performed (555K impressions, 2,300+ clicks, 3/6 top 10, 4 cited in AI Overviews over 13 months); one-click unedited sites did not (28% → 3% of pages in top 100 by month 2-3; "low visibility" after 16 months). - [SE Ranking AI content experiment](https://seranking.com/blog/ai-content-experiment/)
- Semrush's survey of 700 marketers: 31% say AI content performs the same as human, 33% better; 39% report increased organic traffic since publishing AI content; 20,000-URL analysis shows parity in top-10 presence. - [Semrush: Does Google penalize AI content?](https://semrush.com/blog/does-google-penalize-ai-content)
- Open-source "teams": gpt-researcher reports ~$0.4 and ~5 minutes per deep-research report; STORM's authors state its output "cannot produce publication-ready articles". - [gpt-researcher](https://github.com/assafelovic/gpt-researcher); [STORM](https://github.com/stanford-oval/storm)
- A practitioner dual-LLM pipeline (Gemini draft + self-critique, Claude evidence-matched review, fact-retention ratio, human-flag highlighting) is published as code but reports no traffic results. - [aeo-seo-automation-pipeline](https://github.com/cspektor-code/aeo-seo-automation-pipeline)

### Inferences
- The common failure is not "AI wrote it" but "nobody verified it and it added nothing": CNET/Bankrate (numerical errors), the Causal heist (templated copies with new errors), SE Ranking's unedited sites. The common success factor is editing + fact-checking + disclosure + first-party value, which is exactly what steps [3], [6] and [8] of the KQ3 architecture supply.
- HubSpot's lesson applies to topic selection upstream of the enhancer: generic informational sneaker explainers are the most exposed to AI Overviews; drop-date pages, India price/availability, size guidance and model profiles with structured data are where first-party data creates defensible value. The enhancer should therefore inject structured, first-party facts (from `Drop`, `Product`, `SneakerProfile`) and schema, not just SERP vocabulary.
- Every public "scale" success that was later measured declined within 2-18 months; plan the online evaluation (KQ6) to run to 90 days and beyond, and budget for refresh passes over new-page churn.

### Gaps
- No detailed Byword customer case study beyond the Causal heist was retrievable; Byword's own case-study pages were not fetched.
- No Zapier, Causal (post-heist) or Semrush internal-pipeline write-ups with architecture details and measured outcomes were found.
- Kevin Indig, Eli Schwartz and Bernard Huang posts specifically about automated SEO pipelines (2025-2026) were not surfaced by search; only podcast and prediction-review pages appeared.
- HubSpot's exact blog-traffic decline varies by source (70-81%); HubSpot itself has published only the customer-level 27% figure.
