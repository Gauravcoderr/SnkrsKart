---
name: drop
description: "Automated drop calendar pipeline for SNKRS CART. Researches upcoming sneaker release dates from official brand sources, uploads real images to Cloudinary, seeds new Drop docs to MongoDB, and commits + pushes. Trigger on: /drop, 'add upcoming drops', 'update drop calendar', 'add release dates'."
---

# SNKRS CART — Drop Calendar Pipeline

You are a sneaker release researcher AND full-stack developer. When this skill is invoked, execute the full pipeline below. Only add drops sourced from **official brand announcements** — no speculation.

## Step 1 — Research Upcoming Releases

**Primary discovery method: WebSearch, not WebFetch.** Direct WebFetch against listing pages on `sneakerfreaker.com/releases`, `sneakernews.com/release-dates`, `hypebeast.com/footwear/release-dates`, and `kicksonfire.com/release-dates` reliably 403s/404s — don't burn calls on them beyond one quick try each. Instead, run targeted WebSearch queries per candidate:

- `"<Model>" "<Colorway>" <year> release official style code`
- `<Brand> <Model> release dates <year> official confirmed`

WebSearch aggregates across outlets (SneakerFiles, SneakerBarDetroit, HouseOfHeat, WWD, JustFreshKicks, Athlon, etc.) and surfaces style codes, dates, and prices directly in the summary — this is what actually works. Once a candidate looks solid, WebFetch the specific article URL (sneakerbardetroit.com and sneakerfiles.com work reliably as direct WebFetch targets) to pull the real image URL and confirm details firsthand.

**Frontier-biased search.** Before researching, get the current MAX `releaseDate` already in MongoDB from Step 2's output. Bias new searches toward dates beyond that frontier first (the near-term calendar fills up fast and re-discovering already-seeded drops wastes cycles) — but still do a pass for genuinely missed near-term gaps if the frontier search comes up short.

**Date-confirmation rule — reject rumor dates.** A release date only counts as "confirmed" if it appears as an exact day (month + day + year) in the source, stated plainly. Reject any candidate whose only date is qualified by words like "rumored," "expected," "reportedly," "placeholder," "could change," or a vague season with no exact day given anywhere ("Holiday 2026" alone is not confirmed — "December 25, 2026" is). If a source flags its own date as speculative or contradicts itself across updates, drop that candidate and find a different one — don't average or guess.

**Brand diversity nudge.** When multiple genuinely-confirmed candidates exist across different brands, prefer a mix (Nike / Jordan / Adidas / New Balance / Crocs) over an all-one-brand batch. Don't force it — if Jordan just happens to have the only confirmed near-future releases in a given search pass, an all-Jordan batch is fine.

Find **3–5 upcoming drops** (release date in the future) that are:

- NOT already in MongoDB (check slugs in Step 2)
- Confirmed by official brand announcement (Nike SNKRS App, adidas.com, Jordan Brand) surfaced via press coverage — an exact confirmed date per the rule above
- Include: exact release date, retail price as a plain number in whatever currency the source states (do NOT convert), colorway name, official description

For each drop collect:

- Full shoe name (brand + model + colorway, e.g. "Nike Dunk Low Panda")
- Brand (Nike / Jordan / Adidas / New Balance / Crocs)
- Exact colorway name as officially stated
- Release date (confirmed, not rumoured — see date-confirmation rule above)
- Retail price — the raw number the source states, whatever currency that is. Never convert it. `currency` on the Drop doc is auto-derived server-side from the number's magnitude (< 1000 → USD, ≥ 1000 → INR — real sneaker USD prices are always under 1000, real INR prices are always in the thousands), so just enter the number as-is. **If sources disagree on price**, prefer the figure stated in the article that also states the exact confirmed date, or failing that, the most recently published article.
- Where it releases (Nike SNKRS App / adidas.com / Jordan Exclusive Access / Multiple retailers)
- 1–2 sentence official description from the brand/press announcement
- Source article URL for image
- Style code, if stated. It is saved as `styleCode` on the Drop (upper-case, e.g. `DD1391-100`) and shown on the drop page and in its FAQ. If sources disagree on the style code for the same shoe, that is not blocking: proceed on the confirmed date/colorway match and leave `styleCode` as `''` unless one code is clearly confirmed by the source that also states the date
- Launch time, only when a source states an exact time (e.g. "10:00 AM ET"). Convert it to IST and save it as `launchTimeIST` in 24h `HH:MM` (e.g. 10:00 AM ET in October is EDT, UTC-4, so 19:30 IST). Note the source time zone you converted from in the final report. If no exact time is stated, leave it `''`. Never guess a time from typical launch patterns

