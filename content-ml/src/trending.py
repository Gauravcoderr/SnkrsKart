import datetime as dt
import json
import math
import re
import sys
import time
from pathlib import Path

import growth
import keywords
from merchant_insights import product_label

DATA = Path(__file__).resolve().parent.parent / "data"
OURS = DATA / "ours.jsonl"
OUTPUT = DATA / "trending" / "shortlist.json"
MERCHANT_FILE = "merchant_best_sellers_products"
SEARCH_FILES = {"90": "gsc_query_90", "28": "gsc_query_28", "prev28": "gsc_query_prev28"}
WEIGHTS = {"merchant": 0.35, "search": 0.25, "launch": 0.15, "autocomplete": 0.15}
RRF_K = 60
MERCHANT_SOLO_RANK = 50
RISING_MIN_GAIN = 5
RISING_MIN_RATIO = 1.5
LAUNCH_DAYS_BACK = 30
LAUNCH_DAYS_AHEAD = 45
LAUNCH_DECAY_DAYS = 30
AUTOCOMPLETE_POOL = 60
AUTOCOMPLETE_PAUSE = 0.35
PRICE_SUFFIXES = (" price in india", " price")
DEFAULT_LIMIT = 50
STORE_BRANDS = {"nike", "jordan", "adidas", "new balance", "crocs"}
GENDER_WORDS = {"men", "mens", "women", "womens", "man", "woman", "wmns", "unisex", "s"}
KIDS_TOKENS = {"gs", "ps", "td", "kid", "kids", "infant", "infants", "toddler", "toddlers", "preschool", "junior", "youth", "child", "children"}
GENDER_RE = re.compile(r"\b(men's|women's|mens|womens|men|women)\b\s*", re.IGNORECASE)
JORDAN_NIKE = {"jordan", "nike"}


def words(text):
    return [token for token in growth.tokens(text) if token not in GENDER_WORDS]


def contains_run(haystack, needle):
    size = len(needle)
    return any(haystack[i : i + size] == needle for i in range(len(haystack) - size + 1))


def brands_agree(first, second):
    if not first or not second or first == second:
        return True
    return {first, second} == JORDAN_NIKE


def row_brand(brand, title):
    if brand:
        return growth.brand_of(brand) or brand.lower()
    return growth.brand_of(title)


def model_tokens(title, brand):
    tokens = words(title)
    brand_key = growth.brand_of(brand)
    if brand_key == "jordan":
        return tokens
    leading = words(brand) + ["nike"]
    start = 0
    while start < len(tokens) and tokens[start] in leading:
        start += 1
    return tokens[start:]


