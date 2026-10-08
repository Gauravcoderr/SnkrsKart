#!/bin/zsh
set -euo pipefail
source "${0:A:h}/_lib.sh"
need_venv
need_power
busy_check
cd "$ML"
if [[ ! -f models/rewriter-lora-candidate/adapters.safetensors ]]; then echo "No candidate to test. Train one with commands/train-rewriter.sh"; exit 1; fi
echo "Testing base vs live vs candidate on 100 of our paragraphs. Takes 20 to 40 minutes."
/usr/bin/caffeinate -i ./train.sh promote
