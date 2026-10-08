import http.client
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import warnings
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
DATA = Path(os.environ.get("GSC_DATA_DIR") or ROOT / "data")
KEY_FILE = Path(os.environ.get("GSC_KEY_FILE") or ROOT / "secrets" / "gsc.json")
SITE = os.environ.get("GSC_SITE") or "sc-domain:snkrscart.com"
COUNTRY = "ind"
SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
CANONICAL_HOST = "www.snkrscart.com"
API = "https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query"
ROW_LIMIT = 25000
WINDOW_DAYS = 28
LAG_DAYS = 3
TOP_QUERIES = 10
QUEUE_MIN_POS = 8.0
QUEUE_MAX_POS = 20.0
QUEUE_MIN_IMPRESSIONS = 50

KINDS = {"blogs": "blog", "drops": "drop", "sneakers": "profile", "products": "product"}
PATH_RE = re.compile(r"^/(blogs|drops|sneakers|products)/([^/]+)$")


class GscError(Exception):
    def __init__(self, message: str, code: int = 4):
        super().__init__(message)
        self.code = code


def page_ref(url: str) -> Dict[str, str]:
    path = urllib.parse.urlparse(url).path or "/"
    path = urllib.parse.unquote(path).rstrip("/") or "/"
    m = PATH_RE.match(path)
    if not m:
        return {"kind": "other", "slug": path}
    return {"kind": KINDS[m.group(1)], "slug": m.group(2).lower()}


def canonical_url(url: str) -> str:
    p = urllib.parse.urlsplit(url)
    scheme, host = p.scheme, p.netloc.lower()
    if host in ("snkrscart.com", CANONICAL_HOST):
        scheme, host = "https", CANONICAL_HOST
    return urllib.parse.urlunsplit((scheme, host, p.path.rstrip("/") or "/", "", ""))


def _merge(pairs: Iterable[Tuple[object, dict]]) -> Dict[object, dict]:
    grouped: Dict[object, List[dict]] = {}
    for key, m in pairs:
        grouped.setdefault(key, []).append(m)
    return {k: _agg(v) for k, v in grouped.items()}


def date_window(today: Optional[date] = None):
    today = today or date.today()
    end = today - timedelta(days=LAG_DAYS)
    start = end - timedelta(days=WINDOW_DAYS - 1)
    return start.isoformat(), end.isoformat()


class _UrllibResponse:
    def __init__(self, status: int, headers, data: bytes):
        self.status = status
        self.headers = dict(headers or {})
        self.data = data


class _UrllibRequest:
    def __call__(self, url, method="GET", body=None, headers=None, timeout=None, **kwargs):
        if isinstance(body, str):
            body = body.encode("utf-8")
        req = urllib.request.Request(url, data=body, method=method, headers=headers or {})
        try:
            with urllib.request.urlopen(req, timeout=timeout or 60) as r:
                return _UrllibResponse(r.status, r.headers, r.read())
        except urllib.error.HTTPError as e:
            return _UrllibResponse(e.code, e.headers, e.read())
        except urllib.error.URLError as e:
            from google.auth import exceptions
            raise exceptions.TransportError(str(e.reason)) from e
        except (OSError, http.client.HTTPException) as e:
            from google.auth import exceptions
            raise exceptions.TransportError(str(e)) from e


def _token(key_file: Path) -> str:
    if not key_file.is_file():
        raise GscError(f"GSC key file not found at {key_file}. See content-ml/GSC_SETUP.md.", 3)
    warnings.filterwarnings("ignore", category=FutureWarning)
    try:
        from google.oauth2 import service_account
        from google.auth import exceptions
    except ImportError:
        raise GscError("google-auth is not installed. Run: .venv/bin/pip install google-auth", 3)
    try:
        creds = service_account.Credentials.from_service_account_file(str(key_file), scopes=[SCOPE])
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as e:
        raise GscError(f"GSC key file at {key_file} is not a valid service account key ({e}).", 3)
    try:
        creds.refresh(_UrllibRequest())
    except exceptions.TransportError as e:
        raise GscError(f"Network error getting a Google token: {e}", 4)
    except exceptions.GoogleAuthError as e:
        reason = str(e.args[0] if e.args else e).splitlines()[0]
        raise GscError(f"Google rejected the service account key: {reason}", 3)
    return creds.token


