import json
import sys
from pathlib import Path

from corpus import DATA
from factlock import unlock

INPUTS = DATA / "claude_inputs.json"
OUT = DATA / "pairs_claude.jsonl"


def main(results_path):
    inputs = json.loads(INPUTS.read_text())
    raw = json.loads(Path(results_path).read_text())
    rewrites = raw.get("result", raw).get("rewrites", [])
    by_id = {r["id"]: r["text"] for r in rewrites}
    done = {json.loads(l)["human"][:200] for l in OUT.open()} if OUT.exists() else set()
    kept = rejected = 0
    with OUT.open("a") as f:
        for i, item in enumerate(inputs):
            text = by_id.get(i)
            if not text or item["human"][:200] in done:
                continue
            ai, info = unlock(text, item["mapping"], require_all=False)
            if ai is None or len(info["missing"]) > max(1, len(item["mapping"]) // 5):
                rejected += 1
                continue
            f.write(json.dumps({"source": item["source"], "url": item["url"], "human": item["human"], "ai": ai,
                                "locked": True, "origin": "claude", "missing": info["missing"]}, ensure_ascii=False) + "\n")
            kept += 1
    print(json.dumps({"returned": len(by_id), "kept": kept, "rejected": rejected}))


if __name__ == "__main__":
    main(sys.argv[1])