## Step 2 — Check MongoDB for Existing Slugs + Dedup

```bash
cd /Users/gauravrauthan/snkrs-cart/backend
npx ts-node --transpile-only -e "
import 'dotenv/config';
import { connectDB } from './src/config/database';
import { Drop } from './src/models/Drop';
async function run() {
  await connectDB();
  const drops = await Drop.find({}).select('slug name image releaseDate').sort({ releaseDate: 1 }).lean();
  console.log('=== SLUGS (sorted by releaseDate) ===');
  drops.forEach((d: any) => console.log(d.releaseDate.toISOString().slice(0,10), '|', d.slug, '|', d.name));
  console.log('\n=== FRONTIER ===');
  console.log('MAX releaseDate already in calendar:', drops.length ? drops[drops.length - 1].releaseDate.toISOString().slice(0,10) : 'none');
  console.log('\n=== IMAGES ===');
  drops.forEach((d: any) => console.log(d.image));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
" 2>/dev/null
```

**After getting the output, perform TWO checks:**

### Exact Slug Check

Generate slug (`brand-model-colorway` in kebab-case, e.g. `nike-dunk-low-panda-2025`) and confirm it does NOT appear in the slug list.

### Semantic Dedup Check

From the slug + name list, identify drops already in the calendar. Do NOT add:

- Same model + same colorway already present (even with a different year suffix)
- Same model already in calendar with a future release date (adding it again is a duplicate)
- A colourway so visually similar to an existing entry that a user would consider them the same shoe

If a proposed drop conflicts, replace it with a genuinely different upcoming release.

## Step 3 — Find Real Product Images (No Duplicates)

Before choosing images, check the `=== IMAGES ===` output from Step 2. Do NOT use any source image URL or Cloudinary public_id already present.

**BANNED generic Unsplash IDs — never use these:**

- `photo-1542291026-7eec264c27ff` (red Nike Free — generic)
- `photo-1595950653106-6c9ebd614d3a` (generic white shoe on wood)
- `photo-1607522370275-f14206abe5d3` (generic side profile)
- `photo-1491553895911-0055eca6402d` (generic running shoe)

**BANNED AI-slop images.** Reject any image URL/filename containing `generated`, `ai-generated`, or similarly obvious AI-render tells (e.g. a filename like `generated-166029-....jpg` seen from `sneakerscartel.com` — an AI stock image, not a real photo of the shoe). Aggregator/reposting sites that skin their articles with AI art are common in this space; if the only image on a given source looks like that, find a different source for the same shoe rather than using it.

**Trusted image CDNs, in order of preference:**

1. `sneakerbardetroit.com/wp-content/uploads/` — most reliable, direct WebFetch works
2. `sneakerfiles.com/wp-content/uploads/` — reliable, direct WebFetch works
3. `justfreshkicks.com/wp-content/uploads/` — reliable
4. Other outlets (WWD, HouseOfHeat, Athlon) only if the above don't have the shoe, and only after confirming the image isn't AI-slop

