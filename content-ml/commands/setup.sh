#!/bin/zsh
set -euo pipefail
source "${0:A:h}/_lib.sh"
cd "$ML"
[[ -x "$PY" ]] || python3 -m venv .venv
"$PY" -m pip install -q --upgrade pip
"$PY" -m pip install -q mlx mlx-lm scikit-learn lightgbm numpy google-auth
mkdir -p data/drafts models secrets
echo "Setup done. Next: commands/export-content.sh, then commands/status.sh"
