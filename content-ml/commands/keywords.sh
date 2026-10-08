#!/bin/zsh
set -euo pipefail
source "${0:A:h}/_lib.sh"
need_venv
if [[ $# -lt 1 ]]; then echo "Usage: commands/keywords.sh <search phrase>   e.g. commands/keywords.sh adidas samba"; exit 1; fi
cd "$ML/src"
"$PY" -W ignore keywords.py "$@"
