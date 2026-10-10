#!/usr/bin/env bash
# Pull Search Console history and Merchant Center data, then run the growth analysis.
# Usage: commands/growth.sh [--no-pull]
set -euo pipefail
cd "$(dirname "$0")/.."
PY=.venv/bin/python
if [[ "${1:-}" != "--no-pull" ]]; then
  (cd src && ../$PY -W ignore gsc_history.py)
  (cd src && ../$PY -W ignore merchant.py) || echo "merchant pull failed; analysis uses the last saved data" >&2
  curl -sS -m 120 -o data/growth/feed.xml.tmp https://www.snkrscart.com/google-merchant-feed.xml && mv data/growth/feed.xml.tmp data/growth/feed.xml || echo "feed fetch failed; using saved feed.xml" >&2
fi
(cd src && ../$PY -W ignore growth.py) | tail -3
echo "Full output: data/growth/growth_report.json (actions, opportunities, clusters, merchant)"
