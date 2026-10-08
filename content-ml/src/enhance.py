import hfoffline
import argparse
import hashlib
import html as htmllib
import json
import re
import sys
import time
from pathlib import Path

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from corpus import DATA, MODELS, normalize, read_jsonl
from factlock import FACT_RE, PH_RE, has_residue, lock, lock_tags, tag_text, unlock
from features import FEATURE_NAMES, extract, lexicon_hits
from textutil import chunk_paragraphs

BASE_MODEL = "mlx-community/Qwen2.5-1.5B-Instruct-4bit"
ADAPTER = MODELS / "rewriter-lora"
RUNS = DATA / "runs.jsonl"
CATALOG = DATA / "catalog.jsonl"
KEYWORDS_LOG = DATA / "keywords.jsonl"
SHORT_WORDS = 60
MIN_REWRITE_WORDS = 30
MAX_REWRITES = 4
STYLE_BLOCKING = False

OPENER_RE = re.compile(r"(^|[.!?][ \t]+)(Furthermore|Moreover|In conclusion|It'?s worth noting that|It is worth noting that),?[ \t]+([a-z])")
ADDITIONALLY_RE = re.compile(r"(^|[.!?][ \t]+)Additionally,[ \t]+")
WORD_SWAPS = [
    (re.compile(r"\bis boasting\b"), "has"), (re.compile(r"\bboasts\b"), "has"),
    (re.compile(r"\bshowcases\b"), "shows"), (re.compile(r"\bshowcasing\b"), "showing"),
    (re.compile(r"\butilizes\b"), "uses"), (re.compile(r"\butilize\b"), "use"),
    (re.compile(r"\bdelve into\b"), "get into"), (re.compile(r"\bseamlessly\b"), "smoothly"),
    (re.compile(r"(?<=\d)[ \t]*[—–][ \t]*(?=[\d₹$])"), " to "),
    (re.compile(r"(?<=\w)[ \t]+—[ \t]+(?=\w)"), ", "),
    (re.compile(r"(?<=[a-z])—(?=[a-z])"), ", "),
]
QUOTE_RE = re.compile(r"(“[^”]{2,}”|\"[^\"]{2,}\")")
NEGATION_RE = re.compile(r"\b(?:not|no|never|none|nothing|without|nobody|neither|nor)\b|n't\b", re.I)
WATCH_FEATURES = {
    "sent_cv": "Sentence lengths are too uniform. Mix short lines with longer detailed ones.",
    "short_sent_rate": "Almost no short sentences. Add a few 3 to 8 word lines.",
    "ai_lex_rate": "Too many stock AI words.",
    "second_person_rate": "Too much 'you/your' marketing voice. State facts and opinions directly.",
    "triple_rate": "Too many 'X, Y and Z' lists of three.",
    "adverb_ly_rate": "Too many -ly adverbs.",
    "emdash_rate": "Too many dashes.",
}
LOWER_IS_BETTER = {"ai_lex_rate", "second_person_rate", "triple_rate", "adverb_ly_rate", "emdash_rate"}
STYLE_CODE_RE = re.compile(r"\b[A-Z0-9]{2,}\d*-\d{3}\b")
MONEY_RE = re.compile(r"[₹$]\s?\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|[₹$]\s?\d+(?:\.\d+)?")
SOURCE_CHATTER = re.compile(r"sneaker ?files|just ?fresh ?kicks|nice ?kicks|sneaker ?news|sneaker ?history|"
                            r"doctors ?of ?running|wear ?testers|keep it locked|stay tuned|check (?:them |it )?out below|"
                            r"let us know|in the comments|follow us", re.I)
P_SPLIT = re.compile(r"(<p>.*?</p>)", re.S)
ENTITY_STOP = {"i", "the", "a", "an", "and", "but", "or", "if", "it", "its", "this", "that", "these", "those",
               "we", "you", "they", "he", "she", "our", "your", "their", "in", "on", "at", "for", "with", "as",
               "of", "to", "from", "by", "not", "so", "yes", "no", "now", "then", "here", "there", "what", "why"}


