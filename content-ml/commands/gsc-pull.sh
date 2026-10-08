#!/bin/zsh
set -uo pipefail
source "${0:A:h}/_lib.sh"
need_venv
cd "$ML/src"
"$PY" -W ignore gsc.py pull || exit $?
"$PY" -W ignore gsc.py queue || exit $?
echo "Pages to refresh: $ML/data/refresh_queue.json"