def read_vocabulary(path=OURS):
    if not path.is_file():
        return None, None, "data/ours.jsonl is missing, so no model can be matched"
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as error:
        return None, None, f"data/ours.jsonl could not be read ({type(error).__name__}), so no model can be matched"
    models, drops, skipped, first = [], [], 0, None
    for number, line in enumerate(lines, 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
            if not row.get("published"):
                continue
            if row.get("kind") == "profile":
                tokens = model_tokens(row["title"], row.get("brand", ""))
                if tokens:
                    models.append(
                        {
                            "slug": row["slug"],
                            "title": row["title"],
                            "brand": growth.brand_of(row.get("brand", "")),
                            "tokens": tokens,
                        }
                    )
            elif row.get("kind") == "drop":
                drops.append(row)
        except (ValueError, KeyError, AttributeError, TypeError) as error:
            skipped += 1
            first = first or f"line {number} ({type(error).__name__}: {error})"
    problem = f"{skipped} row(s) of ours.jsonl could not be read, first at {first}" if skipped else None
    if skipped and not models:
        return None, None, problem + ", so no model can be matched"
    return models, drops, problem


def assign(models, text, brand=""):
    tokens = words(text)
    if KIDS_TOKENS & set(tokens):
        return None
    text_brand = brand or growth.brand_of(text)
    best = None
    for model in models:
        if not contains_run(tokens, model["tokens"]):
            continue
        if not brands_agree(text_brand, model["brand"]):
            continue
        if len(model["tokens"]) == 1 and any(c.isdigit() for c in model["tokens"][0]) and not text_brand:
            continue
        if best is None or len(model["tokens"]) > len(best["tokens"]):
            best = model
    return best


def model_candidate(model):
    return {"key": model["slug"], "slug": model["slug"], "title": model["title"], "brand": model["brand"]}


def clean_title(title):
    label = product_label(title).split("|")[0]
    return GENDER_RE.sub("", label).strip()


def rank_of(row):
    view = row.get("bestSellersProductClusterView") or {}
    try:
        return int(view["rank"])
    except (KeyError, TypeError, ValueError):
        return None


def merchant_family(models, rows):
    best = {}
    for row in rows:
        rank = rank_of(row)
        if rank is None:
            continue
        view = row["bestSellersProductClusterView"]
        title = view.get("title") or ""
        brand = row_brand(view.get("brand"), title)
        model = assign(models or [], title, brand)
        if model:
            who = model_candidate(model)
        else:
            cleaned = clean_title(title)
            who = {"key": "title:" + " ".join(words(cleaned)), "slug": None, "title": cleaned, "brand": brand}
        known = best.get(who["key"])
        if known is None or rank < known["rank"]:
            best[who["key"]] = {
                "who": who,
                "rank": rank,
                "riser": view.get("relativeDemandChange") == "RISER",
                "inventory": view.get("inventoryStatus"),
            }
    return sorted(best.values(), key=lambda item: item["rank"])


def merchant_week(rows):
    for row in rows:
        date = (row.get("bestSellersProductClusterView") or {}).get("reportDate")
        if date:
            return "%04d-%02d-%02d" % (date["year"], date["month"], date["day"])
    return None


def impressions_by_model(models, rows):
    totals = {}
    for row in rows:
        model = assign(models, row["query"])
        if model:
            totals[model["slug"]] = totals.get(model["slug"], 0) + row["impressions"]
    return totals


def search_family(models, rows90, rows28, rows_prev):
    totals = impressions_by_model(models, rows90)
    recent = impressions_by_model(models, rows28) if rows28 is not None and rows_prev is not None else None
    previous = impressions_by_model(models, rows_prev) if recent is not None else {}
    by_slug = {model["slug"]: model for model in models}
    ranked = []
    for slug, impressions in sorted(totals.items(), key=lambda item: (-item[1], item[0])):
        now, before = (recent or {}).get(slug, 0), previous.get(slug, 0)
        rising = recent is not None and now >= before + RISING_MIN_GAIN and now >= before * RISING_MIN_RATIO
        ranked.append({"who": model_candidate(by_slug[slug]), "impressions": impressions, "rising": rising})
    return ranked


def drop_day(drop):
    try:
        return dt.date.fromisoformat(str(drop["date"])[:10])
    except (KeyError, ValueError):
        return None


def launch_family(models, drops, today):
    best = {}
    for drop in drops:
        day = drop_day(drop)
        if day is None:
            continue
        offset = (day - today).days
        if offset < -LAUNCH_DAYS_BACK or offset > LAUNCH_DAYS_AHEAD:
            continue
        model = assign(models, drop.get("title", ""), growth.brand_of(drop.get("brand", "")))
        if not model:
            continue
        recency = 1.0 if offset >= 0 else math.exp(offset / LAUNCH_DECAY_DAYS)
        item = {"who": model_candidate(model), "date": day.isoformat(), "recency": round(recency, 4), "upcoming": offset >= 0, "_offset": offset}
        known = best.get(model["slug"])
        if known is None or launch_order(item) < launch_order(known):
            best[model["slug"]] = item
    ranked = sorted(best.values(), key=launch_order)
    for item in ranked:
        del item["_offset"]
    return ranked


def launch_order(item):
    return (-item["recency"], abs(item["_offset"]))


def strict_suggest(query):
    return keywords.suggest(query, strict=True)


def autocomplete_family(models, pool, suggest=strict_suggest, pause=None):
    pause = AUTOCOMPLETE_PAUSE if pause is None else pause
    by_slug = {model["slug"]: model for model in models}
    counts, failed, lookups = [], 0, 0
    for slug in pool:
        model = by_slug[slug]
        phrases = set()
        for suffix in PRICE_SUFFIXES:
            lookups += 1
            try:
                found = suggest(model["title"] + suffix)
            except Exception:
                failed += 1
                found = []
            for phrase in found:
                if "price" in phrase.lower() and contains_run(words(phrase), model["tokens"]):
                    phrases.add(phrase.lower().strip())
            time.sleep(pause)
        if phrases:
            counts.append({"who": model_candidate(model), "suggestions": len(phrases)})
    ranked = sorted(counts, key=lambda item: (-item["suggestions"], item["who"]["key"]))
    return ranked, failed, lookups


def fuse(families, weights=WEIGHTS):
    people = {}
    for name, ranked in families.items():
        for position, item in enumerate(ranked, 1):
            rank = item["rank"] if name == "merchant" else position
            entry = people.setdefault(item["who"]["key"], {"who": item["who"], "families": {}, "detail": {}})
            entry["families"][name] = rank
            entry["detail"][name] = item
    rows = []
    for entry in people.values():
        score = sum(weights[name] / (RRF_K + rank) for name, rank in entry["families"].items())
        rows.append({**entry, "score": score})
    return rows


def admitted(row):
    return len(row["families"]) >= 2 or row["families"].get("merchant", MERCHANT_SOLO_RANK + 1) <= MERCHANT_SOLO_RANK


def in_scope(row, all_brands):
    return all_brands or row["who"]["brand"] in STORE_BRANDS


def shape(row):
    who, detail = row["who"], row["detail"]
    merchant = detail.get("merchant")
    launch = detail.get("launch")
    return {
        "model": who["title"],
        "brand": who["brand"],
        "profile": who["slug"],
        "score": round(row["score"], 5),
        "families": row["families"],
        "rising": bool(detail.get("search", {}).get("rising")),
        "riser": bool(merchant and merchant["riser"]),
        "launch_date": launch["date"] if launch and launch["upcoming"] else None,
        "released": launch["date"] if launch and not launch["upcoming"] else None,
        "stocked": None if not merchant else merchant["inventory"] == "IN_STOCK",
    }


def shortlist(families, all_brands=False, weights=WEIGHTS):
    rows = [row for row in fuse(families, weights) if admitted(row) and in_scope(row, all_brands)]
    rows.sort(key=lambda row: (-row["score"], row["families"].get("merchant", 10**6), row["who"]["title"]))
    return [shape(row) for row in rows]


def read_rows(name):
    try:
        rows, pulled = growth.pulled_rows(name)
    except (OSError, ValueError) as error:
        return None, None, f"file could not be read ({type(error).__name__})"
    if rows is None:
        return None, pulled, "file missing or without rows"
    return rows, pulled, None


def available(file, ranked, pulled=None, notes=()):
    entry = {"available": True, "file": file, "models": len(ranked)}
    if pulled:
        entry["pulled"] = pulled
    kept = [note for note in notes if note]
    if kept:
        entry["note"] = "; ".join(kept)
    return entry


def unavailable(file, reason):
    return {"available": False, "file": file, "models": 0, "reason": reason}


def merchant_status(models, problem):
    rows, pulled, reason = read_rows(MERCHANT_FILE)
    file = MERCHANT_FILE + ".json"
    if rows is None:
        return None, unavailable(file, reason)
    ranked = merchant_family(models, rows)
    unranked = sum(1 for row in rows if rank_of(row) is None)
    if rows and not ranked:
        return None, unavailable(file, f"0 of {len(rows)} rows had a rank")
    entry = available(file, ranked, pulled, [problem, f"{unranked} of {len(rows)} rows had no rank" if unranked else None])
    entry["week"] = merchant_week(rows)
    return ranked, entry


def search_status(models, problem):
    rows90, pulled, reason = read_rows(SEARCH_FILES["90"])
    if rows90 is None:
        return None, unavailable(SEARCH_FILES["90"] + ".json", reason)
    rows28, rows_prev = read_rows(SEARCH_FILES["28"])[0], read_rows(SEARCH_FILES["prev28"])[0]
    gap = None if rows28 is not None and rows_prev is not None else "gsc_query_28.json or gsc_query_prev28.json missing, so rising is not marked"
    ranked = search_family(models, rows90, rows28, rows_prev)
    return ranked, available(SEARCH_FILES["90"] + ".json", ranked, pulled, [problem, gap])


def autocomplete_status(models, families, suggest):
    first = fuse(families)
    first.sort(key=lambda row: -row["score"])
    pool = [row["who"]["slug"] for row in first if row["who"]["slug"]][:AUTOCOMPLETE_POOL]
    ranked, failed, lookups = autocomplete_family(models, pool, suggest)
    if lookups and failed == lookups:
        return None, unavailable(None, f"all {lookups} lookups failed")
    note = f"{failed} of {lookups} lookups failed, so some models are missing this vote" if failed else None
    return ranked, available(None, ranked, None, [note])


def collect(today, use_autocomplete=False, suggest=strict_suggest):
    models, drops, problem = read_vocabulary()
    families, status = {}, {}
    no_vocabulary = unavailable("ours.jsonl", problem)
    ranked, status["merchant"] = merchant_status(models, problem)
    if ranked is not None:
        families["merchant"] = ranked
    if models is None:
        rows90, _, reason = read_rows(SEARCH_FILES["90"])
        status["search"] = unavailable(SEARCH_FILES["90"] + ".json", reason) if rows90 is None else no_vocabulary
        status["launch"] = no_vocabulary
    else:
        ranked, status["search"] = search_status(models, problem)
        if ranked is not None:
            families["search"] = ranked
        families["launch"] = launch_family(models, drops, today)
        status["launch"] = available("ours.jsonl", families["launch"], None, [problem])
    if not use_autocomplete:
        status["autocomplete"] = unavailable(None, "not requested (use --autocomplete)")
    elif models is None:
        status["autocomplete"] = no_vocabulary
    else:
        ranked, status["autocomplete"] = autocomplete_status(models, families, suggest)
        if ranked is not None:
            families["autocomplete"] = ranked
    return families, status, {"available": models is not None, "note": problem}


def build(today, all_brands=False, use_autocomplete=False, suggest=strict_suggest):
    families, status, vocabulary = collect(today, use_autocomplete, suggest)
    return {
        "generated_at": today.isoformat(),
        "weights": WEIGHTS,
        "families": status,
        "vocabulary": vocabulary,
        "all_brands": all_brands,
        "rows": shortlist(families, all_brands),
    }


def flags(row, profiles_checked=True):
    marks = []
    if row["rising"]:
        marks.append("search rising")
    if row["riser"]:
        marks.append("demand riser")
    if row["launch_date"]:
        marks.append("launch " + row["launch_date"])
    if row["released"]:
        marks.append("released " + row["released"])
    if row["profile"] is None:
        marks.append("no profile" if profiles_checked else "profile not checked")
    if row["stocked"] is not None:
        marks.append("in our Google feed" if row["stocked"] else "not in our Google feed")
    return ", ".join(marks)


def render(result, limit):
    lines = [f"Trending sneaker models for India (generated {result['generated_at']})", ""]
    for index, row in enumerate(result["rows"][:limit], 1):
        votes = ", ".join(f"{name} #{rank}" for name, rank in row["families"].items())
        lines.append(f"{index:>3}. {row['model']} [{row['brand'] or 'unknown brand'}] score {row['score']:.5f}")
        lines.append(f"     votes: {votes}")
        lines.append(f"     flags: {flags(row, result['vocabulary']['available']) or 'none'}")
    if not result["rows"]:
        lines.append("  no model passed admission")
    lines.append("")
    for name, entry in result["families"].items():
        state = f"{entry['models']} models" if entry["available"] else "NOT AVAILABLE: " + entry.get("reason", "")
        facts = [entry.get("file"), f"pulled {entry['pulled']}" if entry.get("pulled") else None, f"week of {entry['week']}" if entry.get("week") else None]
        source = f" ({', '.join(fact for fact in facts if fact)})" if any(facts) else ""
        lines.append(f"family {name}: {state}{source}" + (f"; {entry['note']}" if entry.get("note") else ""))
    live = [name for name, entry in result["families"].items() if entry["available"]]
    if len(live) < 2:
        lines.append(f"Fewer than two signal families are available ({', '.join(live) or 'none'}). Admission still needs two families or merchant rank {MERCHANT_SOLO_RANK} or better; nothing was relaxed.")
    weights = ", ".join(f"{name} {weight}" for name, weight in result["weights"].items())
    lines.append(f"Weights ({weights}) are untuned starting values; retune WEIGHTS in src/trending.py once price history shows which signal predicts a real move.")
    lines.append("Brands: " + ("all" if result["all_brands"] else "Nike, Jordan, Adidas, New Balance, Crocs (--all-brands lifts it)") + ". Merchant votes use the Google best-seller rank; other families use list position.")
    return "\n".join(lines) + "\n"


def write(result, path=OUTPUT):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp")
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    temporary.replace(path)


def parse_limit(argv):
    if "--limit" in argv:
        return int(argv[argv.index("--limit") + 1])
    return DEFAULT_LIMIT


def main(argv):
    try:
        limit = parse_limit(argv)
    except (IndexError, ValueError):
        print("--limit needs a number, e.g. --limit 15")
        return 1
    result = build(dt.date.today(), "--all-brands" in argv, "--autocomplete" in argv)
    if not any(entry["available"] for entry in result["families"].values()):
        print(render(result, limit))
        print("No signal family is available, so the saved shortlist was left as it was.")
        return 1
    write(result)
    if "--json" in argv:
        print(json.dumps(result, ensure_ascii=False, indent=1))
        return 0
    print(render(result, limit))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
