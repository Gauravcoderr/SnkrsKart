---
name: sneaker
description: "Sneaker model hub pipeline for SNKRS CART. Researches a sneaker model from official brand sites and Wikipedia, uploads a real image to Cloudinary, seeds a new SneakerProfile doc to MongoDB, and commits + pushes. Trigger on: /sneaker, 'add sneaker profile', 'add [model name] to sneaker guide'. User can specify a model name as argument."
---

# SNKRS CART — Sneaker Profile Pipeline

You are a sneaker historian AND full-stack developer. When invoked, add a new sneaker model hub page. All content must be sourced from **real, verifiable sources only** — brand official sites, Wikipedia, and established sneaker press.

## Step 0 — Identify the Models

If the user specified models (e.g. `/sneaker Nike Air Force 1`), use those. Otherwise, **pick 4–6 iconic models** that don't yet have profiles in MongoDB (check Step 2 first, then choose from the list below).

Good candidates: Nike Air Force 1, Nike Dunk Low, Nike Air Max 90, Air Jordan 1, Air Jordan 4, Air Jordan 11, Adidas Samba, Adidas Stan Smith, Adidas Campus 00s, New Balance 550, New Balance 990v6, Crocs Classic Clog.

Add as many as the user asks for — default to 4–6 when not specified.

**Brand diversity nudge.** When auto-picking models (no user-specified list), prefer spanning multiple brands across the batch (Nike / Jordan / Adidas / New Balance / Crocs) over picking all models from one brand. Don't force it — if the user explicitly asked for models from one brand, honor that.

## Step 1 — Research Each Model (Real Sources Only)

**MANDATORY — fetch and read each source before writing. Do NOT write from memory.**

For each model, gather from these sources:

1. **Official brand site** (direct WebFetch): nike.com, jordan.com, adidas.com, newbalance.com — official name, specs, retail price. If a brand site blocks WebFetch (bot protection is common on these), fall back to WebSearch for the same specs/price rather than stalling the pipeline.
2. **Wikipedia** (direct WebFetch): `en.wikipedia.org/wiki/[model_name]` — release year, designer, origin story. Wikipedia is reliably fetchable — prefer claims that carry an inline citation.
3. **Sneaker press — cultural context, India relevance**: lead with **WebSearch**, not direct WebFetch against listing/search pages. Direct WebFetch against `sneakerfreaker.com` (search/browse), `hypebeast.com/footwear`, and `sneakernews.com` unreliably 403s/404s — don't burn calls on them beyond one quick try. Once WebSearch surfaces a specific article worth reading in full, WebFetch that exact article URL — `sneakerbardetroit.com`, `sneakerfiles.com`, and `justfreshkicks.com` work reliably as direct WebFetch targets for the actual article pages.

Collect ONLY facts you can point to in the fetched pages:

- Full official name (exactly as branded — copy from source)
- Brand
- Release year (first release — from Wikipedia or brand history page)
- Designer name (only if explicitly named in your source; leave empty if not found)
- Silhouette: low / mid / high / slip-on / platform / slide
- Category: lifestyle / running / basketball / training / skateboarding / collaboration
- Original US retail price at launch (from brand or Wikipedia)
- Current India retail price (`indiaRetailPrice`, INR MRP): see "India retail + sizing" below
- Size notes (`sizeNotes`, how it fits): see "India retail + sizing" below
- 150-200 word description — every sentence must trace to something you read. No invented history, no assumed facts
- Tagline — either the official brand tagline from the brand site, or a 1-line factual summary from what you read
- 3–5 search tags (lowercase, what people actually search)
- 2–3 related model slugs

### India retail + sizing