class Scorer:
    def __init__(self):
        b = joblib.load(MODELS / "scorer.joblib")
        self.gbm, self.vec, self.lr = b["gbm"], b.get("vec"), b.get("lr")
        self.weights = b.get("weights", (0.5, 0.5))
        self.threshold = float(b.get("threshold", 0.5))
        self.calib = b.get("calib", {})
        self.version = b.get("version", "v1")
        base = b["baseline"]
        self.mean, self.std = np.array(base["mean"]), np.array(base["std"])

    def score(self, texts):
        f = np.array([extract(t) for t in texts], dtype=float)
        p = self.gbm.predict_proba(f)[:, 1]
        if self.lr is not None and self.weights[1] > 0:
            p = self.weights[0] * p + self.weights[1] * self.lr.predict_proba(
                self.vec.transform([normalize(t) for t in texts]))[:, 1]
        return p, f

    def issues(self, feat_row):
        z = (feat_row - self.mean) / self.std
        out = []
        for name, msg in WATCH_FEATURES.items():
            zi = z[FEATURE_NAMES.index(name)]
            if (name in LOWER_IS_BETTER and zi > 1.5) or (name not in LOWER_IS_BETTER and zi < -1.2):
                out.append(msg)
        return out


def facts(text):
    return sorted(m.group(0).replace(" ", "") for m in FACT_RE.finditer(text))


def entities(text):
    out = set()
    for sent in re.split(r"(?<=[.!?:])\s+|\n+", text):
        toks = re.findall(r"[A-Za-z][A-Za-z0-9'&\-]*", sent)
        for i, w in enumerate(toks):
            if i > 0 and (w[0].isupper() or any(ch.isdigit() for ch in w)) and len(w) > 1 and w.lower() not in ENTITY_STOP:
                out.add(w.lower().rstrip("'s"))
    return out


def cap_tokens(text):
    return {w.lower().rstrip("'s") for w in re.findall(r"[A-Za-z][A-Za-z0-9'&\-]*", text)
            if w[0].isupper() or any(ch.isdigit() for ch in w)}


def ngram_hashes(text, n=8):
    w = re.findall(r"[a-z0-9']+", text.lower())
    return {hashlib.md5(" ".join(w[i:i + n]).encode()).hexdigest()[:12] for i in range(len(w) - n + 1)}


def human_ngram_index():
    cache = MODELS / "human_8grams.joblib"
    src = DATA / "human.jsonl"
    stamp = (src.stat().st_size, int(src.stat().st_mtime)) if src.exists() else (0, 0)
    if cache.exists():
        saved = joblib.load(cache)
        if isinstance(saved, dict) and saved.get("stamp") == stamp:
            return saved["index"]
    idx = set()
    for d in read_jsonl(src):
        idx |= ngram_hashes(" ".join(d["paragraphs"]))
    joblib.dump({"stamp": stamp, "index": idx}, cache)
    return idx


def norm_sentences(text):
    return [re.sub(r"[^a-z0-9 ]", "", s.lower()).strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.split()) >= 4]


def accept(orig, cand, old_score, new_score, hidx):
    if not cand or not cand.strip():
        return False, ["empty"]
    reasons = []
    if has_residue(cand):
        reasons.append("placeholder_residue")
    if facts(orig) != facts(cand):
        reasons.append("facts_changed")
    if len(NEGATION_RE.findall(orig)) != len(NEGATION_RE.findall(cand)):
        reasons.append("negation_changed")
    for q in QUOTE_RE.findall(orig):
        if q not in cand:
            reasons.append("quote_changed")
            break
    eo, ec = entities(orig), entities(cand)
    if eo and len(eo & ec) / len(eo) < 0.9:
        reasons.append("entities_lost")
    if ec - cap_tokens(orig):
        reasons.append("entities_added")
    ratio = len(cand.split()) / max(1, len(orig.split()))
    if not 0.75 <= ratio <= 1.3:
        reasons.append("length")
    sn = norm_sentences(cand)
    if len(sn) != len(set(sn)):
        reasons.append("repeated_sentence")
    if SOURCE_CHATTER.search(cand) and not SOURCE_CHATTER.search(orig):
        reasons.append("source_chatter")
    if hidx is not None and (ngram_hashes(cand) - ngram_hashes(orig)) & hidx:
        reasons.append("copied")
    if old_score is not None and new_score is not None and new_score > old_score - 0.1:
        reasons.append("score")
    return not reasons, reasons


