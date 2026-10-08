#!/bin/zsh
set -euo pipefail
source "${0:A:h}/_lib.sh"
echo "Runs the unattended content pipeline once (needs the Claude CLI logged in and a clean git tree)."
exec "$REPO/scripts/auto-content.sh" "$@"
