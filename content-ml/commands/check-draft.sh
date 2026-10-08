#!/bin/zsh
set -uo pipefail
source "${0:A:h}/_lib.sh"
need_venv
if [[ $# -lt 1 ]]; then
  echo "Usage: commands/check-draft.sh <draft.json> [--no-rewrite] [--no-keywords]"
  echo "Draft JSON: {\"kind\": \"blog|drop|profile\", \"slug\": \"...\", \"title\": \"...\", \"html\" or \"text\": \"...\", \"keyword\": \"...\", \"sources\": [\"https://...\"], \"round\": 1}"
  exit 1
fi
draft="${1:A}"; shift
cd "$ML/src"
"$PY" -W ignore enhance.py "$draft" "$@"
rc=$?
echo
[[ $rc -eq 0 ]] && echo "Verdict: PASS" || echo "Verdict: REVISE (see ${draft:r}.report.json, fixed copy in ${draft:r}.enhanced.json)"
exit $rc