def _query(token: str, site: str, body: dict) -> List[dict]:
    url = API.format(site=urllib.parse.quote(site, safe=""))
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read().decode("utf-8")).get("rows", [])
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = json.loads(e.read().decode("utf-8")).get("error", {}).get("message", "")
        except Exception:
            pass
        if e.code == 403:
            if "has not been used" in detail.lower() or "disabled" in detail.lower():
                raise GscError("The Search Console API is not enabled in the Google Cloud project that owns this key. "
                               f"See step 2 of content-ml/GSC_SETUP.md. {detail}".strip(), 3)
            raise GscError(f"No access to {site}. Add the service account email as a user in Search Console. {detail}".strip(), 3)
        raise GscError(f"Search Console API error {e.code}: {detail or e.reason}")
    except urllib.error.URLError as e:
        raise GscError(f"Network error talking to Search Console: {e.reason}")
    except (OSError, http.client.HTTPException, ValueError) as e:
        raise GscError(f"Network error talking to Search Console: {e}")


def _fetch_all(token: str, site: str, body: dict) -> List[dict]:
    rows: List[dict] = []
    start = 0
    while True:
        page = _query(token, site, {**body, "rowLimit": ROW_LIMIT, "startRow": start})
        rows.extend(page)
        if len(page) < ROW_LIMIT:
            return rows
        start += ROW_LIMIT


def _country_filter():
    return [{"filters": [{"dimension": "country", "operator": "equals", "expression": COUNTRY}]}]


def _metrics(r: dict) -> dict:
    return {
        "clicks": int(r.get("clicks", 0)),
        "impressions": int(r.get("impressions", 0)),
        "ctr": round(float(r.get("ctr", 0.0)), 4),
        "position": round(float(r.get("position", 0.0)), 2),
    }


def _agg(items: Iterable[dict]) -> dict:
    clicks = impressions = 0
    weighted = 0.0
    for it in items:
        clicks += it["clicks"]
        impressions += it["impressions"]
        weighted += it["position"] * it["impressions"]
    return {
        "clicks": clicks,
        "impressions": impressions,
        "ctr": round(clicks / impressions, 4) if impressions else 0.0,
        "position": round(weighted / impressions, 2) if impressions else 0.0,
    }


def build_pages(rows: List[dict], meta: dict, totals: Optional[Dict[str, dict]] = None,
                discover: Optional[Dict[str, dict]] = None) -> dict:
    by_page: Dict[str, List[dict]] = {}
    for r in rows:
        by_page.setdefault(r["page"], []).append(r)
    urls = set(by_page) | set(totals or {}) | set(discover or {})
    pages = []
    for url in urls:
        qs = by_page.get(url, [])
        top = sorted(qs, key=lambda q: (-q["impressions"], -q["clicks"], q["query"]))[:TOP_QUERIES]
        entry = {
            "page": url,
            **page_ref(url),
            **((totals or {}).get(url) or _agg(qs)),
            "queries": [{"query": q["query"], **{k: q[k] for k in ("clicks", "impressions", "ctr", "position")}} for q in top],
        }
        if discover and url in discover:
            entry["discover"] = discover[url]
        pages.append(entry)
    pages.sort(key=lambda p: (-p["impressions"], p["page"]))
    return {**meta, "pages": pages}


def build_queue(pages_doc: dict) -> dict:
    queue = [
        {k: p[k] for k in ("page", "kind", "slug", "clicks", "impressions", "ctr", "position", "queries")}
        for p in pages_doc.get("pages", [])
        if QUEUE_MIN_POS <= p["position"] <= QUEUE_MAX_POS and p["impressions"] >= QUEUE_MIN_IMPRESSIONS
    ]
    queue.sort(key=lambda p: (-p["impressions"], p["page"]))
    meta = {k: pages_doc[k] for k in ("pulled", "start", "end", "site") if k in pages_doc}
    return {**meta, "rule": {"position": [QUEUE_MIN_POS, QUEUE_MAX_POS], "minImpressions": QUEUE_MIN_IMPRESSIONS}, "pages": queue}


def latest_rows(jsonl: Path) -> Tuple[List[dict], dict]:
    if not jsonl.is_file():
        return [], {}
    lines = []
    with jsonl.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    lines.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    if not lines:
        return [], {}
    pulled = max(l.get("pulled", "") for l in lines)
    dedup: Dict[tuple, dict] = {}
    for l in lines:
        if l.get("pulled", "") == pulled:
            dedup[(l["page"], l["query"])] = l
    last = list(dedup.values())[-1] if dedup else {}
    merged = _merge(((canonical_url(l["page"]), l["query"]), l) for l in dedup.values())
    rows = [{"page": page, "query": query, **m} for (page, query), m in merged.items()]
    meta = {"pulled": pulled, "start": last.get("start"), "end": last.get("end"), "site": last.get("site", SITE)}
    return rows, meta


