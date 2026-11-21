#!/bin/zsh
set -euo pipefail
source "${0:A:h}/_lib.sh"
need_venv
cd "$ML/src"
"$PY" -W ignore trending.py "$@"