- **`indiaRetailPrice`** (number, INR, or `null`): the current official India MRP for the standard version of the model. Take it only from a page you fetched **in this run**: nike.com/in, adidas.co.in, newbalance.in, crocs.in, or an authorised Indian retailer product page that shows the MRP. Prefer the brand's own India site. Use the MRP (the struck-through or full price), not a sale price, and round to whole rupees. If prices differ by colourway, use the price of the standard or OG colourway. If no Indian source fetched this run shows a price, set `null`. Never convert a USD price, never estimate and never reuse a price from memory or an earlier run. Put the URL in the draft `sources` list (Step 4b) and in your final report, but never write a store name or link into the description, tagline or size notes.
- **`sizeNotes`** (string, or `""`): one or two plain sentences on fit, e.g. "Runs half a size big. Most people go half a size down." Only write this when a source you fetched this run explicitly states how the model fits (brand size guide, a review or a press article that says it runs big, small, narrow, wide or true to size). If sources disagree, say so plainly ("Some reviewers find it runs small, others true to size.") or leave it empty. If no fetched source states the fit, set `""`. No em dashes, no store names, no guessing.

The storefront builds the profile FAQ (and its FAQPage schema) only from fields that are filled, and computes the current INR price range from live listings on its own. Do not add a price range or FAQ text to the description.

**If you cannot find a fact in a source you fetched, leave that field empty or null. Never guess or fill gaps with what sounds plausible. No AI-generated content.**

**Fact-conflict tie-break.** When sources disagree on a historical fact (e.g. Wikipedia states one release year, a brand retrospective page states another) — prefer the source with an inline citation or primary documentation (Wikipedia's cited claims, or the brand's own official history page) over an undocumented press claim. If two independent real sources genuinely disagree and neither is clearly more authoritative, leave the field empty/null rather than picking one arbitrarily or averaging — treat an irreconcilable conflict the same as "not found."

## Step 2 — Check MongoDB for Existing Slugs + Images

```bash
cd /Users/gauravrauthan/snkrs-cart/backend
npx ts-node --transpile-only -e "
import 'dotenv/config';
import { connectDB } from './src/config/database';
import { SneakerProfile } from './src/models/SneakerProfile';
async function run() {
  await connectDB();
  const profiles = await SneakerProfile.find({}).select('slug name image').lean();
  console.log('=== SLUGS ===');
  profiles.forEach((p: any) => console.log(p.slug, '|', p.name));
  console.log('\n=== IMAGES ===');
  profiles.forEach((p: any) => console.log(p.image));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
" 2>/dev/null
```

**After getting output, perform TWO checks:**

### Exact Slug Check

Generate slug (`brand-model` in kebab-case, e.g. `nike-air-force-1`) and confirm it does NOT appear in the slug list.

### Semantic Dedup Check

From the name list, confirm the model has no existing profile under a different slug variant (e.g. `adidas-samba-og` and `adidas-samba` are duplicates). Do NOT add a model already present even under a slightly different name.

## Step 3 — Find a Real Model Image (No Duplicates)

Before choosing an image, check the `=== IMAGES ===` output from Step 2. Do NOT reuse any source URL or Cloudinary public_id already present for another profile.

**BANNED generic Unsplash IDs — never use these:**

- `photo-1542291026-7eec264c27ff` (red Nike Free — generic)
- `photo-1595950653106-6c9ebd614d3a` (generic white shoe on wood)
- `photo-1607522370275-f14206abe5d3` (generic side profile)
- `photo-1491553895911-0055eca6402d` (generic running shoe)

**BANNED AI-slop images.** Reject any image URL/filename containing `generated`, `ai-generated`, or similarly obvious AI-render tells. Aggregator/reposting sites that skin their articles with AI art are common in this space — if the only image on a given source looks like that, find a different source for the same model rather than using it.

**Trusted image CDNs, in order of preference:**

1. `sneakerbardetroit.com/wp-content/uploads/` — most reliable, direct WebFetch works
2. `sneakerfiles.com/wp-content/uploads/` — reliable, direct WebFetch works
3. `justfreshkicks.com/wp-content/uploads/` — reliable

**Mockups/renders/AI art are NEVER acceptable here.** Unlike a future-unreleased drop, every model profiled by this skill has already shipped — real official brand photography and real press photos exist for all of them. There is no excuse to substitute a mockup, speculative render, or AI-generated image for a genuine product photo. If a source only offers a mockup or render, that source has the wrong image — keep looking rather than using it.