def apply_swaps(text):
    applied = []
    parts = QUOTE_RE.split(text)
    for k, part in enumerate(parts):
        if k % 2 == 1:
            continue
        new, n = OPENER_RE.subn(lambda m: m.group(1) + m.group(3).upper(), part)
        if n:
            applied.append({"pattern": "sentence opener", "count": n})
        new, n2 = ADDITIONALLY_RE.subn(lambda m: m.group(1) + "Also, ", new)
        if n2:
            applied.append({"pattern": "Additionally,", "count": n2})
        for rx, rep in WORD_SWAPS:
            new, n3 = rx.subn(rep, new)
            if n3:
                applied.append({"pattern": rx.pattern, "count": n3})
        parts[k] = new
    return "".join(parts), applied


class Rewriter:
    def __init__(self, adapter=ADAPTER):
        from mlx_lm import load
        from mlx_lm.sample_utils import make_sampler
        self.model, self.tok = load(BASE_MODEL, adapter_path=str(adapter)) if adapter else load(BASE_MODEL)
        self.sampler = make_sampler(temp=0.6, top_p=0.9)

    def rewrite(self, text):
        from mlx_lm import generate
        from train_data import SYSTEM, user_prompt
        locked, mapping = lock(text)
        msgs = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user_prompt(locked)}]
        prompt = self.tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
        out = generate(self.model, self.tok, prompt=prompt, max_tokens=480, sampler=self.sampler).strip()
        restored, _ = unlock(out, mapping, require_all=False)
        return restored or ""


class Para:
    def __init__(self, raw, is_html, protected=False):
        self.is_html = is_html
        self.protected = protected
        if is_html:
            inner = raw[3:-4]
            locked, self.tags = lock_tags(inner)
            self.text = htmllib.unescape(locked)
        else:
            self.tags = {}
            self.text = raw
        self.changed = False

    def plain(self, text=None):
        t = self.text if text is None else text
        for ph, v in tag_text(self.tags).items():
            t = t.replace(ph, v)
        return t

    def render(self):
        if not self.is_html:
            return self.text
        parts = re.split(r"(\[\[T_[A-Z]+\]\])", self.text)
        body = "".join(self.tags.get(p, htmllib.escape(p, quote=False)) if p.startswith("[[T_") else htmllib.escape(p, quote=False) for p in parts)
        return f"<p>{body}</p>"

    def tags_intact(self, cand):
        return all(cand.count(ph) == 1 for ph in self.tags)


def load_catalog():
    rows = read_jsonl(CATALOG)
    skus, names = {}, []
    for r in rows:
        if r.get("sku"):
            skus.setdefault(r["sku"].upper(), set()).update(int(x) for x in r.get("inr", []))
        if r.get("type") in ("product", "drop") and r.get("name"):
            key = re.sub(r"[^a-z0-9 ]", "", r["name"].lower())
            names.append((key, {int(x) for x in r.get("inr", [])}, r))
    return skus, names


def money_value(s):
    return int(float(re.sub(r"[^\d.]", "", s) or 0))


