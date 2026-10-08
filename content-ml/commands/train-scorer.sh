#!/bin/zsh
set -euo pipefail
source "${0:A:h}/_lib.sh"
need_venv
busy_check
cd "$ML"
./train.sh scorer
