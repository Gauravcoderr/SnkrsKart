import json
import sys

from corpus import DATA, our_blog_chunks
from enhance import Scorer


def main(n: int):
    chunks = our_blog_chunks()
    scorer = Scorer()
    scores, _ = scorer.score([c["text"] for c in chunks])
    ranked = sorted(zip(scores, chunks), key=lambda x: x[0])
    per_slug = {}
    out = []
    for s, c in ranked:
        if per_slug.get(c["slug"], 0) >= 2:
            continue
        per_slug[c["slug"]] = per_slug.get(c["slug"], 0) + 1
        out.append({"source": "snkrscart", "url": "ours:" + c["slug"], "slug": c["slug"],
                    "human": c["text"], "score": round(float(s), 3)})
        if len(out) >= n:
            break
    with (DATA / "ours_humanlike.jsonl").open("w") as f:
        for r in out:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(json.dumps({"our_chunks": len(chunks), "selected": len(out),
                      "score_range": [out[0]["score"], out[-1]["score"]] if out else None,
                      "median_all": round(float(sorted(scores)[len(scores) // 2]), 3)}))


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 150)