def _write_json(path: Path, doc: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(path)


def write_outputs(pages_doc: dict, data_dir: Path = DATA) -> dict:
    queue = build_queue(pages_doc)
    _write_json(data_dir / "gsc_pages.json", pages_doc)
    _write_json(data_dir / "refresh_queue.json", queue)
    return queue


def pull(data_dir: Path = DATA, key_file: Path = KEY_FILE, site: str = SITE) -> dict:
    token = _token(key_file)
    start, end = date_window()
    pulled = date.today().isoformat()
    base = {"startDate": start, "endDate": end, "dimensionFilterGroups": _country_filter()}

    raw = _fetch_all(token, site, {**base, "type": "web", "dimensions": ["page", "query"]})
    merged = _merge(((canonical_url(r["keys"][0]), r["keys"][1]), _metrics(r)) for r in raw)
    rows = [{"pulled": pulled, "start": start, "end": end, "site": site,
             "page": page, "query": query, **m} for (page, query), m in merged.items()]

    totals = _merge((canonical_url(r["keys"][0]), _metrics(r))
                    for r in _fetch_all(token, site, {**base, "type": "web", "dimensions": ["page"]}))

    discover: Dict[str, dict] = {}
    discover_note = ""
    try:
        discover = _merge((canonical_url(r["keys"][0]), _metrics(r))
                          for r in _fetch_all(token, site, {**base, "type": "discover", "dimensions": ["page"]}))
    except GscError as e:
        discover_note = f" (discover skipped: {e})"

    data_dir.mkdir(parents=True, exist_ok=True)
    with (data_dir / "gsc.jsonl").open("a", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    meta = {"pulled": pulled, "start": start, "end": end, "site": site}
    pages_doc = build_pages(rows, meta, totals, discover)
    queue = write_outputs(pages_doc, data_dir)
    print(f"{start} to {end}: {len(rows)} page+query rows, {len(pages_doc['pages'])} pages, "
          f"{len(discover)} discover pages, {len(queue['pages'])} in refresh queue{discover_note}")
    return pages_doc


def rebuild_queue(data_dir: Path = DATA) -> dict:
    pages_path = data_dir / "gsc_pages.json"
    if pages_path.is_file():
        pages_doc = json.loads(pages_path.read_text(encoding="utf-8"))
    else:
        rows, meta = latest_rows(data_dir / "gsc.jsonl")
        if not rows:
            raise GscError("No GSC data yet. Run: python gsc.py pull", 3)
        pages_doc = build_pages(rows, meta)
    return write_outputs(pages_doc, data_dir)


_cache: Dict[str, tuple] = {}


def _load_pages(data_dir: Path) -> dict:
    path = data_dir / "gsc_pages.json"
    try:
        mtime = path.stat().st_mtime
    except OSError:
        return {}
    hit = _cache.get(str(path))
    if hit and hit[0] == mtime:
        return hit[1]
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    _cache[str(path)] = (mtime, doc)
    return doc


def queries_for(slug: str, kind: Optional[str] = "blog", limit: int = 10,
                data_dir: Optional[Path] = None) -> List[str]:
    slug = (slug or "").strip().lower()
    if not slug:
        return []
    doc = _load_pages(Path(data_dir) if data_dir else DATA)
    best: Dict[str, int] = {}
    for p in doc.get("pages", []):
        if p.get("slug") != slug or (kind and p.get("kind") != kind):
            continue
        for q in p.get("queries", []):
            best[q["query"]] = best.get(q["query"], 0) + int(q.get("impressions", 0))
    ranked = sorted(best.items(), key=lambda kv: (-kv[1], kv[0]))
    return [q for q, _ in ranked[:max(0, limit)]]


def main(argv: List[str]) -> int:
    cmd = argv[0] if argv else ""
    try:
        if cmd == "pull":
            pull()
        elif cmd == "queue":
            queue = rebuild_queue()
            for p in queue["pages"]:
                print(f"{p['impressions']:>7} imp  pos {p['position']:>5}  {p['kind']:<7} {p['slug']}")
            print(f"{len(queue['pages'])} pages in data/refresh_queue.json")
        elif cmd == "queries" and len(argv) >= 2:
            kind = argv[2] if len(argv) >= 3 else None
            for q in queries_for(argv[1], kind=kind, limit=TOP_QUERIES):
                print(q)
        else:
            print("usage: python gsc.py pull | queue | queries <slug> [blog|drop|profile|product]", file=sys.stderr)
            return 1
    except GscError as e:
        print(str(e), file=sys.stderr)
        return e.code
    except KeyboardInterrupt:
        return 130
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