def verify_facts(paras, raw_paras, draft, catalog):
    skus, names = catalog
    has_sources = bool(draft.get("sources"))
    texts = [p.plain() if isinstance(p, Para) else p for p in paras]
    linked = [bool(re.search(r'<a\s[^>]*href="https?://', raw or "")) for raw in raw_paras]
    sourced_figs = set()
    for t, ok in zip(texts, linked):
        if ok:
            sourced_figs |= set(STYLE_CODE_RE.findall(t)) | {m.replace(" ", "") for m in MONEY_RE.findall(t)}
    out, seen = [], set()

    def add(key, blocking, request):
        if key in seen:
            return
        seen.add(key)
        out.append({"type": "facts", "blocking": blocking, "request": request})

    for i, text in enumerate(texts):
        low = re.sub(r"[^a-z0-9 ]", "", text.lower())
        codes = STYLE_CODE_RE.findall(text)
        sku_prices = set()
        for c in codes:
            sku_prices |= skus.get(c.upper(), set())
        name_prices = set()
        for n in names:
            if len(n[0].split()) >= 4 and n[0] in low:
                name_prices |= n[1]
        for c in codes:
            if c.upper() not in skus and not (has_sources or c in sourced_figs):
                add(("code", c), True, f"Style code {c} (first in paragraph {i}) is not in our catalog and no paragraph links its source. "
                                        "Link the source next to it or cut it.")
        for m in MONEY_RE.findall(text):
            fig = m.replace(" ", "")
            v = money_value(m)
            sourced = has_sources or fig in sourced_figs
            if m.startswith("₹") and v in (sku_prices | name_prices):
                continue
            if m.startswith("₹") and sku_prices:
                add(("mismatch", fig), not sourced, f"{m} (paragraph {i}) differs from our catalog for style code "
                    f"{', '.join(codes)} (we list ₹{', ₹'.join(f'{x:,}' for x in sorted(sku_prices)[:4])}). "
                    + ("Check it against your source." if sourced else "Fix it or link the source."))
                continue
            if m.startswith("₹") and name_prices:
                add(("namecheck", fig), False, f"{m} (paragraph {i}) is not one of our listed prices for a product named there "
                    f"(₹{', ₹'.join(f'{x:,}' for x in sorted(name_prices)[:4])}). Make sure it refers to a different shoe or retailer.")
            if not sourced:
                add(("unsourced", fig), True, f"{m} (first in paragraph {i}) has no source. Link the source next to it, "
                    "pass the URLs you fetched as \"sources\" in the draft JSON, or cut the figure.")
    return out


def duplicate_check(text, slug, kind):
    pool = [d for d in read_jsonl(DATA / "ours.jsonl") if d["kind"] == kind and d["slug"] != slug]
    drafts_dir = DATA / "drafts"
    if drafts_dir.exists():
        for f in drafts_dir.glob("*.json"):
            if f.name.endswith((".enhanced.json", ".report.json")):
                continue
            try:
                d = json.loads(f.read_text())
            except Exception:
                continue
            if d.get("slug") != slug and d.get("kind", "blog") == kind:
                pool.append({"slug": d.get("slug", f.stem), "html": d.get("html", ""), "text": d.get("text", ""), "draft": True})
    if not pool:
        return []
    from textutil import html_to_text
    docs = [normalize(html_to_text(d.get("html", "")) if d.get("html") else d.get("text", "")) for d in pool]
    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True, stop_words="english")
    m = vec.fit_transform(docs + [normalize(text)])
    sims = cosine_similarity(m[-1], m[:-1])[0]
    top = np.argsort(-sims)[:3]
    return [{"slug": pool[i]["slug"], "cosine": round(float(sims[i]), 3), "draft": pool[i].get("draft", False)}
            for i in top if sims[i] >= 0.35]


def search_console_queries(slug, kind):
    gsc_kind = {"blog": "blog", "drop": "drop", "profile": "profile"}.get(kind)
    try:
        from gsc import queries_for
        return queries_for(slug, gsc_kind, 10)
    except Exception:
        return []


def keyword_report(text, title, seed, slug, kind):
    from keywords import mine as mine_kw
    low = text.lower() + " " + title.lower()
    gsc_queries = search_console_queries(slug, kind)
    sugg = [{"phrase": q.lower(), "score": 20, "source": "search_console"} for q in gsc_queries] + mine_kw(seed or title)
    present = [s for s in sugg if s["phrase"] in low]
    seen, missing = set(), []
    for s in sugg:
        if s["phrase"] in low or s["phrase"] in seen or s["score"] < 8:
            continue
        seen.add(s["phrase"])
        missing.append(s)
    missing = missing[:12]
    with KEYWORDS_LOG.open("a") as f:
        f.write(json.dumps({"ts": time.time(), "slug": slug, "kind": kind, "seed": seed or title,
                            "suggestions": sugg}, ensure_ascii=False) + "\n")
    return {"seed": seed or title, "present": present[:10], "missing_high_value": missing}


def first_round_score(slug, kind="blog"):
    for r in read_jsonl(RUNS):
        if r.get("slug") == slug and r.get("kind", "blog") == kind and r.get("round") == 1 and r.get("ai_score") is not None:
            return r["ai_score"]
    return None


