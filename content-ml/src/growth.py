import collections
import datetime as dt
import json
import math
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
G = DATA / "growth"
SITE = "https://www.snkrscart.com"
BRANDS = ["new balance", "air jordan", "jordan", "nike", "adidas", "puma", "asics", "crocs", "on cloud", "converse", "vans", "reebok", "coach", "salomon", "hoka"]
BUY_WORDS = {"buy", "price", "online", "store", "shop", "india", "sale", "discount", "cheap", "cost", "order", "offer", "deal", "resell", "resale"}
INFO_WORDS = {"vs", "review", "best", "how", "size", "sizing", "release", "date", "history", "guide", "what", "which", "why", "top", "comparison", "fake", "legit", "lineup", "festival", "fest"}
STOP = {"the", "a", "of", "in", "for", "and", "to", "at", "is", "on", "with"}


def load(name):
    p = G / f"{name}.json"
    if not p.is_file():
        return []
    return json.loads(p.read_text(encoding="utf-8")).get("rows", [])


def canon(url):
    p = urllib.parse.urlsplit(url)
    host = p.netloc.lower()
    if host in ("snkrscart.com", "www.snkrscart.com"):
        host = "www.snkrscart.com"
    return urllib.parse.urlunsplit(("https", host, urllib.parse.unquote(p.path).rstrip("/") or "/", "", ""))


def path_of(url):
    return canon(url).replace(SITE, "") or "/"


def kind_of(url):
    path = path_of(url)
    seg = path.split("/")[1] if path != "/" else "home"
    return {"blogs": "blog", "drops": "drop", "sneakers": "profile", "products": "product", "brands": "brand",
            "category": "category", "home": "home"}.get(seg, "other")


def agg(rows, key):
    out = {}
    for r in rows:
        k = key(r)
        a = out.setdefault(k, {"clicks": 0, "impressions": 0, "wpos": 0.0})
        a["clicks"] += r["clicks"]
        a["impressions"] += r["impressions"]
        a["wpos"] += r["position"] * r["impressions"]
    for a in out.values():
        a["ctr"] = a["clicks"] / a["impressions"] if a["impressions"] else 0.0
        a["position"] = a["wpos"] / a["impressions"] if a["impressions"] else 0.0
        del a["wpos"]
    return out


def tokens(q):
    return [t for t in re.findall(r"[a-z0-9]+", q.lower()) if t not in STOP]


def brand_of(text):
    t = " " + text.lower() + " "
    for b in BRANDS:
        if " " + b + " " in t or t.strip().startswith(b):
            return "jordan" if b == "air jordan" else b
    if "newbalance" in t or " nb " in t:
        return "new balance"
    return ""


def intent_of(q):
    ts = set(tokens(q))
    if ts & {"festival", "fest", "lineup", "event"}:
        return "event"
    if ts & INFO_WORDS:
        return "informational"
    if ts & BUY_WORDS:
        return "transactional"
    return "navigational"


def trend_section(out):
    daily = load("gsc_daily_16m")
    daily.sort(key=lambda r: r["date"])
    dates = [dt.date.fromisoformat(r["date"]) for r in daily]
    clicks = np.array([r["clicks"] for r in daily], float)
    impr = np.array([r["impressions"] for r in daily], float)
    allc = load("gsc_daily_all_countries")
    allc.sort(key=lambda r: r["date"])
    monthly = collections.OrderedDict()
    for r in daily:
        m = monthly.setdefault(r["date"][:7], {"clicks": 0, "impressions": 0, "days": 0})
        m["clicks"] += r["clicks"]
        m["impressions"] += r["impressions"]
        m["days"] += 1
    last90 = slice(max(0, len(daily) - 90), len(daily))
    x = np.arange(len(impr[last90]))
    li = np.log1p(impr[last90])
    lc = np.log1p(clicks[last90])
    si, ii = np.polyfit(x, li, 1)
    sc, ic = np.polyfit(x, lc, 1)
    k = 7
    ma_i = np.convolve(impr, np.ones(k) / k, mode="valid")
    ma_c = np.convolve(clicks, np.ones(k) / k, mode="valid")
    z = []
    for i in range(28, len(clicks)):
        base = clicks[i - 28:i]
        mu, sd = base.mean(), base.std() + 1e-9
        z.append((dates[i], (clicks[i] - mu) / sd, int(clicks[i]), int(impr[i])))
    spikes = [(d.isoformat(), round(zz, 1), c, im) for d, zz, c, im in z if zz > 2.5]
    wd = collections.defaultdict(lambda: [0, 0, 0])
    for d, c, im in zip(dates[-91:], clicks[-91:], impr[-91:]):
        wd[d.strftime("%a")][0] += c
        wd[d.strftime("%a")][1] += im
        wd[d.strftime("%a")][2] += 1
    weekday = {k: {"clicks_per_day": round(v[0] / v[2], 2), "impr_per_day": round(v[1] / v[2], 1)} for k, v in wd.items()}
    last28_c = clicks[-28:].sum()
    prev28_c = clicks[-56:-28].sum()
    last28_i = impr[-28:].sum()
    prev28_i = impr[-56:-28].sum()
    out["trend"] = {
        "first_day": dates[0].isoformat(), "last_day": dates[-1].isoformat(), "days": len(daily),
        "india_total_clicks": int(clicks.sum()), "india_total_impressions": int(impr.sum()),
        "all_countries_total_clicks": int(sum(r["clicks"] for r in allc)),
        "all_countries_total_impressions": int(sum(r["impressions"] for r in allc)),
        "monthly": monthly,
        "last28": {"clicks": int(last28_c), "impressions": int(last28_i)},
        "prev28": {"clicks": int(prev28_c), "impressions": int(prev28_i)},
        "wow_change_clicks_pct": round(100 * (last28_c - prev28_c) / max(prev28_c, 1), 1),
        "wow_change_impr_pct": round(100 * (last28_i - prev28_i) / max(prev28_i, 1), 1),
        "impr_growth_per_day_pct_90d": round(100 * (math.exp(si) - 1), 2),
        "clicks_growth_per_day_pct_90d": round(100 * (math.exp(sc) - 1), 2),
        "impr_7d_avg_now": round(float(ma_i[-1]), 1), "clicks_7d_avg_now": round(float(ma_c[-1]), 2),
        "impr_7d_avg_30d_ago": round(float(ma_i[-31]), 1) if len(ma_i) > 31 else None,
        "clicks_7d_avg_30d_ago": round(float(ma_c[-31]), 2) if len(ma_c) > 31 else None,
        "spike_days": spikes, "weekday": weekday,
        "projection_30d_clicks_at_trend": int(sum(np.expm1(ic + sc * (len(x) + i)) for i in range(30))),
        "projection_30d_clicks_flat": int(ma_c[-1] * 30),
    }


