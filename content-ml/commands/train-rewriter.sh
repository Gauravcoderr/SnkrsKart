#!/bin/zsh
set -euo pipefail
source "${0:A:h}/_lib.sh"
need_venv
need_power
busy_check
cd "$ML"
echo "Training a candidate rewriter (${ITERS:-600} steps), then the promotion test. Takes 40 to 90 minutes. Logs: data/lora.log"
ITERS="${ITERS:-600}" /usr/bin/caffeinate -i ./train.sh rewriter