**Mockups are acceptable.** For shoes releasing far in the future, sneaker sites often explicitly label their product shot as a "mockup" or "speculative render" rather than an official brand photo — this is normal industry practice for confirmed-but-unreleased drops (the colorway/style code is real and confirmed even if the brand hasn't shot official photography yet). A labeled mockup of the correct, confirmed colorway is fine to use. It is NOT fine to use a generic stock photo, a different model, or an AI-generated image — those are rejected regardless of how the source describes them.

For each drop, find the image:

1. Pull it from the specific article on a trusted CDN above (image must show the **actual shoe being added**, mockup or real photo — no generic stock photos of a different model, no AI-slop)
2. **Verify every URL returns HTTP 200 via `curl`, not WebFetch** — WebFetch summarizes page content and does not reliably report real HTTP status. Use:

   ```bash
   curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0" "https://source-url.com/image.jpg"
   ```

   Only proceed to Step 4 for URLs that return `200`.

## Step 4 — Upload Images to Cloudinary

```bash
cd /Users/gauravrauthan/snkrs-cart/backend
npx ts-node --transpile-only src/scripts/uploadBlogImage.ts \
  "https://source-url.com/image.jpg" \
  "drop-slug-here"
```

The script prints `https://res.cloudinary.com/dadulg5bs/image/upload/.../blog-images/drop-slug-here.jpg`

Use the returned Cloudinary URL as the `image` field. Never use the original CDN URL directly.

**Extra angles (optional).** If the source article has 2–4 more real photos of the same shoe (side, heel, top, sole), upload each with a suffixed publicId (`drop-slug-here-2`, `-3`, …) and put those URLs in `images`. The drop page renders a thumbnail slider when there is more than one image. Same rules apply: actual shoe, HTTP 200, no AI-slop.

## Step 4b: Content ML Loop (our own model, runs before the gate)

Every drop goes through SNKRS CART's local content model in `content-ml/` before it is seeded. It is free and runs on this Mac. It checks facts against our catalog, flags near-duplicates, suggests real Google India searches, scores each paragraph for machine-written style, auto-fixes what it safely can, and returns change requests for the rest.

If `content-ml/.venv`, `content-ml/src/enhance.py` or `content-ml/models/scorer.joblib` does not exist, skip this step and say so in the final report. Never block the pipeline on it.

1. Write the draft to `content-ml/data/drafts/<slug>.json`:

   ```json
   {"kind": "drop", "slug": "<slug>", "title": "<title>", "text": "<the text>", "keyword": "<primary search phrase>", "sources": ["<every URL you fetched and used for facts>"], "round": 1}
   ```

   `sources` matters: a price, date or style code that is not in our catalog only passes if it sits next to a source link in the text or the draft lists the URLs it came from.

2. Run it:

   ```bash
   cd /Users/gauravrauthan/snkrs-cart/content-ml/src
   ../.venv/bin/python -W ignore enhance.py ../data/drafts/<slug>.json
   ```

   Exit code 0 means `verdict: pass`. Exit code 2 means `verdict: revise`. The report is printed and saved as `<slug>.report.json`. The auto-fixed version is saved as `<slug>.enhanced.json`.
   For a drop, the style model only scores text of 60 words or more, so most drops are checked for facts, stock words, keywords and duplicates only. That is expected.


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

For each drop, run:

```bash
cd /Users/gauravrauthan/snkrs-cart/backend
npx ts-node --transpile-only -e "
import 'dotenv/config';
import { connectDB } from './src/config/database';
import { Drop } from './src/models/Drop';
async function run() {
  await connectDB();
  const drop = await Drop.create({
    slug: 'SLUG_HERE',
    name: 'NAME_HERE',
    brand: 'BRAND_HERE',
    colorway: 'COLORWAY_HERE',
    releaseDate: new Date('YYYY-MM-DD'),
    retailPrice: PRICE_IN_ORIGINAL_CURRENCY_OR_NULL, // never convert — currency is auto-derived from this number
    image: 'CLOUDINARY_URL_HERE',
    images: [], // optional extra Cloudinary URLs (side/top/detail shots); detail page shows a slider when present
    description: 'OFFICIAL_DESCRIPTION_HERE',
    where: 'WHERE_HERE',
    availableAtStore: false,
    productSlug: '',
    styleCode: 'STYLE_CODE_OR_EMPTY', // upper-case, '' when not confirmed
    launchTimeIST: 'HH:MM_OR_EMPTY',   // 24h IST, only when a source states an exact time; '' otherwise
    published: true,
  });
  console.log('✅ Added:', drop.name, drop.slug);
  process.exit(0);
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });
" 2>/dev/null
```

Confirm `✅ Added:` in output for each drop.

## Step 5b: Instagram draft (optional)

**Run by hand:** ask once, "Make the Instagram post for this? (y/n)". On no, skip to the next step.
**AUTOMATED DRAFT RUN:** do not ask, always make the draft. It only lands as status `draft`; a human approves it in `/admin/instagram`. Never approve or publish from here.

1. Starter spec. Every fact on the slides (dates, ₹ prices, style codes, where) comes straight from Mongo, never typed by hand:
   ```bash
   cd /Users/gauravrauthan/snkrs-cart/backend
   npx ts-node --transpile-only src/scripts/igDraft.ts starter drop <slug> [<more-slugs> for a weekly roundup] --out ../.claude/instagram/specs/$(date +%F)-<slug>.json 2>/dev/null
   ```
2. Caption. Follow `.claude/skills/ig-caption/SKILL.md` in the voice of `.claude/instagram/voice.md`: first line under 125 characters carrying the concrete fact (date, ₹ price, model), one ask, 3 to 5 specific hashtags, no em dashes, no other store names, nothing invented. Lint and clean it, fix every FAIL:
   ```bash
   cd /Users/gauravrauthan/snkrs-cart
   python3 -I .claude/skills/ig-caption/caption.py /tmp/ig-cap.txt --keywords "<model name>"
   python3 -I .claude/skills/ig-human/humanize.py /tmp/ig-cap.txt -o /tmp/ig-cap.txt --report
   ```
   Put the final text in the spec's `caption` (it starts as a `{{placeholder}}`, and `create` refuses while it is there). Leave the slides as generated; if a fact on them is wrong, fix the Mongo record and regenerate the starter.
3. Preview, then look at every slide image:
   ```bash
   cd /Users/gauravrauthan/snkrs-cart/backend
   npx ts-node --transpile-only src/scripts/igDraft.ts render ../.claude/instagram/specs/<file>.json /tmp/ig-<slug>
   ```
   A watermark warning means the photo belongs to another account (an @handle or a web address is printed on it). Swap the record's image for a clean one and re-run. Never pass `--allow-watermark` for a photo we do not own.
4. Create the draft (renders, uploads to Cloudinary `instagram/`, saves the post as `draft`):
   ```bash
   npx ts-node --transpile-only src/scripts/igDraft.ts create ../.claude/instagram/specs/<file>.json 2>/dev/null
   ```
   Confirm `✅ Instagram draft` and put the admin link (https://www.snkrscart.com/admin/instagram) in your summary.

## Step 6 — Commit & Push

```bash
cd /Users/gauravrauthan/snkrs-cart
git add -A
git commit -m "content: add [drop names] to drop calendar"
git push
```

## Quality Checklist Before Seeding

- [ ] Release date is an exact confirmed day — not qualified by "rumoured", "expected", "reportedly", "placeholder", or a vague season with no day given
- [ ] Slug does not already exist in DB — exact AND semantic check done
- [ ] No same-model duplicate already in calendar with a future release date
- [ ] Image URL returns HTTP 200 via `curl` (not WebFetch) and is uploaded to Cloudinary
- [ ] Image shows the actual shoe being added — not a different model or generic stock photo (a labeled mockup/render of the confirmed colorway is fine; an AI-generated image is not)
- [ ] Image filename/URL does not contain `generated` or other AI-slop tells
- [ ] Source image URL not already used by an existing drop entry
- [ ] Description is from official press/brand announcement only
- [ ] Price is retail price, not resale, entered as the raw number from the source (currency auto-derives from magnitude). If sources disagree, the tie-break in Step 1 was applied
- [ ] If style codes disagreed across sources, that was noted but did not block seeding, and `styleCode` holds only a confirmed code (or `''`)
- [ ] `launchTimeIST` is set only when a source states an exact time, converted to IST in `HH:MM` 24h, with the source time zone noted in the report

## Drop Object Reference

```ts
{
  slug: string,          // kebab-case, unique
  name: string,          // "Nike Dunk Low Panda 2025"
  brand: string,         // "Nike"
  colorway: string,      // "White/Black" — official colorway name
  releaseDate: Date,     // confirmed date only
  retailPrice: number,   // number as stated by the source, or null — never convert currencies
  currency: 'INR' | 'USD', // auto-derived server-side from retailPrice magnitude — do not set manually
  image: string,         // Cloudinary URL (required) — cover, also first slide
  images: string[],      // optional extra Cloudinary URLs; drop page shows slider when 2+ total
  description: string,   // 1-2 sentences from official announcement
  where: string,         // "Nike SNKRS App" / "Adidas.com" / "Multiple Retailers"
  availableAtStore: boolean, // false unless SNKRS KART stocks it
  productSlug: string,   // "" unless availableAtStore is true
  styleCode: string,     // "DD1391-100", upper-case; "" when not confirmed
  launchTimeIST: string, // "19:30" (24h IST, HH:MM); "" unless a source states an exact time. Converted from the source time zone
  published: boolean,    // true
}
```
