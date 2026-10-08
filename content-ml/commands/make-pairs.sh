#!/bin/zsh
set -euo pipefail
source "${0:A:h}/_lib.sh"
need_venv
need_power
busy_check
total="${1:-}"
if [[ -z "$total" ]]; then echo "Usage: commands/make-pairs.sh <target total pairs>   e.g. commands/make-pairs.sh 1600"; exit 1; fi
cd "$ML/src"
echo "Generating local training pairs until data/pairs.jsonl has $total lines. About 4 to 10 seconds each. Safe to stop and resume."
/usr/bin/caffeinate -i "$PY" -W ignore gen_ai_pairs.py "$total"