def content_titles():
    path = DATA / "ours.jsonl"
    if not path.is_file():
        return {}
    prefix = {"blog": "/blogs/", "drop": "/drops/", "profile": "/sneakers/"}
    titles = {}
    with path.open(encoding="utf-8") as f:
        for line in f:
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                continue
            if r.get("kind") in prefix and r.get("slug"):
                titles[prefix[r["kind"]] + r["slug"]] = (r.get("metaTitle") or r.get("title") or "")[:120]
    return titles


def ctr_curve(rows):
    from sklearn.isotonic import IsotonicRegression
    pos = np.array([r["position"] for r in rows], float)
    imp = np.array([r["impressions"] for r in rows], float)
    clk = np.array([r["clicks"] for r in rows], float)
    m = (pos <= 30) & (imp >= 3)
    ir = IsotonicRegression(increasing=False, y_min=0.0, out_of_bounds="clip")
    ir.fit(pos[m], clk[m] / imp[m], sample_weight=imp[m])
    grid = {p: float(ir.predict([p])[0]) for p in [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30]}
    return ir, grid


def opportunity_section(out):
    pq = load("gsc_page_query_90")
    for r in pq:
        r["page"] = canon(r["page"])
    merged = {}
    for r in pq:
        a = merged.setdefault((r["page"], r["query"]), {"page": r["page"], "query": r["query"], "clicks": 0, "impressions": 0, "wpos": 0.0})
        a["clicks"] += r["clicks"]
        a["impressions"] += r["impressions"]
        a["wpos"] += r["position"] * r["impressions"]
    rows = []
    for a in merged.values():
        a["position"] = a["wpos"] / a["impressions"]
        a["ctr"] = a["clicks"] / a["impressions"]
        del a["wpos"]
        rows.append(a)
    ir, grid = ctr_curve(rows)
    out["ctr_curve_90d"] = {str(k): round(v, 4) for k, v in grid.items()}
    scored = []
    for r in rows:
        exp_now = float(ir.predict([r["position"]])[0])
        target = max(1.0, min(r["position"], 3.0)) if r["position"] <= 20 else r["position"]
        exp_target = float(ir.predict([target])[0])
        ctr_fix = max(0.0, exp_now * r["impressions"] - r["clicks"])
        rank_lift = max(0.0, exp_target * r["impressions"] - max(r["clicks"], exp_now * r["impressions"]))
        scored.append({**r, "kind": kind_of(r["page"]), "path": path_of(r["page"]), "expected_ctr": round(exp_now, 4),
                       "ctr_gap_clicks_90d": round(ctr_fix, 1), "rank_lift_clicks_90d": round(rank_lift, 1),
                       "intent": intent_of(r["query"]), "brand": brand_of(r["query"])})
    scored.sort(key=lambda r: -(r["ctr_gap_clicks_90d"] + r["rank_lift_clicks_90d"]))
    out["opportunities_page_query_top"] = scored[:40]
    by_page = collections.defaultdict(lambda: {"impressions": 0, "clicks": 0, "ctr_gap": 0.0, "rank_lift": 0.0, "queries": 0, "wpos": 0.0})
    for r in scored:
        p = by_page[r["path"]]
        p["impressions"] += r["impressions"]
        p["clicks"] += r["clicks"]
        p["ctr_gap"] += r["ctr_gap_clicks_90d"]
        p["rank_lift"] += r["rank_lift_clicks_90d"]
        p["queries"] += 1
        p["wpos"] += r["position"] * r["impressions"]
    pages = []
    for path, p in by_page.items():
        pages.append({"path": path, "kind": kind_of(SITE + path), "impressions": p["impressions"], "clicks": p["clicks"],
                      "position": round(p["wpos"] / p["impressions"], 1), "queries": p["queries"],
                      "ctr_gap_clicks_90d": round(p["ctr_gap"], 1), "rank_lift_clicks_90d": round(p["rank_lift"], 1),
                      "total_opportunity_90d": round(p["ctr_gap"] + p["rank_lift"], 1)})
    pages.sort(key=lambda p: -p["total_opportunity_90d"])
    titles = content_titles()
    for p in pages:
        p["current_title"] = titles.get(p["path"])
    out["opportunities_by_page"] = pages[:30]
    out["opportunity_totals_90d"] = {"ctr_gap_clicks": round(sum(p["ctr_gap_clicks_90d"] for p in pages), 0),
                                     "rank_lift_clicks": round(sum(p["rank_lift_clicks_90d"] for p in pages), 0),
                                     "actual_clicks": sum(p["clicks"] for p in pages)}
    by_kind = collections.defaultdict(lambda: {"pages": 0, "impressions": 0, "clicks": 0, "opportunity": 0.0})
    for p in pages:
        k = by_kind[p["kind"]]
        k["pages"] += 1
        k["impressions"] += p["impressions"]
        k["clicks"] += p["clicks"]
        k["opportunity"] += p["total_opportunity_90d"]
    out["by_kind_90d"] = {k: {**v, "ctr": round(v["clicks"] / max(v["impressions"], 1), 4), "opportunity": round(v["opportunity"], 0)} for k, v in by_kind.items()}
    return rows, scored