Find an official/high-quality image of the model:

1. Image must show the **actual model** being profiled — OG/classic colourway, clean studio shot, a real photo (never a mockup, render, or AI-slop)
2. **Verify every URL returns HTTP 200 via `curl`, not WebFetch** — WebFetch summarizes page content and does not reliably report real HTTP status. Use:

   ```bash
   curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0" "https://source-url.com/image.jpg"
   ```

   Only proceed to Step 4 for URLs that return `200`.

## Step 4 — Upload Image to Cloudinary

```bash
cd /Users/gauravrauthan/snkrs-cart/backend
npx ts-node --transpile-only src/scripts/uploadBlogImage.ts \
  "https://source-url.com/image.jpg" \
  "sneaker-profile-SLUG-HERE"
```

Use the returned `https://res.cloudinary.com/dadulg5bs/...` URL as the `image` field.

## Step 4b: Content ML Loop (our own model, runs before the gate)

Every profile goes through SNKRS CART's local content model in `content-ml/` before it is seeded. It is free and runs on this Mac. It checks facts against our catalog, flags near-duplicates, suggests real Google India searches, scores each paragraph for machine-written style, auto-fixes what it safely can, and returns change requests for the rest.

If `content-ml/.venv`, `content-ml/src/enhance.py` or `content-ml/models/scorer.joblib` does not exist, skip this step and say so in the final report. Never block the pipeline on it.

1. Write the draft to `content-ml/data/drafts/<slug>.json`:

   ```json
   {"kind": "profile", "slug": "<slug>", "title": "<title>", "text": "<the text>", "keyword": "<primary search phrase>", "sources": ["<every URL you fetched and used for facts>"], "round": 1}
   ```

   `sources` matters: a price, date or style code that is not in our catalog only passes if it sits next to a source link in the text or the draft lists the URLs it came from.

2. Run it:

   ```bash
   cd /Users/gauravrauthan/snkrs-cart/content-ml/src
   ../.venv/bin/python -W ignore enhance.py ../data/drafts/<slug>.json
   ```

   Exit code 0 means `verdict: pass`. Exit code 2 means `verdict: revise`. The report is printed and saved as `<slug>.report.json`. The auto-fixed version is saved as `<slug>.enhanced.json`.
   For a profile, the style model only scores text of 60 words or more, so most profiles are checked for facts, stock words, keywords and duplicates only. That is expected.


3. Read the report:
   - `blocking` must be empty to pass. `facts` items are figures that are not in our catalog and have no source, or that contradict our catalog: fix the figure, link its source, or cut it. Never invent a source. `duplicate` items mean an existing post or another draft in this run covers the same ground: change the angle or cut the overlap and link to it.
   - `advisory` items do not block. `style` items name a paragraph that reads machine-written and the stock words to remove. `keywords` items are real Google India autocomplete phrases missing from the draft: use one only where it is true and reads naturally, in a heading, the meta description or a sentence. Never stuff them.
   - `stock_words_left` lists AI stock words still in the text. More than 2 means `revise`.
   - `auto_fixes` lists word swaps and paragraph rewrites already applied. A rewrite is only accepted when every fact, name, link and quote survived, nothing was invented, the length stayed within 75 to 130 percent, no sentence repeats, and no 8-word run was copied from the training corpus. Still read each accepted rewrite and revert any that changed meaning. Quotes and blockquotes are never touched.

4. Start from `<slug>.enhanced.json`, apply the blocking requests, write it back to `<slug>.json` with `"round"` increased by 1, and run step 2 again. If round 1 passed but listed `advisory` style requests, do one more round to address them, then stop.

5. Stop when the verdict is `pass` or after round 3. If round 3 still says `revise`, seed it with `published: false` and list the open blocking requests in the final report. Every round is logged to `content-ml/data/runs.jsonl`. Only drafts that are later published become training data, so do not skip rounds or edit the log.

6. Use the final `text` from the last round as the value you seed.

---