def run(draft, rewrite=True, mine=True, scorer=None):
    kind = draft.get("kind", "blog")
    slug = draft.get("slug", "")
    title = draft.get("title", "")
    is_html = bool(draft.get("html"))
    scorer = scorer or Scorer()
    report = {"slug": slug, "kind": kind, "round": draft.get("round", 1), "scorer": scorer.version,
              "auto_fixes": [], "change_requests": [], "accepted_rewrites": []}

    if is_html:
        segments = P_SPLIT.split(draft["html"])
        para_idx = [k for k, s in enumerate(segments) if P_SPLIT.fullmatch(s)]
        depth, quoted = 0, set()
        for k, seg in enumerate(segments):
            if k in para_idx and depth > 0:
                quoted.add(k)
            depth += len(re.findall(r"<blockquote\b", seg, re.I)) - len(re.findall(r"</blockquote>", seg, re.I))
        paras = [Para(segments[k], True, protected=k in quoted) for k in para_idx]
        raw_paras = [segments[k] for k in para_idx]
    else:
        blocks = [b for b in re.split(r"\n\s*\n", draft.get("text", "")) if b.strip()]
        paras = [Para(b.strip(), False) for b in blocks]
        raw_paras = [None] * len(paras)

    if not any(p.plain().strip() for p in paras):
        report["verdict"] = "revise"
        report["ai_score"] = None
        report["blocking"] = [{"type": "empty", "request": "The draft has no body text."}]
        report["change_requests"] = report["blocking"]
        report["advisory"] = []
        return report, dict(draft)

    for p in paras:
        if p.protected:
            continue
        new, applied = apply_swaps(p.text)
        if applied:
            p.text = new
            p.changed = True
            report["auto_fixes"].extend({"type": "swap", **a} for a in applied)

    plain = [p.plain() for p in paras]
    body_text = "\n\n".join(plain)
    words = len(body_text.split())
    scored = [(i, t) for i, t in enumerate(plain) if len(t.split()) >= 25]

    if words >= SHORT_WORDS and scored:
        chunks = chunk_paragraphs(plain, 70, 220) or [body_text]
        cscores, _ = scorer.score(chunks)
        _, wf = scorer.score([body_text])
        pscores, _ = scorer.score([t for _, t in scored])
        report["ai_score"] = round(float(np.mean(cscores)), 3)
        report["threshold"] = round(scorer.threshold, 3)
        report["pass_mark"] = round(scorer.calib.get("pass_mark", scorer.calib.get("ours_doc_p25", 0.5)), 3)
        report["doc_style_notes"] = scorer.issues(wf[0])
        report["paragraphs"] = [{"i": i, "score": round(float(s), 3), "tells": lexicon_hits(t), "preview": t[:110]}
                                for (i, t), s in zip(scored, pscores)]
    else:
        report["ai_score"] = None
        report["note"] = f"Text has {words} words, too short for the style model. Facts, keywords and duplicates still checked."
        report["paragraphs"] = []
        report["doc_style_notes"] = []

    flagged = sorted([p for p in report["paragraphs"] if p["score"] > report.get("threshold", 1)],
                     key=lambda p: -p["score"])[:MAX_REWRITES]
    if rewrite and flagged and (ADAPTER / "adapters.safetensors").exists():
        rw = Rewriter()
        hidx = human_ngram_index()
        for f in flagged:
            p = paras[f["i"]]
            if p.protected or len(p.plain().split()) < MIN_REWRITE_WORDS:
                continue
            cand_locked = rw.rewrite(p.text)
            if not p.tags_intact(cand_locked):
                report["auto_fixes"].append({"type": "rewrite", "paragraph": f["i"], "accepted": False, "reasons": ["link_or_tag_lost"]})
                continue
            cand_plain = p.plain(cand_locked)
            new_score = float(scorer.score([cand_plain])[0][0])
            ok, reasons = accept(p.plain(), cand_plain, f["score"], new_score, hidx)
            report["auto_fixes"].append({"type": "rewrite", "paragraph": f["i"], "accepted": ok, "reasons": reasons,
                                         "old_score": f["score"], "new_score": round(new_score, 3)})
            if ok:
                p.text = cand_locked
                p.changed = True
                f["auto_rewritten"] = True
                report["accepted_rewrites"].append(cand_plain)

    for f in flagged:
        if f.get("auto_rewritten"):
            continue
        req = f"Paragraph {f['i']} reads machine-written. Starts: \"{f['preview'][:70]}...\"."
        if f["tells"]:
            req += f" Remove stock words: {', '.join(f['tells'])}."
        req += (" Rewrite it with uneven sentence lengths and plain verbs. Use only figures from our catalog or your"
                " linked sources; never add a quote or number that is not there.")
        report["change_requests"].append({"type": "style", "blocking": STYLE_BLOCKING, "paragraph": f["i"], "request": req})
    for note in report["doc_style_notes"]:
        report["change_requests"].append({"type": "style_doc", "blocking": False, "request": note})

    report["change_requests"].extend(verify_facts(paras, raw_paras, draft, load_catalog()))

    dups = duplicate_check(body_text, slug, kind)
    report["similar_existing"] = dups
    limit = 0.6 if kind == "blog" else 0.8
    for d in dups:
        if d["cosine"] >= limit:
            where = "another draft in this run" if d["draft"] else f"existing {kind} {d['slug']}"
            report["change_requests"].append({"type": "duplicate", "blocking": True, "request":
                f"Too close to {where} (cosine {d['cosine']}). Change the angle or cut the overlap and link to it."})

    if mine and (draft.get("keyword") or kind == "blog" or search_console_queries(slug, kind)):
        kw = keyword_report(body_text, title, draft.get("keyword"), slug, kind)
        report["keywords"] = kw
        real = [m["phrase"] for m in kw["missing_high_value"] if m.get("source") == "search_console"][:5]
        auto = [m["phrase"] for m in kw["missing_high_value"] if m.get("source") != "search_console"][:5]
        if real:
            report["change_requests"].append({"type": "keywords", "blocking": False, "request":
                "This page already gets Google India impressions for these searches but does not answer them in the text. Cover them where true: "
                + "; ".join(real)})
        if auto:
            report["change_requests"].append({"type": "keywords", "blocking": False, "request":
                "Work these Google India searches in where they are true and read naturally (a heading, the meta description or a sentence): "
                + "; ".join(auto)})

    report["first_round_score"] = first_round_score(slug, kind) if report["round"] > 1 else report["ai_score"]
    final_tells = sorted({t for p in paras if not p.protected for t in lexicon_hits(p.plain())})
    report["stock_words_left"] = final_tells
    lex_left = len(final_tells)
    report["blocking"] = [c for c in report["change_requests"] if c.get("blocking")]
    if STYLE_BLOCKING and report["ai_score"] is not None and report["ai_score"] > report["pass_mark"]:
        report["blocking"].append({"type": "style", "request": "Overall style score above the pass mark."})
    report["advisory"] = [c for c in report["change_requests"] if not c.get("blocking")]
    report["verdict"] = "pass" if not report["blocking"] and lex_left <= 2 else "revise"

    out = dict(draft)
    if is_html:
        for k, p in zip(para_idx, paras):
            if p.changed:
                segments[k] = p.render()
        out["html"] = "".join(segments)
    else:
        out["text"] = "\n\n".join(p.render() for p in paras)
    return report, out


