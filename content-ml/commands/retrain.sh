#!/bin/zsh
set -euo pipefail
source "${0:A:h}/_lib.sh"
need_venv
need_power
busy_check
cd "$ML"
echo "Full retrain: export content, retrain scorer, train and test a new rewriter. Takes 1 to 2 hours."
ITERS="${ITERS:-600}" /usr/bin/caffeinate -i ./train.sh retrain
