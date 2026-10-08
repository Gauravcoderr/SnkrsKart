#!/bin/zsh
set -euo pipefail
source "${0:A:h}/_lib.sh"
cd "$REPO/backend"
npx ts-node --transpile-only src/scripts/exportContentCorpus.ts
