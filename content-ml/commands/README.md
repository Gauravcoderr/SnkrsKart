# content-ml commands

Run these yourself from Terminal when Claude is not available. Every command works from any folder.

```bash
cd ~/snkrs-cart/content-ml
commands/status.sh
```

## Everyday

| Command | What it does | Time |
|---|---|---|
| `commands/status.sh` | Shows the scorer and rewriter versions, the last promotion result, data counts, the Search Console refresh queue, battery and running jobs | seconds |
| `commands/check-draft.sh <draft.json>` | Runs the enhancer on a draft: facts, duplicates, style, keywords, safe fixes. Prints PASS or REVISE and saves `<draft>.report.json` and `<draft>.enhanced.json` | under a minute |
| `commands/check-post.sh <slug>` | Same check on a post that is already in MongoDB (blog, drop or sneaker profile). Not logged as training data | under a minute |
| `commands/keywords.sh <phrase>` | Real Google India search suggestions for a phrase, e.g. `commands/keywords.sh adidas samba` | seconds |
| `commands/export-content.sh` | Re-exports blogs, drops, profiles and the fact catalog from MongoDB. Run it before `check-post.sh` if a post is new | under a minute |
| `commands/refresh-blog.sh show|backup|apply ...` | Shows, backs up or updates live blog posts. `apply <updates.json>` always backs up first to `data/backups/` and pings IndexNow | seconds |
| `commands/gsc-pull.sh` | Pulls Search Console data and builds the list of pages worth refreshing. First time: follow `GSC_SETUP.md` | a minute |

Add `--no-rewrite` to `check-draft.sh` or `check-post.sh` to skip the local rewriter (much faster), and `--no-keywords` to skip the Google suggestions.

A draft file looks like this:

```json
{"kind": "blog", "slug": "my-post", "title": "My post", "html": "<p>...</p>", "keyword": "nike dunk low price in india", "sources": ["https://..."], "round": 1}
```

Drops and profiles use `"text"` instead of `"html"`.

## Training (needs the Mac's own 30W or stronger charger)

These refuse to start on battery or on a weak charger, because the Mac shut down twice during training. Add `FORCE=1` in front to override.

| Command | What it does | Time |
|---|---|---|
| `commands/train-rewriter.sh` | Trains a new rewriter, picks its best checkpoint, then runs the promotion test. It only goes live if it beats the current one | 40 to 90 minutes |
| `commands/promote.sh` | Re-runs only the promotion test on the waiting candidate | 20 to 40 minutes |
| `commands/train-scorer.sh` | Retrains the style scorer | 2 minutes |
| `commands/retrain.sh` | Everything: export content, retrain scorer, train and test a new rewriter | 1 to 2 hours |
| `commands/make-pairs.sh <total>` | Generates more local training pairs until the file has that many lines, e.g. `commands/make-pairs.sh 1600`. Safe to stop and resume | 4 to 10 seconds per pair |

`ITERS=800 commands/train-rewriter.sh` changes the number of training steps (default 600).

## Control

| Command | What it does |
|---|---|
| `commands/stop.sh` | Stops any running training, evaluation or pair generation. The live model and saved data are untouched |
| `commands/setup.sh` | Creates the Python environment and installs the libraries (first time, or after deleting `.venv`) |
| `commands/run-auto-content.sh` | Runs the unattended content pipeline once. Needs the Claude CLI logged in and no uncommitted files |

Exit codes: 0 means success or PASS, 2 means REVISE or not enough power, 3 means another job is already running or Search Console setup is missing.

## growth.sh

`commands/growth.sh` pulls 16 months of Search Console history (daily, device, country, query and page windows, image search), the Merchant Center account state (products accepted, item issues, account issues, best-seller brands and product clusters for India, non-product performance) and the live product feed, then runs `src/growth.py`. Output is `data/growth/growth_report.json`: trend and spike days, the site's own CTR by position curve (isotonic regression), missed clicks per page and per page-query pair (CTR gap and rank lift), query clusters (TF-IDF + KMeans), rising and falling queries and pages, cannibalised queries, anchor-fragment URL leaks, commercial queries that rank with no shop page, product pages never seen, Merchant demand coverage and a ranked `actions` list. `--no-pull` reruns the analysis on saved data. The Merchant pull needs `secrets/merchant_token.json` (owner OAuth refresh token) and `secrets/merchant_oauth_client.json`.
