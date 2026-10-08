import hfoffline
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

from corpus import DATA, MODELS, read_jsonl
from enhance import ADAPTER, Rewriter, Scorer, accept, apply_swaps, facts, entities, human_ngram_index, ngram_hashes
from textutil import html_to_paragraphs

EVAL_SET = MODELS / "eval_ours.jsonl"


def build_eval_set(scorer, n=100):
    if EVAL_SET.exists():
        return read_jsonl(EVAL_SET)
    used = {p["slug"] for p in read_jsonl(DATA / "pairs_ours.jsonl")}
    cands = []
    for d in read_jsonl(DATA / "ours.jsonl"):
        if d["kind"] != "blog" or not d.get("published") or d["slug"] in used:
            continue
        for i, raw in enumerate(__import__("re").findall(r"<p>([^<>]+)</p>", d.get("html", ""))):
            text = apply_swaps(__import__("html").unescape(raw))[0]
            if 40 <= len(text.split()) <= 200:
                cands.append({"slug": d["slug"], "idx": i, "text": text})
    scores, _ = scorer.score([c["text"] for c in cands])
    for c, s in zip(cands, scores):
        c["score_at_freeze"] = round(float(s), 4)
    cands.sort(key=lambda c: -c["score_at_freeze"])
    pool = cands[: n * 3]
    pool.sort(key=lambda c: hashlib.md5(f"{c['slug']}:{c['idx']}".encode()).hexdigest())
    per_slug, picked = {}, []
    for c in pool:
        if per_slug.get(c["slug"], 0) >= 2:
            continue
        per_slug[c["slug"]] = per_slug.get(c["slug"], 0) + 1
        picked.append(c)
        if len(picked) >= n:
            break
    with EVAL_SET.open("w") as f:
        for c in picked:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")
    return picked


def evaluate(name, adapter, rows, scorer, hidx):
    import mlx.core as mx
    mx.random.seed(0)
    rw = Rewriter(adapter)
    srcs = [r["text"] for r in rows]
    outs = [rw.rewrite(t) for t in srcs]
    del rw
    s_src, _ = scorer.score(srcs)
    s_out, _ = scorer.score([o or " " for o in outs])
    verdicts = [accept(a, b, float(x), float(y), hidx) for a, b, x, y in zip(srcs, outs, s_src, s_out)]
    n = len(srcs)
    reasons = {}
    for ok, rs in verdicts:
        for r in rs:
            reasons[r] = reasons.get(r, 0) + 1
    m = {
        "model": name, "n": n,
        "accepted": sum(ok for ok, _ in verdicts),
        "accept_rate": round(sum(ok for ok, _ in verdicts) / n, 3),
        "ai_score_before": round(float(s_src.mean()), 3),
        "ai_score_after": round(float(s_out.mean()), 3),
        "facts_preserved_rate": round(sum(facts(a) == facts(b) for a, b in zip(srcs, outs)) / n, 3),
        "entities_preserved_rate": round(sum((not entities(a)) or len(entities(a) & entities(b)) / len(entities(a)) >= 0.9
                                             for a, b in zip(srcs, outs)) / n, 3),
        "copied_rate": round(sum(bool((ngram_hashes(b) - ngram_hashes(a)) & hidx) for a, b in zip(srcs, outs)) / n, 3),
        "empty_rate": round(sum(not o for o in outs) / n, 3),
        "reject_reasons": dict(sorted(reasons.items(), key=lambda kv: -kv[1])),
    }
    samples = [{"in": a, "out": b, "accepted": ok, "reasons": rs} for a, b, (ok, rs) in list(zip(srcs, outs, verdicts))[:10]]
    return m, samples


def run(models, limit=100, out=None):
    scorer = Scorer()
    hidx = human_ngram_index()
    rows = build_eval_set(scorer)[:limit]
    results, samples = [], {}
    for name, adapter in models:
        if adapter is not None and not (Path(adapter) / "adapters.safetensors").exists():
            continue
        m, smp = evaluate(name, adapter, rows, scorer, hidx)
        m["scorer"] = scorer.version
        results.append(m)
        samples[name] = smp
    if out:
        Path(out).write_text(json.dumps(results, indent=2))
        (DATA / "rewriter_samples.json").write_text(json.dumps(samples, ensure_ascii=False, indent=2))
    return results


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=100)
    ap.add_argument("--candidate")
    ap.add_argument("--no-base", action="store_true")
    ap.add_argument("--out", default=str(MODELS / "rewriter_metrics.json"))
    a = ap.parse_args()
    models = [] if a.no_base else [("base_qwen_1.5b", None)]
    models.append(("live", str(ADAPTER)))
    if a.candidate:
        models.append(("candidate", a.candidate))
    print(json.dumps(run(models, a.limit, a.out), indent=2))
