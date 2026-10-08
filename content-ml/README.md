# content-ml

SNKRS CART's own content model. It runs free on this Mac (Apple Silicon, 8 GB is enough) and checks every blog, drop and sneaker profile before it is seeded.

## What it does per draft

`src/enhance.py` takes a draft JSON (`kind`, `slug`, `title`, `html` or `text`, `keyword`, `sources`, `round`) and:

1. **Checks facts against our data (blocking).** Prices, dates and style codes are checked against `data/catalog.jsonl` (products, seller list prices, scraped Indian retailer prices, drop dates). A figure that is not in the catalog must sit next to a source link, or the draft must list the URLs it fetched in `sources`. Otherwise the draft is sent back.
2. **Flags near-duplicates (blocking).** TF-IDF cosine against every existing post of the same kind, published or not, and against other drafts in `data/drafts/`.
3. **Fixes safe things automatically.** Stock AI words and em dashes are swapped outside quotes. Sentence openers like "Furthermore," are only removed at a sentence start. Number ranges become "7 to 12". Blockquotes are never touched.
4. **Scores style (advisory).** A LightGBM model on 30 style features, blended with a TF-IDF logistic regression, trained only on matched pairs: the same paragraph written by a human journalist and rewritten by an LLM. Topic and era are held constant, so it learns writing style, not subject matter. Thresholds come from human out-of-fold scores and are frozen per scorer version.
5. **Rewrites the worst paragraphs.** A LoRA fine-tune of Qwen2.5-1.5B-Instruct (4-bit, MLX). `factlock.py` swaps every name, number, link and quote target for a placeholder (`[[E_A]]`, `[[N_B]]`, `[[T_C]]`) before rewriting and restores them after. One shared gate, `enhance.accept()`, keeps a rewrite only if facts match as a multiset, names survive and none are invented, negations and quotes are unchanged, length stays within 75 to 130 percent, no sentence repeats, no placeholder residue or source-site chatter appears, no new 8-word run matches the training corpus, and the style score drops by at least 0.1.
6. **Suggests keywords (advisory).** Free Google India autocomplete phrases missing from the draft, logged to `data/keywords.jsonl`.
7. **Logs every round** to `data/runs.jsonl`.

Exit code 0 means pass (no blocking requests and at most 2 stock words left). Exit code 2 means revise.

## Training data

| Source | Use | Note |
|---|---|---|
| Pre-November-2022 articles from sneakerfiles, justfreshkicks, nicekicks, sneakernews, sneakerhistory, doctorsofrunning (WordPress REST API) | Human side of every pair | Copyrighted. Kept local in `data/` (git-ignored) and used only to train an internal model. The 8-gram guard blocks verbatim reuse. |
| Local Qwen rewrites of those paragraphs, facts locked (`pairs.jsonl`) | AI side | Generated on this Mac |
| SNKRS CART blog-voice rewrites by Claude agents, facts locked (`pairs_claude.jsonl`) | AI side, matches production drafts | Imported with `import_claude_pairs.py` |
| Our most human-sounding blog paragraphs (`pairs_ours.jsonl`) | Rewrite targets in our voice | Ours |
| Published posts that went through the loop (`runs.jsonl` + MongoDB) | Flywheel pairs, weight 1 | Only once published, paragraphs aligned with difflib, accepted model rewrites excluded |

`train_data.py` drops dirty pairs (placeholder residue, leaked instructions), removes target sentences whose facts or names are not in the input or that carry source chatter, strips sentences with unlocked facts, keeps targets at 70 to 140 percent of input length, and assigns train, valid and test splits by a hash of the article so they never shift between retrains.

## Commands

Plain scripts you can run without Claude live in `commands/` (see `commands/README.md`): status, check a draft or an existing post, keywords, export, Search Console pull, and guarded training, promotion and stop.

Underlying runner:

```bash
./train.sh all              # first time: collect, generate pairs, train scorer, train rewriter, gated promotion
./train.sh retrain          # re-export our content, retrain scorer, train a candidate rewriter, promote only if better
./train.sh retrain-if-due   # same, only when 30+ new published flywheel pairs exist (MIN_NEW=30)
./train.sh scorer           # scorer only
./train.sh promote          # re-run the side-by-side promotion test on models/rewriter-lora-candidate
./train.sh gsc              # pull Search Console data and rebuild the refresh queue
./train.sh evaluate         # base vs live rewriter on the frozen evaluation set

cd src && ../.venv/bin/python -W ignore enhance.py ../data/drafts/<slug>.json
cd src && ../.venv/bin/python -W ignore keywords.py adidas samba
```

## How a new rewriter goes live

1. MLX trains a candidate adapter into `models/rewriter-lora-candidate`, saving a checkpoint every 100 steps.
2. `promote.py pick` keeps the checkpoint with the lowest validation loss.
3. `promote.py promote` evaluates base, live and candidate in one run, with the same scorer and seed, on `models/eval_ours.jsonl`: 100 of our own blog paragraphs that no model trained on, frozen on first use.
4. The candidate goes live only if it gets at least 5 more paragraphs through the acceptance gate than the live model, with no drop in facts or names preserved and no rise in copying. The previous adapter is kept in `models/rewriter-lora-prev`, and every decision is saved as `models/promotion_*_decision.json`.

`scripts/auto-content.sh` calls `train.sh retrain-if-due` under `caffeinate` at the end of every unattended run.

## Google Search Console data

`src/gsc.py` pulls our real Google search data for India (free Search Console API, read-only service account). One-time setup is in `GSC_SETUP.md`. The key lives in `secrets/gsc.json` (git-ignored); `GSC_KEY_FILE` and `GSC_SITE` (default `sc-domain:snkrscart.com`) override it.

Each pull covers the last 28 complete days (ending 3 days ago, since Search Console data lags) and writes:

| File | Contents |
|---|---|
| `data/gsc.jsonl` | One line per page and query, appended on every pull: pull date, date range, clicks, impressions, CTR, average position |
| `data/gsc_pages.json` | Per page totals, Discover clicks and impressions when there are any, and the top 10 queries by impressions. Each page is mapped to `kind` (`blog`, `drop`, `profile`, `product` or `other`) and `slug` from its URL (`/blogs/<slug>`, `/drops/<slug>`, `/sneakers/<slug>`, `/products/<slug>`) |
| `data/refresh_queue.json` | Pages ranking at average position 8 to 20 with at least 50 impressions, most impressions first, each with its top queries. These are on page one or two and are the best candidates for a refresh |

```bash
cd src
../.venv/bin/python gsc.py pull                    # fetch from Google and rebuild all three files
../.venv/bin/python gsc.py queue                   # rebuild and print the refresh queue from saved data
../.venv/bin/python gsc.py queries <slug> [kind]   # top real queries for one page
```

From Python, `gsc.queries_for(slug, kind='blog', limit=10)` returns the top queries for a page as a list of strings, or an empty list when there is no data. A missing or rejected key prints one line and exits with code 3.

`scripts/auto-content.sh` runs `commands/gsc-pull.sh` on every scheduled run when `secrets/gsc.json` exists, so the data and refresh queue stay current without anyone running it.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install mlx mlx-lm scikit-learn lightgbm numpy
./train.sh all
```
