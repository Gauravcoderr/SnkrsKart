import json
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

from textutil import html_to_paragraphs

SITES = ["sneakerfiles.com", "justfreshkicks.com", "nicekicks.com", "sneakernews.com",
         "sneakerhistory.com", "doctorsofrunning.com"]
BEFORE = "2022-11-01T00:00:00"
OUT = Path(__file__).resolve().parent.parent / "data" / "human.jsonl"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
SKIP_WORDS = ("restock alert", "deal alert", "on sale", "giveaway", "% off", "coupon")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode("utf-8"))


def main(per_site: int, only=None):
    seen = set()
    if OUT.exists():
        for line in OUT.open():
            seen.add(json.loads(line)["url"])
    out = OUT.open("a")
    for site in (only or SITES):
        got, page, fails = 0, 1, 0
        while got < per_site and fails < 3:
            url = (f"https://{site}/wp-json/wp/v2/posts?per_page=50&page={page}&before={BEFORE}"
                   f"&_fields=link,date,title,content")
            try:
                posts = fetch(url)
            except urllib.error.HTTPError as e:
                print(f"{site} page {page}: HTTP {e.code}", file=sys.stderr)
                break
            except Exception as e:
                print(f"{site} page {page}: {e}", file=sys.stderr)
                fails += 1
                time.sleep(5)
                page += 1
                continue
            fails = 0
            if not posts:
                break
            for p in posts:
                link = p.get("link")
                if not link or link in seen or (p.get("date") or "9") >= BEFORE:
                    continue
                title = (p.get("title") or {}).get("rendered", "")
                if any(w in title.lower() for w in SKIP_WORDS):
                    continue
                paras = html_to_paragraphs((p.get("content") or {}).get("rendered", ""))
                words = sum(len(x.split()) for x in paras)
                if words < 120:
                    continue
                out.write(json.dumps({"source": site, "url": link, "date": p.get("date"),
                                      "title": title, "paragraphs": paras, "words": words}) + "\n")
                seen.add(link)
                got += 1
            out.flush()
            print(f"{site}: {got} (page {page})", file=sys.stderr)
            page += 1
            time.sleep(1.5)
    out.close()


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 400, sys.argv[2:] or None)
