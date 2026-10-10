import json
import sys
import urllib.parse
from datetime import date, timedelta
from pathlib import Path

import gsc

OUT = gsc.DATA / "growth"


def _rows(token, body):
    return gsc._fetch_all(token, gsc.SITE, body)


def _keyed(rows, dims):
    out = []
    for r in rows:
        d = dict(zip(dims, r["keys"]))
        d.update(gsc._metrics(r))
        out.append(d)
    return out


def pull(days_history=480):
    token = gsc._token(gsc.KEY_FILE)
    end = date.today() - timedelta(days=gsc.LAG_DAYS)
    start28 = end - timedelta(days=27)
    prev_start = start28 - timedelta(days=28)
    prev_end = start28 - timedelta(days=1)
    start90 = end - timedelta(days=89)
    hist_start = end - timedelta(days=days_history - 1)
    india = {"dimensionFilterGroups": gsc._country_filter()}
    pulls = {
        "daily_16m": ({"startDate": hist_start.isoformat(), "endDate": end.isoformat(), "type": "web",
                       "dimensions": ["date"], **india}, ["date"]),
        "daily_all_countries": ({"startDate": hist_start.isoformat(), "endDate": end.isoformat(), "type": "web",
                                 "dimensions": ["date"]}, ["date"]),
        "daily_device_90": ({"startDate": start90.isoformat(), "endDate": end.isoformat(), "type": "web",
                             "dimensions": ["date", "device"], **india}, ["date", "device"]),
        "query_28": ({"startDate": start28.isoformat(), "endDate": end.isoformat(), "type": "web",
                      "dimensions": ["query"], **india}, ["query"]),
        "query_prev28": ({"startDate": prev_start.isoformat(), "endDate": prev_end.isoformat(), "type": "web",
                          "dimensions": ["query"], **india}, ["query"]),
        "query_90": ({"startDate": start90.isoformat(), "endDate": end.isoformat(), "type": "web",
                      "dimensions": ["query"], **india}, ["query"]),
        "page_28": ({"startDate": start28.isoformat(), "endDate": end.isoformat(), "type": "web",
                     "dimensions": ["page"], **india}, ["page"]),
        "page_prev28": ({"startDate": prev_start.isoformat(), "endDate": prev_end.isoformat(), "type": "web",
                         "dimensions": ["page"], **india}, ["page"]),
        "page_query_90": ({"startDate": start90.isoformat(), "endDate": end.isoformat(), "type": "web",
                           "dimensions": ["page", "query"], **india}, ["page", "query"]),
        "page_date_90": ({"startDate": start90.isoformat(), "endDate": end.isoformat(), "type": "web",
                          "dimensions": ["page", "date"], **india}, ["page", "date"]),
        "query_device_28": ({"startDate": start28.isoformat(), "endDate": end.isoformat(), "type": "web",
                             "dimensions": ["query", "device"], **india}, ["query", "device"]),
        "country_28": ({"startDate": start28.isoformat(), "endDate": end.isoformat(), "type": "web",
                        "dimensions": ["country"]}, ["country"]),
        "appearance_28": ({"startDate": start28.isoformat(), "endDate": end.isoformat(), "type": "web",
                           "dimensions": ["searchAppearance"], **india}, ["searchAppearance"]),
        "image_query_28": ({"startDate": start28.isoformat(), "endDate": end.isoformat(), "type": "image",
                            "dimensions": ["query"], **india}, ["query"]),
        "discover_page_90": ({"startDate": start90.isoformat(), "endDate": end.isoformat(), "type": "discover",
                              "dimensions": ["page"]}, ["page"]),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {"pulled": date.today().isoformat(), "end": end.isoformat(), "start28": start28.isoformat(),
            "prev28": [prev_start.isoformat(), prev_end.isoformat()], "start90": start90.isoformat(),
            "hist_start": hist_start.isoformat(), "site": gsc.SITE}
    for name, (body, dims) in pulls.items():
        try:
            rows = _keyed(_rows(token, body), dims)
            if "page" in dims:
                for r in rows:
                    r["page"] = gsc.canonical_url(r["page"])
        except gsc.GscError as e:
            print(f"{name}: skipped ({e})", file=sys.stderr)
            rows = []
        (OUT / f"gsc_{name}.json").write_text(json.dumps({**meta, "rows": rows}, ensure_ascii=False), encoding="utf-8")
        print(f"{name}: {len(rows)} rows")
    (OUT / "gsc_meta.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    return meta


if __name__ == "__main__":
    try:
        pull()
    except gsc.GscError as e:
        print(str(e), file=sys.stderr)
        sys.exit(e.code)