def cannibal_section(out, rows):
    by_q = collections.defaultdict(list)
    for r in rows:
        if r["impressions"] >= 10:
            by_q[r["query"]].append(r)
    cann = []
    for q, rs in by_q.items():
        if len(rs) >= 2:
            rs.sort(key=lambda r: -r["impressions"])
            total = sum(r["impressions"] for r in rs)
            cann.append({"query": q, "impressions": total, "pages": [(path_of(r["page"]), r["impressions"], round(r["position"], 1)) for r in rs[:4]]})
    cann.sort(key=lambda c: -c["impressions"])
    out["cannibalization"] = cann[:20]


def fragments_section(out):
    raw = load("gsc_page_28_raw")
    frag = collections.defaultdict(lambda: {"main": 0, "fragments": 0, "alt_host": 0, "n": 0})
    for r in raw:
        c = path_of(r["page"])
        p = urllib.parse.urlsplit(r["page"])
        if p.fragment:
            frag[c]["fragments"] += r["impressions"]
            frag[c]["n"] += 1
        elif p.netloc.lower() == "snkrscart.com":
            frag[c]["alt_host"] += r["impressions"]
        else:
            frag[c]["main"] += r["impressions"]
    items = [{"path": k, **v} for k, v in frag.items() if v["fragments"] or v["alt_host"]]
    items.sort(key=lambda i: -(i["fragments"] + i["alt_host"]))
    out["url_variants_28d"] = {"pages_with_fragment_urls": len([i for i in items if i["fragments"]]),
                               "fragment_impressions": sum(i["fragments"] for i in items),
                               "alt_host_impressions": sum(i["alt_host"] for i in items), "top": items[:10]}


def momentum_section(out):
    q28 = agg(load("gsc_query_28"), lambda r: r["query"])
    qp = agg(load("gsc_query_prev28"), lambda r: r["query"])
    rising, falling, new = [], [], []
    for q in set(q28) | set(qp):
        a, b = q28.get(q, {"impressions": 0, "clicks": 0, "position": 0}), qp.get(q, {"impressions": 0, "clicks": 0, "position": 0})
        d = a["impressions"] - b["impressions"]
        rec = {"query": q, "impr_28": a["impressions"], "impr_prev": b["impressions"], "delta": d, "clicks_28": a["clicks"],
               "pos_28": round(a["position"], 1), "pos_prev": round(b["position"], 1), "intent": intent_of(q), "brand": brand_of(q)}
        if b["impressions"] == 0 and a["impressions"] >= 15:
            new.append(rec)
        elif d >= 15:
            rising.append(rec)
        elif d <= -15:
            falling.append(rec)
    rising.sort(key=lambda r: -r["delta"])
    falling.sort(key=lambda r: r["delta"])
    new.sort(key=lambda r: -r["impr_28"])
    out["momentum_queries"] = {"rising": rising[:15], "falling": falling[:15], "new": new[:15]}
    p28 = agg(load("gsc_page_28"), lambda r: path_of(r["page"]))
    pp = agg(load("gsc_page_prev28"), lambda r: path_of(r["page"]))
    prising, pfalling = [], []
    for p in set(p28) | set(pp):
        a, b = p28.get(p, {"impressions": 0, "clicks": 0, "position": 0}), pp.get(p, {"impressions": 0, "clicks": 0, "position": 0})
        d = a["impressions"] - b["impressions"]
        rec = {"path": p, "kind": kind_of(SITE + p), "impr_28": a["impressions"], "impr_prev": b["impressions"], "delta": d,
               "clicks_28": a["clicks"], "clicks_prev": b["clicks"], "pos_28": round(a["position"], 1), "pos_prev": round(b["position"], 1)}
        (prising if d > 0 else pfalling).append(rec)
    prising.sort(key=lambda r: -r["delta"])
    pfalling.sort(key=lambda r: r["delta"])
    out["momentum_pages"] = {"rising": prising[:12], "falling": pfalling[:12]}


