#!/bin/zsh
set -uo pipefail
source "${0:A:h}/_lib.sh"
need_venv
if [[ $# -lt 1 ]]; then
  echo "Usage: commands/check-post.sh <slug> [--no-rewrite] [--no-keywords]"
  echo "Checks an existing blog, drop or sneaker profile from data/ours.jsonl (refresh it with commands/export-content.sh)."
  exit 1
fi
slug="$1"; shift
mkdir -p "$ML/data/drafts"
out="$ML/data/drafts/check-$slug.json"
"$PY" - "$slug" "$out" <<'PY' || exit 1
import json, sys
slug, out = sys.argv[1], sys.argv[2]
for line in open(sys.argv[2].rsplit("/data/", 1)[0] + "/data/ours.jsonl"):
    d = json.loads(line)
    if d["slug"] == slug:
        draft = {"kind": d["kind"], "slug": slug, "title": d.get("title", ""), "round": 1}
        draft["html" if d.get("html") else "text"] = d.get("html") or d.get("text", "")
        json.dump(draft, open(out, "w"), ensure_ascii=False)
        sys.exit(0)
print(f"No post with slug '{slug}' in data/ours.jsonl. Run commands/export-content.sh first.")
sys.exit(1)
PY
exec "${0:A:h}/check-draft.sh" "$out" --no-log "$@"