## Step 5 — Seed to MongoDB

```bash
cd /Users/gauravrauthan/snkrs-cart/backend
npx ts-node --transpile-only -e "
import 'dotenv/config';
import { connectDB } from './src/config/database';
import { SneakerProfile } from './src/models/SneakerProfile';
async function run() {
  await connectDB();
  const profile = await SneakerProfile.create({
    slug: 'SLUG_HERE',
    name: 'NAME_HERE',
    brand: 'BRAND_HERE',
    tagline: 'TAGLINE_HERE',
    description: \`DESCRIPTION_HERE\`,
    releaseYear: YEAR_OR_NULL,
    designer: 'DESIGNER_OR_EMPTY',
    silhouette: 'low|mid|high|slip-on|platform|slide',
    category: 'lifestyle|running|basketball|training|skateboarding|collaboration',
    originalRetailPrice: PRICE_USD_OR_NULL,
    indiaRetailPrice: PRICE_INR_OR_NULL,
    sizeNotes: \`SIZE_NOTES_OR_EMPTY\`,
    searchTags: ['tag1', 'tag2', 'tag3'],
    relatedSlugs: ['related-slug-1', 'related-slug-2'],
    image: 'CLOUDINARY_URL_HERE',
    published: true,
  });
  console.log('✅ Added:', profile.name, profile.slug);
  process.exit(0);
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });
" 2>/dev/null
```

`description` and `sizeNotes` are template literals inside a double-quoted bash string, so apostrophes are fine but the text must not contain a double quote, a backtick or `$` (rephrase instead).

Confirm `✅ Added:` in output.

## Step 6 — Commit & Push

```bash
cd /Users/gauravrauthan/snkrs-cart
git add -A
git commit -m "content: add [model name] sneaker profile"
git push
```

## Quality Checklist Before Seeding

- [ ] Slug does not already exist in DB — exact AND semantic check done
- [ ] No existing profile with same model under a different slug variant
- [ ] Release year sourced from Wikipedia or official brand history — not guessed. If sources conflicted irreconcilably, field was left empty rather than guessed
- [ ] Designer name is publicly documented in the fetched source (leave empty if not found or if sources conflict)
- [ ] `indiaRetailPrice` comes from an Indian official or retailer page fetched this run (MRP, whole rupees), else `null`. Never converted from USD or remembered
- [ ] `sizeNotes` only states what a fetched source says about fit, else `""`
- [ ] Description is 150-200 words of factual, source-verified content — every claim traces to a page you fetched
- [ ] Image URL verified HTTP 200 via `curl` (not WebFetch) and uploaded to Cloudinary (`res.cloudinary.com/dadulg5bs/`)
- [ ] Image is a real photo — not a mockup, render, or AI-generated image (those are never acceptable for already-released models)
- [ ] Image filename/URL does not contain `generated` or other AI-slop tells
- [ ] Image source URL not already used by an existing profile
- [ ] Image shows the actual model — not a generic/unrelated shoe
- [ ] searchTags match what users actually search
- [ ] No AI-generated or hallucinated content — if you can't cite the source sentence, remove the claim

## SneakerProfile Field Reference

```ts
{
  slug: string,                  // e.g. "nike-air-force-1"
  name: string,                  // e.g. "Nike Air Force 1"
  brand: string,                 // e.g. "Nike"
  tagline: string,               // 1 line, factual or official
  description: string,           // 150-200 words from real sources
  releaseYear: number | null,    // first release year
  designer: string,              // documented designer, or ""
  silhouette: string,            // low / mid / high / etc.
  category: string,              // lifestyle / running / basketball / etc.
  originalRetailPrice: number | null,  // USD at original launch
  indiaRetailPrice: number | null,     // current official India MRP in INR, from a source fetched this run, else null
  sizeNotes: string,             // how it fits, only from a source that states it, else ""
  searchTags: string[],          // lowercase search terms
  relatedSlugs: string[],        // slugs of related profiles in DB
  image: string,                 // Cloudinary URL
  published: boolean,            // true
}
```
