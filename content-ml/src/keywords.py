import json
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter

MODIFIERS = ["", " price in india", " release date", " india", " vs", " size", " sizing", " review",
             " original", " where to buy", " how to", " resale", " colourway", " launch"]
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"


def suggest(q: str):
    url = ("https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=in&q="
           + urllib.parse.quote(q))
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode("utf-8", "ignore"))
            return data[1] if len(data) > 1 else []
    except Exception:
        return []


def mine(seed: str, pause=0.35):
    seed = seed.strip().lower()
    score = Counter()
    for m in MODIFIERS:
        for rank, s in enumerate(suggest(seed + m)):
            s = s.lower().strip()
            if s == seed:
                continue
            score[s] += 10 - min(rank, 9)
        time.sleep(pause)
    return [{"phrase": p, "score": s} for p, s in score.most_common(40)]


if __name__ == "__main__":
    print(json.dumps(mine(" ".join(sys.argv[1:]) or "air jordan 4"), indent=2))
