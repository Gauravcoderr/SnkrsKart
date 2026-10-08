#!/bin/zsh
set -euo pipefail
source "${0:A:h}/_lib.sh"
mode="${1:-}"
if [[ "$mode" != "show" && "$mode" != "backup" && "$mode" != "apply" ]]; then
  echo "Usage:"
  echo "  commands/refresh-blog.sh show <slug...>      print title, meta, headings of live posts"
  echo "  commands/refresh-blog.sh backup <slug...>    save the live posts to content-ml/data/backups/"
  echo "  commands/refresh-blog.sh apply <updates.json> back up, update the posts in MongoDB, ping IndexNow"
  echo "updates.json is a list of {\"slug\", and any of \"title\", \"excerpt\", \"content\", \"metaTitle\", \"metaDescription\", \"metaKeywords\", \"tags\"}."
  exit 1
fi
shift
[[ "$mode" == "apply" && -n "${1:-}" ]] && set -- "${1:A}"
cd "$REPO/backend"
npx ts-node --transpile-only src/scripts/refreshBlogs.ts "$mode" "$@"