def main():
    ap = argparse.ArgumentParser(description="SNKRS CART content enhancer")
    ap.add_argument("draft", help="draft JSON: {kind, slug, title, html|text, keyword?, sources?, round?}")
    ap.add_argument("--no-rewrite", action="store_true")
    ap.add_argument("--no-keywords", action="store_true")
    ap.add_argument("--no-log", action="store_true")
    a = ap.parse_args()
    path = Path(a.draft)
    draft = json.loads(path.read_text())
    t0 = time.time()
    report, enhanced = run(draft, rewrite=not a.no_rewrite, mine=not a.no_keywords)
    report["seconds"] = round(time.time() - t0, 1)
    stem = path.with_suffix("")
    Path(f"{stem}.enhanced.json").write_text(json.dumps(enhanced, ensure_ascii=False, indent=2))
    Path(f"{stem}.report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
    if not a.no_log:
        with RUNS.open("a") as f:
            f.write(json.dumps({"ts": time.time(), "slug": report["slug"], "kind": report["kind"],
                                "round": report["round"], "verdict": report["verdict"], "ai_score": report["ai_score"],
                                "accepted_rewrites": report["accepted_rewrites"], "draft": draft, "enhanced": enhanced},
                               ensure_ascii=False) + "\n")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    sys.exit(0 if report["verdict"] == "pass" else 2)


if __name__ == "__main__":
    main()