def cluster_section(out, rows):
    from sklearn.cluster import KMeans
    from sklearn.feature_extraction.text import TfidfVectorizer
    q90 = agg(load("gsc_query_90"), lambda r: r["query"])
    queries = sorted(q90, key=lambda q: -q90[q]["impressions"])
    if len(queries) < 20:
        out["query_clusters"] = []
        return
    vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=2, sublinear_tf=True)
    X = vec.fit_transform(queries)
    w = np.array([math.log1p(q90[q]["impressions"]) for q in queries])
    k = min(14, max(4, len(queries) // 60))
    km = KMeans(n_clusters=k, n_init=10, random_state=7).fit(X, sample_weight=w)
    best_page = {}
    for r in rows:
        bp = best_page.get(r["query"])
        if not bp or r["impressions"] > bp[1]:
            best_page[r["query"]] = (path_of(r["page"]), r["impressions"])
    clusters = collections.defaultdict(lambda: {"queries": [], "impressions": 0, "clicks": 0, "wpos": 0.0, "pages": collections.Counter(), "intents": collections.Counter(), "brands": collections.Counter()})
    for q, lab in zip(queries, km.labels_):
        c = clusters[int(lab)]
        a = q90[q]
        c["queries"].append((q, a["impressions"], a["clicks"], round(a["position"], 1)))
        c["impressions"] += a["impressions"]
        c["clicks"] += a["clicks"]
        c["wpos"] += a["position"] * a["impressions"]
        c["intents"][intent_of(q)] += a["impressions"]
        b = brand_of(q)
        if b:
            c["brands"][b] += a["impressions"]
        if q in best_page:
            c["pages"][best_page[q][0]] += a["impressions"]
    result = []
    for lab, c in clusters.items():
        c["queries"].sort(key=lambda t: -t[1])
        toks = collections.Counter()
        for q, imp, _, _ in c["queries"]:
            for t in set(tokens(q)):
                toks[t] += imp
        result.append({"cluster": lab, "label": " ".join(t for t, _ in toks.most_common(3)), "n_queries": len(c["queries"]),
                       "impressions": c["impressions"], "clicks": c["clicks"], "ctr": round(c["clicks"] / max(c["impressions"], 1), 4),
                       "position": round(c["wpos"] / max(c["impressions"], 1), 1),
                       "intent_mix": dict(c["intents"].most_common(3)), "brands": dict(c["brands"].most_common(3)),
                       "top_pages": [p for p, _ in c["pages"].most_common(3)], "top_queries": c["queries"][:8]})
    result.sort(key=lambda c: -c["impressions"])
    out["query_clusters"] = result
    intent = collections.defaultdict(lambda: {"queries": 0, "impressions": 0, "clicks": 0})
    for q, a in q90.items():
        i = intent[intent_of(q)]
        i["queries"] += 1
        i["impressions"] += a["impressions"]
        i["clicks"] += a["clicks"]
    out["intent_mix_90d"] = {k: {**v, "ctr": round(v["clicks"] / max(v["impressions"], 1), 4)} for k, v in intent.items()}
    brand = collections.defaultdict(lambda: {"queries": 0, "impressions": 0, "clicks": 0})
    for q, a in q90.items():
        b = brand_of(q) or "(no brand)"
        brand[b]["queries"] += 1
        brand[b]["impressions"] += a["impressions"]
        brand[b]["clicks"] += a["clicks"]
    out["brand_demand_90d"] = dict(sorted(brand.items(), key=lambda kv: -kv[1]["impressions"]))


def driver_model_section(out, scored):
    try:
        import lightgbm as lgb
    except ImportError:
        out["ctr_driver_model"] = {"skipped": "lightgbm missing"}
        return
    feats, names = [], ["position", "log_impressions", "query_words", "slug_overlap", "is_blog", "is_drop", "is_product", "is_brand", "has_brand_word", "transactional", "informational", "event", "has_india", "has_year"]
    y, w = [], []
    for r in scored:
        qt = set(tokens(r["query"]))
        st = set(tokens(r["path"].replace("-", " ").replace("/", " ")))
        feats.append([r["position"], math.log1p(r["impressions"]), len(qt), len(qt & st) / max(len(qt), 1),
                      r["kind"] == "blog", r["kind"] == "drop", r["kind"] == "product", r["kind"] == "brand", bool(r["brand"]),
                      r["intent"] == "transactional", r["intent"] == "informational", r["intent"] == "event",
                      "india" in qt, bool(qt & {"2025", "2026"})])
        y.append(r["ctr"])
        w.append(r["impressions"])
    X = np.array(feats, float)
    y = np.array(y)
    w = np.array(w, float)
    from sklearn.model_selection import KFold
    preds = np.zeros(len(y))
    for tr, te in KFold(5, shuffle=True, random_state=3).split(X):
        m = lgb.LGBMRegressor(n_estimators=300, learning_rate=0.03, num_leaves=7, min_child_samples=15, subsample=0.8, colsample_bytree=0.8, verbose=-1, random_state=3)
        m.fit(X[tr], y[tr], sample_weight=w[tr])
        preds[te] = np.clip(m.predict(X[te]), 0, 1)
    base = np.average(y, weights=w)
    ss_res = np.sum(w * (y - preds) ** 2)
    ss_tot = np.sum(w * (y - base) ** 2)
    final = lgb.LGBMRegressor(n_estimators=300, learning_rate=0.03, num_leaves=7, min_child_samples=15, subsample=0.8, colsample_bytree=0.8, verbose=-1, random_state=3)
    final.fit(X, y, sample_weight=w)
    imp = final.booster_.feature_importance(importance_type="gain")
    total = imp.sum() or 1
    r2 = round(1 - ss_res / ss_tot, 3)
    out["ctr_driver_model"] = {"rows": len(y), "weighted_r2_oof": r2,
                               "verdict": ("model beats the mean; use its residuals" if r2 > 0.05 else
                                           "model does not beat the impression-weighted mean out of fold; CTR is noise-dominated at this volume, trust the isotonic curve and revisit at 10x clicks"),
                               "feature_importance_gain_pct": {n: round(100 * float(v) / total, 1) for n, v in sorted(zip(names, imp), key=lambda t: -t[1])}}
    resid = [(r["path"], r["query"], r["impressions"], r["clicks"], round(p, 4), round(r["ctr"], 4)) for r, p in zip(scored, preds) if r["impressions"] >= 40]
    resid.sort(key=lambda t: (t[5] - t[4]) * t[2])
    out["ctr_driver_model"]["worst_underperformers_vs_model"] = resid[:12]


def coverage_section(out, rows):
    feed = ET.parse(G / "feed.xml").getroot()
    ns = {"g": "http://base.google.com/ns/1.0"}
    products = {}
    for item in feed.iter("item"):
        link = item.findtext("link") or ""
        slug = path_of(link)
        p = products.setdefault(slug, {"path": slug, "title": item.findtext("title") or "", "brand": item.findtext("g:brand", default="", namespaces=ns),
                                        "sizes": 0, "in_stock": 0, "price": None, "type": item.findtext("g:product_type", default="", namespaces=ns)})
        p["sizes"] += 1
        if (item.findtext("g:availability", default="", namespaces=ns) or "").strip() == "in stock":
            p["in_stock"] += 1
        pr = item.findtext("g:price", default="", namespaces=ns)
        try:
            v = float(pr.split()[0])
            p["price"] = v if p["price"] is None else min(p["price"], v)
        except (ValueError, IndexError):
            pass
    page_impr = agg(rows, lambda r: path_of(r["page"]))
    seen = {p: v for p, v in page_impr.items() if p.startswith("/products/")}
    never = [p for p in products if p not in seen]
    in_stock_products = [p for p, v in products.items() if v["in_stock"]]
    out["product_coverage"] = {
        "feed_items": sum(v["sizes"] for v in products.values()), "feed_products": len(products),
        "feed_products_in_stock": len(in_stock_products), "product_pages_with_impressions_90d": len(seen),
        "product_pages_never_seen_90d": len(never),
        "product_impressions_90d": sum(v["impressions"] for v in seen.values()), "product_clicks_90d": sum(v["clicks"] for v in seen.values()),
        "brands_in_feed": dict(collections.Counter(v["brand"] for v in products.values()).most_common()),
        "in_stock_never_seen_sample": [products[p]["title"] for p in never if products[p]["in_stock"]][:15],
    }
    q90 = agg(load("gsc_query_90"), lambda r: r["query"])
    best_page = {}
    for r in rows:
        bp = best_page.get(r["query"])
        if not bp or r["impressions"] > bp[1]:
            best_page[r["query"]] = (path_of(r["page"]), r["impressions"])
    prod_tokens = {p: set(tokens(v["title"])) - {"uk", "us", "eu"} for p, v in products.items()}
    gaps = []
    for q, a in q90.items():
        if a["impressions"] < 10:
            continue
        qt = set(tokens(q)) - BUY_WORDS - {"shoes", "sneakers", "sneaker", "india", "indian"}
        if len(qt) < 2 and not brand_of(q):
            continue
        bp = best_page.get(q, ("", 0))[0]
        match = None
        digits = {t for t in qt if any(ch.isdigit() for ch in t)}
        for p, pt in prod_tokens.items():
            if qt and digits <= pt and len(qt & pt) >= max(2, int(0.6 * len(qt))):
                if match is None or products[p]["in_stock"] > products[match]["in_stock"]:
                    match = p
        if intent_of(q) in ("transactional", "navigational") and not bp.startswith(("/products/", "/brands/")):
            gaps.append({"query": q, "impressions": a["impressions"], "clicks": a["clicks"], "position": round(a["position"], 1),
                         "ranking_page": bp, "matching_product": match, "in_stock": bool(match and products[match]["in_stock"]),
                         "intent": intent_of(q), "brand": brand_of(q)})
    gaps.sort(key=lambda g: -g["impressions"])
    out["commercial_queries_without_shop_page"] = gaps[:30]
    out["commercial_gap_totals"] = {"queries": len(gaps), "impressions": sum(g["impressions"] for g in gaps),
                                    "with_matching_product": len([g for g in gaps if g["matching_product"]]),
                                    "with_in_stock_product": len([g for g in gaps if g["in_stock"]])}
    return products


def geo_device_section(out):
    c28 = sorted(load("gsc_country_28"), key=lambda r: -r["impressions"])
    tot_i = sum(r["impressions"] for r in c28) or 1
    tot_c = sum(r["clicks"] for r in c28) or 1
    out["geo_28d"] = {"india_impr_share": round(100 * next((r["impressions"] for r in c28 if r["country"] == "ind"), 0) / tot_i, 1),
                      "india_click_share": round(100 * next((r["clicks"] for r in c28 if r["country"] == "ind"), 0) / tot_c, 1),
                      "top": [{k: r[k] for k in ("country", "clicks", "impressions", "ctr", "position")} for r in c28[:8]]}
    dev = agg(load("gsc_daily_device_90"), lambda r: r["device"])
    out["device_90d"] = {k: {kk: (round(vv, 4) if isinstance(vv, float) else vv) for kk, vv in v.items()} for k, v in dev.items()}
    qd = load("gsc_query_device_28")
    by = collections.defaultdict(dict)
    for r in qd:
        by[r["query"]][r["device"]] = r
    split = []
    for q, d in by.items():
        m, dd = d.get("MOBILE"), d.get("DESKTOP")
        if m and dd and m["impressions"] + dd["impressions"] >= 40:
            split.append({"query": q, "mobile_pos": m["position"], "desktop_pos": dd["position"], "mobile_impr": m["impressions"], "desktop_impr": dd["impressions"], "gap": round(dd["position"] - m["position"], 1)})
    split.sort(key=lambda s: -abs(s["gap"]))
    out["device_position_gaps"] = split[:10]
    app = load("gsc_appearance_28")
    out["search_appearance_28d"] = app
    img = load("gsc_image_query_28")
    out["image_search_28d"] = {"impressions": sum(r["impressions"] for r in img), "clicks": sum(r["clicks"] for r in img),
                               "top": sorted(img, key=lambda r: -r["impressions"])[:6]}


def latest_upload_summary():
    ups = sorted(G.glob("merchant_latest_upload_*.json"))
    if not ups:
        return None
    u = json.loads(ups[-1].read_text(encoding="utf-8"))
    issues = "; ".join(f"{i.get('count')} {i.get('title')}" for i in u.get("issues", []))
    return {"upload_time": u.get("uploadTime"), "state": u.get("processingState"), "items_total": int(u.get("itemsTotal", 0) or 0), "issues": issues}


def review_requested():
    p = G / "merchant_render_account_issues.json"
    if not p.is_file():
        return None
    m = re.search(r"Review requested on ([A-Z][a-z]{2} \d{1,2}, \d{4})", p.read_text(encoding="utf-8"))
    return m.group(1) if m else None


def merchant_section(out, products):
    pv = json.loads((G / "merchant_product_view_min.json").read_text()).get("rows", []) if (G / "merchant_product_view_min.json").is_file() else []
    statuses = collections.Counter(r["productView"].get("aggregatedReportingContextStatus") for r in pv)
    issues = collections.Counter()
    for r in pv:
        for i in r["productView"].get("itemIssues", []):
            issues[i.get("type", {}).get("code")] += 1
    acc = json.loads((G / "merchant_account_issues_list.json").read_text()) if (G / "merchant_account_issues_list.json").is_file() else {}
    npp = load("merchant_non_product_performance")
    npp_rows = [(r["nonProductPerformanceView"]["date"], int(r["nonProductPerformanceView"].get("clicks", 0)), int(r["nonProductPerformanceView"].get("impressions", 0))) for r in npp]
    npp_rows.sort(key=lambda t: (t[0]["year"], t[0]["month"], t[0]["day"]))
    half = len(npp_rows) // 2
    bsb = load("merchant_best_sellers_brand")
    latest = {}
    for r in bsb:
        v = r["bestSellersBrandView"]
        d = (v["reportDate"]["year"], v["reportDate"]["month"], v["reportDate"]["day"])
        if not latest or d > latest[0]:
            latest = (d, [])
        if d == latest[0]:
            latest[1].append(v)
    our_brands = {b.lower() for b in out["product_coverage"]["brands_in_feed"]}
    brand_rank = [{"brand": v.get("brand", ""), "rank": int(v["rank"]), "demand": v.get("relativeDemand"), "change": v.get("relativeDemandChange"), "we_carry": v["brand"].lower() in our_brands} for v in sorted(latest[1], key=lambda v: int(v["rank"]))][:40] if latest else []
    bsp = load("merchant_best_sellers_products")
    plat = {}
    for r in bsp:
        v = r["bestSellersProductClusterView"]
        d = (v["reportDate"]["year"], v["reportDate"]["month"], v["reportDate"]["day"])
        if not plat or d > plat[0]:
            plat = (d, [])
        if d == plat[0]:
            plat[1].append(v)
    clusters = sorted(plat[1], key=lambda v: int(v["rank"])) if plat else []
    sneaker_words = {"sneaker", "sneakers", "shoe", "shoes", "running", "jordan", "dunk", "samba", "air", "force", "new balance", "nike", "adidas", "puma", "asics", "crocs"}
    top_sneaker_clusters = [{"rank": int(v["rank"]), "title": v.get("title", ""), "brand": v.get("brand", ""), "demand": v.get("relativeDemand"), "change": v.get("relativeDemandChange"), "inventory": v.get("inventoryStatus")}
                            for v in clusters if any(w in (v["title"] + " " + v.get("brand", "")).lower() for w in sneaker_words)][:40]
    brand_demand = collections.Counter(v.get("brand", "") for v in clusters)
    out["merchant"] = {
        "account_id": "5750742430",
        "account_issues": [{"title": i.get("title"), "severity": i.get("severity"), "detail": i.get("detail")} for i in acc.get("accountIssues", [])],
        "feed_items_sent": out["product_coverage"]["feed_items"], "products_accepted_by_google": len(pv),
        "accepted_status": dict(statuses), "item_issue_codes": dict(issues),
        "latest_upload": latest_upload_summary(),
        "review_requested": review_requested(),
        "product_performance_90d": "0 rows (no product clicks or impressions, listings never live)",
        "non_product_performance_90d": {"clicks": sum(t[1] for t in npp_rows), "impressions": sum(t[2] for t in npp_rows),
                                        "first_half_clicks": sum(t[1] for t in npp_rows[:half]), "second_half_clicks": sum(t[1] for t in npp_rows[half:]),
                                        "last_7_days": [(f"{d['year']}-{d['month']:02d}-{d['day']:02d}", c, i) for d, c, i in npp_rows[-7:]]},
        "best_seller_brands_in_shoes_latest_week": brand_rank,
        "brands_we_carry_in_top40": [b["brand"] for b in brand_rank if b["we_carry"]],
        "best_seller_product_clusters_latest_week": {"total_clusters": len(clusters), "brand_counts_top": dict(brand_demand.most_common(12)),
                                                     "in_inventory": collections.Counter(v.get("inventoryStatus") for v in clusters).most_common(),
                                                     "sneaker_like_top": top_sneaker_clusters},
    }


def actions_section(out):
    t, o, m, cov = out["trend"], out["opportunity_totals_90d"], out["merchant"], out["product_coverage"]
    nb = next((p for p in out["opportunities_by_page"] if p["path"] == "/brands/new-balance"), None)
    frag = out["url_variants_28d"]
    gaps = out["commercial_gap_totals"]
    per_month = lambda v90: round(v90 / 3)
    acts = [
        {"rank": 1, "action": "Clear the Merchant Center misrepresentation suspension and the item capacity cap",
         "why": f"All {m['feed_items_sent']} feed items are invisible: latest upload {m['latest_upload']}; {m['products_accepted_by_google']} accepted, status {m['accepted_status']}. Zero product clicks in 90 days while non-product surfaces still brought {m['non_product_performance_90d']['clicks']} clicks. Review requested {m['review_requested']}.",
         "how": "Finish Google's root-cause list: business info and verified phone/address in Merchant Center, Google Business Profile linked, policy text identical on site and in MC, visible reviews, no placeholder images; after approval ask support to lift the item limit (new accounts start capped). Re-fetch the feed and confirm itemsTotal equals processed.",
         "expected": "Free listings for about 200 in-stock sizes across ~130 products; comparable Indian sneaker stores see product free listings at 1 to 3 percent CTR, so the ceiling is a new channel rather than a lift on the current 300 clicks a month.",
         "effort": "M", "confidence": "high", "metric": "merchant product_performance_view clicks > 0; productStatuses approved share"},
        {"rank": 2, "action": "Fix CTR on pages that already rank on page one (titles, meta, rich results)",
         "why": f"Isotonic CTR curve on 90 days of our own page by query data puts {int(o['ctr_gap_clicks'])} missed clicks per 90 days ({per_month(o['ctr_gap_clicks'])} per month) on pages whose CTR sits below the site's own curve at their position. /brands/new-balance alone: {nb['impressions'] if nb else 0} impressions, {nb['clicks'] if nb else 0} clicks at position {nb['position'] if nb else 0}.",
         "how": "Rewrite title and description for the top 10 pages in opportunities_by_page (ordered in growth_report.json), add Product and Offer structured data to brand and category pages (PRODUCT_SNIPPETS already run at 5 percent CTR vs 2 percent site average), show INR price and in-stock count in the title for brand pages.",
         "expected": f"{per_month(o['ctr_gap_clicks'] * 0.5)} to {per_month(o['ctr_gap_clicks'])} extra clicks a month (half to all of the gap)",
         "effort": "S", "confidence": "high", "metric": "page CTR vs curve in next pull"},
        {"rank": 3, "action": "Push striking-distance pages from positions 4 to 15 into the top 3",
         "why": f"Rank-lift model (same curve, target position 3) finds {int(o['rank_lift_clicks'])} clicks per 90 days ({per_month(o['rank_lift_clicks'])} per month) on queries we already rank for below position 3.",
         "how": "Use refresh_queue plus opportunities_page_query_top: add the exact query phrasing to H1 and intro, add internal links from the home page and brand pages to the top 8 pages, expand thin sections, add FAQ blocks with the rising queries.",
         "expected": f"{per_month(o['rank_lift_clicks'] * 0.3)} to {per_month(o['rank_lift_clicks'] * 0.6)} extra clicks a month (30 to 60 percent of modelled lift)",
         "effort": "M", "confidence": "medium", "metric": "weighted position of the 20 target page by query pairs"},
        {"rank": 4, "action": "Make product and brand pages visible: internal links, index coverage, shop pages for commercial queries",
         "why": f"Only {cov['product_pages_with_impressions_90d']} of {cov['feed_products']} product pages got any impression in 90 days ({cov['product_impressions_90d']} impressions, {cov['product_clicks_90d']} clicks); {cov['product_pages_never_seen_90d']} never appeared. {gaps['queries']} commercial or navigational queries ({gaps['impressions']} impressions) rank with a blog or nothing instead of a shop page; {gaps['with_in_stock_product']} of them match an in-stock product.",
         "how": "Link every blog and drop to the matching product and brand page (the drop and profile pages already compute market matches), add a model-level landing page per hot model (Samba, Dunk Low, AJ1 Low, 9060, 1906R), submit product URLs in the sitemap with lastmod, check Search Console index coverage for /products/.",
         "expected": "Moves the site from a magazine to a store in Google's eyes; product pages typically reach 5 to 10 percent of blog impressions within 2 months once linked",
         "effort": "M", "confidence": "medium", "metric": "product_pages_with_impressions_90d, product_clicks_90d"},
        {"rank": 5, "action": "Keep table-of-contents anchors; they are Google jump links",
         "why": f"{frag['pages_with_fragment_urls']} pages report #heading-N rows with {frag['fragment_impressions']} impressions in 28 days ({frag['alt_host_impressions']} on the bare host, which already 308s to www). These rows are jump links shown under the main result, so they are a reporting artefact and not a leak.",
         "how": "Do not nofollow or remove the anchors. Heading ids are stable slugs of the heading text since 2026-10-10 (frontend app/blogs/[slug]/headings.ts); clicks on jump links are a bonus on top of the main URL.",
         "expected": "No change in clicks; jump links survive edits", "effort": "S", "confidence": "high", "metric": "clicks on fragment rows"},
        {"rank": 6, "action": "Ride event and release spikes with a calendar of posts",
         "why": f"Spike days {', '.join(d for d, *_ in t['spike_days'][-4:])}: the Indian Sneaker Festival post and the AJ1 Last Dance drop made week 39 the best week (153 clicks). Event and drop queries carry the highest CTR in the data.",
         "how": "Publish 10 days before each big India event or drop (festival, Diwali drops, Air Max Day, Jordan anniversaries), update the post on the day, add a drops hub page per month.",
         "expected": "One spike week per month adds about 100 clicks a month on current scale", "effort": "M", "confidence": "medium", "metric": "spike_days per month"},
        {"rank": 7, "action": "Decide what to do with non-India traffic",
         "why": f"India is only {out['geo_28d']['india_impr_share']} percent of impressions and {out['geo_28d']['india_click_share']} percent of clicks; the US alone matches India. The store ships only to India.",
         "how": "Either geo-target blog topics to India (price in INR, where to buy in India) so the Indian share grows, or monetise non-India readers with affiliate links. Do not spend content effort on US-only topics.",
         "expected": "Higher share of clicks that can convert", "effort": "S", "confidence": "medium", "metric": "india_click_share"},
        {"rank": 8, "action": "Grow the non-product Merchant surfaces that already work",
         "why": f"Merchant non_product_performance_view (store and page links on Google surfaces, not product offers) brought {m['non_product_performance_90d']['clicks']} clicks on {m['non_product_performance_90d']['impressions']} impressions in 90 days, and the second half ({m['non_product_performance_90d']['second_half_clicks']}) was 2.5x the first half ({m['non_product_performance_90d']['first_half_clicks']}). This channel is not in Search Console.",
         "how": "Keep the business profile, logo, store policies and the collection pages complete in Merchant Center; add brand and category pages to the sitemap Merchant Center crawls; once products are approved these surfaces also show offers.",
         "expected": "Holds the 500 clicks a month this surface already gives and compounds with action 1", "effort": "S", "confidence": "medium", "metric": "non_product_performance clicks per week"},
        {"rank": 9, "action": "Stock what Google says India buys",
         "why": "Merchant best-seller brand ranks for Shoes in India and product clusters show which models have VERY_HIGH demand and whether we carry them (see merchant.best_seller_product_clusters_latest_week).",
         "how": "Use brands_we_carry_in_top40 and sneaker_like_top as the sourcing list for sellers; add a drop or profile page for every top cluster we do not stock.",
         "expected": "Demand-led catalogue growth", "effort": "L", "confidence": "medium", "metric": "in_inventory share of top clusters"},
    ]
    out["actions"] = acts


def main():
    out = {"generated": dt.date.today().isoformat()}
    trend_section(out)
    rows, scored = opportunity_section(out)
    cannibal_section(out, rows)
    fragments_section(out)
    momentum_section(out)
    cluster_section(out, rows)
    driver_model_section(out, scored)
    products = coverage_section(out, rows)
    geo_device_section(out)
    merchant_section(out, products)
    actions_section(out)
    (G / "growth_report.json").write_text(json.dumps(out, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
    print(json.dumps({k: out[k] for k in ("trend", "opportunity_totals_90d", "by_kind_90d", "ctr_curve_90d", "product_coverage", "commercial_gap_totals", "geo_28d", "url_variants_28d")}, indent=1, default=str)[:6000])
    print("written", G / "growth_report.json")


if __name__ == "__main__":
    main()
